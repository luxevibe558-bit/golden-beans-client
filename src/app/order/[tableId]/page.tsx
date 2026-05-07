"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import CRMCaptureCard from "@/components/CRMCaptureCard";
import WaiterHelpSheet from "@/components/WaiterHelpSheet";
import { menuApi, orderApi, tableApi } from "@/lib/api";
import { getThumbnailUrl, getHeroUrl } from "@/lib/cloudinary";
import { Icons, Button, Skeleton } from "@/components/PremiumUI";
import LiveOrderTracker from "@/components/LiveOrderTracker";
import type { MenuCategory, MenuItem, CartItem, Table, Order, VariantGroup } from "@/types";

// ─── Design Tokens ───
const G = {
  bg:       "#0A0A0A",
  bg1:      "#111111",
  bg2:      "#181818",
  bg3:      "#202020",
  gold:     "#C89B3C",
  goldMid:  "#E8B84B",
  goldLight:"#F5D27A",
  goldGlow: "rgba(200,155,60,0.35)",
  glass:    "rgba(255,255,255,0.04)",
  glassBorder:"rgba(255,255,255,0.07)",
  text:     "#FFFFFF",
  textSub:  "#B8B8B8",
  textDim:  "#555555",
  success:  "#3D9A5C",
  danger:   "#E53935",
  brown:    "#2C1506",
  brownMid: "#4A2510",
};

const GOLD_GRADIENT = `linear-gradient(135deg, ${G.gold}, ${G.goldMid}, ${G.goldLight})`;
const GLASS_BG = `rgba(255,255,255,0.03)`;

// ─── Types ───
interface ExtendedCartItem extends CartItem {
  variants?: { groupName: string; selected: string[] }[];
  totalPriceModifier?: number;
  imageUrl?: string;
}
interface AppliedDiscount {
  promotionId: string; name: string; description: string;
  discount: number; type: "auto"|"code"; code?: string; promoCodeId?: string;
}
type Tab = "home"|"menu"|"orders"|"cart"|"info";
interface SecurityResult {
  allowed:boolean; ipAllowed:boolean; gpsAllowed:boolean;
  gpsRequired:boolean; ipRequired:boolean; distance:number|null;
  cafeName:string; cafeAddress:string; cafePhone:string; wifiName:string; reason:string;
}

// ════════════════════════════════════════════════
// GLOBAL STYLES
// ════════════════════════════════════════════════
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0;}
html,body{background:${G.bg};overflow-x:hidden;overscroll-behavior:none;}
img{user-select:none;pointer-events:none;-webkit-user-drag:none;}
.hide-scroll{scrollbar-width:none;-ms-overflow-style:none;}
.hide-scroll::-webkit-scrollbar{display:none;}
input,textarea{-webkit-user-select:text!important;user-select:text!important;}

@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}
@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes kenBurns{from{transform:scale(1) translate(0,0)}to{transform:scale(1.08) translate(-1%,-1%)}}
@keyframes goldGlow{0%,100%{box-shadow:0 0 20px ${G.goldGlow}}50%{box-shadow:0 0 40px ${G.goldGlow},0 0 80px rgba(200,155,60,0.15)}}
@keyframes cartBounce{0%{transform:scale(1)}30%{transform:scale(1.4)}60%{transform:scale(0.9)}100%{transform:scale(1)}}
@keyframes steamRise{0%{opacity:0;transform:translateY(0) scaleX(1)}50%{opacity:0.6}100%{opacity:0;transform:translateY(-40px) scaleX(1.5)}}
@keyframes ripple{to{transform:scale(4);opacity:0}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes countIn{from{opacity:0;transform:translateY(10px) scale(0.8)}to{opacity:1;transform:translateY(0) scale(1)}}

.card-hover{transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.35s ease;}
.card-hover:active{transform:scale(0.96)!important;}
.gold-text{background:${GOLD_GRADIENT};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.shimmer-bg{background:linear-gradient(90deg,${G.bg2} 25%,${G.bg3} 50%,${G.bg2} 75%);background-size:200% 100%;animation:shimmer 1.8s infinite;}
`;

// ════════════════════════════════════════════════
// REUSABLE ATOMS
// ════════════════════════════════════════════════
function GoldBadge({ children, size="sm" }: { children: React.ReactNode; size?: "xs"|"sm"|"md" }) {
  const p = size === "xs" ? "2px 7px" : size === "sm" ? "3px 10px" : "5px 14px";
  const fs = size === "xs" ? 8 : size === "sm" ? 9 : 11;
  return <span style={{ background: GOLD_GRADIENT, color: G.bg, fontWeight: 900, fontSize: fs, padding: p, borderRadius: 99, letterSpacing: "0.05em", display:"inline-block" }}>{children}</span>;
}

function Spinner({ size=20, color=G.gold }: { size?: number; color?: string }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", border: `2.5px solid ${color}30`, borderTopColor: color, animation: "spin 0.75s linear infinite", flexShrink: 0 }} />;
}

function SkeletonCard() {
  return (
    <div style={{ background: G.bg1, borderRadius: 20, overflow: "hidden", border: `1px solid ${G.glassBorder}` }}>
      <div className="shimmer-bg" style={{ height: 150 }} />
      <div style={{ padding: "12px 14px" }}>
        <div className="shimmer-bg" style={{ height: 14, borderRadius: 6, marginBottom: 8, width: "70%" }} />
        <div className="shimmer-bg" style={{ height: 11, borderRadius: 6, width: "50%" }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// SECURITY SCREENS
// ════════════════════════════════════════════════
function WelcomeScreen({ onDone }: { cafeName: string; onDone: () => void }) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    const iv = setInterval(() => setCount(p => { if (p <= 1) { clearInterval(iv); onDone(); return 0; } return p - 1; }), 1000);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div style={{ minHeight:"100vh", background: G.bg, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
      {/* Ambient glow */}
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle, ${G.gold}18 0%, transparent 70%)`, top:"20%", left:"50%", transform:"translateX(-50%)", animation:"pulse 3s ease-in-out infinite" }} />

      <div style={{ textAlign:"center", position:"relative", zIndex:1, animation:"scaleIn 0.7s cubic-bezier(0.34,1.56,0.64,1)" }}>
        {/* Logo */}
        <div style={{ width:110, height:110, borderRadius:"50%", overflow:"hidden", margin:"0 auto 28px", border:`2px solid ${G.gold}50`, boxShadow:`0 0 0 8px ${G.gold}08, 0 0 60px ${G.gold}30`, animation:"float 4s ease-in-out infinite" }}>
          <img src="/logo-large.png" alt="GB" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        </div>

        {/* Steam animation */}
        <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:60, height:60, overflow:"visible", pointerEvents:"none" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ position:"absolute", bottom:110, left:i*16-8, width:6, height:20, background:`linear-gradient(to top, ${G.gold}60, transparent)`, borderRadius:99, animation:`steamRise 2s ${i*0.6}s ease-out infinite`, opacity:0 }} />
          ))}
        </div>

        <p style={{ fontSize:11, color:G.gold, letterSpacing:"0.35em", textTransform:"uppercase", fontWeight:700, marginBottom:8, fontFamily:"Inter, sans-serif", animation:"fadeUp 0.6s 0.3s ease both" }}>Welcome to</p>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:48, fontWeight:700, color:G.text, lineHeight:1, marginBottom:6, animation:"fadeUp 0.6s 0.4s ease both" }}>Golden Beans</h1>
        <p style={{ fontSize:14, color:G.textSub, fontFamily:"Inter, sans-serif", fontWeight:400, marginBottom:44, animation:"fadeUp 0.6s 0.5s ease both" }}>Cafe &amp; Bistro</p>

        {/* Countdown ring */}
        <div style={{ width:64, height:64, margin:"0 auto", position:"relative", animation:"fadeUp 0.6s 0.6s ease both" }}>
          <svg width={64} height={64} style={{ transform:"rotate(-90deg)" }}>
            <circle cx={32} cy={32} r={28} fill="none" stroke={`${G.gold}20`} strokeWidth={3} />
            <circle cx={32} cy={32} r={28} fill="none" stroke={G.gold} strokeWidth={3}
              strokeDasharray={`${2*Math.PI*28}`} strokeDashoffset={`${2*Math.PI*28*(1-count/3)}`}
              strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.9s linear" }} />
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:22, fontWeight:800, color:G.gold, fontFamily:"'DM Mono', monospace" }}>{count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityCheckScreen({ onPassed, onFailed }: { onPassed: () => void; onFailed: (r: SecurityResult) => void }) {
  type CS = "pending"|"loading"|"success"|"failed";
  const [gps, setGps] = useState<CS>("pending");
  const [wifi, setWifi] = useState<CS>("pending");
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        setGps("loading");
        await new Promise(r => setTimeout(r, 500));
        const api = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
        const s = await fetch(`${api}/security/settings`).then(r => r.json());
        const settings = s.data;
        if (settings && !settings.ipWhitelistEnabled && !settings.geofenceEnabled) {
          if (mounted) { setGps("success"); setWifi("success"); setShowWelcome(true); } return;
        }
        if (!("geolocation" in navigator)) {
          if (mounted) { setGps("failed"); await new Promise(r => setTimeout(r, 500)); onFailed({ allowed:false, ipAllowed:false, gpsAllowed:false, gpsRequired:true, ipRequired:true, distance:null, cafeName:"Golden Beans", cafeAddress:"", cafePhone:"", wifiName:"GoldenBeans-WiFi", reason:"GPS not supported" }); } return;
        }
        let pos: GeolocationPosition|null = null;
        if (settings?.geofenceEnabled) {
          pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy:true, timeout:15000, maximumAge:0 })).catch(e => { throw new Error(e.code===1?"DENIED":"TIMEOUT"); });
        }
        if (mounted) setGps("success");
        await new Promise(r => setTimeout(r, 500));
        if (mounted) setWifi("loading");
        const res = await fetch(`${api}/security/check`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ latitude:pos?.coords.latitude, longitude:pos?.coords.longitude }) });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        const result = data.data;
        if (mounted) {
          if (result.securityDisabled) { setGps("success"); setWifi("success"); setShowWelcome(true); return; }
          setGps(result.gpsAllowed?"success":"failed");
          setWifi(result.ipAllowed?"success":"failed");
          await new Promise(r => setTimeout(r, 800));
          if (result.allowed) setShowWelcome(true); else onFailed(result);
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : "";
        const isGPS = msg==="DENIED"||msg.includes("denied");
        if (isGPS||msg==="TIMEOUT") setGps("failed"); else setWifi("failed");
        await new Promise(r => setTimeout(r, 800));
        onFailed({ allowed:false, ipAllowed:true, gpsAllowed:!isGPS, gpsRequired:true, ipRequired:true, distance:null, cafeName:"Golden Beans Cafe & Bistro", cafeAddress:"Pramukh Darshan Society, Dabholi, Surat", cafePhone:"+91 XXXXX XXXXX", wifiName:"GoldenBeans-WiFi", reason:isGPS?"Location access denied":msg==="TIMEOUT"?"Location timed out":"Connect to cafe WiFi" });
      }
    }
    run(); return () => { mounted = false; };
  }, [onPassed, onFailed]);

  if (showWelcome) return <WelcomeScreen cafeName="Golden Beans" onDone={onPassed} />;

  const Row = ({ state, icon, label, desc }: { state:CS; icon:string; label:string; desc:string }) => {
    const clr = state==="success" ? G.success : state==="failed" ? G.danger : state==="loading" ? G.gold : G.textDim;
    return (
      <div style={{ background:G.glass, border:`1px solid ${clr}25`, borderRadius:16, padding:"14px 18px", display:"flex", alignItems:"center", gap:14, marginBottom:10, transition:"all 0.4s ease" }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:13, fontWeight:700, color:clr, margin:"0 0 2px", fontFamily:"Inter, sans-serif" }}>{label}</p>
          <p style={{ fontSize:11, color:G.textSub, margin:0 }}>{desc}</p>
        </div>
        {state==="loading" && <Spinner size={18} />}
        {state==="success" && <div style={{ width:24, height:24, borderRadius:"50%", background:G.success, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, animation:"scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>✓</div>}
        {state==="failed" && <div style={{ width:24, height:24, borderRadius:"50%", background:G.danger, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>✗</div>}
      </div>
    );
  };

  return (
    <div style={{ minHeight:"100vh", background:G.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ maxWidth:340, width:"100%", textAlign:"center" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", overflow:"hidden", margin:"0 auto 20px", border:`1.5px solid ${G.gold}50`, boxShadow:`0 0 40px ${G.gold}25` }}>
          <img src="/logo-large.png" alt="GB" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        </div>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, color:G.text, margin:"0 0 6px" }}>Verifying Access</h2>
        <p style={{ fontSize:12, color:G.textSub, margin:"0 0 28px", fontFamily:"Inter, sans-serif" }}>Confirming you&apos;re at Golden Beans</p>
        <Row state={gps} icon="📍" label="Location" desc={gps==="loading"?"Getting your location...":gps==="success"?"You're at the cafe ✓":gps==="failed"?"Location not verified":"Waiting..."} />
        <Row state={wifi} icon="📶" label="Network" desc={wifi==="loading"?"Verifying network...":wifi==="success"?"Cafe network confirmed ✓":wifi==="failed"?"Not on cafe network":"Waiting..."} />
        <p style={{ fontSize:10, color:G.textDim, marginTop:20, fontFamily:"Inter, sans-serif" }}>🔒 Protecting against unauthorized orders</p>
      </div>
    </div>
  );
}

function AwarenessScreen({ result, onRetry }: { result:SecurityResult; onRetry:()=>void }) {
  return (
    <div style={{ minHeight:"100vh", background:G.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ maxWidth:360, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:60, marginBottom:16, animation:"float 3s ease-in-out infinite" }}>🚫</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:32, color:G.gold, margin:"0 0 10px" }}>Access Restricted</h1>
        <p style={{ fontSize:14, color:G.textSub, margin:"0 0 28px", lineHeight:1.6, fontFamily:"Inter, sans-serif" }}>{result.reason}</p>
        {!result.ipAllowed && <div style={{ background:G.glass, border:`1px solid ${G.gold}25`, borderRadius:14, padding:14, marginBottom:10, textAlign:"left" }}><p style={{ color:G.gold, fontWeight:700, fontSize:13, margin:"0 0 3px" }}>📶 Connect to Cafe WiFi</p><p style={{ color:G.textSub, fontSize:12, margin:0 }}>{result.wifiName}</p></div>}
        {!result.gpsAllowed && <div style={{ background:G.glass, border:`1px solid ${G.gold}25`, borderRadius:14, padding:14, marginBottom:10, textAlign:"left" }}><p style={{ color:G.gold, fontWeight:700, fontSize:13, margin:"0 0 3px" }}>📍 Enable Location Access</p><p style={{ color:G.textSub, fontSize:12, margin:0 }}>{result.distance ? `${result.distance}m from cafe` : "Allow location in browser settings"}</p></div>}
        <button onClick={onRetry} style={{ width:"100%", padding:"16px", borderRadius:14, border:"none", background:GOLD_GRADIENT, color:G.bg, fontWeight:800, fontSize:15, cursor:"pointer", marginTop:8, fontFamily:"Inter, sans-serif", boxShadow:`0 8px 24px ${G.goldGlow}` }}>Try Again</button>
      </div>
    </div>
  );
}

function SessionEndedScreen({ reason, onRestart }: { reason:string; onRestart:()=>void }) {
  const [rating, setRating] = useState(0); const [comment, setComment] = useState(""); const [submitting, setSubmitting] = useState(false); const [done, setDone] = useState(false);
  const API = "https://golden-beans-server.onrender.com/api";
  useEffect(() => { if (done) { const t = setTimeout(() => onRestart(), 5000); return () => clearTimeout(t); } }, [done, onRestart]);
  const submit = async () => {
    if (!rating) return; setSubmitting(true);
    try { await fetch(`${API}/feedback/submit`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ orderId:localStorage.getItem("gb_settled_order_id")||"unknown", tableId:localStorage.getItem("gb_settled_table")||"unknown", tableNumber:localStorage.getItem("gb_settled_table")||"unknown", rating, categories:{}, comment }) }); } catch {}
    setSubmitting(false); setDone(true);
  };
  if (done) return (
    <div style={{ minHeight:"100vh", background:G.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", animation:"scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ fontSize:72, marginBottom:16 }}>🎉</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:40, color:G.gold, margin:"0 0 10px" }}>Thank You!</h1>
        <p style={{ fontSize:14, color:G.textSub, maxWidth:280, margin:"0 auto 20px", lineHeight:1.6 }}>{reason}</p>
        <p style={{ fontSize:11, color:G.textDim }}>Redirecting in 5 seconds...</p>
      </div>
    </div>
  );
  return (
    <div style={{ minHeight:"100vh", background:G.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ maxWidth:380, width:"100%" }}>
        <div style={{ textAlign:"center", marginBottom:28, animation:"fadeUp 0.6s ease" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>⭐</div>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:32, color:G.gold, margin:"0 0 6px" }}>How was your visit?</h1>
          <p style={{ fontSize:13, color:G.textSub, fontFamily:"Inter, sans-serif" }}>Your feedback helps us serve you better</p>
        </div>
        <div style={{ background:G.bg1, borderRadius:24, padding:24, border:`1px solid ${G.glassBorder}` }}>
          <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:16 }}>
            {[1,2,3,4,5].map(s => <button key={s} onClick={() => setRating(s)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:rating>=s?40:32, transform:rating>=s?"scale(1.15)":"scale(1)", filter:rating>=s?"none":"grayscale(1) opacity(0.3)", transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}>⭐</button>)}
          </div>
          {rating>0 && <p style={{ textAlign:"center", fontSize:14, fontWeight:700, color:G.gold, marginBottom:16, fontFamily:"Inter, sans-serif", animation:"countIn 0.3s ease" }}>{["","😞 Poor","😐 Fair","🙂 Good","😊 Great","🤩 Excellent!"][rating]}</p>}
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Any comments? (optional)" rows={3} style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1px solid ${G.glassBorder}`, background:G.bg2, color:G.text, fontSize:14, outline:"none", resize:"none", boxSizing:"border-box", marginBottom:16, fontFamily:"Inter, sans-serif", lineHeight:1.5 }} />
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => setDone(true)} style={{ flex:1, padding:13, borderRadius:12, border:`1px solid ${G.glassBorder}`, background:"transparent", color:G.textSub, cursor:"pointer", fontFamily:"Inter, sans-serif" }}>Skip</button>
            <button onClick={submit} disabled={!rating||submitting} style={{ flex:2, padding:13, borderRadius:12, border:"none", background:rating?GOLD_GRADIENT:G.bg2, color:rating?G.bg:G.textDim, fontWeight:800, cursor:rating?"pointer":"not-allowed", fontFamily:"Inter, sans-serif", boxShadow:rating?`0 6px 20px ${G.goldGlow}`:"none", transition:"all 0.3s" }}>{submitting?"Submitting...":"Submit Feedback ⭐"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// HERO CAROUSEL — Cinematic
// ════════════════════════════════════════════════
function HeroCarousel({ heroItems, onExplore, onItemTap, cart }: { heroItems:MenuItem[]; onExplore:()=>void; onItemTap:(i:MenuItem)=>void; cart:ExtendedCartItem[] }) {
  const [active, setActive] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  const slides = heroItems.slice(0, 3);
  const next = useCallback(() => setActive(p => (p+1)%slides.length), [slides.length]);
  const prev = useCallback(() => setActive(p => (p-1+slides.length)%slides.length), [slides.length]);

  useEffect(() => {
    if (isDragging||slides.length===0) return;
    timerRef.current = setInterval(next, 4800);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, isDragging, active, slides.length]);

  const onStart = (x:number) => { setIsDragging(true); startXRef.current=x; if (timerRef.current) clearInterval(timerRef.current); };
  const onMove = (x:number) => { if (isDragging) setDragDelta(x-startXRef.current); };
  const onEnd = () => { if (Math.abs(dragDelta)>55) dragDelta<0?next():prev(); setIsDragging(false); setDragDelta(0); };

  if (slides.length===0) return null;
  const item = slides[active];
  const cartQty = cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);

  return (
    <div style={{ position:"relative", width:"100%", height:"58vw", maxHeight:300, overflow:"hidden", userSelect:"none" }}
      onTouchStart={e=>onStart(e.touches[0].clientX)} onTouchMove={e=>onMove(e.touches[0].clientX)} onTouchEnd={onEnd}
      onMouseDown={e=>onStart(e.clientX)} onMouseMove={e=>isDragging&&onMove(e.clientX)} onMouseUp={onEnd} onMouseLeave={onEnd}>

      {slides.map((s, i) => (
        <div key={s._id} style={{ position:"absolute", inset:0, transition:isDragging?"none":"all 0.65s cubic-bezier(0.16,1,0.3,1)", opacity:i===active?1:0, transform:i===active?`translateX(${dragDelta}px)`:i<active?`translateX(calc(-100% + ${dragDelta}px))`:`translateX(calc(100% + ${dragDelta}px))`, zIndex:i===active?1:0 }}>
          {s.imageUrl
            ? <img src={getHeroUrl(s.imageUrl)} alt={s.name} style={{ width:"100%", height:"100%", objectFit:"cover", animation:i===active?"kenBurns 8s ease-out forwards":"none" }} />
            : <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg, ${G.brown}, ${G.brownMid}, #000)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:80 }}>☕</div>
          }
        </div>
      ))}

      {/* Multi-layer gradient overlay */}
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.5) 55%, rgba(10,10,10,0.1) 100%)", zIndex:2, pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(10,10,10,0.8) 0%, transparent 50%)", zIndex:2, pointerEvents:"none" }} />

      {/* Content */}
      <div style={{ position:"absolute", bottom:0, left:0, padding:"20px 20px 24px", zIndex:3, maxWidth:"65%" }}>
        {item.tags?.includes("bestseller") && <GoldBadge size="xs">⭐ BESTSELLER</GoldBadge>}
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(24px,7vw,36px)", fontWeight:700, color:G.text, margin:"6px 0 4px", lineHeight:1.1, textShadow:"0 2px 12px rgba(0,0,0,0.5)" }}>
          Brewed to<br /><em style={{ color:G.gold }}>perfection,</em><br />just for you.
        </h2>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.65)", margin:"0 0 14px", fontFamily:"Inter, sans-serif" }}>Discover our signature blends and cozy vibes.</p>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={onExplore} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.1)", backdropFilter:"blur(16px)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:99, padding:"9px 18px", color:G.text, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"Inter, sans-serif" }}>
            Explore Menu <span>›</span>
          </button>
          <button onClick={() => onItemTap(item)} style={{ width:36, height:36, borderRadius:"50%", border:`1.5px solid ${G.gold}`, background:cartQty>0?GOLD_GRADIENT:"rgba(0,0,0,0.5)", color:cartQty>0?G.bg:G.gold, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, backdropFilter:"blur(8px)", boxShadow:cartQty>0?`0 4px 16px ${G.goldGlow}`:"none", transition:"all 0.3s" }}>
            {cartQty>0?"✓":"+"}
          </button>
        </div>
      </div>

      {/* Slide counter */}
      <div style={{ position:"absolute", bottom:28, right:16, zIndex:4, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontFamily:"'DM Mono', monospace", fontSize:11, fontWeight:500, color:"rgba(255,255,255,0.8)" }}>0{active+1}</span>
        <div style={{ width:36, height:1.5, background:"rgba(255,255,255,0.2)", position:"relative", borderRadius:99 }}>
          <div style={{ position:"absolute", left:0, top:0, height:"100%", background:GOLD_GRADIENT, borderRadius:99, transition:"width 0.5s ease", width:`${((active+1)/slides.length)*100}%` }} />
        </div>
        <span style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:G.textDim }}>0{slides.length}</span>
      </div>

      {/* Dots */}
      <div style={{ position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)", display:"flex", gap:5, zIndex:4 }}>
        {slides.map((_,i)=>(
          <button key={i} onClick={()=>setActive(i)} style={{ width:i===active?18:5, height:5, borderRadius:99, background:i===active?G.gold:"rgba(255,255,255,0.3)", border:"none", cursor:"pointer", transition:"all 0.35s cubic-bezier(0.34,1.56,0.64,1)", padding:0 }} />
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// CATEGORY ROW — Glassmorphism
// ════════════════════════════════════════════════
function CategoryRow({ categories, active, onSelect }: { categories:MenuCategory[]; active:string; onSelect:(id:string)=>void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector('[data-active="true"]') as HTMLElement;
    el?.scrollIntoView({ behavior:"smooth", block:"nearest", inline:"center" });
  }, [active]);
  return (
    <div style={{ padding:"16px 0 8px" }}>
      <div style={{ padding:"0 16px", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:12, fontWeight:700, color:G.textSub, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"Inter, sans-serif" }}>Categories</span>
      </div>
      <div ref={ref} className="hide-scroll" style={{ display:"flex", gap:10, overflowX:"auto", paddingLeft:16, paddingRight:16 }}>
        {categories.map((cat,idx) => {
          const isA = cat._id===active;
          return (
            <button key={cat._id} data-active={isA} onClick={()=>onSelect(cat._id)}
              style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:6, background:isA?`linear-gradient(135deg, ${G.gold}18, ${G.goldLight}08)`:G.glass, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1.5px solid ${isA?G.gold:G.glassBorder}`, borderRadius:18, padding:"12px 14px", cursor:"pointer", minWidth:72, boxShadow:isA?`0 0 20px ${G.goldGlow}, inset 0 1px 0 rgba(255,255,255,0.06)`:"none", transition:"all 0.3s cubic-bezier(0.16,1,0.3,1)", animation:`fadeUp 0.4s ${idx*0.05}s ease both` }}>
              <span style={{ fontSize:22 }}>{cat.icon}</span>
              <span style={{ fontSize:10, fontWeight:isA?800:500, color:isA?G.gold:G.textSub, whiteSpace:"nowrap", fontFamily:"Inter, sans-serif", letterSpacing:"0.02em" }}>{cat.name}</span>
              {isA && <div style={{ width:14, height:2, background:GOLD_GRADIENT, borderRadius:99 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// MENU ITEM CARD — Premium large card
// ════════════════════════════════════════════════
function ItemCard({ item, onTap, cartQty, isFav, onFav, delay=0 }: { item:MenuItem; onTap:()=>void; cartQty:number; isFav:boolean; onFav:()=>void; delay?:number }) {
  const [pressed, setPressed] = useState(false);
  const [ripple, setRipple] = useState<{x:number;y:number}|null>(null);

  const handleTap = (e: React.MouseEvent) => {
    if (!item.isAvailable) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setRipple({ x:e.clientX-rect.left, y:e.clientY-rect.top });
    setTimeout(()=>setRipple(null), 600);
    onTap();
  };

  return (
    <div className="card-hover" style={{ background:G.bg1, borderRadius:20, overflow:"hidden", cursor:item.isAvailable?"pointer":"not-allowed", opacity:item.isAvailable?1:0.45, border:`1px solid ${cartQty>0?G.gold:G.glassBorder}`, boxShadow:cartQty>0?`0 0 0 1px ${G.gold}30, 0 8px 32px ${G.goldGlow}`:"0 4px 20px rgba(0,0,0,0.4)", transform:pressed?"scale(0.97)":"scale(1)", transition:"all 0.3s cubic-bezier(0.16,1,0.3,1)", position:"relative", animation:`fadeUp 0.5s ${delay}s ease both` }}
      onClick={handleTap} onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)}
      onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}>

      {/* Image */}
      <div style={{ position:"relative", height:138, overflow:"hidden" }}>
        {item.imageUrl
          ? <img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.5s ease" }} loading="lazy" />
          : <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg, ${G.brown}80, ${G.brownMid}60)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:52 }}>☕</div>
        }
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(17,17,17,0.9) 0%, transparent 55%)" }} />

        {/* Badges */}
        <div style={{ position:"absolute", top:10, left:10, display:"flex", gap:5 }}>
          {item.tags?.includes("bestseller") && <GoldBadge size="xs">⭐ BEST</GoldBadge>}
          {!item.isAvailable && <span style={{ background:"rgba(229,57,53,0.85)", color:"white", fontSize:8, fontWeight:800, padding:"2px 7px", borderRadius:99 }}>OUT</span>}
        </div>

        {/* Fav + Cart count */}
        <div style={{ position:"absolute", top:10, right:10, display:"flex", gap:5 }}>
          {cartQty>0 && <div style={{ width:22, height:22, borderRadius:"50%", background:GOLD_GRADIENT, color:G.bg, fontSize:10, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", animation:"cartBounce 0.4s ease" }}>{cartQty}</div>}
          <button onClick={e=>{e.stopPropagation();onFav();}} style={{ width:28, height:28, borderRadius:"50%", background:"rgba(0,0,0,0.55)", border:`1px solid rgba(255,255,255,0.1)`, color:isFav?"#E53935":"rgba(255,255,255,0.8)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, backdropFilter:"blur(8px)", transition:"all 0.25s" }}>
            {isFav?"❤️":"🤍"}
          </button>
        </div>

        {/* Bottom info */}
        <div style={{ position:"absolute", bottom:8, left:10, right:10, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <span style={{ fontFamily:"'DM Mono', monospace", fontSize:16, fontWeight:500, color:G.gold }}>₹{item.price}</span>
          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
            <span style={{ color:G.gold, fontSize:10 }}>★</span>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)", fontFamily:"Inter, sans-serif" }}>{item.rating?.toFixed(1)||"4.5"}</span>
          </div>
        </div>

        {/* Ripple */}
        {ripple && <div style={{ position:"absolute", left:ripple.x-20, top:ripple.y-20, width:40, height:40, borderRadius:"50%", background:"rgba(200,155,60,0.35)", animation:"ripple 0.6s ease-out forwards", pointerEvents:"none" }} />}
      </div>

      {/* Body */}
      <div style={{ padding:"10px 12px 12px" }}>
        <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:16, fontWeight:600, color:G.text, margin:"0 0 3px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.name}</p>
        <p style={{ fontSize:10, color:G.textSub, margin:"0 0 10px", lineHeight:1.4, fontFamily:"Inter, sans-serif", display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{item.description||"Premium quality item"}</p>
        <button onClick={e=>{e.stopPropagation();if(item.isAvailable)onTap();}}
          style={{ width:"100%", padding:"9px", borderRadius:12, border:`1px solid ${cartQty>0?G.gold:G.glassBorder}`, background:cartQty>0?GOLD_GRADIENT:G.glass, color:cartQty>0?G.bg:G.textSub, fontWeight:700, fontSize:12, cursor:item.isAvailable?"pointer":"not-allowed", fontFamily:"Inter, sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:5, transition:"all 0.25s", boxShadow:cartQty>0?`0 4px 16px ${G.goldGlow}`:"none" }}>
          {!item.isAvailable ? "⛔ Out of Stock" : cartQty>0 ? (<><span>✓</span> Added ({cartQty})</>) : (<><span style={{ fontSize:14 }}>+</span> Add to Cart</>)}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// HORIZONTAL SCROLL ROW — Cinematic
// ════════════════════════════════════════════════
function ScrollRow({ title, subtitle, items, cart, onTap, favs, onFav, showFeatured=false }: { title:string; subtitle?:string; items:MenuItem[]; cart:ExtendedCartItem[]; onTap:(i:MenuItem)=>void; favs:Set<string>; onFav:(id:string)=>void; showFeatured?:boolean }) {
  if (items.length===0) return null;
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ padding:"0 16px", marginBottom:12, display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:G.text, margin:"0 0 2px" }}>{title}</h3>
          {subtitle && <p style={{ fontSize:11, color:G.textSub, margin:0, fontFamily:"Inter, sans-serif" }}>{subtitle}</p>}
        </div>
        <button style={{ fontSize:12, color:G.gold, background:"none", border:"none", cursor:"pointer", fontWeight:600, fontFamily:"Inter, sans-serif", display:"flex", alignItems:"center", gap:3 }}>See All <span>›</span></button>
      </div>
      <div className="hide-scroll" style={{ display:"flex", gap:12, overflowX:"auto", paddingLeft:16, paddingRight:16, paddingBottom:4, scrollSnapType:"x mandatory" }}>
        {items.map((item, idx) => {
          const qty = cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
          return (
            <div key={item._id} style={{ flexShrink:0, width:showFeatured&&idx===0?"200px":"156px", scrollSnapAlign:"start" }}>
              <ItemCard item={item} onTap={()=>onTap(item)} cartQty={qty} isFav={favs.has(item._id)} onFav={()=>onFav(item._id)} delay={idx*0.06} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// HORIZONTAL COMPACT ROW — "Continue Your Favorites"
// ════════════════════════════════════════════════
function CompactRow({ title, items, cart, onTap }: { title:string; items:MenuItem[]; cart:ExtendedCartItem[]; onTap:(i:MenuItem)=>void }) {
  if (items.length===0) return null;
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ padding:"0 16px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:G.text, margin:0 }}>{title}</h3>
        <button style={{ fontSize:12, color:G.gold, background:"none", border:"none", cursor:"pointer", fontWeight:600, fontFamily:"Inter, sans-serif" }}>See All ›</button>
      </div>
      <div className="hide-scroll" style={{ display:"flex", gap:10, overflowX:"auto", paddingLeft:16, paddingRight:16 }}>
        {items.map((item, idx) => {
          const qty = cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
          return (
            <div key={item._id} style={{ flexShrink:0, width:160, background:G.bg1, borderRadius:16, border:`1px solid ${qty>0?G.gold:G.glassBorder}`, overflow:"hidden", cursor:item.isAvailable?"pointer":"not-allowed", animation:`fadeUp 0.4s ${idx*0.07}s ease both`, boxShadow:qty>0?`0 0 16px ${G.goldGlow}`:"none" }}
              onClick={()=>item.isAvailable&&onTap(item)}>
              <div style={{ display:"flex", gap:10, padding:"10px 12px", alignItems:"center" }}>
                <div style={{ width:50, height:50, borderRadius:12, overflow:"hidden", flexShrink:0, background:`linear-gradient(135deg,${G.brown}80,${G.brownMid}60)` }}>
                  {item.imageUrl && <img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy" />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:14, fontWeight:600, color:G.text, margin:"0 0 2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.name}</p>
                  <p style={{ fontSize:10, color:G.textSub, margin:"0 0 4px", lineHeight:1.3, fontFamily:"Inter, sans-serif", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{item.description||""}</p>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontFamily:"'DM Mono', monospace", fontSize:13, color:G.gold }}>₹{item.price}</span>
                    <button onClick={e=>{e.stopPropagation();if(item.isAvailable)onTap(item);}} style={{ width:26, height:26, borderRadius:"50%", border:`1.5px solid ${G.gold}`, background:qty>0?GOLD_GRADIENT:"transparent", color:qty>0?G.bg:G.gold, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:900, transition:"all 0.2s" }}>+</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// PROMO BANNER
// ════════════════════════════════════════════════
function PromoBanner({ onOrderNow }: { onOrderNow:()=>void }) {
  return (
    <div style={{ margin:"0 16px 28px" }}>
      <div style={{ background:`linear-gradient(135deg, ${G.brownMid}, ${G.brown})`, borderRadius:20, padding:20, position:"relative", overflow:"hidden", border:`1px solid ${G.gold}30`, boxShadow:`0 8px 32px rgba(0,0,0,0.5)` }}>
        {/* Decorative glow */}
        <div style={{ position:"absolute", right:-20, top:-20, width:120, height:120, borderRadius:"50%", background:`radial-gradient(circle, ${G.gold}20, transparent)`, pointerEvents:"none" }} />
        <div style={{ position:"absolute", right:16, top:"50%", transform:"translateY(-50%)", fontSize:40, opacity:0.3, pointerEvents:"none" }}>☕</div>

        <p style={{ fontSize:9, color:G.gold, fontWeight:800, letterSpacing:"0.15em", textTransform:"uppercase", margin:"0 0 4px", fontFamily:"Inter, sans-serif" }}>Special For You</p>
        <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:32, fontWeight:700, color:G.gold, margin:"0 0 4px", lineHeight:1 }}>Flat 20% Off</h3>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.65)", margin:"0 0 16px", fontFamily:"Inter, sans-serif" }}>on all beverages this evening!</p>
        <button onClick={onOrderNow} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:`1.5px solid ${G.gold}80`, borderRadius:99, padding:"8px 18px", color:G.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"Inter, sans-serif" }}>
          Order Now <span>›</span>
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// PRODUCT DETAIL MODAL
// ════════════════════════════════════════════════
function ProductDetailModal({ item, isOpen, onClose, onAddToCart }: { item:MenuItem|null; isOpen:boolean; onClose:()=>void; onAddToCart:(i:MenuItem,qty:number,v:{groupName:string;selected:string[]}[],mod:number)=>void }) {
  const [qty, setQty] = useState(1);
  const [sel, setSel] = useState<Record<string,string[]>>({});

  useEffect(() => {
    if (item) {
      setQty(1);
      const d: Record<string,string[]> = {};
      item.variantGroups?.forEach(g => { const def=g.options.find(o=>o.isDefault); if(def) d[g.name]=[def.name]; else if(g.required&&g.options.length>0) d[g.name]=[g.options[0].name]; else d[g.name]=[]; });
      setSel(d);
    }
  }, [item]);

  if (!isOpen||!item) return null;

  const toggle = (gn:string, on:string, ms:boolean) => setSel(prev => {
    const cur = prev[gn]||[];
    if (ms) return {...prev,[gn]:cur.includes(on)?cur.filter(n=>n!==on):[...cur,on]};
    return {...prev,[gn]:[on]};
  });

  let mod = 0;
  item.variantGroups?.forEach(g=>(sel[g.name]||[]).forEach(n=>{const o=g.options.find(o=>o.name===n);if(o)mod+=o.priceModifier;}));
  const total = (item.price+mod)*qty;
  const vs = Object.entries(sel).map(([gn,s])=>({groupName:gn,selected:s}));

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:G.bg1, width:"100%", maxWidth:480, maxHeight:"92vh", borderRadius:"28px 28px 0 0", overflow:"hidden", display:"flex", flexDirection:"column", animation:"slideUp 0.4s cubic-bezier(0.32,0.72,0,1)", border:`1px solid ${G.glassBorder}`, borderBottom:"none" }}>
        {/* Gold accent bar */}
        <div style={{ height:3, background:GOLD_GRADIENT, flexShrink:0 }} />

        {/* Image */}
        <div style={{ position:"relative", height:240, overflow:"hidden", flexShrink:0 }}>
          {item.imageUrl
            ? <img src={getHeroUrl(item.imageUrl)} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg,${G.brown},${G.brownMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:90 }}>☕</div>
          }
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, background:`linear-gradient(to top, ${G.bg1}, transparent)` }} />
          <button onClick={onClose} style={{ position:"absolute", top:16, right:16, width:36, height:36, borderRadius:"50%", background:"rgba(0,0,0,0.65)", border:`1px solid ${G.glassBorder}`, color:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, backdropFilter:"blur(8px)" }}>✕</button>
          <div style={{ position:"absolute", top:16, left:16, display:"flex", gap:6 }}>
            <span style={{ background:G.success, color:"white", fontSize:9, fontWeight:800, padding:"3px 9px", borderRadius:99 }}>🌿 VEG</span>
            {item.tags?.includes("bestseller") && <GoldBadge size="xs">⭐ BESTSELLER</GoldBadge>}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 20px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, fontWeight:700, color:G.text, margin:0, flex:1 }}>{item.name}</h2>
            <div style={{ display:"flex", alignItems:"center", gap:4, background:G.glass, padding:"4px 10px", borderRadius:99, flexShrink:0, marginLeft:12 }}>
              <span style={{ color:G.gold, fontSize:11 }}>★</span>
              <span style={{ fontSize:12, fontWeight:700, color:G.text, fontFamily:"'DM Mono', monospace" }}>{item.rating?.toFixed(1)||"4.5"}</span>
            </div>
          </div>
          {item.description && <p style={{ fontSize:13, color:G.textSub, margin:"0 0 20px", lineHeight:1.6, fontFamily:"Inter, sans-serif" }}>{item.description}</p>}

          {item.variantGroups?.map((g:VariantGroup) => (
            <div key={g.name} style={{ marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <h4 style={{ fontSize:13, fontWeight:700, color:G.text, margin:0, letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:"Inter, sans-serif" }}>{g.name}</h4>
                {g.required && <span style={{ background:`${G.danger}20`, color:G.danger, fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:99 }}>Required</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:g.options.length>3?"1fr 1fr":`repeat(${g.options.length},1fr)`, gap:8 }}>
                {g.options.map(opt => {
                  const s = sel[g.name]?.includes(opt.name);
                  return (
                    <button key={opt.name} onClick={()=>toggle(g.name,opt.name,g.multiSelect)}
                      style={{ padding:12, background:s?`linear-gradient(135deg,${G.gold}18,${G.goldLight}08)`:G.glass, border:`1.5px solid ${s?G.gold:G.glassBorder}`, borderRadius:12, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, boxShadow:s?`0 0 12px ${G.goldGlow}`:"none", transition:"all 0.25s" }}>
                      <span style={{ fontWeight:700, fontSize:13, color:s?G.gold:G.text, fontFamily:"Inter, sans-serif" }}>{opt.name}</span>
                      {opt.priceModifier!==0 && <span style={{ fontSize:11, color:s?"rgba(200,155,60,0.6)":G.textSub, fontFamily:"'DM Mono', monospace" }}>{opt.priceModifier>0?`+₹${opt.priceModifier}`:`-₹${Math.abs(opt.priceModifier)}`}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 20px 24px", borderTop:`1px solid ${G.glassBorder}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <span style={{ fontSize:11, color:G.textDim, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"Inter, sans-serif" }}>Quantity</span>
            <div style={{ display:"flex", alignItems:"center", background:G.glass, border:`1px solid ${G.glassBorder}`, borderRadius:99, overflow:"hidden" }}>
              <button onClick={()=>setQty(Math.max(1,qty-1))} style={{ width:44, height:44, background:"none", border:"none", color:G.gold, cursor:"pointer", fontSize:22 }}>−</button>
              <span style={{ minWidth:36, textAlign:"center", color:G.text, fontWeight:900, fontSize:18, fontFamily:"'DM Mono', monospace" }}>{qty}</span>
              <button onClick={()=>setQty(qty+1)} style={{ width:44, height:44, background:"none", border:"none", color:G.gold, cursor:"pointer", fontSize:22 }}>+</button>
            </div>
          </div>
          <button onClick={()=>{onAddToCart(item,qty,vs,mod);onClose();}}
            style={{ width:"100%", background:GOLD_GRADIENT, color:G.bg, border:"none", borderRadius:16, padding:"18px 24px", fontWeight:800, fontSize:16, cursor:"pointer", boxShadow:`0 8px 32px ${G.goldGlow}`, display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"Inter, sans-serif" }}>
            <span>Add to Cart</span>
            <span style={{ fontFamily:"'DM Mono', monospace" }}>₹{total.toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// FLOATING CART BAR
// ════════════════════════════════════════════════
function FloatingCartBar({ cart, discount, onViewCart }: { cart:ExtendedCartItem[]; discount:number; onViewCart:()=>void }) {
  const total = cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
  const items = cart.reduce((s,i)=>s+i.quantity,0);
  const [visible, setVisible] = useState(false);
  const prevLen = useRef(0);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (cart.length>0 && !visible) setVisible(true);
    if (cart.length===0 && visible) setVisible(false);
    if (cart.length!==prevLen.current) { setBump(true); setTimeout(()=>setBump(false), 400); }
    prevLen.current = cart.length;
  }, [cart.length, visible]);

  if (!visible) return null;

  return (
    <div style={{ position:"fixed", bottom:76, left:14, right:14, zIndex:50, animation:"slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <button onClick={onViewCart} style={{ width:"100%", background:G.bg1, borderRadius:18, padding:"13px 16px", border:`1px solid ${G.gold}50`, boxShadow:`0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px ${G.gold}15, 0 0 24px ${G.goldGlow}`, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", transform:bump?"scale(1.02)":"scale(1)", transition:"transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ position:"relative" }}>
            <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg,${G.gold}20,${G.goldLight}10)`, border:`1.5px solid ${G.gold}60`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🛒</div>
            <div style={{ position:"absolute", top:-6, right:-6, width:20, height:20, borderRadius:"50%", background:GOLD_GRADIENT, color:G.bg, fontSize:10, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${G.bg1}`, animation:bump?"cartBounce 0.4s ease":"none" }}>{items}</div>
          </div>
          <div style={{ textAlign:"left" }}>
            <p style={{ fontWeight:800, fontSize:16, color:G.text, margin:0, fontFamily:"Inter, sans-serif" }}>₹{(total*1.05).toFixed(0)}</p>
            {discount>0 && <p style={{ fontSize:10, color:G.success, margin:0, fontWeight:700 }}>You Save ₹{discount} 🎉</p>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:GOLD_GRADIENT, borderRadius:12, padding:"10px 18px", boxShadow:`0 4px 16px ${G.goldGlow}` }}>
          <span style={{ fontWeight:900, fontSize:14, color:G.bg, fontFamily:"Inter, sans-serif" }}>View Cart</span>
          <span style={{ color:G.bg, fontSize:18 }}>›</span>
        </div>
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════
// CART VIEW
// ════════════════════════════════════════════════
function CartView({ cart, onUpdateQty, onPlaceOrder, isPlacing, appliedDiscount, onDiscountChange }: { cart:ExtendedCartItem[]; onUpdateQty:(k:string,d:number)=>void; onPlaceOrder:()=>void; isPlacing:boolean; appliedDiscount:AppliedDiscount|null; onDiscountChange:(d:AppliedDiscount|null)=>void }) {
  const [promo, setPromo] = useState(""); const [validating, setValidating] = useState(false); const [promoErr, setPromoErr] = useState("");
  const sub = cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
  const disc = appliedDiscount?.discount||0;
  const tax = Math.max(0,sub-disc)*0.05;
  const total = Math.max(0,sub-disc)+tax;

  useEffect(() => {
    if (!cart.length||appliedDiscount?.type==="code"){if(!cart.length)onDiscountChange(null);return;}
    const items = cart.map(c=>({menuItemId:c.menuItemId,name:c.name,price:c.price+(c.totalPriceModifier||0),quantity:c.quantity}));
    const api = process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
    fetch(`${api}/promotions/calculate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items,subtotal:sub})}).then(r=>r.json()).then(d=>{if(d.success&&d.data?.applied)onDiscountChange({...d.data.applied,type:"auto"});else if(appliedDiscount?.type==="auto")onDiscountChange(null);}).catch(()=>{});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[cart.length,sub]);

  const applyCode = async () => {
    if (!promo.trim()) return; setValidating(true); setPromoErr("");
    try {
      const items = cart.map(c=>({menuItemId:c.menuItemId,name:c.name,price:c.price+(c.totalPriceModifier||0),quantity:c.quantity}));
      const api = process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
      const res = await fetch(`${api}/promotions/codes/validate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:promo.trim(),items,subtotal:sub})});
      const d = await res.json();
      if (!d.success){setPromoErr(d.message||"Invalid");return;}
      onDiscountChange({...d.data,type:"code",code:d.data.code}); setPromo("");
    } catch(e:unknown){setPromoErr(e instanceof Error?e.message:"Failed");}
    finally{setValidating(false);}
  };

  if (cart.length===0) return (
    <div style={{ padding:"80px 20px", textAlign:"center" }}>
      <div style={{ fontSize:64, marginBottom:16, animation:"float 3s ease-in-out infinite" }}>🛒</div>
      <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, color:G.text, margin:"0 0 8px" }}>Cart is Empty</h3>
      <p style={{ fontSize:14, color:G.textSub, fontFamily:"Inter, sans-serif" }}>Browse our menu to add items</p>
    </div>
  );

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, color:G.text, margin:"0 0 4px" }}>My Cart</h2>
      <p style={{ fontSize:12, color:G.textSub, margin:"0 0 20px", fontFamily:"Inter, sans-serif" }}>{cart.reduce((s,i)=>s+i.quantity,0)} items</p>

      {cart.map(item => (
        <div key={item.menuItemId+JSON.stringify(item.variants)} style={{ background:G.bg1, borderRadius:16, padding:"12px 14px", marginBottom:10, border:`1px solid ${G.glassBorder}`, display:"flex", gap:12, alignItems:"center", animation:"fadeUp 0.3s ease" }}>
          <div style={{ flexShrink:0 }}>
            {item.imageUrl
              ? <img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ width:58, height:58, borderRadius:12, objectFit:"cover" }} />
              : <div style={{ width:58, height:58, borderRadius:12, background:`linear-gradient(135deg,${G.brown},${G.brownMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>☕</div>
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:"'Cormorant Garamond', serif", fontWeight:600, fontSize:16, color:G.text, margin:"0 0 2px" }}>{item.name}</p>
            {item.variants?.some(v=>v.selected.length>0) && <p style={{ fontSize:10, color:G.textSub, margin:"0 0 4px", fontFamily:"Inter, sans-serif" }}>{item.variants?.flatMap(v=>v.selected).join(", ")}</p>}
            <p style={{ fontFamily:"'DM Mono', monospace", fontWeight:500, fontSize:15, color:G.gold, margin:0 }}>₹{((item.price+(item.totalPriceModifier||0))*item.quantity).toFixed(0)}</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", background:G.glass, border:`1px solid ${G.glassBorder}`, borderRadius:99 }}>
            <button onClick={()=>onUpdateQty(item.menuItemId+JSON.stringify(item.variants),-1)} style={{ width:32, height:32, background:"none", border:"none", color:G.gold, cursor:"pointer", fontSize:20 }}>−</button>
            <span style={{ fontWeight:800, color:G.text, fontSize:14, minWidth:20, textAlign:"center", fontFamily:"'DM Mono', monospace" }}>{item.quantity}</span>
            <button onClick={()=>onUpdateQty(item.menuItemId+JSON.stringify(item.variants),1)} style={{ width:32, height:32, background:"none", border:"none", color:G.gold, cursor:"pointer", fontSize:20 }}>+</button>
          </div>
        </div>
      ))}

      {/* Discount banner */}
      {appliedDiscount && (
        <div style={{ background:appliedDiscount.type==="auto"?`${G.success}18`:`${G.gold}15`, borderRadius:14, padding:"12px 14px", marginTop:12, border:`1px solid ${appliedDiscount.type==="auto"?G.success+"40":G.gold+"40"}`, display:"flex", justifyContent:"space-between", alignItems:"center", animation:"fadeUp 0.3s ease" }}>
          <div>
            <p style={{ fontSize:11, color:appliedDiscount.type==="auto"?G.success:G.gold, fontWeight:700, margin:"0 0 2px", fontFamily:"Inter, sans-serif" }}>{appliedDiscount.type==="auto"?"🎉 Auto Promo Applied":`🎫 Code: ${appliedDiscount.code}`}</p>
            <p style={{ fontSize:14, fontWeight:800, color:G.text, margin:0, fontFamily:"Inter, sans-serif" }}>Saved ₹{appliedDiscount.discount}</p>
          </div>
          {appliedDiscount.type==="code" && <button onClick={()=>onDiscountChange(null)} style={{ background:G.glass, border:"none", color:G.text, width:28, height:28, borderRadius:"50%", cursor:"pointer" }}>✕</button>}
        </div>
      )}

      {/* Promo input */}
      {(!appliedDiscount||appliedDiscount.type==="auto") && (
        <div style={{ background:G.bg1, borderRadius:14, padding:14, marginTop:12, border:`1px dashed ${G.glassBorder}` }}>
          <p style={{ fontSize:10, fontWeight:700, color:G.textDim, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 8px", fontFamily:"Inter, sans-serif" }}>Promo Code</p>
          <div style={{ display:"flex", gap:8 }}>
            <input value={promo} onChange={e=>{setPromo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""));setPromoErr("");}} placeholder="Enter code..." style={{ flex:1, padding:"10px 13px", borderRadius:10, border:`1px solid ${promoErr?G.danger:G.glassBorder}`, background:G.bg2, color:G.text, fontSize:14, outline:"none", fontFamily:"'DM Mono', monospace", letterSpacing:"0.08em" }} />
            <button onClick={applyCode} disabled={!promo.trim()||validating} style={{ padding:"10px 18px", borderRadius:10, background:promo.trim()?GOLD_GRADIENT:G.glass, color:promo.trim()?G.bg:G.textDim, border:"none", fontWeight:800, fontSize:12, cursor:promo.trim()?"pointer":"not-allowed", fontFamily:"Inter, sans-serif", boxShadow:promo.trim()?`0 4px 16px ${G.goldGlow}`:"none" }}>{validating?"...":"Apply"}</button>
          </div>
          {promoErr && <p style={{ fontSize:11, color:G.danger, margin:"6px 0 0", fontWeight:700, fontFamily:"Inter, sans-serif" }}>⚠ {promoErr}</p>}
        </div>
      )}

      {/* Bill */}
      <div style={{ background:G.bg1, borderRadius:16, padding:16, marginTop:14, border:`1px solid ${G.glassBorder}` }}>
        {[[`Subtotal`,`₹${sub.toFixed(0)}`,G.textSub],[...(disc>0?[[`Discount`,`-₹${disc.toFixed(0)}`,G.success]]:[])] as [string,string,string][],[`GST (5%)`,`₹${tax.toFixed(0)}`,G.textSub]].flat().filter(Boolean).map((row,i)=> Array.isArray(row) ? (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:13, color:row[2] as string, fontFamily:"Inter, sans-serif" }}>{row[0] as string}</span>
            <span style={{ fontSize:13, color:row[2] as string, fontFamily:"'DM Mono', monospace", fontWeight:600 }}>{row[1] as string}</span>
          </div>
        ):null)}
        <div style={{ borderTop:`1px solid ${G.glassBorder}`, paddingTop:10, marginTop:4, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:16, fontWeight:700, color:G.text, fontFamily:"Inter, sans-serif" }}>Total</span>
          <span style={{ fontSize:22, fontWeight:800, color:G.gold, fontFamily:"'DM Mono', monospace" }}>₹{total.toFixed(0)}</span>
        </div>
        {disc>0 && <p style={{ fontSize:11, color:G.success, textAlign:"center", margin:"10px 0 0", fontWeight:700, fontFamily:"Inter, sans-serif" }}>🎉 You&apos;re saving ₹{disc}!</p>}
      </div>

      <button onClick={onPlaceOrder} disabled={isPlacing}
        style={{ width:"100%", marginTop:16, padding:18, borderRadius:16, border:"none", background:isPlacing?G.glass:GOLD_GRADIENT, color:isPlacing?G.textDim:G.bg, fontWeight:900, fontSize:16, cursor:isPlacing?"not-allowed":"pointer", boxShadow:isPlacing?"none":`0 8px 32px ${G.goldGlow}`, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"Inter, sans-serif", transition:"all 0.3s" }}>
        {isPlacing?<><Spinner size={18} color={G.textDim} /> Placing Order...</>:`🛒 Place Order — ₹${total.toFixed(0)}`}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════
// TOP CANCEL BAR
// ════════════════════════════════════════════════
function TopCancelBar({ order, onCancelled }: { order:Order; onCancelled:()=>void }) {
  const placedAt = new Date(order.createdAt).getTime();
  const [s, setS] = useState(()=>Math.max(0,120-Math.floor((Date.now()-placedAt)/1000)));
  const [cancelling, setCancelling] = useState(false);
  useEffect(()=>{const iv=setInterval(()=>setS(Math.max(0,120-Math.floor((Date.now()-placedAt)/1000))),1000);return()=>clearInterval(iv);},[placedAt]);
  if (s<=0) return null;
  const isUrgent=s<=30; const pct=(s/120)*100; const mins=Math.floor(s/60); const secs=s%60;
  const cancel = async()=>{if(cancelling||!confirm(`Cancel order #${order.orderNumber}?`))return;setCancelling(true);try{await orderApi.cancelOrder(order._id);localStorage.removeItem("gb_active_order");onCancelled();}catch{alert("Failed");setCancelling(false);}};
  return (
    <div style={{ position:"sticky", top:0, zIndex:45, background:isUrgent?"linear-gradient(135deg,#7f1d1d,#C0392B)":"linear-gradient(135deg,#0F3D2E,#1A5340)", borderBottom:`1px solid ${isUrgent?"#ef4444":G.gold}` }}>
      <div style={{ padding:"9px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:8, padding:"5px 10px", border:`1px solid ${isUrgent?"rgba(255,255,255,0.4)":G.gold}` }}>
            <span style={{ fontFamily:"'DM Mono', monospace", fontSize:13, color:"white", fontWeight:600 }}>{mins}:{String(secs).padStart(2,"0")}</span>
          </div>
          <p style={{ fontWeight:700, fontSize:12, color:"white", margin:0, fontFamily:"Inter, sans-serif" }}>{isUrgent?"⚠️ Last chance to cancel!":"Cancel within 2 min"}</p>
        </div>
        <button onClick={cancel} disabled={cancelling} style={{ background:"rgba(255,255,255,0.9)", color:isUrgent?"#C0392B":"#0F3D2E", border:"none", borderRadius:8, padding:"6px 14px", fontWeight:800, fontSize:11, cursor:cancelling?"wait":"pointer", fontFamily:"Inter, sans-serif" }}>{cancelling?"...":"✕ CANCEL"}</button>
      </div>
      <div style={{ height:2, background:"rgba(0,0,0,0.25)" }}><div style={{ height:"100%", width:`${pct}%`, background:isUrgent?"linear-gradient(90deg,#fca5a5,white)":GOLD_GRADIENT, transition:"width 1s linear" }} /></div>
    </div>
  );
}

// ════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════
export default function CustomerOrderPage() {
  const params = useParams(); const router = useRouter();
  const tableId = params.tableId as string;

  const [secStatus, setSecStatus] = useState<"checking"|"passed"|"failed"|"session_ended">("checking");
  const [secResult, setSecResult] = useState<SecurityResult|null>(null);
  const [sessionEndReason, setSessionEndReason] = useState("");
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [table, setTable] = useState<Table|null>(null);
  const [existingOrder, setExistingOrder] = useState<Order|null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<ExtendedCartItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isPlacing, setIsPlacing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem|null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount|null>(null);
  const [customerData, setCustomerData] = useState<{name:string;phone:string}|null>(null);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const prevStatusRef = useRef<string|null>(null);
  const pollRef = useRef<NodeJS.Timeout|null>(null);

  const onPassed = useCallback(()=>setSecStatus("passed"),[]);
  const onFailed = useCallback((r:SecurityResult)=>{setSecResult(r);setSecStatus("failed");},[]);
  const onRetry = useCallback(()=>{setSecStatus("checking");setSecResult(null);},[]);

  useEffect(()=>{
    if(secStatus!=="passed")return;
    const saved=localStorage.getItem("gb_customer");
    if(saved){try{const d=JSON.parse(saved);setCustomerData({name:d.name,phone:d.phone});}catch{}}
    const onStorage=()=>{const u=localStorage.getItem("gb_customer");if(u){try{const d=JSON.parse(u);setCustomerData({name:d.name,phone:d.phone});}catch{}}};
    window.addEventListener("storage",onStorage);
    const iv=setInterval(()=>{const u=localStorage.getItem("gb_customer");if(u){try{const d=JSON.parse(u);setCustomerData(p=>p?.name===d.name?p:{name:d.name,phone:d.phone});}catch{}}},2000);
    return()=>{window.removeEventListener("storage",onStorage);clearInterval(iv);};
  },[secStatus]);

  useEffect(()=>{
    if(secStatus!=="passed")return;
    async function load(){
      try{
        setLoading(true);
        const[mR,tR]=await Promise.all([menuApi.getMenu(),tableApi.getTable(tableId)]);
        setMenu(mR.data.data);setTable(tR.data.data);
        if(mR.data.data.length>0)setActiveCategory(mR.data.data[0]._id);
        const oR=await orderApi.getOrderByTable(tableId);
        if(oR.data.data){const o=oR.data.data;if(["settled","cancelled"].includes(o.status)){localStorage.removeItem("gb_active_order");setExistingOrder(null);}else{setExistingOrder(o);prevStatusRef.current=o.status;localStorage.setItem("gb_active_order",o._id);}}
      }catch{}finally{setLoading(false);}
    }
    load();
  },[tableId,secStatus]);

  useEffect(()=>{
    if(secStatus!=="passed")return;
    let cancelled=false;
    const check=async()=>{
      if(cancelled)return;
      try{
        if(existingOrder){
          const dR=await orderApi.getOrder(existingOrder._id);
          const dO:Order|null=dR.data?.data;
          if(dO){
            if(dO.status==="settled"){localStorage.setItem("gb_settled_order_id",existingOrder._id);localStorage.setItem("gb_settled_table",existingOrder.tableNumber||tableId);localStorage.removeItem("gb_active_order");localStorage.removeItem("gb_customer");setSessionEndReason("Your bill has been settled. Thank you for visiting!");setSecStatus("session_ended");return;}
            if(dO.status==="cancelled"){localStorage.removeItem("gb_active_order");setSessionEndReason("Your order was cancelled.");setSecStatus("session_ended");return;}
          }
        }
        const[oR,aR]=await Promise.all([orderApi.getOrderByTable(tableId),orderApi.getKdsOrders()]);
        if(cancelled)return;
        if(aR.data.data)setAllOrders(aR.data.data);
        const nO:Order|null=oR.data.data;
        if(!nO)return;
        prevStatusRef.current=nO.status;setExistingOrder(nO);
      }catch{}
    };
    pollRef.current=setInterval(check,5000);
    const onVis=()=>{if(document.visibilityState==="visible")check();};
    document.addEventListener("visibilitychange",onVis);window.addEventListener("focus",check);
    check();
    return()=>{cancelled=true;if(pollRef.current)clearInterval(pollRef.current);document.removeEventListener("visibilitychange",onVis);window.removeEventListener("focus",check);};
  },[secStatus,tableId,existingOrder]);

  const queuePos = existingOrder ? allOrders.filter(o=>["kotSent","open"].includes(o.status)&&o._id!==existingOrder._id&&new Date(o.createdAt).getTime()<new Date(existingOrder.createdAt).getTime()).length : undefined;

  const addToCart = (item:MenuItem,qty:number,variants:{groupName:string;selected:string[]}[],mod:number)=>{
    const key=item._id+JSON.stringify(variants);
    setCart(prev=>{const ex=prev.find(c=>(c.menuItemId+JSON.stringify(c.variants))===key);if(ex)return prev.map(c=>(c.menuItemId+JSON.stringify(c.variants))===key?{...c,quantity:c.quantity+qty}:c);return[...prev,{menuItemId:item._id,name:item.name,price:item.price,quantity:qty,notes:"",isVeg:true,variants,totalPriceModifier:mod,imageUrl:item.imageUrl}];});
  };

  const updateQty=(key:string,d:number)=>setCart(prev=>{const ex=prev.find(c=>(c.menuItemId+JSON.stringify(c.variants))===key);if(!ex)return prev;if(ex.quantity+d<=0)return prev.filter(c=>(c.menuItemId+JSON.stringify(c.variants))!==key);return prev.map(c=>(c.menuItemId+JSON.stringify(c.variants))===key?{...c,quantity:c.quantity+d}:c);});

  const handleOrder=async()=>{
    if(!cart.length)return;
    try{
      const API=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
      const pm=(await fetch(`${API}/settings/payment_mode`).then(r=>r.json())).data||"counter";
      if(pm==="online"||pm==="both")await initiateRazorpay();
      else placeOrder(customerData||undefined);
    }catch{placeOrder(customerData||undefined);}
  };

  const initiateRazorpay=async()=>{
    const sub=cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
    const disc=appliedDiscount?.discount||0;
    const total=Math.round(Math.max(0,sub-disc)*1.05);
    const API=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
    setIsPlacing(true);
    try{
      const res=await fetch(`${API}/payment/create-order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:total,tableNumber:table?.tableNumber})}).then(r=>r.json());
      if(!res.success)throw new Error(res.message);
      await new Promise<void>((resolve,reject)=>{if((window as any).Razorpay){resolve();return;}const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.onload=()=>resolve();s.onerror=()=>reject();document.body.appendChild(s);});
      await new Promise<void>((resolve,reject)=>{new (window as any).Razorpay({key:res.data.keyId,amount:total*100,currency:"INR",name:"Golden Beans Café",order_id:res.data.orderId,prefill:{name:customerData?.name||"",contact:customerData?.phone||""},theme:{color:G.gold},handler:async(r:any)=>{try{const v=await fetch(`${API}/payment/verify`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)}).then(r=>r.json());if(v.success){await placeOrder(customerData||undefined,r.razorpay_payment_id);resolve();}else reject();}catch(e){reject(e);}},modal:{ondismiss:()=>reject(new Error("cancelled"))}}).open();});
    }catch(e:any){if(e?.message!=="cancelled")alert(e?.message||"Payment failed");}
    finally{setIsPlacing(false);}
  };

  const placeOrder=async(customer?:{name:string;phone:string},paymentId?:string)=>{
    if(!cart.length)return;setIsPlacing(true);
    try{
      const res=await orderApi.createOrder({tableId,items:cart.map(c=>({menuItemId:c.menuItemId,name:c.name,price:c.price+(c.totalPriceModifier||0),quantity:c.quantity,notes:c.variants?.flatMap(v=>v.selected).join(", ")||c.notes,isVeg:c.isVeg})),createdBy:"customer",customerName:customer?.name||customerData?.name||"",customerPhone:customer?.phone||customerData?.phone||"",discount:appliedDiscount?.discount||0,appliedPromoId:appliedDiscount?.promotionId||null,appliedPromoCode:appliedDiscount?.code||null,razorpayPaymentId:paymentId||null});
      const nO:Order=res.data.data;setCart([]);setAppliedDiscount(null);setExistingOrder(nO);prevStatusRef.current=nO.status;localStorage.setItem("gb_active_order",nO._id);setActiveTab("orders");
    }catch(e:unknown){alert(e instanceof Error?e.message:"Failed");}
    finally{setIsPlacing(false);}
  };

  const allItems = menu.flatMap(c=>c.items as MenuItem[]);
  const bestsellers = allItems.filter(i=>i.tags?.includes("bestseller")&&i.isAvailable);
  const catItems = (menu.find(c=>c._id===activeCategory)?.items||[]) as MenuItem[];
  const discount = appliedDiscount?.discount||0;
  const totalCartItems = cart.reduce((s,i)=>s+i.quantity,0);
  const hour = new Date().getHours();
  const greeting = hour<12?"Good Morning":hour<17?"Good Afternoon":"Good Evening";

  // ── Security gates ──
  if(secStatus==="checking") return <SecurityCheckScreen onPassed={onPassed} onFailed={onFailed} />;
  if(secStatus==="failed"&&secResult) return <AwarenessScreen result={secResult} onRetry={onRetry} />;
  if(secStatus==="session_ended") return <SessionEndedScreen reason={sessionEndReason} onRestart={()=>router.replace("/")} />;

  return (
    <div style={{ minHeight:"100vh", background:G.bg, display:"flex", flexDirection:"column", overflowX:"hidden" }}>
      <style>{STYLES}</style>

      {existingOrder&&!["settled","cancelled"].includes(existingOrder.status) && <TopCancelBar order={existingOrder} onCancelled={()=>{setExistingOrder(null);prevStatusRef.current=null;}} />}

      {/* ── HEADER ── */}
      <header style={{ position:"sticky", top:0, zIndex:30, background:"rgba(10,10,10,0.95)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", padding:"13px 16px", borderBottom:`1px solid ${G.glassBorder}` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:46, height:46, borderRadius:14, overflow:"hidden", border:`1.5px solid ${G.gold}60`, boxShadow:`0 0 16px ${G.goldGlow}`, flexShrink:0 }}>
              <img src="/logo-small.png" alt="GB" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
            </div>
            <div>
              <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:18, fontWeight:700, color:G.text, margin:0, lineHeight:1.1 }}>Golden Beans</p>
              <p style={{ fontSize:10, color:G.textSub, margin:0, fontFamily:"Inter, sans-serif" }}>Café &amp; Bistro{table?` · Table ${table.tableNumber}`:""}</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {/* Coffee icon btn */}
            <button style={{ width:40, height:40, borderRadius:12, background:G.glass, border:`1px solid ${G.glassBorder}`, color:G.text, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, backdropFilter:"blur(8px)" }}>☕</button>
            {/* Search */}
            <button style={{ width:40, height:40, borderRadius:12, background:G.glass, border:`1px solid ${G.glassBorder}`, color:G.text, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, backdropFilter:"blur(8px)" }}>🔍</button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex:1, paddingBottom: cart.length>0&&activeTab!=="cart" ? 148 : 80 }}>

        {/* HOME */}
        {activeTab==="home" && (
          <div>
            {loading ? (
              <div>
                <div className="shimmer-bg" style={{ height:300, marginBottom:0 }} />
                <div style={{ padding:"16px 16px 0", display:"flex", gap:10 }}>
                  {[1,2,3,4].map(i=><div key={i} className="shimmer-bg" style={{ flexShrink:0, width:72, height:90, borderRadius:18 }} />)}
                </div>
                <div style={{ padding:"20px 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {[1,2,3,4].map(i=><SkeletonCard key={i} />)}
                </div>
              </div>
            ):(
              <>
                {/* Hero */}
                <HeroCarousel heroItems={allItems.filter(i=>i.isAvailable)} onExplore={()=>setActiveTab("menu")} onItemTap={setSelectedItem} cart={cart} />

                {/* Greeting */}
                <div style={{ padding:"18px 16px 4px" }}>
                  <p style={{ fontSize:11, color:G.textSub, margin:"0 0 2px", fontFamily:"Inter, sans-serif" }}>{greeting}{customerData?",":" ☕"}</p>
                  <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:700, color:G.text, margin:0 }}>
                    {customerData?<><span className="gold-text">{customerData.name}</span> 👋</>:"Welcome to Golden Beans"}
                  </h2>
                </div>

                {/* 🔥 Popular Right Now */}
                <div style={{ padding:"16px 0 0" }}>
                  <ScrollRow title="🔥 Popular Right Now" subtitle="Crowd favourites you'll love" items={bestsellers.length>0?bestsellers:allItems.filter(i=>i.isAvailable).slice(0,5)} cart={cart} onTap={setSelectedItem} favs={favs} onFav={id=>setFavs(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;})} showFeatured />
                </div>

                {/* Category grid */}
                <CategoryRow categories={menu} active={activeCategory} onSelect={id=>{setActiveCategory(id);}} />

                {/* Continue your favorites (random from selected cat) */}
                <CompactRow title="Continue Your Favorites" items={catItems.filter(i=>i.isAvailable).slice(0,6)} cart={cart} onTap={setSelectedItem} />

                {/* Promo */}
                <PromoBanner onOrderNow={()=>setActiveTab("menu")} />

                {/* Each category row */}
                {menu.map(cat=>(
                  <ScrollRow key={cat._id} title={`${cat.icon} ${cat.name}`} items={(cat.items as MenuItem[]).filter(i=>i.isAvailable).slice(0,8)} cart={cart} onTap={setSelectedItem} favs={favs} onFav={id=>setFavs(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;})} />
                ))}
              </>
            )}
          </div>
        )}

        {/* MENU */}
        {activeTab==="menu" && (
          <div>
            <CategoryRow categories={menu} active={activeCategory} onSelect={setActiveCategory} />
            <div style={{ padding:"0 16px", marginBottom:10 }}>
              <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, color:G.text, margin:"0 0 3px" }}>
                {menu.find(c=>c._id===activeCategory)?.icon} {menu.find(c=>c._id===activeCategory)?.name}
              </h3>
              <p style={{ fontSize:11, color:G.textSub, margin:0, fontFamily:"Inter, sans-serif" }}>{catItems.filter(i=>i.isAvailable).length} items available</p>
            </div>
            {loading ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, padding:"0 16px" }}>
                {[1,2,3,4,5,6].map(i=><SkeletonCard key={i} />)}
              </div>
            ):(
              catItems.length===0
                ? <div style={{ textAlign:"center", padding:"60px 20px" }}><div style={{ fontSize:48, marginBottom:12 }}>☕</div><p style={{ color:G.textSub, fontFamily:"Inter, sans-serif" }}>No items in this category yet</p></div>
                : <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, padding:"0 16px 20px" }}>
                    {catItems.map((item,idx)=>{
                      const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
                      return <ItemCard key={item._id} item={item} onTap={()=>setSelectedItem(item)} cartQty={qty} isFav={favs.has(item._id)} onFav={()=>setFavs(p=>{const n=new Set(p);n.has(item._id)?n.delete(item._id):n.add(item._id);return n;})} delay={idx*0.04} />;
                    })}
                  </div>
            )}
          </div>
        )}

        {/* ORDERS */}
        {activeTab==="orders" && (
          <div style={{ padding:"20px 16px" }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, color:G.text, margin:"0 0 16px" }}>My Orders</h2>
            {existingOrder
              ? <LiveOrderTracker order={existingOrder} queuePosition={queuePos} />
              : <div style={{ textAlign:"center", padding:"60px 20px" }}>
                  <div style={{ fontSize:60, marginBottom:16, animation:"float 3s ease-in-out infinite" }}>📋</div>
                  <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, color:G.text, margin:"0 0 8px" }}>No Active Orders</h3>
                  <p style={{ fontSize:13, color:G.textSub, fontFamily:"Inter, sans-serif" }}>Place an order to track it live</p>
                </div>
            }
          </div>
        )}

        {/* CART */}
        {activeTab==="cart" && <CartView cart={cart} onUpdateQty={updateQty} onPlaceOrder={handleOrder} isPlacing={isPlacing} appliedDiscount={appliedDiscount} onDiscountChange={setAppliedDiscount} />}

        {/* INFO */}
        {activeTab==="info" && (
          <div style={{ padding:"20px 16px" }}>
            <div style={{ background:`linear-gradient(135deg,${G.brownMid},${G.brown})`, borderRadius:20, padding:24, marginBottom:16, border:`1px solid ${G.gold}25`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-20, right:-20, width:120, height:120, borderRadius:"50%", background:`radial-gradient(circle,${G.gold}15,transparent)`, pointerEvents:"none" }} />
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
                <img src="/logo-small.png" alt="GB" style={{ width:54, height:54, borderRadius:14, border:`1px solid ${G.gold}40` }} />
                <div>
                  <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, color:G.gold, margin:"0 0 2px" }}>Golden Beans</h3>
                  <p style={{ fontSize:11, color:"rgba(200,155,60,0.6)", margin:0, letterSpacing:"0.15em", fontFamily:"Inter, sans-serif", fontWeight:600 }}>CAFE &amp; BISTRO</p>
                </div>
              </div>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.75)", margin:0, lineHeight:1.6, fontFamily:"Inter, sans-serif" }}>Premium 100% pure vegetarian cafe in Surat. Handcrafted coffee, fresh snacks &amp; artisanal beverages.</p>
            </div>
            {table && (
              <div style={{ background:G.bg1, borderRadius:16, padding:16, marginBottom:12, border:`1px solid ${G.glassBorder}`, display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ fontSize:36 }}>🪑</span>
                <div><p style={{ fontSize:10, color:G.textDim, letterSpacing:"0.1em", textTransform:"uppercase", margin:0, fontFamily:"Inter, sans-serif" }}>Your Table</p><p style={{ fontFamily:"'Cormorant Garamond', serif", fontWeight:700, fontSize:22, color:G.text, margin:"2px 0 0" }}>Table {table.tableNumber}</p></div>
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{icon:"🌿",label:"100% Pure Vegetarian",color:G.success},{icon:"☕",label:"Handcrafted Coffee",color:G.gold},{icon:"⚡",label:"Fast Service",color:"#4A9EFF"},{icon:"❤️",label:"Made with Love",color:G.danger}].map(f=>(
                <div key={f.label} style={{ background:G.bg1, borderRadius:14, padding:16, border:`1px solid ${G.glassBorder}`, textAlign:"center" }}>
                  <p style={{ fontSize:26, margin:"0 0 6px" }}>{f.icon}</p>
                  <p style={{ fontSize:11, fontWeight:700, color:f.color, margin:0, fontFamily:"Inter, sans-serif" }}>{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <CRMCaptureCard tableId={tableId} />
        <WaiterHelpSheet tableId={tableId} tableNumber={table?.tableNumber||tableId} />
      </main>

      {/* ── FLOATING CART BAR ── */}
      {cart.length>0&&activeTab!=="cart" && <FloatingCartBar cart={cart} discount={discount} onViewCart={()=>setActiveTab("cart")} />}

      {/* ── BOTTOM NAV ── */}
      <nav style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:40, background:"rgba(10,10,10,0.97)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderTop:`1px solid ${G.glassBorder}`, paddingTop:8, paddingBottom:"max(10px, env(safe-area-inset-bottom))" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-around", maxWidth:480, margin:"0 auto", padding:"0 8px" }}>
          {([
            {id:"home",icon:"🏠",label:"Home"},
            {id:"menu",icon:"🍽️",label:"Menu"},
            {id:"orders",icon:"📋",label:"Orders",badge:existingOrder?"•":null},
            {id:"cart",icon:"🛒",label:"Cart",badge:totalCartItems>0?totalCartItems:null},
            {id:"info",icon:"ℹ️",label:"Info"},
          ] as {id:Tab;icon:string;label:string;badge?:string|number|null}[]).map(tab=>{
            const isA=activeTab===tab.id;
            return (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", padding:"4px 14px", position:"relative", flex:1 }}>
                {/* Active indicator */}
                {isA && <div style={{ position:"absolute", top:-8, left:"50%", transform:"translateX(-50%)", width:28, height:3, background:GOLD_GRADIENT, borderRadius:99 }} />}
                <span style={{ fontSize:22, transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)", transform:isA?"scale(1.18)":"scale(1)", filter:isA?"none":"grayscale(0.9) opacity(0.4)" }}>{tab.icon}</span>
                <span style={{ fontSize:9, fontWeight:isA?700:500, color:isA?G.gold:G.textDim, fontFamily:"Inter, sans-serif", letterSpacing:"0.03em", transition:"color 0.2s" }}>{tab.label}</span>
                {tab.badge!=null && (
                  <div style={{ position:"absolute", top:1, right:8, minWidth:typeof tab.badge==="number"?18:9, height:typeof tab.badge==="number"?18:9, borderRadius:99, background:GOLD_GRADIENT, color:G.bg, fontSize:9, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${G.bg}`, fontFamily:"'DM Mono', monospace", animation:"cartBounce 0.4s ease" }}>
                    {typeof tab.badge==="number"?tab.badge:""}
                  </div>
                )}
              </button>
            );
          })}

          {/* Help button — floating circle */}
          <div style={{ position:"absolute", right:16, bottom:58, width:44, height:44, borderRadius:"50%", background:GOLD_GRADIENT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:`0 4px 20px ${G.goldGlow}`, border:`2px solid ${G.bg}`, animation:"goldGlow 3s ease-in-out infinite", cursor:"pointer" }}>🙋</div>
        </div>
      </nav>

      <ProductDetailModal item={selectedItem} isOpen={!!selectedItem} onClose={()=>setSelectedItem(null)} onAddToCart={addToCart} />
    </div>
  );
}
