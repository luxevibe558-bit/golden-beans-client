"use client";

// ═══════════════════════════════════════════════════════════════
// CRM CAPTURE CARD — Compulsory OTP Every Visit
// File: src/components/CRMCaptureCard.tsx
// Flow: Name+Phone → OTP WhatsApp → Verified → Menu
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import {
  registerCustomer, getSessionCustomer, clearSessionCustomer,
  TIER_CONFIG, type CustomerProfile,
} from "@/lib/CustomerIdentitySystem";

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

const C = {
  void:    "#020100", deep:  "#070504", surface: "#0F0D09",
  raise:   "#1A1712", lift:  "#231F18",
  gold:    "#C8922A", goldM: "#E8B84B", goldL:   "#F5CC6A",
  ink:     "#F5EDD8", inkS:  "#C4AA80", inkD:    "#7A6448", inkG: "#352C1C",
  g08:     "rgba(200,146,42,0.08)",  g15: "rgba(200,146,42,0.15)",
  g25:     "rgba(200,146,42,0.25)",  g40: "rgba(200,146,42,0.40)",
  gl1:     "rgba(255,255,255,0.03)", gl2: "rgba(255,255,255,0.06)",
  glBd:    "rgba(255,255,255,0.08)",
  green:   "#2E7D52", greenL: "rgba(46,125,82,0.15)",
  red:     "#C0392B",
};
const GG  = `linear-gradient(135deg,${C.gold} 0%,${C.goldM} 52%,${C.goldL} 100%)`;
const SPR = "cubic-bezier(0.34,1.56,0.64,1)";
const EA  = "cubic-bezier(0.25,0.46,0.45,0.94)";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
@keyframes crmIn  {from{opacity:0;transform:scale(0.92) translateY(28px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes fadeUp {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin   {to{transform:rotate(360deg)}}
@keyframes shake  {0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
@keyframes success{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes pulse  {0%,100%{opacity:1}50%{opacity:0.5}}
.crm-inp{
  width:100%;padding:13px 14px;border-radius:12px;
  border:1.5px solid rgba(255,255,255,0.08);
  background:rgba(255,255,255,0.04);
  color:#F5EDD8;font-size:15px;font-family:'DM Sans',sans-serif;
  font-weight:500;outline:none;transition:all 0.2s ease;
}
.crm-inp:focus{
  border-color:rgba(200,146,42,0.65)!important;
  background:rgba(200,146,42,0.05)!important;
  box-shadow:0 0 0 3px rgba(200,146,42,0.12)!important;
}
.crm-inp::placeholder{color:rgba(122,100,72,0.6);}
.otp-inp{
  width:100%;padding:16px;border-radius:12px;
  border:1.5px solid rgba(255,255,255,0.08);
  background:rgba(255,255,255,0.04);
  color:#F5EDD8;font-size:28px;font-family:'DM Mono',monospace;
  font-weight:500;outline:none;text-align:center;letter-spacing:12px;
  transition:all 0.2s ease;
}
.otp-inp:focus{
  border-color:rgba(200,146,42,0.65)!important;
  background:rgba(200,146,42,0.05)!important;
  box-shadow:0 0 0 3px rgba(200,146,42,0.12)!important;
}
`;

type Step = "form" | "otp" | "success";

interface Props {
  tableId: string;
  onCustomerIdentified?: (c: CustomerProfile) => void;
}

export default function CRMCaptureCard({ tableId, onCustomerIdentified }: Props) {
  const [step,        setStep       ] = useState<Step>("form");
  const [visible,     setVisible    ] = useState(false);
  const [name,        setName       ] = useState("");
  const [phone,       setPhone      ] = useState("");
  const [otp,         setOtp        ] = useState("");
  const [error,       setError      ] = useState("");
  const [loading,     setLoading    ] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [profile,     setProfile    ] = useState<CustomerProfile|null>(null);
  const [shake,       setShake      ] = useState(false);

  // ── ALWAYS clear session on mount — OTP every visit ──
  useEffect(()=>{
    clearSessionCustomer();
    localStorage.removeItem("gb_active_order");
    // Pre-fill from previous session if exists
    const prev = getSessionCustomer();
    if(prev){ setName(prev.name||""); setPhone(prev.phone||""); }
    // Show popup after 800ms
    const t = setTimeout(()=>setVisible(true), 800);
    return()=>clearTimeout(t);
  },[]);

  // Resend countdown
  useEffect(()=>{
    if(resendTimer<=0) return;
    const iv = setInterval(()=>setResendTimer(p=>p-1), 1000);
    return()=>clearInterval(iv);
  },[resendTimer]);

  const shake_ = ()=>{ setShake(true); setTimeout(()=>setShake(false),500); };

  // ── STEP 1: Send OTP ──
  const sendOTP = async()=>{
    const p = phone.trim().replace(/\D/g,"");
    if(!name.trim()){ setError("Please enter your name"); shake_(); return; }
    if(p.length!==10){ setError("Enter a valid 10-digit WhatsApp number"); shake_(); return; }
    setError(""); setLoading(true);
    try{
      const r = await fetch(`${API}/crm-capture/send-otp`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ phone:p, name:name.trim() }),
      }).then(r=>r.json());

      if(r.success){
        setStep("otp");
        setResendTimer(60);
        if(r._dev_otp) setError(`DEV — OTP: ${r._dev_otp}`);
      } else {
        setError("Failed to send OTP. Please try again.");
        shake_();
      }
    } catch {
      setError("Connection failed. Please check your internet and try again.");
      shake_();
    }
    setLoading(false);
  };

  // ── STEP 2: Verify OTP ──
  const verifyOTP = async()=>{
    if(otp.length!==6){ setError("Enter the 6-digit OTP"); shake_(); return; }
    setError(""); setLoading(true);
    try{
      const p = phone.trim().replace(/\D/g,"");
      const r = await fetch(`${API}/crm-capture/verify-otp`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ phone:p, otp, name:name.trim(), tableId }),
      }).then(r=>r.json());

      if(r.success){
        const result = await registerCustomer(name.trim(), p, tableId);
        if(result){
          setProfile(result);
          setStep("success");
          onCustomerIdentified?.(result);
          // Welcome WhatsApp for new customers
          if(result.totalOrders<=1){
            fetch(`${API}/whatsapp/welcome`,{
              method:"POST", headers:{"Content-Type":"application/json"},
              body: JSON.stringify({ phone:p, customerName:name.trim(), welcomePoints:result.totalPoints||50, value:Math.floor((result.totalPoints||50)/10) }),
            }).catch(()=>{});
          }
          setTimeout(()=>setVisible(false), 3500);
        }
      } else {
        setError(r.message || "Incorrect OTP. Please try again.");
        setOtp(""); shake_();
      }
    } catch { setError("Verification failed. Please try again."); shake_(); }
    setLoading(false);
  };

  const resendOTP = async()=>{
    if(resendTimer>0) return;
    setOtp(""); setError(""); setLoading(true);
    try{
      await fetch(`${API}/crm-capture/send-otp`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ phone:phone.trim().replace(/\D/g,""), name:name.trim() }),
      });
      setResendTimer(60);
    }catch{}
    setLoading(false);
  };

  if(!visible) return <style>{CSS}</style>;

  const tierCfg = profile ? TIER_CONFIG[profile.tier] : null;

  return(
    <>
      <style>{CSS}</style>
      {/* Backdrop — no dismiss */}
      <div style={{position:"fixed",inset:0,zIndex:200,
        background:"rgba(2,1,0,0.95)",
        backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",
        display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>

        {/* Card */}
        <div style={{
          width:"100%",maxWidth:420,
          background:`linear-gradient(160deg,${C.raise} 0%,${C.surface} 50%,${C.deep} 100%)`,
          borderRadius:24,overflow:"hidden",
          border:`1px solid ${C.glBd}`,
          boxShadow:`0 40px 80px rgba(0,0,0,0.8),0 0 0 1px rgba(200,146,42,0.1)`,
          animation:shake?`shake 0.4s ease`:`crmIn 0.45s ${SPR}`,
        }}>
          <div style={{height:3,background:GG}}/>

          {/* ── SUCCESS ── */}
          {step==="success"&&profile&&(
            <div style={{padding:"32px 24px 36px",textAlign:"center",animation:`fadeUp 0.4s ${EA}`}}>
              <div style={{width:72,height:72,borderRadius:"50%",
                background:C.greenL,border:`2px solid ${C.green}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                margin:"0 auto 18px",fontSize:30,
                boxShadow:`0 0 30px rgba(46,125,82,0.3)`,
                animation:`success 0.5s ${SPR}`}}>✓</div>
              {tierCfg&&(
                <div style={{display:"inline-flex",alignItems:"center",gap:7,
                  padding:"5px 14px",borderRadius:99,marginBottom:12,
                  background:`${tierCfg.color}15`,border:`1px solid ${tierCfg.color}40`}}>
                  <span style={{fontSize:16}}>{tierCfg.icon}</span>
                  <span style={{fontSize:11,fontWeight:700,color:tierCfg.color,
                    fontFamily:"'DM Mono',monospace"}}>{tierCfg.label} Member</span>
                </div>
              )}
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,
                fontWeight:700,color:C.ink,margin:"0 0 6px"}}>
                Welcome, {profile.name.split(" ")[0]}! ☕
              </h2>
              <p style={{fontSize:13,color:C.inkS,fontFamily:"'DM Sans',sans-serif",
                margin:"0 0 18px",lineHeight:1.6}}>
                You're all set! Enjoy your experience<br/>at Golden Beans Café.
              </p>
              <div style={{display:"inline-flex",alignItems:"center",gap:10,
                padding:"10px 20px",borderRadius:12,
                background:C.g08,border:`1px solid rgba(200,146,42,0.2)`}}>
                <span style={{fontSize:20}}>🫘</span>
                <div style={{textAlign:"left"}}>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:18,
                    fontWeight:500,color:C.goldL,margin:0,lineHeight:1}}>
                    {profile.totalPoints} pts
                  </p>
                  <p style={{fontSize:10,color:C.inkD,margin:0}}>
                    = ₹{Math.floor(profile.totalPoints/10)} discount available
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── FORM ── */}
          {step==="form"&&(
            <div style={{padding:"24px 22px 28px"}}>
              <div style={{textAlign:"center",marginBottom:22}}>
                <div style={{fontSize:36,marginBottom:10}}>☕</div>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,
                  fontWeight:700,color:C.ink,margin:"0 0 6px",lineHeight:1.2}}>
                  Welcome to Golden Beans
                </h2>
                <p style={{fontSize:13,color:C.inkS,fontFamily:"'DM Sans',sans-serif",
                  margin:0,lineHeight:1.6}}>
                  Please verify your identity<br/>
                  <strong style={{color:C.goldL}}>to start ordering</strong>
                </p>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
                <div>
                  <label style={{fontSize:10,fontWeight:700,color:C.inkD,
                    letterSpacing:".1em",textTransform:"uppercase",
                    display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>
                    Your Name
                  </label>
                  <input className="crm-inp" value={name}
                    onChange={e=>{setName(e.target.value);setError("");}}
                    placeholder="e.g. Nirav Patel"
                    onKeyDown={e=>e.key==="Enter"&&sendOTP()}/>
                </div>
                <div>
                  <label style={{fontSize:10,fontWeight:700,color:C.inkD,
                    letterSpacing:".1em",textTransform:"uppercase",
                    display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>
                    WhatsApp Number
                  </label>
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:14,top:"50%",
                      transform:"translateY(-50%)",fontSize:14,color:C.inkD,
                      fontFamily:"'DM Sans',sans-serif",fontWeight:600,pointerEvents:"none"}}>
                      +91
                    </span>
                    <input className="crm-inp" value={phone}
                      onChange={e=>{setPhone(e.target.value.replace(/\D/g,"").slice(0,10));setError("");}}
                      placeholder="98765 43210" type="tel" inputMode="numeric"
                      style={{paddingLeft:46}}
                      onKeyDown={e=>e.key==="Enter"&&sendOTP()}/>
                  </div>
                  <p style={{fontSize:11,color:C.inkD,margin:"5px 0 0",
                    fontFamily:"'DM Sans',sans-serif"}}>
                    📱 OTP will be sent on WhatsApp
                  </p>
                </div>
              </div>

              {error&&(
                <div style={{background:"rgba(192,57,43,0.1)",border:"1px solid rgba(192,57,43,0.3)",
                  borderRadius:10,padding:"9px 12px",marginBottom:12,
                  fontSize:12.5,color:"#F87171",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
                  ⚠ {error}
                </div>
              )}

              <button onClick={sendOTP} disabled={loading}
                style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
                  background:loading?"rgba(255,255,255,0.05)":GG,
                  color:loading?C.inkD:"#050301",fontWeight:700,fontSize:15,
                  cursor:loading?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",
                  boxShadow:loading?"none":`0 8px 28px ${C.g40}`,
                  display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  transition:`all 0.2s ${EA}`}}>
                {loading
                  ?<><div style={{width:18,height:18,borderRadius:"50%",
                      border:`2.5px solid rgba(0,0,0,0.2)`,borderTopColor:"rgba(0,0,0,0.6)",
                      animation:"spin .75s linear infinite"}}/>Sending OTP...</>
                  :<><span>📱</span>Send OTP</>}
              </button>

              <p style={{textAlign:"center",fontSize:11,color:C.inkG,
                margin:"12px 0 0",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>
                🔒 Your details are safe · Earn loyalty points on every visit
              </p>
            </div>
          )}

          {/* ── OTP ── */}
          {step==="otp"&&(
            <div style={{padding:"24px 22px 28px",animation:`fadeUp 0.3s ${EA}`}}>
              <div style={{textAlign:"center",marginBottom:22}}>
                <div style={{fontSize:36,marginBottom:10}}>📱</div>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,
                  fontWeight:700,color:C.ink,margin:"0 0 6px"}}>
                  Verify Your Number
                </h2>
                <p style={{fontSize:13,color:C.inkS,fontFamily:"'DM Sans',sans-serif",
                  margin:0,lineHeight:1.6}}>
                  A 6-digit OTP has been sent to<br/>
                  <strong style={{color:C.goldL}}>+91 {phone}</strong> on WhatsApp
                </p>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{fontSize:10,fontWeight:700,color:C.inkD,
                  letterSpacing:".1em",textTransform:"uppercase",
                  display:"block",marginBottom:8,fontFamily:"'DM Mono',monospace"}}>
                  Enter OTP
                </label>
                <input className="otp-inp" value={otp}
                  onChange={e=>{setOtp(e.target.value.replace(/\D/g,"").slice(0,6));setError("");}}
                  placeholder="——————" type="tel" inputMode="numeric"
                  maxLength={6} autoFocus
                  onKeyDown={e=>e.key==="Enter"&&verifyOTP()}/>
              </div>

              {error&&(
                <div style={{background:"rgba(192,57,43,0.1)",border:"1px solid rgba(192,57,43,0.3)",
                  borderRadius:10,padding:"9px 12px",marginBottom:12,
                  fontSize:12.5,color:"#F87171",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
                  ⚠ {error}
                </div>
              )}

              <button onClick={verifyOTP} disabled={loading||otp.length!==6}
                style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
                  background:otp.length===6&&!loading?GG:"rgba(255,255,255,0.05)",
                  color:otp.length===6&&!loading?"#050301":C.inkD,
                  fontWeight:700,fontSize:15,
                  cursor:otp.length===6&&!loading?"pointer":"not-allowed",
                  fontFamily:"'DM Sans',sans-serif",
                  boxShadow:otp.length===6&&!loading?`0 8px 28px ${C.g40}`:"none",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  marginBottom:12,transition:`all 0.2s ${EA}`}}>
                {loading
                  ?<><div style={{width:18,height:18,borderRadius:"50%",
                      border:`2.5px solid rgba(0,0,0,0.2)`,borderTopColor:"rgba(0,0,0,0.6)",
                      animation:"spin .75s linear infinite"}}/>Verifying...</>
                  :<><span>✓</span>Verify OTP</>}
              </button>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <button onClick={()=>{setStep("form");setOtp("");setError("");}}
                  style={{background:"none",border:"none",color:C.inkD,fontSize:12,
                    cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,padding:0}}>
                  ← Change Number
                </button>
                <button onClick={resendOTP} disabled={resendTimer>0||loading}
                  style={{background:"none",border:"none",
                    color:resendTimer>0?C.inkD:C.goldM,fontSize:12,
                    cursor:resendTimer>0?"not-allowed":"pointer",
                    fontFamily:"'DM Sans',sans-serif",fontWeight:600,padding:0}}>
                  {resendTimer>0?`Resend in ${resendTimer}s`:"Resend OTP"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
