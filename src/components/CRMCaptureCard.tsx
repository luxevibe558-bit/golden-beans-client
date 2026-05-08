"use client";

import { useState, useEffect, useRef } from "react";
import {
  registerCustomer, getSessionCustomer, clearSessionCustomer,
  TIER_CONFIG, getNextTier, type CustomerProfile
} from "@/lib/CustomerIdentitySystem";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
@keyframes crmIn     { from{opacity:0;transform:scale(0.88) translateY(24px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes breathG   { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.65;transform:scale(1.1)} }
@keyframes smokeUp   { 0%{opacity:0;transform:translateY(0) scaleX(1)} 25%{opacity:.55} 100%{opacity:0;transform:translateY(-60px) scaleX(2.4)} }
@keyframes pulseRing { 0%{box-shadow:0 0 0 0 rgba(200,146,42,.45)} 70%{box-shadow:0 0 0 12px rgba(200,146,42,0)} 100%{box-shadow:0 0 0 0 rgba(200,146,42,0)} }
@keyframes shimmer   { from{background-position:200% center} to{background-position:-200% center} }
@keyframes floatUp   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes glowPop   { 0%{box-shadow:0 0 0 0 rgba(200,146,42,.6)} 100%{box-shadow:0 0 0 20px rgba(200,146,42,0)} }
@keyframes checkDraw { from{stroke-dashoffset:40} to{stroke-dashoffset:0} }
@keyframes spin      { to{transform:rotate(360deg)} }
@keyframes fadeRise  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes tierIn    { from{opacity:0;transform:scale(0.7) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }

.crm-input:focus {
  border-color: rgba(200,146,42,0.7)!important;
  box-shadow: 0 0 0 3px rgba(200,146,42,0.12), 0 4px 20px rgba(200,146,42,0.15)!important;
  background: rgba(255,255,255,0.055)!important;
  outline: none;
  transform: translateY(-1px);
}
`;

const T = {
  void:"#030201",deep:"#080604",surface:"#110E09",raise:"#1C1810",
  gold:"#C8922A",goldM:"#E8B84B",goldL:"#F5CC6A",
  ink:"#F5EDD8",inkSub:"#C4AA80",inkDim:"#7A6448",
  g08:"rgba(200,146,42,0.08)",g15:"rgba(200,146,42,0.15)",
  g25:"rgba(200,146,42,0.25)",g40:"rgba(200,146,42,0.40)",
  gl1:"rgba(255,255,255,0.03)",gl2:"rgba(255,255,255,0.06)",glBd:"rgba(255,255,255,0.08)",
  green:"#2E7D52",greenL:"rgba(46,125,82,0.15)",
};
const GG = `linear-gradient(135deg,${T.gold} 0%,${T.goldM} 52%,${T.goldL} 100%)`;
const SP = "cubic-bezier(0.34,1.56,0.64,1)";
const EA = "cubic-bezier(0.25,0.46,0.45,0.94)";

interface Props {
  tableId: string;
  onCustomerIdentified?: (customer: CustomerProfile) => void;
}

export default function CRMCaptureCard({ tableId, onCustomerIdentified }: Props) {
  const [visible,    setVisible   ] = useState(false);
  const [dismissed,  setDismissed ] = useState(false);
  const [name,       setName      ] = useState("");
  const [phone,      setPhone     ] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess   ] = useState(false);
  const [profile,    setProfile   ] = useState<CustomerProfile|null>(null);
  const [error,      setError     ] = useState("");
  const [nameFocus,  setNameFocus ] = useState(false);
  const [phoneFocus, setPhoneFocus] = useState(false);
  const [ripple,     setRipple    ] = useState(false);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  useEffect(()=>{
    // Check if already have session
    const existing = getSessionCustomer();
    if (existing) {
      onCustomerIdentified?.(existing);
      return;
    }
    // Check sessionStorage key for dismissal (only per-session)
    if (sessionStorage.getItem("gb_crm_dismissed")) return;

    timerRef.current = setTimeout(()=>setVisible(true), 15000);
    return()=>{ if(timerRef.current) clearTimeout(timerRef.current); };
  },[]);

  const dismiss = ()=>{
    setVisible(false);
    sessionStorage.setItem("gb_crm_dismissed","1"); // session only — shows again next visit
    setTimeout(()=>setDismissed(true), 400);
  };

  const submit = async()=>{
    if(!name.trim())   { setError("Please enter your name"); return; }
    if(phone.trim().replace(/\D/g,"").length < 10) { setError("Enter a valid 10-digit number"); return; }
    setError(""); setSubmitting(true);

    const result = await registerCustomer(name.trim(), phone.trim(), tableId);

    if(result) {
      setProfile(result);
      setSuccess(true);
      onCustomerIdentified?.(result);
      // Auto-close after showing success
      setTimeout(()=>{
        setVisible(false);
        setTimeout(()=>setDismissed(true), 400);
      }, 4000);
    } else {
      setError("Could not connect. Please try again.");
    }
    setSubmitting(false);
  };

  const handleCTA = ()=>{ setRipple(true); setTimeout(()=>setRipple(false),600); submit(); };

  if(dismissed || !visible) return <style>{CSS}</style>;

  const tierCfg = profile ? TIER_CONFIG[profile.tier] : null;
  const nextTier = profile ? getNextTier(profile.tier, profile.totalPoints) : null;

  return(
    <>
      <style>{CSS}</style>
      <div onClick={dismiss} style={{position:"fixed",inset:0,zIndex:200,
        background:"rgba(2,1,0,0.88)",backdropFilter:"blur(22px)",
        display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,maxHeight:"93dvh",
          background:`linear-gradient(160deg,#1A1510 0%,#0D0B07 50%,#080604 100%)`,
          borderRadius:28,border:`1px solid rgba(200,146,42,0.35)`,
          boxShadow:`0 0 0 1px rgba(200,146,42,0.08),0 32px 80px rgba(0,0,0,0.9),0 0 60px rgba(200,146,42,0.08)`,
          overflow:"hidden",animation:`crmIn 0.55s ${SP} both`,
          display:"flex",flexDirection:"column",position:"relative"}}>

          {/* Gold top bar */}
          <div style={{height:2,background:GG,flexShrink:0}}/>

          {/* Ambient glow */}
          <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",
            background:`radial-gradient(circle,rgba(200,146,42,0.12),transparent 70%)`,
            pointerEvents:"none",animation:"breathG 5s ease-in-out infinite"}}/>

          <div style={{overflowY:"auto",overflowX:"hidden",flex:1}}>
            {/* Header */}
            <div style={{padding:"20px 20px 0",position:"relative"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:44,height:44,borderRadius:12,overflow:"hidden",
                    border:`1.5px solid rgba(200,146,42,0.45)`,boxShadow:`0 0 18px rgba(200,146,42,0.2)`}}>
                    <img src="/logo-large.png" alt="GB"
                      style={{width:"100%",height:"100%",objectFit:"cover"}}
                      onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
                  </div>
                  <div>
                    <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:600,color:T.goldL,margin:0,lineHeight:1.1}}>Golden Beans</p>
                    <p style={{fontSize:9,color:T.inkDim,margin:0,fontFamily:"'DM Mono',monospace",letterSpacing:".14em",textTransform:"uppercase"}}>Cafe &amp; Bistro</p>
                  </div>
                </div>
                <button onClick={dismiss} style={{width:36,height:36,borderRadius:"50%",
                  background:"rgba(255,255,255,0.04)",border:`1px solid rgba(255,255,255,0.1)`,
                  color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:16,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>

              {/* Hero row */}
              <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:20}}>
                <div style={{flex:1,paddingTop:4}}>
                  <p style={{fontSize:10.5,color:T.gold,fontFamily:"'DM Mono',monospace",
                    letterSpacing:".16em",textTransform:"uppercase",margin:"0 0 8px",
                    animation:`fadeRise 0.5s 0.1s ${EA} both`}}>✦ Loyalty Program</p>
                  <h2 style={{fontFamily:"'Cormorant Garamond',serif",
                    fontSize:"clamp(24px,7vw,30px)",fontWeight:700,
                    color:T.ink,margin:"0 0 4px",lineHeight:1.05,
                    animation:`fadeRise 0.5s 0.18s ${EA} both`}}>
                    Join the<br/>
                    <em style={{fontStyle:"italic",fontWeight:700,
                      background:GG,WebkitBackgroundClip:"text",
                      WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
                      Golden Beans<br/>Family!
                    </em>
                  </h2>
                  <p style={{fontSize:12.5,color:T.inkSub,fontFamily:"'DM Sans',sans-serif",
                    fontWeight:300,lineHeight:1.55,margin:"8px 0 0",maxWidth:200,
                    animation:`fadeRise 0.5s 0.28s ${EA} both`}}>
                    Earn points on every order. Redeem for free drinks &amp; discounts!
                  </p>
                </div>
                <div style={{width:120,flexShrink:0,position:"relative",
                  animation:`floatUp 4s ease-in-out infinite`}}>
                  <div style={{position:"absolute",inset:-8,borderRadius:"50%",
                    background:`radial-gradient(ellipse,rgba(200,146,42,0.18),transparent 70%)`,
                    animation:"breathG 4s ease-in-out infinite"}}/>
                  <img src="/coffee-hero.png" alt="Coffee"
                    style={{width:"100%",borderRadius:16,objectFit:"cover",
                      filter:"drop-shadow(0 8px 24px rgba(200,146,42,0.3))"}}
                    onError={e=>{
                      const el=e.target as HTMLImageElement;
                      el.style.display="none";
                      const fb=document.createElement("div");
                      fb.style.cssText=`width:100%;aspect-ratio:1;border-radius:16px;background:radial-gradient(ellipse at 40% 35%,#5C2E0A,#2A1205);display:flex;align-items:center;justify-content:center;font-size:52px`;
                      fb.textContent="☕";
                      el.parentElement?.appendChild(fb);
                    }}/>
                </div>
              </div>
            </div>

            {/* Reward card */}
            <div style={{margin:"0 20px 18px",animation:`fadeRise 0.5s 0.35s ${EA} both`}}>
              <div style={{background:`linear-gradient(135deg,rgba(200,146,42,0.14),rgba(232,184,75,0.08))`,
                backdropFilter:"blur(16px)",border:`1.5px solid rgba(200,146,42,0.45)`,
                borderRadius:16,padding:"13px 16px",display:"flex",alignItems:"center",gap:13,
                boxShadow:`0 0 0 1px rgba(200,146,42,0.08),0 8px 28px rgba(200,146,42,0.12)`,
                position:"relative",overflow:"hidden",animation:"pulseRing 3s ease-in-out infinite"}}>
                <div style={{position:"absolute",inset:0,overflow:"hidden",borderRadius:16,pointerEvents:"none"}}>
                  <div style={{position:"absolute",top:0,left:0,width:"25%",height:"100%",
                    background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)",
                    animation:"shimmer 3s ease-in-out infinite",backgroundSize:"200% 100%"}}/>
                </div>
                <div style={{width:44,height:44,borderRadius:12,background:GG,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,
                  boxShadow:`0 4px 16px rgba(200,146,42,0.45)`}}>🫘</div>
                <div>
                  <p style={{fontFamily:"'DM Mono',monospace",fontWeight:500,fontSize:11,
                    color:T.inkDim,letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 2px"}}>
                    Earn on Every Order
                  </p>
                  <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:T.goldL,lineHeight:1}}>1 point</span>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:T.gold}}>per ₹10 spent</span>
                  </div>
                  <p style={{fontSize:11,color:T.inkSub,margin:"2px 0 0",fontFamily:"'DM Sans',sans-serif"}}>
                    100 pts = ₹10 off · Welcome bonus: 50 pts 🎉
                  </p>
                </div>
              </div>
            </div>

            {/* Success state */}
            {success && profile ? (
              <div style={{padding:"0 20px 26px",textAlign:"center"}}>
                {/* Tier badge */}
                {tierCfg && (
                  <div style={{display:"inline-flex",alignItems:"center",gap:8,
                    background:`${tierCfg.color}18`,
                    border:`1.5px solid ${tierCfg.color}60`,
                    borderRadius:99,padding:"6px 16px",marginBottom:16,
                    animation:`tierIn 0.5s ${SP}`}}>
                    <span style={{fontSize:18}}>{tierCfg.icon}</span>
                    <div style={{textAlign:"left"}}>
                      <p style={{fontSize:12,fontWeight:700,color:tierCfg.color,
                        fontFamily:"'DM Sans',sans-serif",margin:0}}>
                        {tierCfg.label} Member
                      </p>
                      <p style={{fontSize:10,color:T.inkDim,fontFamily:"'DM Sans',sans-serif",margin:0}}>
                        {tierCfg.perks}
                      </p>
                    </div>
                  </div>
                )}

                {/* Stats grid */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  <div style={{background:T.gl1,border:`1px solid rgba(200,146,42,0.25)`,
                    borderRadius:14,padding:"14px 12px",textAlign:"center"}}>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:26,fontWeight:500,
                      color:T.goldL,margin:"0 0 2px",lineHeight:1}}>
                      {profile.totalPoints}
                    </p>
                    <p style={{fontSize:10.5,color:T.inkSub,margin:0,
                      fontFamily:"'DM Sans',sans-serif"}}>Points Balance</p>
                    <p style={{fontSize:10,color:T.gold,margin:"3px 0 0",
                      fontFamily:"'DM Mono',monospace"}}>= ₹{Math.floor(profile.totalPoints/10)} value</p>
                  </div>
                  <div style={{background:T.gl1,border:`1px solid ${T.glBd}`,
                    borderRadius:14,padding:"14px 12px",textAlign:"center"}}>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:26,fontWeight:500,
                      color:T.ink,margin:"0 0 2px",lineHeight:1}}>
                      {profile.visits}
                    </p>
                    <p style={{fontSize:10.5,color:T.inkSub,margin:0,fontFamily:"'DM Sans',sans-serif"}}>
                      {profile.isNewCustomer ? "First Visit 🎉" : "Total Visits"}
                    </p>
                    <p style={{fontSize:10,color:T.inkDim,margin:"3px 0 0",fontFamily:"'DM Sans',sans-serif"}}>
                      {profile.isNewCustomer ? "+50 welcome pts!" : `${profile.totalOrders} orders`}
                    </p>
                  </div>
                </div>

                {/* Next tier progress */}
                {nextTier && (
                  <div style={{background:T.gl1,border:`1px solid ${T.glBd}`,
                    borderRadius:13,padding:"11px 14px",marginBottom:14,textAlign:"left"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                      <span style={{fontSize:11,color:T.inkSub,fontFamily:"'DM Sans',sans-serif"}}>
                        {nextTier.pointsNeeded} pts to {nextTier.icon} {nextTier.label}
                      </span>
                      <span style={{fontSize:11,color:T.gold,fontFamily:"'DM Mono',monospace"}}>
                        {profile.totalPoints}/{TIER_CONFIG[nextTier.tier].min}
                      </span>
                    </div>
                    <div style={{height:5,borderRadius:3,background:"rgba(255,255,255,0.06)"}}>
                      <div style={{height:"100%",borderRadius:3,background:GG,
                        width:`${Math.min(100,(profile.totalPoints/TIER_CONFIG[nextTier.tier].min)*100)}%`,
                        transition:"width 1s ease",boxShadow:`0 0 8px rgba(200,146,42,0.4)`}}/>
                    </div>
                  </div>
                )}

                {/* Welcome message */}
                <div style={{padding:"12px 16px",background:`rgba(46,125,82,0.1)`,
                  border:`1px solid rgba(46,125,82,0.3)`,borderRadius:12,
                  display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:22}}>
                    {profile.isNewCustomer ? "🎉" : "👋"}
                  </span>
                  <div style={{textAlign:"left"}}>
                    <p style={{fontSize:13.5,fontWeight:700,color:"#4ADE80",
                      fontFamily:"'DM Sans',sans-serif",margin:"0 0 2px"}}>
                      {profile.isNewCustomer
                        ? `Welcome, ${profile.name.split(" ")[0]}!`
                        : `Welcome back, ${profile.name.split(" ")[0]}!`}
                    </p>
                    <p style={{fontSize:11.5,color:T.inkSub,fontFamily:"'DM Sans',sans-serif",margin:0}}>
                      {profile.isNewCustomer
                        ? `You've earned 50 welcome points! 🫘`
                        : `You have ${profile.totalPoints} points (₹${Math.floor(profile.totalPoints/10)} value)`}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Form */
              <div style={{padding:"0 20px 24px"}}>
                {/* Name field */}
                <div style={{marginBottom:13}}>
                  <label style={{fontSize:10,fontWeight:700,color:T.inkDim,
                    letterSpacing:".12em",textTransform:"uppercase",
                    fontFamily:"'DM Mono',monospace",display:"block",marginBottom:7}}>
                    Your Name
                  </label>
                  <div style={{position:"relative"}}>
                    <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",
                      color:nameFocus?T.gold:T.inkDim,fontSize:16,transition:`color 0.2s ${EA}`,pointerEvents:"none"}}>
                      <svg width={17} height={17} viewBox="0 0 17 17" fill="none">
                        <circle cx={8.5} cy={6} r={3} stroke="currentColor" strokeWidth={1.4}/>
                        <path d="M2 15c0-3 3-5 6.5-5s6.5 2 6.5 5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
                      </svg>
                    </div>
                    <input className="crm-input" value={name}
                      onChange={e=>setName(e.target.value)}
                      onFocus={()=>setNameFocus(true)} onBlur={()=>setNameFocus(false)}
                      placeholder="e.g. Nirav Patel"
                      style={{width:"100%",padding:"14px 14px 14px 44px",borderRadius:14,
                        border:`1.5px solid ${nameFocus?"rgba(200,146,42,0.6)":"rgba(255,255,255,0.08)"}`,
                        background:"rgba(255,255,255,0.04)",color:T.ink,fontSize:15,
                        fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",
                        transition:`all 0.25s ${EA}`}}/>
                  </div>
                </div>

                {/* Phone field */}
                <div style={{marginBottom:error?9:18}}>
                  <label style={{fontSize:10,fontWeight:700,color:T.inkDim,
                    letterSpacing:".12em",textTransform:"uppercase",
                    fontFamily:"'DM Mono',monospace",display:"block",marginBottom:7}}>
                    Phone Number
                    <span style={{fontSize:9,color:T.gold,marginLeft:6,
                      background:T.g08,borderRadius:4,padding:"1px 6px",
                      letterSpacing:".06em"}}>used to identify you</span>
                  </label>
                  <div style={{position:"relative"}}>
                    <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",
                      color:phoneFocus?T.gold:T.inkDim,transition:`color 0.2s ${EA}`,pointerEvents:"none"}}>
                      <svg width={17} height={17} viewBox="0 0 17 17" fill="none">
                        <path d="M3 3h3l1.5 3.5-2 1.5c1 2 2.5 3.5 4.5 4.5l1.5-2L15 12v3c-6.5 1-13-5.5-12-12z" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <input className="crm-input" value={phone}
                      onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                      onFocus={()=>setPhoneFocus(true)} onBlur={()=>setPhoneFocus(false)}
                      placeholder="98765 43210" type="tel" inputMode="numeric"
                      style={{width:"100%",padding:"14px 14px 14px 44px",borderRadius:14,
                        border:`1.5px solid ${phoneFocus?"rgba(200,146,42,0.6)":"rgba(255,255,255,0.08)"}`,
                        background:"rgba(255,255,255,0.04)",color:T.ink,fontSize:15,
                        fontFamily:"'DM Mono',monospace",letterSpacing:".06em",
                        boxSizing:"border-box",transition:`all 0.25s ${EA}`}}/>
                  </div>
                </div>

                {error&&<p style={{fontSize:11.5,color:"#ef8080",
                  fontFamily:"'DM Sans',sans-serif",margin:"0 0 12px",
                  display:"flex",alignItems:"center",gap:5}}>⚠ {error}</p>}

                {/* Why phone explanation */}
                <div style={{background:T.g08,border:`1px solid rgba(200,146,42,0.18)`,
                  borderRadius:11,padding:"9px 13px",marginBottom:16,
                  display:"flex",gap:9,alignItems:"flex-start"}}>
                  <span style={{fontSize:14,flexShrink:0}}>🔐</span>
                  <p style={{fontSize:11,color:T.inkDim,fontFamily:"'DM Sans',sans-serif",
                    margin:0,lineHeight:1.5}}>
                    Your phone number keeps your loyalty points safe across visits — even if you use a different device or browser.
                  </p>
                </div>

                {/* CTAs */}
                <div style={{display:"flex",flexDirection:"column",gap:9}}>
                  <button onClick={handleCTA} disabled={submitting}
                    style={{position:"relative",overflow:"hidden",width:"100%",padding:"16px",
                      borderRadius:14,border:"none",
                      background:submitting?"rgba(200,146,42,0.3)":GG,
                      color:submitting?T.inkDim:T.void,fontWeight:700,fontSize:15,
                      fontFamily:"'DM Sans',sans-serif",cursor:submitting?"not-allowed":"pointer",
                      boxShadow:submitting?"none":`0 8px 28px rgba(200,146,42,0.45)`,
                      display:"flex",alignItems:"center",justifyContent:"center",gap:9,
                      transition:`all 0.3s ${EA}`,transform:ripple?"scale(0.97)":"scale(1)"}}>
                    {ripple&&<div style={{position:"absolute",inset:0,borderRadius:14,
                      background:"rgba(255,255,255,0.15)"}}/>}
                    {submitting
                      ?<><div style={{width:18,height:18,borderRadius:"50%",
                          border:`2.5px solid rgba(0,0,0,0.2)`,borderTopColor:"rgba(0,0,0,0.6)",
                          animation:"spin 0.75s linear infinite"}}/> Joining...</>
                      :<><span style={{fontSize:17}}>🫘</span> Join &amp; Earn Points</>
                    }
                  </button>
                  <button onClick={dismiss}
                    style={{width:"100%",padding:"12px",borderRadius:14,
                      border:`1px solid rgba(255,255,255,0.09)`,
                      background:"rgba(255,255,255,0.025)",color:T.inkDim,
                      fontWeight:500,fontSize:13.5,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
                    Maybe Later
                  </button>
                </div>

                <p style={{textAlign:"center",fontSize:10.5,color:T.inkDim,
                  fontFamily:"'DM Sans',sans-serif",margin:"11px 0 0"}}>
                  🔒 No spam. Only your order history &amp; rewards.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
