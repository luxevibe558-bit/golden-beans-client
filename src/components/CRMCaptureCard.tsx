"use client";

// ═══════════════════════════════════════════════════════════════
// CRM CAPTURE CARD — Compulsory + WhatsApp OTP Verification
// File: src/components/CRMCaptureCard.tsx
// Flow: Name+Phone → OTP via WhatsApp → Verified → Menu Access
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import {
  registerCustomer, getSessionCustomer,
  TIER_CONFIG, type CustomerProfile,
} from "@/lib/CustomerIdentitySystem";

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

const T = {
  void:   "#020100",
  deep:   "#070504",
  surface:"#0F0D09",
  raise:  "#1A1712",
  lift:   "#231F18",
  gold:   "#C8922A",
  goldM:  "#E8B84B",
  goldL:  "#F5CC6A",
  ink:    "#F5EDD8",
  inkSub: "#C4AA80",
  inkDim: "#7A6448",
  inkGh:  "#3D3020",
  g08:    "rgba(200,146,42,0.08)",
  g15:    "rgba(200,146,42,0.15)",
  g25:    "rgba(200,146,42,0.25)",
  g40:    "rgba(200,146,42,0.40)",
  gl1:    "rgba(255,255,255,0.03)",
  gl2:    "rgba(255,255,255,0.06)",
  glBd:   "rgba(255,255,255,0.08)",
  green:  "#2E7D52",
  greenL: "rgba(46,125,82,0.15)",
  red:    "#C0392B",
};
const GG  = `linear-gradient(135deg,${T.gold} 0%,${T.goldM} 52%,${T.goldL} 100%)`;
const SPR = "cubic-bezier(0.34,1.56,0.64,1)";
const EA  = "cubic-bezier(0.25,0.46,0.45,0.94)";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
@keyframes crmIn   {from{opacity:0;transform:scale(0.9) translateY(30px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes fadeIn  {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin    {to{transform:rotate(360deg)}}
@keyframes pulse   {0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes glow    {0%,100%{box-shadow:0 0 0 0 rgba(200,146,42,0.4)}50%{box-shadow:0 0 0 12px rgba(200,146,42,0)}}
@keyframes success {0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes shake   {0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.crm-inp{
  width:100%;padding:13px 14px;border-radius:12px;
  border:1.5px solid rgba(255,255,255,0.08);
  background:rgba(255,255,255,0.04);
  color:#F5EDD8;font-size:15px;font-family:'DM Sans',sans-serif;
  font-weight:500;outline:none;
  transition:all 0.2s ease;
}
.crm-inp:focus{
  border-color:rgba(200,146,42,0.65)!important;
  background:rgba(200,146,42,0.05)!important;
  box-shadow:0 0 0 3px rgba(200,146,42,0.12)!important;
}
.crm-inp::placeholder{color:rgba(122,100,72,0.7);}
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
  onCustomerIdentified?: (customer: CustomerProfile) => void;
}

export default function CRMCaptureCard({ tableId, onCustomerIdentified }: Props) {
  const [visible,    setVisible   ] = useState(false);
  const [step,       setStep      ] = useState<Step>("form");
  const [name,       setName      ] = useState("");
  const [phone,      setPhone     ] = useState("");
  const [otp,        setOtp       ] = useState("");
  const [error,      setError     ] = useState("");
  const [loading,    setLoading   ] = useState(false);
  const [resendTimer,setResendTimer] = useState(0);
  const [profile,    setProfile   ] = useState<CustomerProfile|null>(null);
  const [shake,      setShake     ] = useState(false);

  // Show popup immediately — compulsory
  useEffect(()=>{
    const existing = getSessionCustomer();
    if(existing){
      onCustomerIdentified?.(existing);
      return;
    }
    // Show after 1.5s for smooth page load
    const t = setTimeout(()=>setVisible(true), 1500);
    return()=>clearTimeout(t);
  },[]);

  // Resend countdown
  useEffect(()=>{
    if(resendTimer<=0) return;
    const iv = setInterval(()=>setResendTimer(p=>p-1), 1000);
    return()=>clearInterval(iv);
  },[resendTimer]);

  const triggerShake = ()=>{
    setShake(true);
    setTimeout(()=>setShake(false), 500);
  };

  // Step 1 — Send OTP
  const sendOTP = async()=>{
    const cleanPhone = phone.trim().replace(/\D/g,"");
    if(!name.trim()){ setError("Please enter your name"); triggerShake(); return; }
    if(cleanPhone.length!==10){ setError("Please enter a valid 10-digit number"); triggerShake(); return; }
    
    setError(""); setLoading(true);
    
    try {
      // Send OTP via WhatsApp
      const r = await fetch(`${API}/crm-capture/send-otp`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ phone: cleanPhone, name: name.trim() }),
      }).then(r=>r.json());
      
      if(r.success){
        setStep("otp");
        setResendTimer(60);
        // DEV: Show OTP on screen if server returns it
        if(r._dev_otp){
          console.log(`[DEV OTP]: ${r._dev_otp}`);
          setError(`⚠ DEV MODE — OTP: ${r._dev_otp}`);
        }
      } else {
        // If OTP service not available, try direct register
        const result = await registerCustomer(name.trim(), cleanPhone, tableId);
        if(result){
          setProfile(result);
          setStep("success");
          onCustomerIdentified?.(result);
          setTimeout(()=>setVisible(false), 3500);
        } else {
          setError("Connection failed. Please try again.");
          triggerShake();
        }
      }
    } catch {
      // Fallback — direct register without OTP
      try {
        const result = await registerCustomer(name.trim(), cleanPhone, tableId);
        if(result){
          setProfile(result);
          setStep("success");
          onCustomerIdentified?.(result);
          setTimeout(()=>setVisible(false), 3500);
        } else {
          setError("Server unavailable. Please try again.");
          triggerShake();
        }
      } catch {
        setError("Connection error. Please try again.");
        triggerShake();
      }
    }
    setLoading(false);
  };

  // Step 2 — Verify OTP
  const verifyOTP = async()=>{
    if(otp.length!==6){ setError("Please enter the 6-digit OTP"); triggerShake(); return; }
    setError(""); setLoading(true);
    
    try {
      const cleanPhone = phone.trim().replace(/\D/g,"");
      const r = await fetch(`${API}/crm-capture/verify-otp`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ phone:cleanPhone, otp, name:name.trim(), tableId }),
      }).then(r=>r.json());
      
      if(r.success){
        const result = await registerCustomer(name.trim(), cleanPhone, tableId);
        if(result){
          setProfile(result);
          setStep("success");
          onCustomerIdentified?.(result);
          setTimeout(()=>setVisible(false), 3500);
        }
      } else {
        setError("Incorrect OTP. Please try again.");
        setOtp("");
        triggerShake();
      }
    } catch {
      setError("Verification failed. Please try again.");
      triggerShake();
    }
    setLoading(false);
  };

  const resendOTP = async()=>{
    if(resendTimer>0) return;
    setOtp(""); setError(""); setLoading(true);
    try {
      const cleanPhone = phone.trim().replace(/\D/g,"");
      await fetch(`${API}/crm-capture/send-otp`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ phone:cleanPhone, name:name.trim() }),
      });
      setResendTimer(60);
    } catch {}
    setLoading(false);
  };

  if(!visible) return <style>{CSS}</style>;

  const tierCfg = profile ? TIER_CONFIG[profile.tier] : null;

  return(
    <>
      <style>{CSS}</style>

      {/* BACKDROP — no click to dismiss (compulsory) */}
      <div style={{
        position:"fixed",inset:0,zIndex:200,
        background:"rgba(2,1,0,0.94)",
        backdropFilter:"blur(28px)",
        WebkitBackdropFilter:"blur(28px)",
        display:"flex",alignItems:"center",
        justifyContent:"center",padding:16,
      }}>
        {/* Card */}
        <div
          style={{
            width:"100%",maxWidth:420,
            background:`linear-gradient(160deg,${T.raise} 0%,${T.surface} 50%,${T.deep} 100%)`,
            borderRadius:24,overflow:"hidden",
            border:`1px solid ${T.glBd}`,
            boxShadow:`0 40px 80px rgba(0,0,0,0.8),0 0 0 1px rgba(200,146,42,0.1)`,
            animation:`crmIn 0.45s ${SPR}`,
            position:"relative",
            ...(shake?{animation:"shake 0.4s ease"}:{}),
          }}>

          {/* Gold top bar */}
          <div style={{height:3,background:GG}}/>

          {/* ── SUCCESS STATE ── */}
          {step==="success"&&profile&&(
            <div style={{padding:"32px 24px 36px",textAlign:"center",
              animation:`fadeIn 0.4s ${EA}`}}>
              {/* Success icon */}
              <div style={{width:72,height:72,borderRadius:"50%",
                background:T.greenL,border:`2px solid ${T.green}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                margin:"0 auto 20px",fontSize:30,
                boxShadow:`0 0 30px rgba(46,125,82,0.3)`,
                animation:`success 0.5s ${SPR}`}}>
                ✓
              </div>
              
              {/* Tier badge */}
              {tierCfg&&(
                <div style={{display:"inline-flex",alignItems:"center",gap:7,
                  padding:"6px 16px",borderRadius:99,marginBottom:14,
                  background:`${tierCfg.color}15`,
                  border:`1px solid ${tierCfg.color}40`}}>
                  <span style={{fontSize:18}}>{tierCfg.icon}</span>
                  <span style={{fontSize:12,fontWeight:700,color:tierCfg.color,
                    fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>
                    {tierCfg.label} Member
                  </span>
                </div>
              )}

              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,
                fontWeight:700,color:T.ink,margin:"0 0 6px"}}>
                Welcome, {profile.name.split(" ")[0]}! ☕
              </h2>
              <p style={{fontSize:13,color:T.inkSub,
                fontFamily:"'DM Sans',sans-serif",margin:"0 0 20px",lineHeight:1.6}}>
                Verified successfully! Enjoy your experience<br/>at Golden Beans Café.
              </p>
              
              {/* Points */}
              <div style={{display:"inline-flex",alignItems:"center",gap:10,
                padding:"10px 20px",borderRadius:12,
                background:T.g08,border:`1px solid rgba(200,146,42,0.2)`}}>
                <span style={{fontSize:20}}>🫘</span>
                <div style={{textAlign:"left"}}>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:18,
                    fontWeight:500,color:T.goldL,margin:0,lineHeight:1}}>
                    {profile.totalPoints} pts
                  </p>
                  <p style={{fontSize:10,color:T.inkDim,margin:0}}>
                    = ₹{Math.floor(profile.totalPoints/10)} discount
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── FORM STATE ── */}
          {step==="form"&&(
            <div style={{padding:"24px 22px 28px"}}>
              {/* Header */}
              <div style={{textAlign:"center",marginBottom:22}}>
                <div style={{fontSize:36,marginBottom:10}}>☕</div>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,
                  fontWeight:700,color:T.ink,margin:"0 0 6px",lineHeight:1.2}}>
                  Welcome to Golden Beans
                </h2>
                <p style={{fontSize:13,color:T.inkSub,
                  fontFamily:"'DM Sans',sans-serif",margin:0,lineHeight:1.6}}>
                  Please fill in your details<br/>
                  <strong style={{color:T.goldL}}>to start ordering</strong> — required
                </p>
              </div>

              {/* Form */}
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
                {/* Name */}
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:T.inkDim,
                    letterSpacing:".1em",textTransform:"uppercase",
                    display:"block",marginBottom:6,
                    fontFamily:"'DM Mono',monospace"}}>
                    Your Name
                  </label>
                  <input
                    className="crm-inp"
                    value={name}
                    onChange={e=>{ setName(e.target.value); setError(""); }}
                    placeholder="e.g. Nirav Patel"
                    onKeyDown={e=>e.key==="Enter"&&sendOTP()}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:T.inkDim,
                    letterSpacing:".1em",textTransform:"uppercase",
                    display:"block",marginBottom:6,
                    fontFamily:"'DM Mono',monospace"}}>
                    WhatsApp Number
                  </label>
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:14,top:"50%",
                      transform:"translateY(-50%)",
                      fontSize:14,color:T.inkDim,fontFamily:"'DM Sans',sans-serif",
                      fontWeight:600,pointerEvents:"none"}}>
                      +91
                    </span>
                    <input
                      className="crm-inp"
                      value={phone}
                      onChange={e=>{ setPhone(e.target.value.replace(/\D/g,"").slice(0,10)); setError(""); }}
                      placeholder="98765 43210"
                      type="tel"
                      inputMode="numeric"
                      style={{paddingLeft:46}}
                      onKeyDown={e=>e.key==="Enter"&&sendOTP()}
                    />
                  </div>
                  <p style={{fontSize:11,color:T.inkDim,margin:"6px 0 0",
                    fontFamily:"'DM Sans',sans-serif"}}>
                    📱 You will receive an OTP on WhatsApp
                  </p>
                </div>
              </div>

              {/* Error */}
              {error&&(
                <div style={{background:"rgba(192,57,43,0.1)",
                  border:"1px solid rgba(192,57,43,0.3)",
                  borderRadius:10,padding:"9px 12px",marginBottom:12,
                  fontSize:12.5,color:"#F87171",
                  fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
                  ⚠ {error}
                </div>
              )}

              {/* CTA */}
              <button onClick={sendOTP} disabled={loading}
                style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
                  background:loading?"rgba(255,255,255,0.05)":GG,
                  color:loading?T.inkDim:"#050301",
                  fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer",
                  fontFamily:"'DM Sans',sans-serif",
                  boxShadow:loading?"none":`0 8px 28px ${T.g40}`,
                  display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  transition:`all 0.2s ${EA}`,letterSpacing:".02em"}}>
                {loading
                  ?<><div style={{width:18,height:18,borderRadius:"50%",
                      border:`2.5px solid rgba(0,0,0,0.2)`,
                      borderTopColor:"rgba(0,0,0,0.6)",
                      animation:"spin .75s linear infinite"}}/> Sending OTP...</>
                  :<><span>📱</span> Send OTP</>}
              </button>

              {/* Notice */}
              <p style={{textAlign:"center",fontSize:11,color:T.inkGh,
                margin:"12px 0 0",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>
                🔒 Your details are safe · Earn loyalty points on every visit
              </p>
            </div>
          )}

          {/* ── OTP STATE ── */}
          {step==="otp"&&(
            <div style={{padding:"24px 22px 28px",animation:`fadeIn 0.3s ${EA}`}}>
              {/* Header */}
              <div style={{textAlign:"center",marginBottom:22}}>
                <div style={{fontSize:36,marginBottom:10}}>📱</div>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,
                  fontWeight:700,color:T.ink,margin:"0 0 6px"}}>
                  Verify Your Number
                </h2>
                <p style={{fontSize:13,color:T.inkSub,
                  fontFamily:"'DM Sans',sans-serif",margin:0,lineHeight:1.6}}>
                  A 6-digit OTP has been sent to WhatsApp<br/>
                  <strong style={{color:T.goldL}}>+91 {phone}</strong>
                </p>
              </div>

              {/* OTP Input */}
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:700,color:T.inkDim,
                  letterSpacing:".1em",textTransform:"uppercase",
                  display:"block",marginBottom:8,
                  fontFamily:"'DM Mono',monospace"}}>
                  Enter OTP
                </label>
                <input
                  className="otp-inp"
                  value={otp}
                  onChange={e=>{ setOtp(e.target.value.replace(/\D/g,"").slice(0,6)); setError(""); }}
                  placeholder="——————"
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  onKeyDown={e=>e.key==="Enter"&&verifyOTP()}
                />
              </div>

              {/* Error */}
              {error&&(
                <div style={{background:"rgba(192,57,43,0.1)",
                  border:"1px solid rgba(192,57,43,0.3)",
                  borderRadius:10,padding:"9px 12px",marginBottom:12,
                  fontSize:12.5,color:"#F87171",
                  fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
                  ⚠ {error}
                </div>
              )}

              {/* Verify Button */}
              <button onClick={verifyOTP} disabled={loading||otp.length!==6}
                style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
                  background:otp.length===6&&!loading?GG:"rgba(255,255,255,0.05)",
                  color:otp.length===6&&!loading?"#050301":T.inkDim,
                  fontWeight:700,fontSize:15,
                  cursor:otp.length===6&&!loading?"pointer":"not-allowed",
                  fontFamily:"'DM Sans',sans-serif",
                  boxShadow:otp.length===6&&!loading?`0 8px 28px ${T.g40}`:"none",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  marginBottom:12,
                  transition:`all 0.2s ${EA}`}}>
                {loading
                  ?<><div style={{width:18,height:18,borderRadius:"50%",
                      border:`2.5px solid rgba(0,0,0,0.2)`,
                      borderTopColor:"rgba(0,0,0,0.6)",
                      animation:"spin .75s linear infinite"}}/> Verifying...</>
                  :<><span>✓</span> Verify OTP</>}
              </button>

              {/* Resend + Back */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <button onClick={()=>{ setStep("form"); setOtp(""); setError(""); }}
                  style={{background:"none",border:"none",color:T.inkDim,
                    fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                    fontWeight:600,padding:0}}>
                  ← Change Number
                </button>
                <button onClick={resendOTP} disabled={resendTimer>0||loading}
                  style={{background:"none",border:"none",
                    color:resendTimer>0?T.inkDim:T.goldM,
                    fontSize:12,cursor:resendTimer>0?"not-allowed":"pointer",
                    fontFamily:"'DM Sans',sans-serif",fontWeight:600,padding:0}}>
                  {resendTimer>0?`Resend OTP in ${resendTimer}s`:"Resend OTP"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
