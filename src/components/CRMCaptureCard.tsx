"use client";
import { useState, useEffect, useRef } from "react";
import { setSessionCustomer, clearSessionCustomer } from "@/lib/CustomerIdentitySystem";

// ═══════════════════════════════════════════════════════════════════
// CRM CAPTURE — Smart Phone-First Login
// Flow: Phone → (CRM fetch) → Name auto-fill/new → OTP → Auto-proceed
// Returning customers: name locked (CRM data protected)
// New customers: name editable → saved to CRM on verify
// ═══════════════════════════════════════════════════════════════════

const C = {
  void:"#030201", deep:"#080604", surface:"#110E09", raise:"#1A160F",
  gold:"#C8922A", goldM:"#E8B84B", goldL:"#F5CC6A",
  ink:"#F5EDD8", inkS:"#C4AA80", inkD:"#7A6448",
  gl1:"rgba(255,255,255,0.03)", glBd:"rgba(255,255,255,0.08)",
  g08:"rgba(200,146,42,0.08)", g15:"rgba(200,146,42,0.15)",
  g25:"rgba(200,146,42,0.25)", g40:"rgba(200,146,42,0.40)",
  green:"#2E7D52", greenL:"rgba(46,125,82,0.15)",
  red:"#C0392B", redL:"rgba(192,57,43,0.1)",
  blue:"#60A5FA", blueL:"rgba(96,165,250,0.1)",
};
const GG  = `linear-gradient(135deg,${C.gold} 0%,${C.goldM} 52%,${C.goldL} 100%)`;
const SPR = "cubic-bezier(0.34,1.56,0.64,1)";
const EA  = "cubic-bezier(0.25,0.46,0.45,0.94)";
const API = process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";

const TIER_CONFIG: Record<string,{label:string;icon:string;color:string}> = {
  bronze:   {label:"Bronze",   icon:"🥉", color:"#CD7F32"},
  silver:   {label:"Silver",   icon:"🥈", color:"#C0C0C0"},
  gold:     {label:"Gold",     icon:"🥇", color:C.gold},
  platinum: {label:"Platinum", icon:"💎", color:"#E5E4E2"},
};

interface CustomerProfile {
  _id:string; name:string; phone:string;
  totalPoints:number; tier:string; totalOrders:number;
}

async function registerCustomer(name:string, phone:string, tableId:string): Promise<CustomerProfile|null> {
  try{
    const r = await fetch(`${API}/crm-capture/register`,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name,phone,tableId}),
    }).then(r=>r.json());
    if(r.success&&r.data){
      const p = r.data;
      setSessionCustomer({_id:p._id,name:p.name,phone:p.phone,totalPoints:p.totalPoints||0,tier:p.tier||"bronze",totalOrders:p.totalOrders||0, totalSpent:0, visits:p.visitCount||0, lastVisit:new Date().toISOString()});
      return p;
    }
    return null;
  }catch{ return null; }
}

const CSS = `
@keyframes crmIn   {from{opacity:0;transform:scale(0.94) translateY(24px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes fadeUp  {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes shake   {0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
@keyframes success {0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes spin    {to{transform:rotate(360deg)}}
@keyframes pulse   {0%,100%{opacity:1}50%{opacity:0.5}}
.crm-inp{width:100%;padding:14px 16px;border-radius:14px;border:1.5px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:#F5EDD8;font-size:16px;font-weight:600;outline:none;box-sizing:border-box;font-family:'DM Sans',sans-serif;transition:border-color 0.2s ease,background 0.2s ease;}
.crm-inp:focus{border-color:rgba(200,146,42,0.5);background:rgba(200,146,42,0.06);}
.crm-inp::placeholder{color:rgba(122,100,72,0.6);}
.crm-inp:disabled{opacity:0.7;cursor:not-allowed;}
.otp-inp{width:100%;padding:16px;border-radius:14px;border:2px solid rgba(200,146,42,0.3);background:rgba(200,146,42,0.05);color:#F5CC6A;font-size:32px;font-weight:900;text-align:center;letter-spacing:14px;outline:none;box-sizing:border-box;font-family:'DM Mono',monospace;transition:all 0.2s ease;}
.otp-inp:focus{border-color:rgba(200,146,42,0.7);background:rgba(200,146,42,0.1);}
`;

type Step = "phone" | "name" | "otp" | "success";

interface Props {
  tableId: string;
  onCustomerIdentified?: (c: CustomerProfile) => void;
}

export default function CRMCaptureCard({ tableId, onCustomerIdentified }: Props) {
  const [step,         setStep        ] = useState<Step>("phone");
  const [visible,      setVisible     ] = useState(false);
  const [phone,        setPhone       ] = useState("");
  const [name,         setName        ] = useState("");
  const [isReturning,  setIsReturning ] = useState(false); // CRM match found
  const [nameLocked,   setNameLocked  ] = useState(false); // returning = locked
  const [otp,          setOtp         ] = useState("");
  const [error,        setError       ] = useState("");
  const [loading,      setLoading     ] = useState(false);
  const [fetchingCRM,  setFetchingCRM ] = useState(false);
  const [resendTimer,  setResendTimer ] = useState(0);
  const [profile,      setProfile     ] = useState<CustomerProfile|null>(null);
  const [shake,        setShake       ] = useState(false);
  const [otpRequired,  setOtpRequired ] = useState(true);
  const otpRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    clearSessionCustomer();
    localStorage.removeItem("gb_active_order");
    fetch(`${API}/security/settings`).then(r=>r.json())
      .then(d=>{ setOtpRequired(d.data?.otpEnabled !== false); })
      .catch(()=>{ setOtpRequired(true); });
    const t=setTimeout(()=>{ setVisible(true); setTimeout(()=>phoneRef.current?.focus(),200); },800);
    return()=>clearTimeout(t);
  },[]);

  useEffect(()=>{
    if(resendTimer<=0) return;
    const iv=setInterval(()=>setResendTimer(p=>p-1),1000);
    return()=>clearInterval(iv);
  },[resendTimer]);

  // Auto-proceed when OTP is 6 digits
  useEffect(()=>{
    if(otp.length===6&&step==="otp") verifyOTP();
  },[otp]);

  const shake_ = ()=>{ setShake(true); setTimeout(()=>setShake(false),500); };

  // ── STEP 1: Phone entered → fetch CRM ──
  const handlePhoneNext = async()=>{
    const p = phone.trim().replace(/\D/g,"");
    if(p.length!==10){ setError("Enter a valid 10-digit number"); shake_(); return; }
    setError(""); setFetchingCRM(true);

    try{
      // Fetch CRM customer by phone
      const r = await fetch(`${API}/crm-capture/lookup?phone=${p}`).then(r=>r.json());
      if(r.success && r.data){
        // Returning customer — name locked
        setName(r.data.name);
        setNameLocked(true);
        setIsReturning(true);
        setFetchingCRM(false);
        // Send OTP directly — skip name step
        await sendOTPDirect(p, r.data.name);
      } else {
        // New customer — show name input
        setNameLocked(false);
        setIsReturning(false);
        setFetchingCRM(false);
        setStep("name");
      }
    }catch{
      setNameLocked(false);
      setIsReturning(false);
      setFetchingCRM(false);
      setStep("name");
    }
  };

  // ── STEP 2a: Send OTP (returning customer — direct) ──
  const sendOTPDirect = async(p:string, n:string)=>{
    if(!otpRequired){
      // No OTP — direct register
      const result = await registerCustomer(n, p, tableId);
      if(result){
        setProfile(result);
        setStep("success");
        onCustomerIdentified?.(result);
        setTimeout(()=>setVisible(false), 2500);
      }
      return;
    }
    setLoading(true);
    try{
      const r = await fetch(`${API}/crm-capture/send-otp`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({phone:p, name:n}),
      }).then(r=>r.json());
      if(r.success){
        setStep("otp");
        setResendTimer(60);
        setTimeout(()=>otpRef.current?.focus(),300);
      } else { setError("Failed to send OTP. Try again."); shake_(); }
    }catch{ setError("Connection failed. Try again."); shake_(); }
    setLoading(false);
  };

  // ── STEP 2b: New customer — name entered → send OTP ──
  const handleNameNext = async()=>{
    if(!name.trim()){ setError("Please enter your name"); shake_(); return; }
    if(name.trim().length<2){ setError("Please enter a valid name"); shake_(); return; }
    setError("");
    const p = phone.trim().replace(/\D/g,"");
    await sendOTPDirect(p, name.trim());
  };

  // ── STEP 3: Verify OTP — auto-triggered when 6 digits ──
  const verifyOTP = async()=>{
    if(otp.length!==6) return;
    setError(""); setLoading(true);
    try{
      const p = phone.trim().replace(/\D/g,"");
      const r = await fetch(`${API}/crm-capture/verify-otp`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({phone:p, otp, name:name.trim(), tableId}),
      }).then(r=>r.json());

      if(r.success){
        const result = await registerCustomer(name.trim(), p, tableId);
        if(result){
          setProfile(result);
          setStep("success");
          onCustomerIdentified?.(result);
          // Welcome WhatsApp for new customers
          if(!isReturning){
            fetch(`${API}/whatsapp/welcome`,{
              method:"POST", headers:{"Content-Type":"application/json"},
              body:JSON.stringify({phone:p, customerName:name.trim(), welcomePoints:50, value:5}),
            }).catch(()=>{});
          }
          setTimeout(()=>setVisible(false), 2500);
        }
      } else {
        setError(r.message||"Incorrect OTP. Try again.");
        setOtp(""); shake_();
      }
    }catch{ setError("Verification failed. Try again."); shake_(); }
    setLoading(false);
  };

  const resendOTP = async()=>{
    if(resendTimer>0) return;
    setOtp(""); setError(""); setLoading(true);
    try{
      const p = phone.trim().replace(/\D/g,"");
      await fetch(`${API}/crm-capture/send-otp`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({phone:p, name:name.trim()}),
      });
      setResendTimer(60);
    }catch{}
    setLoading(false);
  };

  if(!visible) return <style>{CSS}</style>;

  const tierCfg = profile ? TIER_CONFIG[profile.tier]||TIER_CONFIG.bronze : null;

  return(
    <>
      <style>{CSS}</style>
      <div style={{position:"fixed",inset:0,zIndex:200,
        background:"rgba(2,1,0,0.96)",
        backdropFilter:"blur(32px)",WebkitBackdropFilter:"blur(32px)",
        display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>

        <div style={{
          width:"100%",maxWidth:420,
          background:`linear-gradient(160deg,${C.raise} 0%,${C.surface} 50%,${C.deep} 100%)`,
          borderRadius:24,overflow:"hidden",
          border:`1px solid ${C.glBd}`,
          boxShadow:`0 40px 80px rgba(0,0,0,0.8),0 0 0 1px rgba(200,146,42,0.08)`,
          animation:shake?`shake 0.4s ease`:`crmIn 0.45s ${SPR}`,
        }}>
          <div style={{height:3,background:GG}}/>

          {/* ── SUCCESS ── */}
          {step==="success"&&profile&&(
            <div style={{padding:"32px 24px 36px",textAlign:"center",animation:`fadeUp 0.4s ${EA}`}}>
              <div style={{width:72,height:72,borderRadius:"50%",
                background:C.greenL,border:`2px solid ${C.green}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                margin:"0 auto 16px",fontSize:30,
                boxShadow:`0 0 30px rgba(46,125,82,0.3)`,
                animation:`success 0.5s ${SPR}`}}>✓</div>
              {tierCfg&&(
                <div style={{display:"inline-flex",alignItems:"center",gap:7,
                  padding:"4px 14px",borderRadius:99,marginBottom:12,
                  background:`${tierCfg.color}15`,border:`1px solid ${tierCfg.color}40`}}>
                  <span>{tierCfg.icon}</span>
                  <span style={{fontSize:11,fontWeight:700,color:tierCfg.color,fontFamily:"'DM Mono',monospace"}}>{tierCfg.label} Member</span>
                </div>
              )}
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:C.ink,margin:"0 0 6px"}}>
                {isReturning?`Welcome back, ${profile.name.split(" ")[0]}! ☕`:`Welcome, ${profile.name.split(" ")[0]}! ☕`}
              </h2>
              <p style={{fontSize:13,color:C.inkS,fontFamily:"'DM Sans',sans-serif",margin:"0 0 18px",lineHeight:1.6}}>
                {isReturning?"Great to see you again! Enjoy your visit.":"You're all set! Enjoy your experience at Golden Beans."}
              </p>
              <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"10px 20px",borderRadius:12,background:C.g08,border:`1px solid rgba(200,146,42,0.2)`}}>
                <span style={{fontSize:20}}>🫘</span>
                <div style={{textAlign:"left"}}>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:18,fontWeight:500,color:C.goldL,margin:0,lineHeight:1}}>{profile.totalPoints} pts</p>
                  <p style={{fontSize:10,color:C.inkD,margin:0}}>= ₹{Math.floor(profile.totalPoints/10)} discount available</p>
                </div>
              </div>
            </div>
          )}

          {/* ── PHONE STEP ── */}
          {step==="phone"&&(
            <div style={{padding:"28px 22px 32px"}}>
              <div style={{textAlign:"center",marginBottom:24}}>
                <div style={{fontSize:38,marginBottom:10}}>☕</div>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:C.ink,margin:"0 0 6px"}}>Welcome to Golden Beans</h2>
                <p style={{fontSize:13,color:C.inkS,fontFamily:"'DM Sans',sans-serif",margin:0,lineHeight:1.6}}>Enter your WhatsApp number to continue</p>
              </div>

              <div style={{marginBottom:16}}>
                <div style={{position:"relative"}}>
                  <div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontSize:13,color:C.inkD,fontFamily:"'DM Sans',sans-serif",fontWeight:700,pointerEvents:"none"}}>+91</div>
                  <input
                    ref={phoneRef}
                    className="crm-inp"
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    value={phone}
                    maxLength={10}
                    style={{paddingLeft:48}}
                    onChange={e=>{ setPhone(e.target.value.replace(/\D/g,"")); setError(""); }}
                    onKeyDown={e=>{ if(e.key==="Enter"&&phone.replace(/\D/g,"").length===10) handlePhoneNext(); }}
                  />
                </div>
              </div>

              {error&&<p style={{fontSize:12,color:"#f87171",textAlign:"center",margin:"0 0 12px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>⚠ {error}</p>}

              <button onClick={handlePhoneNext} disabled={loading||fetchingCRM||phone.replace(/\D/g,"").length!==10}
                style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
                  background:phone.replace(/\D/g,"").length===10?GG:"rgba(255,255,255,0.05)",
                  color:phone.replace(/\D/g,"").length===10?C.void:"rgba(122,100,72,0.5)",
                  fontWeight:700,fontSize:15,cursor:phone.replace(/\D/g,"").length===10?"pointer":"not-allowed",
                  fontFamily:"'DM Sans',sans-serif",
                  boxShadow:phone.replace(/\D/g,"").length===10?`0 8px 24px ${C.g40}`:"none",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  transition:"all 0.25s ease"}}>
                {fetchingCRM?(
                  <><div style={{width:16,height:16,borderRadius:"50%",border:"2px solid rgba(0,0,0,0.3)",borderTopColor:C.void,animation:"spin 0.7s linear infinite"}}/> Checking...</>
                ):loading?"Sending OTP...":"Continue →"}
              </button>

              <p style={{textAlign:"center",fontSize:11,color:C.inkD,margin:"14px 0 0",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>
                We'll send a WhatsApp OTP to verify your number
              </p>
            </div>
          )}

          {/* ── NAME STEP (new customer only) ── */}
          {step==="name"&&(
            <div style={{padding:"28px 22px 32px",animation:`fadeUp 0.3s ${EA}`}}>
              <div style={{textAlign:"center",marginBottom:24}}>
                <div style={{fontSize:32,marginBottom:10}}>👋</div>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:C.ink,margin:"0 0 6px"}}>Nice to meet you!</h2>
                <p style={{fontSize:13,color:C.inkS,fontFamily:"'DM Sans',sans-serif",margin:0,lineHeight:1.6}}>
                  First time here? What's your name?
                </p>
              </div>

              {/* Phone shown as locked */}
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:12,background:C.g08,border:`1px solid ${C.g15}`,marginBottom:14}}>
                <span style={{fontSize:14}}>📱</span>
                <span style={{fontSize:13,color:C.inkS,fontFamily:"'DM Mono',monospace",letterSpacing:".05em"}}>+91 {phone}</span>
                <button onClick={()=>{ setStep("phone"); setName(""); setError(""); }} style={{marginLeft:"auto",background:"none",border:"none",color:C.gold,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>Change</button>
              </div>

              <div style={{marginBottom:16}}>
                <input
                  className="crm-inp"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  autoFocus
                  onChange={e=>{ setName(e.target.value); setError(""); }}
                  onKeyDown={e=>{ if(e.key==="Enter"&&name.trim().length>=2) handleNameNext(); }}
                />
              </div>

              {error&&<p style={{fontSize:12,color:"#f87171",textAlign:"center",margin:"0 0 12px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>⚠ {error}</p>}

              <button onClick={handleNameNext} disabled={loading||name.trim().length<2}
                style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
                  background:name.trim().length>=2?GG:"rgba(255,255,255,0.05)",
                  color:name.trim().length>=2?C.void:"rgba(122,100,72,0.5)",
                  fontWeight:700,fontSize:15,cursor:name.trim().length>=2?"pointer":"not-allowed",
                  fontFamily:"'DM Sans',sans-serif",
                  boxShadow:name.trim().length>=2?`0 8px 24px ${C.g40}`:"none",
                  transition:"all 0.25s ease"}}>
                {loading?"Sending OTP...":"Send OTP →"}
              </button>
            </div>
          )}

          {/* ── OTP STEP ── */}
          {step==="otp"&&(
            <div style={{padding:"28px 22px 32px",animation:`fadeUp 0.3s ${EA}`}}>
              <div style={{textAlign:"center",marginBottom:24}}>
                <div style={{fontSize:32,marginBottom:10}}>💬</div>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:C.ink,margin:"0 0 6px"}}>
                  {isReturning?`Welcome back, ${name.split(" ")[0]}!`:"Check WhatsApp"}
                </h2>
                <p style={{fontSize:13,color:C.inkS,fontFamily:"'DM Sans',sans-serif",margin:0,lineHeight:1.6}}>
                  OTP sent to <strong style={{color:C.goldL}}>+91 {phone}</strong>
                </p>
              </div>

              {/* Returning customer — name shown locked */}
              {isReturning&&(
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:12,background:"rgba(46,125,82,0.1)",border:"1px solid rgba(46,125,82,0.25)",marginBottom:14}}>
                  <span style={{fontSize:14}}>✓</span>
                  <span style={{fontSize:13,color:"#4ADE80",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>{name}</span>
                  <span style={{marginLeft:"auto",fontSize:10,color:"rgba(74,222,128,0.6)",fontFamily:"'DM Mono',monospace"}}>RETURNING</span>
                </div>
              )}

              <div style={{marginBottom:8}}>
                <input
                  ref={otpRef}
                  className="otp-inp"
                  type="number"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  maxLength={6}
                  onChange={e=>{ const v=e.target.value.replace(/\D/g,"").slice(0,6); setOtp(v); setError(""); }}
                />
              </div>

              {loading&&(
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 0",marginBottom:8}}>
                  <div style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(200,146,42,0.3)",borderTopColor:C.gold,animation:"spin 0.7s linear infinite"}}/>
                  <span style={{fontSize:12,color:C.inkS,fontFamily:"'DM Sans',sans-serif"}}>Verifying...</span>
                </div>
              )}

              {error&&<p style={{fontSize:12,color:"#f87171",textAlign:"center",margin:"0 0 10px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>⚠ {error}</p>}

              <p style={{textAlign:"center",fontSize:12,color:C.inkD,margin:"8px 0 0",fontFamily:"'DM Sans',sans-serif"}}>
                OTP enters automatically — no need to press any button
              </p>

              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:16}}>
                <button onClick={resendOTP} disabled={resendTimer>0||loading}
                  style={{background:"none",border:"none",fontSize:12,
                    color:resendTimer>0?C.inkD:C.gold,
                    cursor:resendTimer>0?"not-allowed":"pointer",
                    fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>
                  {resendTimer>0?`Resend in ${resendTimer}s`:"Resend OTP"}
                </button>
                <span style={{color:C.inkD,fontSize:12}}>·</span>
                <button onClick={()=>{ setStep("phone"); setOtp(""); setError(""); setName(""); }}
                  style={{background:"none",border:"none",fontSize:12,color:C.inkD,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                  Change number
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
