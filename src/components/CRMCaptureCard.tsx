"use client";

import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════
// CINEMATIC CRM POPUP — Golden Beans
// Premium luxury invitation modal
// ═══════════════════════════════════════════════════

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

// ── Design tokens ──
const T = {
  void:   "#030201",
  deep:   "#080604",
  surface:"#110E09",
  raise:  "#1C1810",
  gold:   "#C8922A",
  goldM:  "#E8B84B",
  goldL:  "#F5CC6A",
  goldXL: "#FAE095",
  ink:    "#F5EDD8",
  inkSub: "#C4AA80",
  inkDim: "#7A6448",
  g0:     "rgba(200,146,42,0)",
  g08:    "rgba(200,146,42,0.08)",
  g15:    "rgba(200,146,42,0.15)",
  g25:    "rgba(200,146,42,0.25)",
  g40:    "rgba(200,146,42,0.40)",
  g60:    "rgba(200,146,42,0.60)",
  gl1:    "rgba(255,255,255,0.03)",
  gl2:    "rgba(255,255,255,0.06)",
  gl3:    "rgba(255,255,255,0.10)",
  glBd:   "rgba(255,255,255,0.08)",
  emerald:"#2E7D52",
};

const GG = `linear-gradient(135deg, ${T.gold} 0%, ${T.goldM} 52%, ${T.goldL} 100%)`;
const SP = "cubic-bezier(0.34,1.56,0.64,1)";
const EA = "cubic-bezier(0.25,0.46,0.45,0.94)";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

@keyframes crmIn     { from{opacity:0;transform:scale(0.88) translateY(24px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes crmBgIn   { from{opacity:0;backdrop-filter:blur(0px)} to{opacity:1;backdrop-filter:blur(22px)} }
@keyframes steamUp   { 0%{opacity:0;transform:translateY(0) scaleX(1) rotate(0deg)} 25%{opacity:.55} 75%{opacity:.3} 100%{opacity:0;transform:translateY(-60px) scaleX(2.4) rotate(8deg)} }
@keyframes particleFl{ 0%{opacity:0;transform:translate(0,0) scale(0)} 30%{opacity:.7} 100%{opacity:0;transform:translate(var(--px),var(--py)) scale(0)} }
@keyframes breathGold{ 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.6;transform:scale(1.1)} }
@keyframes pulseRing { 0%{box-shadow:0 0 0 0 rgba(200,146,42,0.4)} 70%{box-shadow:0 0 0 12px rgba(200,146,42,0)} 100%{box-shadow:0 0 0 0 rgba(200,146,42,0)} }
@keyframes shimmerGo { from{background-position:200% center} to{background-position:-200% center} }
@keyframes floatUp   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes glowPop   { 0%{box-shadow:0 0 0 0 rgba(200,146,42,0.6)} 100%{box-shadow:0 0 0 20px rgba(200,146,42,0)} }
@keyframes checkDraw { from{stroke-dashoffset:40} to{stroke-dashoffset:0} }
@keyframes fadeRise  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes spin      { to{transform:rotate(360deg)} }

.crm-input:focus {
  border-color: rgba(200,146,42,0.7) !important;
  box-shadow: 0 0 0 3px rgba(200,146,42,0.12), 0 4px 20px rgba(200,146,42,0.15) !important;
  background: rgba(255,255,255,0.055) !important;
  transform: translateY(-1px);
  outline: none;
}
`;

interface Props {
  tableId: string;
}

export default function CRMCaptureCard({ tableId }: Props) {
  const [visible,   setVisible  ] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [name,      setName     ] = useState("");
  const [phone,     setPhone    ] = useState("");
  const [submitting,setSubmitting] = useState(false);
  const [success,   setSuccess  ] = useState(false);
  const [error,     setError    ] = useState("");
  const [nameFocus, setNameFocus] = useState(false);
  const [phoneFocus,setPhoneFocus] = useState(false);
  const [ripple,    setRipple   ] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Don't show if customer already registered
    const saved = localStorage.getItem("gb_customer");
    if (saved) return;
    const dismissed = localStorage.getItem("gb_crm_dismissed");
    if (dismissed) return;

    timerRef.current = setTimeout(() => setVisible(true), 15000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem("gb_crm_dismissed", "1");
    setTimeout(() => setDismissed(true), 400);
  };

  const submit = async () => {
    if (!name.trim() || phone.trim().length < 10) {
      setError(!name.trim() ? "Please enter your name" : "Enter a valid 10-digit number");
      return;
    }
    setError(""); setSubmitting(true);
    try {
      await fetch(`${API}/customers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), tableId }),
      });
      localStorage.setItem("gb_customer", JSON.stringify({ name: name.trim(), phone: phone.trim() }));
      setSuccess(true);
      setTimeout(() => { setVisible(false); setTimeout(() => setDismissed(true), 400); }, 3200);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const handleCTA = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
    submit();
  };

  if (dismissed || !visible) return <style>{CSS}</style>;

  return (
    <>
      <style>{CSS}</style>

      {/* ── Backdrop ── */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(2,1,0,0.85)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          animation: `crmBgIn 0.45s ${EA} both`,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
        }}
      >
        {/* ── Modal ── */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 420,
            maxHeight: "92dvh",
            background: `linear-gradient(160deg, #1A1510 0%, #0D0B07 50%, #080604 100%)`,
            borderRadius: 28,
            border: `1px solid rgba(200,146,42,0.35)`,
            boxShadow: `0 0 0 1px rgba(200,146,42,0.08), 0 32px 80px rgba(0,0,0,0.9), 0 0 60px rgba(200,146,42,0.08)`,
            overflow: "hidden",
            animation: `crmIn 0.55s ${SP} both`,
            display: "flex", flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Gold top bar */}
          <div style={{ height: 2, background: GG, flexShrink: 0 }} />

          {/* Ambient corner glow */}
          <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%",
            background:`radial-gradient(circle, rgba(200,146,42,0.12) 0%, transparent 70%)`,
            pointerEvents:"none", animation:"breathGold 5s ease-in-out infinite" }} />
          <div style={{ position:"absolute", bottom:-60, left:-30, width:180, height:180, borderRadius:"50%",
            background:`radial-gradient(circle, rgba(200,146,42,0.06) 0%, transparent 70%)`,
            pointerEvents:"none", animation:"breathGold 7s 2s ease-in-out infinite" }} />

          {/* ── Scrollable body ── */}
          <div style={{ overflowY:"auto", overflowX:"hidden", flex:1 }}>

            {/* ── HERO SECTION ── */}
            <div style={{ position:"relative", padding:"22px 22px 0", overflow:"hidden" }}>

              {/* Logo + branding row */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:44, height:44, borderRadius:12, overflow:"hidden",
                    border:`1.5px solid rgba(200,146,42,0.45)`,
                    boxShadow:`0 0 18px rgba(200,146,42,0.2)` }}>
                    <img src="/logo-large.png" alt="GB"
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}
                      onError={e=>{(e.target as HTMLImageElement).style.display="none";}} />
                  </div>
                  <div>
                    <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, fontWeight:600,
                      color:T.goldL, margin:0, lineHeight:1.1 }}>Golden Beans</p>
                    <p style={{ fontSize:9, color:T.inkDim, margin:0,
                      fontFamily:"'DM Mono',monospace", letterSpacing:".14em", textTransform:"uppercase" }}>
                      Cafe &amp; Bistro
                    </p>
                  </div>
                </div>

                {/* Close button */}
                <button onClick={dismiss}
                  style={{ width:36, height:36, borderRadius:"50%",
                    background:"rgba(255,255,255,0.04)", backdropFilter:"blur(12px)",
                    border:`1px solid rgba(255,255,255,0.1)`,
                    color:"rgba(255,255,255,0.5)", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:16, fontWeight:300,
                    transition:`all 0.22s ${EA}`,
                  }}>✕</button>
              </div>

              {/* Hero layout — text left, coffee right */}
              <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:20 }}>
                {/* Left — headline */}
                <div style={{ flex:1, paddingTop:4 }}>
                  <p style={{ fontSize:10.5, color:T.gold, fontFamily:"'DM Mono',monospace",
                    letterSpacing:".16em", textTransform:"uppercase", margin:"0 0 8px",
                    animation:`fadeRise 0.5s 0.1s ${EA} both` }}>
                    ✦ Exclusive Invite
                  </p>
                  <h2 style={{ fontFamily:"'Cormorant Garamond',serif",
                    fontSize:"clamp(26px,7vw,32px)", fontWeight:700,
                    color:T.ink, margin:"0 0 4px", lineHeight:1.05, letterSpacing:"-.01em",
                    animation:`fadeRise 0.5s 0.18s ${EA} both` }}>
                    Join the<br />
                    <em style={{ fontStyle:"italic", fontWeight:700,
                      background:GG, WebkitBackgroundClip:"text",
                      WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                      Golden Beans<br />Family!
                    </em>
                  </h2>
                  <p style={{ fontSize:12.5, color:T.inkSub, fontFamily:"'DM Sans',sans-serif",
                    fontWeight:300, lineHeight:1.55, margin:"8px 0 0", maxWidth:200,
                    animation:`fadeRise 0.5s 0.28s ${EA} both` }}>
                    Get exclusive offers, rewards &amp; surprises made just for you.
                  </p>
                </div>

                {/* Right — cinematic coffee cup */}
                <div style={{ width:130, flexShrink:0, position:"relative",
                  animation:`floatUp 4s ease-in-out infinite` }}>
                  {/* Cup glow */}
                  <div style={{ position:"absolute", inset:-8, borderRadius:"50%",
                    background:`radial-gradient(ellipse, rgba(200,146,42,0.18) 0%, transparent 70%)`,
                    animation:"breathGold 4s ease-in-out infinite" }} />
                  {/* Steam particles */}
                  {[
                    { l:"28%", d:0,    w:4,  h:22, rot:"-3deg"  },
                    { l:"44%", d:0.5,  w:5,  h:28, rot:"2deg"   },
                    { l:"60%", d:1.1,  w:3.5,h:18, rot:"-5deg"  },
                    { l:"72%", d:0.3,  w:4,  h:24, rot:"4deg"   },
                  ].map((s,i) => (
                    <div key={i} style={{ position:"absolute", bottom:"58%", left:s.l,
                      width:s.w, height:s.h, borderRadius:99,
                      background:`linear-gradient(to top, rgba(245,204,106,0.5), transparent)`,
                      animation:`steamUp ${2.2+i*.4}s ${s.d}s ease-out infinite`,
                      filter:"blur(1.5px)", opacity:0,
                      transform:`rotate(${s.rot})`,
                    }} />
                  ))}
                  <img
                    src="/coffee-hero.png" alt="Coffee"
                    style={{ width:"100%", borderRadius:16, objectFit:"cover",
                      filter:"drop-shadow(0 8px 24px rgba(200,146,42,0.3))" }}
                    onError={e => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = "none";
                      const parent = el.parentElement!;
                      const fb = document.createElement("div");
                      fb.style.cssText = `width:100%;aspect-ratio:1;border-radius:16px;background:radial-gradient(ellipse at 40% 35%,#5C2E0A,#2A1205);display:flex;align-items:center;justify-content:center;font-size:52px;`;
                      fb.textContent = "☕";
                      parent.appendChild(fb);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ── REWARD CARD ── */}
            <div style={{ margin:"0 22px 20px",
              animation:`fadeRise 0.5s 0.35s ${EA} both` }}>
              <div style={{
                background:`linear-gradient(135deg, rgba(200,146,42,0.14) 0%, rgba(232,184,75,0.08) 100%)`,
                backdropFilter:"blur(16px)",
                border:`1.5px solid rgba(200,146,42,0.45)`,
                borderRadius:16, padding:"14px 18px",
                display:"flex", alignItems:"center", gap:14,
                boxShadow:`0 0 0 1px rgba(200,146,42,0.08), 0 8px 28px rgba(200,146,42,0.12)`,
                position:"relative", overflow:"hidden",
                animation:"pulseRing 3s ease-in-out infinite",
              }}>
                {/* Shimmer sweep */}
                <div style={{ position:"absolute", inset:0, overflow:"hidden", borderRadius:16, pointerEvents:"none" }}>
                  <div style={{ position:"absolute", top:0, left:0, width:"25%", height:"100%",
                    background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
                    animation:"shimmerGo 3s ease-in-out infinite",
                    backgroundSize:"200% 100%" }} />
                </div>

                <div style={{ width:44, height:44, borderRadius:12, background:GG,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:20, flexShrink:0,
                  boxShadow:`0 4px 16px rgba(200,146,42,0.45)` }}>🎁</div>

                <div>
                  <p style={{ fontFamily:"'DM Mono',monospace", fontWeight:500,
                    fontSize:11, color:T.inkDim, letterSpacing:".1em",
                    textTransform:"uppercase", margin:"0 0 2px" }}>Limited Offer</p>
                  <div style={{ display:"flex", alignItems:"baseline", gap:5 }}>
                    <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28,
                      fontWeight:700, color:T.goldL, lineHeight:1 }}>₹20</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                      fontWeight:700, color:T.gold, letterSpacing:".08em",
                      textTransform:"uppercase" }}>OFF</span>
                  </div>
                  <p style={{ fontSize:11, color:T.inkSub, margin:"1px 0 0",
                    fontFamily:"'DM Sans',sans-serif" }}>Your next visit</p>
                </div>
              </div>
            </div>

            {/* ── SUCCESS STATE ── */}
            {success ? (
              <div style={{ padding:"8px 22px 28px", textAlign:"center",
                animation:`crmIn 0.5s ${SP}` }}>
                {/* Success ring */}
                <div style={{ width:72, height:72, borderRadius:"50%",
                  background:`radial-gradient(circle, rgba(46,125,82,0.2), rgba(46,125,82,0.05))`,
                  border:`2px solid ${T.emerald}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  margin:"0 auto 16px",
                  boxShadow:`0 0 0 8px rgba(46,125,82,0.08), 0 0 32px rgba(46,125,82,0.2)`,
                  animation:`glowPop 0.6s ${SP}`,
                }}>
                  <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                    <path d="M8 17l6 6 10-11" stroke={T.emerald} strokeWidth={2.5}
                      strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="40" strokeDashoffset="40"
                      style={{ animation:"checkDraw 0.5s 0.2s ease both" }} />
                  </svg>
                </div>
                <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26,
                  fontWeight:600, color:T.ink, margin:"0 0 6px" }}>
                  Welcome to the Family!
                </h3>
                <p style={{ fontSize:13, color:T.inkSub, fontFamily:"'DM Sans',sans-serif",
                  lineHeight:1.6, margin:"0 0 12px" }}>
                  Your ₹20 reward is ready. We'll notify you with exclusive offers!
                </p>
                <div style={{ display:"inline-flex", alignItems:"center", gap:7,
                  background:`rgba(46,125,82,0.12)`, border:`1px solid rgba(46,125,82,0.3)`,
                  borderRadius:99, padding:"6px 16px" }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:T.emerald,
                    animation:"breathGold 1.5s ease-in-out infinite" }} />
                  <span style={{ fontSize:11.5, color:"#7EF4A8",
                    fontFamily:"'DM Mono',monospace" }}>Reward added to your account</span>
                </div>
              </div>
            ) : (
              /* ── FORM ── */
              <div style={{ padding:"0 22px 26px" }}>
                {/* Name field */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:10, fontWeight:700, color:T.inkDim,
                    letterSpacing:".12em", textTransform:"uppercase",
                    fontFamily:"'DM Mono',monospace", display:"block", marginBottom:8 }}>
                    Your Name
                  </label>
                  <div style={{ position:"relative" }}>
                    <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
                      color:nameFocus ? T.gold : T.inkDim, fontSize:16,
                      transition:`color 0.2s ${EA}`, pointerEvents:"none" }}>
                      <svg width={17} height={17} viewBox="0 0 17 17" fill="none">
                        <circle cx={8.5} cy={6} r={3} stroke="currentColor" strokeWidth={1.4}/>
                        <path d="M2 15c0-3 3-5 6.5-5s6.5 2 6.5 5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
                      </svg>
                    </div>
                    <input
                      className="crm-input"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onFocus={() => setNameFocus(true)}
                      onBlur={() => setNameFocus(false)}
                      placeholder="e.g. Nirav Patel"
                      style={{ width:"100%", padding:"14px 14px 14px 44px",
                        borderRadius:14, border:`1.5px solid ${nameFocus ? "rgba(200,146,42,0.6)" : "rgba(255,255,255,0.08)"}`,
                        background:"rgba(255,255,255,0.04)", color:T.ink,
                        fontSize:15, fontFamily:"'DM Sans',sans-serif", fontWeight:400,
                        outline:"none", boxSizing:"border-box",
                        transition:`all 0.25s ${EA}`,
                        boxShadow: nameFocus ? `0 0 0 3px rgba(200,146,42,0.12), 0 4px 20px rgba(200,146,42,0.1)` : "none",
                      }}
                    />
                  </div>
                </div>

                {/* Phone field */}
                <div style={{ marginBottom:error ? 10 : 20 }}>
                  <label style={{ fontSize:10, fontWeight:700, color:T.inkDim,
                    letterSpacing:".12em", textTransform:"uppercase",
                    fontFamily:"'DM Mono',monospace", display:"block", marginBottom:8 }}>
                    Phone Number
                  </label>
                  <div style={{ position:"relative" }}>
                    <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
                      color:phoneFocus ? T.gold : T.inkDim, fontSize:16,
                      transition:`color 0.2s ${EA}`, pointerEvents:"none" }}>
                      <svg width={17} height={17} viewBox="0 0 17 17" fill="none">
                        <path d="M3 3h3l1.5 3.5-2 1.5c1 2 2.5 3.5 4.5 4.5l1.5-2L15 12v3c-6.5 1-13-5.5-12-12z" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <input
                      className="crm-input"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                      onFocus={() => setPhoneFocus(true)}
                      onBlur={() => setPhoneFocus(false)}
                      placeholder="98765 43210"
                      type="tel" inputMode="numeric"
                      style={{ width:"100%", padding:"14px 14px 14px 44px",
                        borderRadius:14, border:`1.5px solid ${phoneFocus ? "rgba(200,146,42,0.6)" : "rgba(255,255,255,0.08)"}`,
                        background:"rgba(255,255,255,0.04)", color:T.ink,
                        fontSize:15, fontFamily:"'DM Mono',monospace", fontWeight:400,
                        letterSpacing:".06em",
                        outline:"none", boxSizing:"border-box",
                        transition:`all 0.25s ${EA}`,
                        boxShadow: phoneFocus ? `0 0 0 3px rgba(200,146,42,0.12), 0 4px 20px rgba(200,146,42,0.1)` : "none",
                      }}
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p style={{ fontSize:11.5, color:"#ef8080", fontFamily:"'DM Sans',sans-serif",
                    margin:"0 0 14px", display:"flex", alignItems:"center", gap:5 }}>
                    <span>⚠</span>{error}
                  </p>
                )}

                {/* CTA Buttons */}
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {/* Primary */}
                  <button onClick={handleCTA} disabled={submitting}
                    style={{ position:"relative", overflow:"hidden",
                      width:"100%", padding:"16px",
                      borderRadius:14, border:"none",
                      background: submitting ? "rgba(200,146,42,0.3)" : GG,
                      color: submitting ? T.inkDim : T.void,
                      fontWeight:700, fontSize:15,
                      fontFamily:"'DM Sans',sans-serif",
                      cursor: submitting ? "not-allowed" : "pointer",
                      boxShadow: submitting ? "none" : `0 8px 28px rgba(200,146,42,0.45), 0 2px 8px rgba(200,146,42,0.2)`,
                      display:"flex", alignItems:"center", justifyContent:"center", gap:9,
                      transition:`all 0.3s ${EA}`,
                      transform: ripple ? "scale(0.97)" : "scale(1)",
                    }}>
                    {/* Ripple */}
                    {ripple && (
                      <div style={{ position:"absolute", inset:0, borderRadius:14,
                        background:"rgba(255,255,255,0.15)",
                        animation:"glowPop 0.6s ease-out" }} />
                    )}
                    {submitting
                      ? <><div style={{ width:18, height:18, borderRadius:"50%",
                          border:`2.5px solid rgba(0,0,0,0.2)`,
                          borderTopColor:"rgba(0,0,0,0.6)",
                          animation:"spin 0.75s linear infinite" }}/> Claiming...</>
                      : <><span style={{ fontSize:17 }}>🎁</span> Claim ₹20 Off</>
                    }
                  </button>

                  {/* Secondary */}
                  <button onClick={dismiss}
                    style={{ width:"100%", padding:"13px",
                      borderRadius:14,
                      border:`1px solid rgba(255,255,255,0.09)`,
                      background:"rgba(255,255,255,0.025)",
                      color:T.inkDim, fontWeight:500, fontSize:13.5,
                      fontFamily:"'DM Sans',sans-serif",
                      cursor:"pointer",
                      backdropFilter:"blur(8px)",
                      transition:`all 0.22s ${EA}`,
                    }}>
                    Maybe Later
                  </button>
                </div>

                {/* Trust line */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                  gap:6, marginTop:14 }}>
                  <span style={{ fontSize:13 }}>🔒</span>
                  <p style={{ fontSize:10.5, color:T.inkDim,
                    fontFamily:"'DM Sans',sans-serif", margin:0 }}>
                    No spam. Only special offers for you. 🌿
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
