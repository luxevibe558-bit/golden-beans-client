"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import CRMCaptureCard from "@/components/CRMCaptureCard";
import WaiterHelpSheet from "@/components/WaiterHelpSheet";
import { menuApi, orderApi, tableApi } from "@/lib/api";
import { getThumbnailUrl, getHeroUrl } from "@/lib/cloudinary";
import LiveOrderTracker from "@/components/LiveOrderTracker";
import type { MenuCategory, MenuItem, CartItem, Table, Order, VariantGroup } from "@/types";

// ─── EXACT DESIGN TOKENS from photo ───
const T = {
  // Backgrounds — deep dark brown-black
  bg:     "#080501",
  bg1:    "#0D0A06",
  bg2:    "#13100A",
  bg3:    "#1C1810",
  bg4:    "#252018",
  card:   "#181410",
  // Gold palette — warm honey gold
  gold:   "#C8922A",
  goldM:  "#E8B84B",
  goldL:  "#F5CC6A",
  goldD:  "#8B5E1A",
  goldGl: "rgba(200,146,42,0.25)",
  // Text
  text:   "#F0E8D8",
  textS:  "#A89878",
  textD:  "#5C5040",
  // Status
  green:  "#4CAF6A",
  red:    "#E53935",
  // Glass
  gl:     "rgba(255,255,255,0.03)",
  glB:    "rgba(255,255,255,0.07)",
  glB2:   "rgba(255,255,255,0.12)",
};

// Gold gradient — exact warm honey like photo
const GG  = `linear-gradient(135deg, ${T.gold} 0%, ${T.goldM} 50%, ${T.goldL} 100%)`;
const GGR = `linear-gradient(135deg, ${T.goldL} 0%, ${T.goldM} 50%, ${T.gold} 100%)`;
const CARD_BG = `linear-gradient(160deg, #1C1810 0%, #13100A 100%)`;

// ─── GLOBAL CSS ───
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=Inter:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; margin: 0; padding: 0; }
html, body { background: #080501; overflow-x: hidden; overscroll-behavior: none; -webkit-font-smoothing: antialiased; }
img { user-select: none; pointer-events: none; -webkit-user-drag: none; }
input, textarea { -webkit-user-select: text !important; user-select: text !important; }
button { cursor: pointer; outline: none; }
.hs { scrollbar-width: none; -ms-overflow-style: none; }
.hs::-webkit-scrollbar { display: none; }

/* ── Animations ── */
@keyframes fadeUp   { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
@keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
@keyframes scaleIn  { from { opacity:0; transform:scale(0.82) } to { opacity:1; transform:scale(1) } }
@keyframes slideUp  { from { transform:translateY(100%) } to { transform:translateY(0) } }
@keyframes slideDown{ from { transform:translateY(-100%) } to { transform:translateY(0) } }
@keyframes spin     { to { transform:rotate(360deg) } }
@keyframes pulse    { 0%,100%{opacity:0.35} 50%{opacity:1} }
@keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@keyframes kenBurns { from{transform:scale(1) translate(0,0)} to{transform:scale(1.06) translate(-0.5%,-0.5%)} }
@keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes goldGlow { 0%,100%{box-shadow:0 0 20px rgba(200,146,42,0.3)} 50%{box-shadow:0 0 50px rgba(200,146,42,0.6),0 0 80px rgba(200,146,42,0.2)} }
@keyframes ripple   { to{transform:scale(4.5);opacity:0} }
@keyframes cartBump { 0%{transform:scale(1)} 30%{transform:scale(1.5)} 70%{transform:scale(0.88)} 100%{transform:scale(1)} }
@keyframes ringIn   { 0%{transform:scale(0.4);opacity:0} 60%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
@keyframes steamUp  { 0%{opacity:0;transform:translateY(0) scaleX(1)} 45%{opacity:0.55} 100%{opacity:0;transform:translateY(-44px) scaleX(2)} }
@keyframes dotBlink { 0%,100%{opacity:0.3} 50%{opacity:1} }
@keyframes countUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes checkDraw{ from{stroke-dashoffset:80} to{stroke-dashoffset:0} }
@keyframes particleFly { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0} }
@keyframes progressFill { from{width:0} to{width:var(--w)} }
@keyframes rotateBrew { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

/* ── Utility classes ── */
.sk { background:linear-gradient(90deg,#1C1810 25%,#252018 50%,#1C1810 75%); background-size:200% 100%; animation:shimmer 1.9s infinite; }
.gt { background:${GG}; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.tap:active { transform:scale(0.94) !important; transition:transform 0.11s ease !important; }
`;

// ─── TYPES ───
interface ECI extends CartItem {
  variants?: { groupName: string; selected: string[] }[];
  totalPriceModifier?: number;
  imageUrl?: string;
}
interface Disc {
  promotionId: string; name: string; description: string; discount: number;
  type: "auto" | "code"; code?: string; promoCodeId?: string;
}
interface SecRes {
  allowed: boolean; ipAllowed: boolean; gpsAllowed: boolean; gpsRequired: boolean;
  ipRequired: boolean; distance: number | null; cafeName: string;
  cafeAddress: string; cafePhone: string; wifiName: string; reason: string;
}
type Screen = "security" | "home" | "cart" | "checkout" | "placed" | "tracking" | "ready";
type Tab    = "home" | "menu" | "orders" | "cart" | "profile";

// ─── ATOMS ───
function Spinner({ s=18, c=T.gold }: { s?: number; c?: string }) {
  return <div style={{ width:s, height:s, borderRadius:"50%", border:`2.5px solid ${c}30`, borderTopColor:c, animation:"spin 0.72s linear infinite", flexShrink:0 }}/>;
}

function GBadge({ children, tiny=false }: { children: React.ReactNode; tiny?: boolean }) {
  return (
    <span style={{ background:GG, color:T.bg, fontSize:tiny?7.5:9, fontWeight:900, padding:tiny?"1.5px 6px":"2.5px 8px", borderRadius:99, letterSpacing:"0.05em", fontFamily:"Inter,sans-serif", display:"inline-block", lineHeight:1.4 }}>
      {children}
    </span>
  );
}

function HR() {
  return <div style={{ height:1, background:`linear-gradient(90deg,transparent,${T.glB},transparent)`, margin:"2px 0" }}/>;
}

// ─── SKELETON CARD ───
function SkCard() {
  return (
    <div style={{ background:T.card, borderRadius:18, overflow:"hidden", border:`1px solid ${T.glB}` }}>
      <div className="sk" style={{ height:132 }}/>
      <div style={{ padding:"10px 12px" }}>
        <div className="sk" style={{ height:13, borderRadius:5, marginBottom:7, width:"68%" }}/>
        <div className="sk" style={{ height:10, borderRadius:5, width:"45%" }}/>
        <div className="sk" style={{ height:32, borderRadius:10, marginTop:10 }}/>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════
// SECURITY — Welcome + Check screens
// ════════════════════════════════════════════════
function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    const iv = setInterval(() => setN(p => { if (p <= 1) { clearInterval(iv); onDone(); return 0; } return p - 1; }), 1000);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative" }}>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 75% 55% at 50% 38%, ${T.gold}18 0%, transparent 68%)`, animation:"pulse 3.5s ease-in-out infinite" }}/>
      {[0,1,2].map(i => <div key={i} style={{ position:"absolute", top:"36%", left:`${46+i*4}%`, width:5, height:20, background:`linear-gradient(to top,${T.gold}60,transparent)`, borderRadius:99, animation:`steamUp 2.3s ${i*0.65}s ease-out infinite` }}/>)}
      <div style={{ textAlign:"center", position:"relative", zIndex:1 }}>
        <div style={{ width:112, height:112, borderRadius:"50%", overflow:"hidden", margin:"0 auto 26px", border:`2px solid ${T.gold}60`, boxShadow:`0 0 0 8px ${T.gold}0A, 0 0 64px ${T.gold}30`, animation:"float 3.8s ease-in-out infinite, scaleIn 0.7s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <img src="/logo-large.png" alt="GB" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        </div>
        <p style={{ fontSize:9.5, color:T.gold, letterSpacing:"0.38em", textTransform:"uppercase", fontWeight:700, fontFamily:"Inter,sans-serif", marginBottom:7, animation:"fadeUp 0.5s 0.3s ease both" }}>Welcome to</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:48, fontWeight:900, color:T.text, lineHeight:1, marginBottom:5, animation:"fadeUp 0.5s 0.4s ease both" }}>Golden Beans</h1>
        <p style={{ fontSize:13, color:T.textS, fontFamily:"Inter,sans-serif", marginBottom:44, fontWeight:300, letterSpacing:"0.05em", animation:"fadeUp 0.5s 0.5s ease both" }}>Cafe &amp; Bistro</p>
        {/* Countdown ring */}
        <div style={{ width:60, height:60, margin:"0 auto", position:"relative", animation:"fadeUp 0.5s 0.6s ease both" }}>
          <svg width={60} height={60} style={{ transform:"rotate(-90deg)" }}>
            <circle cx={30} cy={30} r={26} fill="none" stroke={`${T.gold}22`} strokeWidth={2.5}/>
            <circle cx={30} cy={30} r={26} fill="none" stroke={T.gold} strokeWidth={2.5}
              strokeDasharray={`${2*Math.PI*26}`} strokeDashoffset={`${2*Math.PI*26*(1-n/3)}`}
              strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.9s linear" }}/>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:20, fontWeight:800, color:T.gold, fontFamily:"'DM Mono',monospace" }}>{n}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityCheckScreen({ onPassed, onFailed }: { onPassed: () => void; onFailed: (r: SecRes) => void }) {
  type CS = "pending" | "loading" | "ok" | "fail";
  const [gps, setGps] = useState<CS>("pending");
  const [net, setNet] = useState<CS>("pending");
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    let ok = true;
    async function run() {
      try {
        setGps("loading"); await new Promise(r => setTimeout(r, 420));
        const api = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
        const s = (await fetch(`${api}/security/settings`).then(r => r.json())).data;
        if (s && !s.ipWhitelistEnabled && !s.geofenceEnabled) { if (ok) { setGps("ok"); setNet("ok"); setWelcome(true); } return; }
        if (!("geolocation" in navigator)) { if (ok) { setGps("fail"); await new Promise(r => setTimeout(r,500)); onFailed({ allowed:false,ipAllowed:false,gpsAllowed:false,gpsRequired:true,ipRequired:true,distance:null,cafeName:"Golden Beans",cafeAddress:"",cafePhone:"",wifiName:"GoldenBeans-WiFi",reason:"GPS not supported" }); } return; }
        let pos: GeolocationPosition | null = null;
        if (s?.geofenceEnabled) pos = await new Promise<GeolocationPosition>((res,rej) => navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:true,timeout:15000,maximumAge:0})).catch(e => { throw new Error(e.code===1?"DENIED":"TIMEOUT"); });
        if (ok) setGps("ok");
        await new Promise(r => setTimeout(r, 500));
        if (ok) setNet("loading");
        const res = await fetch(`${api}/security/check`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({latitude:pos?.coords.latitude,longitude:pos?.coords.longitude}) });
        const d = (await res.json());
        if (!d.success) throw new Error(d.message);
        const r = d.data;
        if (ok) { if (r.securityDisabled) { setGps("ok"); setNet("ok"); setWelcome(true); return; } setGps(r.gpsAllowed?"ok":"fail"); setNet(r.ipAllowed?"ok":"fail"); await new Promise(x=>setTimeout(x,750)); if (r.allowed) setWelcome(true); else onFailed(r); }
      } catch (e: unknown) {
        if (!ok) return;
        const m = e instanceof Error ? e.message : "";
        const gf = m==="DENIED"||m.includes("denied");
        if (gf||m==="TIMEOUT") setGps("fail"); else setNet("fail");
        await new Promise(r=>setTimeout(r,750));
        onFailed({ allowed:false,ipAllowed:true,gpsAllowed:!gf,gpsRequired:true,ipRequired:true,distance:null,cafeName:"Golden Beans",cafeAddress:"Pramukh Darshan, Dabholi, Surat",cafePhone:"",wifiName:"GoldenBeans-WiFi",reason:gf?"Location denied":m==="TIMEOUT"?"Location timed out":"Connect to cafe WiFi" });
      }
    }
    run(); return () => { ok = false; };
  }, [onPassed, onFailed]);

  if (welcome) return <WelcomeScreen onDone={onPassed}/>;

  const Row = ({ state, icon, title, sub }: { state:CS; icon:string; title:string; sub:string }) => {
    const c = state==="ok" ? T.green : state==="fail" ? T.red : state==="loading" ? T.gold : T.textD;
    return (
      <div style={{ background:T.card, border:`1px solid ${c}22`, borderRadius:14, padding:"13px 16px", display:"flex", alignItems:"center", gap:12, marginBottom:9, transition:"all 0.4s ease" }}>
        <span style={{ fontSize:20 }}>{icon}</span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:13, fontWeight:600, color:c, margin:"0 0 1px", fontFamily:"Inter,sans-serif" }}>{title}</p>
          <p style={{ fontSize:11, color:T.textS, margin:0, fontFamily:"Inter,sans-serif" }}>{sub}</p>
        </div>
        {state==="loading" && <Spinner s={17}/>}
        {state==="ok"      && <div style={{ width:22,height:22,borderRadius:"50%",background:T.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,animation:"scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>✓</div>}
        {state==="fail"    && <div style={{ width:22,height:22,borderRadius:"50%",background:T.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12 }}>✗</div>}
      </div>
    );
  };

  return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ maxWidth:340, width:"100%", textAlign:"center" }}>
        <div style={{ width:76,height:76,borderRadius:"50%",overflow:"hidden",margin:"0 auto 20px",border:`1.5px solid ${T.gold}50`,boxShadow:`0 0 36px ${T.gold}22` }}>
          <img src="/logo-large.png" alt="GB" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
        </div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:T.text, margin:"0 0 5px" }}>Verifying Access</h2>
        <p style={{ fontSize:12, color:T.textS, margin:"0 0 26px", fontFamily:"Inter,sans-serif" }}>Confirming you're at Golden Beans</p>
        <Row state={gps} icon="📍" title="Location" sub={gps==="loading"?"Getting location...":gps==="ok"?"You're at the cafe ✓":gps==="fail"?"Location not verified":"Waiting..."}/>
        <Row state={net} icon="📶" title="Network"  sub={net==="loading"?"Verifying network...":net==="ok"?"Cafe network confirmed ✓":net==="fail"?"Not on cafe network":"Waiting..."}/>
        <p style={{ fontSize:10, color:T.textD, marginTop:18, fontFamily:"Inter,sans-serif" }}>🔒 Protecting against unauthorized orders</p>
      </div>
    </div>
  );
}

function AwarenessScreen({ result, onRetry }: { result: SecRes; onRetry: () => void }) {
  return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ maxWidth:360, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:54, marginBottom:14, animation:"float 3s ease-in-out infinite" }}>🚫</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:T.gold, margin:"0 0 10px" }}>Access Restricted</h1>
        <p style={{ fontSize:13, color:T.textS, margin:"0 0 26px", lineHeight:1.7, fontFamily:"Inter,sans-serif" }}>{result.reason}</p>
        {!result.ipAllowed && <div style={{ background:T.card, border:`1px solid ${T.gold}20`, borderRadius:13, padding:14, marginBottom:9, textAlign:"left" }}><p style={{ color:T.gold, fontWeight:700, fontSize:13, margin:"0 0 2px", fontFamily:"Inter,sans-serif" }}>📶 Connect to Cafe WiFi</p><p style={{ color:T.textS, fontSize:11, margin:0, fontFamily:"Inter,sans-serif" }}>{result.wifiName}</p></div>}
        {!result.gpsAllowed && <div style={{ background:T.card, border:`1px solid ${T.gold}20`, borderRadius:13, padding:14, marginBottom:9, textAlign:"left" }}><p style={{ color:T.gold, fontWeight:700, fontSize:13, margin:"0 0 2px", fontFamily:"Inter,sans-serif" }}>📍 Enable Location</p><p style={{ color:T.textS, fontSize:11, margin:0, fontFamily:"Inter,sans-serif" }}>{result.distance?`${result.distance}m away`:"Allow in browser settings"}</p></div>}
        <button onClick={onRetry} className="tap" style={{ width:"100%", padding:"16px", borderRadius:14, border:"none", background:GG, color:T.bg, fontWeight:800, fontSize:15, fontFamily:"Inter,sans-serif", boxShadow:`0 8px 24px ${T.goldGl}`, marginTop:4 }}>Try Again</button>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════
// HERO CAROUSEL
// ════════════════════════════════════════════════
function HeroCarousel({ items, cart, onTap, onExplore }: { items: MenuItem[]; cart: ECI[]; onTap:(i:MenuItem)=>void; onExplore:()=>void }) {
  const [active, setActive] = useState(0);
  const [drag,   setDrag  ] = useState(0);
  const [isDrag, setIsDrag] = useState(false);
  const sx = useRef(0); const tmr = useRef<NodeJS.Timeout|null>(null);
  const slides = items.filter(i=>i.isAvailable).slice(0,4);
  const next = useCallback(() => setActive(p=>(p+1)%slides.length), [slides.length]);
  const prev = useCallback(() => setActive(p=>(p-1+slides.length)%slides.length), [slides.length]);
  useEffect(() => {
    if (isDrag||!slides.length) return;
    tmr.current = setInterval(next, 4800);
    return () => { if(tmr.current) clearInterval(tmr.current); };
  }, [next, isDrag, active, slides.length]);
  if (!slides.length) return null;
  const item = slides[active];
  const qty  = cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
  return (
    <div style={{ position:"relative", width:"100%", height:"58vw", maxHeight:290, overflow:"hidden", userSelect:"none" }}
      onTouchStart={e=>{setIsDrag(true);sx.current=e.touches[0].clientX;if(tmr.current)clearInterval(tmr.current);}}
      onTouchMove ={e=>{if(isDrag)setDrag(e.touches[0].clientX-sx.current);}}
      onTouchEnd  ={()=>{if(Math.abs(drag)>52)drag<0?next():prev();setIsDrag(false);setDrag(0);}}
      onMouseDown ={e=>{setIsDrag(true);sx.current=e.clientX;if(tmr.current)clearInterval(tmr.current);}}
      onMouseMove ={e=>{if(isDrag)setDrag(e.clientX-sx.current);}}
      onMouseUp   ={()=>{if(Math.abs(drag)>52)drag<0?next():prev();setIsDrag(false);setDrag(0);}}>
      {slides.map((s,i)=>(
        <div key={s._id} style={{ position:"absolute",inset:0,transition:isDrag?"none":"all 0.6s cubic-bezier(0.16,1,0.3,1)",opacity:i===active?1:0,transform:i===active?`translateX(${drag}px)`:i<active?`translateX(calc(-100% + ${drag}px))`:`translateX(calc(100% + ${drag}px))`,zIndex:i===active?1:0 }}>
          {s.imageUrl ? <img src={getHeroUrl(s.imageUrl)} alt={s.name} style={{ width:"100%",height:"100%",objectFit:"cover",animation:i===active?"kenBurns 8s ease-out forwards":"none" }}/> : <div style={{ width:"100%",height:"100%",background:`linear-gradient(135deg,${T.bg3},#000)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:80 }}>☕</div>}
        </div>
      ))}
      {/* Gradient overlays */}
      <div style={{ position:"absolute",inset:0,background:"linear-gradient(to right,rgba(8,5,1,0.9) 0%,rgba(8,5,1,0.4) 55%,transparent 100%)",zIndex:2,pointerEvents:"none" }}/>
      <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(8,5,1,0.88) 0%,transparent 48%)",zIndex:2,pointerEvents:"none" }}/>
      {/* Content */}
      <div style={{ position:"absolute",bottom:0,left:0,padding:"18px 18px 24px",zIndex:3,maxWidth:"63%" }}>
        {item.tags?.includes("bestseller") && <GBadge tiny>⭐ BESTSELLER</GBadge>}
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:"clamp(20px,6vw,32px)",fontWeight:900,color:T.text,margin:"6px 0 4px",lineHeight:1.12,textShadow:"0 2px 14px rgba(0,0,0,0.6)" }}>
          Brewed to<br/><em style={{ color:T.gold }}>perfection,</em><br/>just for you.
        </h2>
        <p style={{ fontSize:11,color:"rgba(240,232,216,0.58)",margin:"0 0 13px",fontFamily:"Inter,sans-serif" }}>Discover our signature blends.</p>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <button onClick={onExplore} className="tap" style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.07)",backdropFilter:"blur(14px)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:99,padding:"8px 16px",color:T.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif" }}>Explore Menu <span>›</span></button>
          <button onClick={()=>onTap(item)} className="tap" style={{ width:35,height:35,borderRadius:"50%",border:`1.5px solid ${T.gold}`,background:qty>0?GG:"rgba(0,0,0,0.5)",color:qty>0?T.bg:T.gold,fontSize:17,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,backdropFilter:"blur(8px)",transition:"all 0.22s ease" }}>{qty>0?"✓":"+"}</button>
        </div>
      </div>
      {/* Slide indicator */}
      <div style={{ position:"absolute",bottom:26,right:14,zIndex:4,display:"flex",alignItems:"center",gap:7 }}>
        <span style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(240,232,216,0.65)" }}>0{active+1}</span>
        <div style={{ width:32,height:1.5,background:"rgba(255,255,255,0.18)",position:"relative",borderRadius:99 }}>
          <div style={{ position:"absolute",left:0,top:0,height:"100%",background:GG,borderRadius:99,transition:"width 0.5s ease",width:`${((active+1)/slides.length)*100}%` }}/>
        </div>
        <span style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:T.textD }}>0{slides.length}</span>
      </div>
      <div style={{ position:"absolute",bottom:9,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5,zIndex:4 }}>
        {slides.map((_,i)=><button key={i} onClick={()=>setActive(i)} style={{ width:i===active?16:4.5,height:4.5,borderRadius:99,background:i===active?T.gold:"rgba(240,232,216,0.22)",border:"none",cursor:"pointer",transition:"all 0.3s ease",padding:0 }}/>)}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// CATEGORY ROW
// ════════════════════════════════════════════════
function CategoryRow({ cats, active, onSelect }: { cats: MenuCategory[]; active: string; onSelect: (id:string)=>void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector('[data-active="true"]') as HTMLElement;
    el?.scrollIntoView({ behavior:"smooth", block:"nearest", inline:"center" });
  }, [active]);
  return (
    <div style={{ padding:"14px 0 8px" }}>
      <div ref={ref} className="hs" style={{ display:"flex", gap:9, overflowX:"auto", paddingLeft:14, paddingRight:14 }}>
        {cats.map((cat, idx) => {
          const isA = cat._id === active;
          return (
            <button key={cat._id} data-active={isA} onClick={()=>onSelect(cat._id)} className="tap"
              style={{ flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:isA?`linear-gradient(145deg,${T.gold}1A,${T.goldM}0A)`:T.gl,backdropFilter:"blur(14px)",border:`1.5px solid ${isA?T.gold:T.glB}`,borderRadius:16,padding:"11px 14px",cursor:"pointer",minWidth:70,boxShadow:isA?`0 0 20px ${T.goldGl},inset 0 1px 0 rgba(255,255,255,0.05)`:"none",transition:"all 0.28s ease",animation:`fadeUp 0.38s ${idx*0.05}s ease both` }}>
              <span style={{ fontSize:22 }}>{cat.icon}</span>
              <span style={{ fontSize:9.5,fontWeight:isA?800:500,color:isA?T.gold:T.textS,whiteSpace:"nowrap",fontFamily:"Inter,sans-serif" }}>{cat.name}</span>
              {isA && <div style={{ width:13,height:2,background:GG,borderRadius:99 }}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// ITEM CARD — exact photo style
// ════════════════════════════════════════════════
function ItemCard({ item, qty, isFav, onFav, onTap, delay=0 }: { item:MenuItem; qty:number; isFav:boolean; onFav:()=>void; onTap:()=>void; delay?:number }) {
  const [pressed, setPressed] = useState(false);
  const [rp, setRp] = useState<{x:number;y:number}|null>(null);
  const tap = (e: React.MouseEvent) => {
    if (!item.isAvailable) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setRp({x:e.clientX-r.left,y:e.clientY-r.top});
    setTimeout(()=>setRp(null),600);
    onTap();
  };
  return (
    <div style={{ background:CARD_BG,borderRadius:18,overflow:"hidden",cursor:item.isAvailable?"pointer":"not-allowed",opacity:item.isAvailable?1:0.45,border:`1px solid ${qty>0?T.gold:T.glB}`,boxShadow:qty>0?`0 0 0 1px ${T.gold}2A,0 8px 26px ${T.goldGl}`:"0 4px 14px rgba(0,0,0,0.5)",transform:pressed?"scale(0.96)":"scale(1)",transition:"all 0.25s ease",position:"relative",animation:`fadeUp 0.45s ${delay}s ease both` }}
      onClick={tap} onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}>
      {/* Image */}
      <div style={{ position:"relative",height:130,overflow:"hidden",background:T.bg3 }}>
        {item.imageUrl ? <img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} loading="lazy"/> : <div style={{ width:"100%",height:"100%",background:`linear-gradient(145deg,${T.bg4},${T.bg3})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:48 }}>☕</div>}
        <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(8,5,1,0.95) 0%,rgba(8,5,1,0) 52%)" }}/>
        {/* Top badges */}
        <div style={{ position:"absolute",top:8,left:8,display:"flex",gap:4 }}>
          {item.tags?.includes("bestseller") && <GBadge tiny>⭐ POPULAR</GBadge>}
          {!item.isAvailable && <span style={{ background:"rgba(229,57,53,0.82)",color:"white",fontSize:7.5,fontWeight:800,padding:"1.5px 7px",borderRadius:99 }}>SOLD OUT</span>}
        </div>
        {/* Top right — qty + fav */}
        <div style={{ position:"absolute",top:8,right:8,display:"flex",gap:4 }}>
          {qty>0 && <div style={{ width:20,height:20,borderRadius:"50%",background:GG,color:T.bg,fontSize:9.5,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",animation:"cartBump 0.4s ease",border:`1.5px solid ${T.bg3}` }}>{qty}</div>}
          <button onClick={e=>{e.stopPropagation();onFav();}} style={{ width:26,height:26,borderRadius:"50%",background:"rgba(8,5,1,0.65)",border:"1px solid rgba(255,255,255,0.1)",color:isFav?"#ef4444":"rgba(240,232,216,0.7)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,backdropFilter:"blur(6px)",transition:"all 0.18s ease" }}>{isFav?"❤️":"🤍"}</button>
        </div>
        {/* Bottom — price + rating */}
        <div style={{ position:"absolute",bottom:7,left:9,right:9,display:"flex",justifyContent:"space-between",alignItems:"flex-end" }}>
          <span style={{ fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:500,color:T.gold }}>₹{item.price}</span>
          <div style={{ display:"flex",alignItems:"center",gap:2 }}>
            <span style={{ color:T.gold,fontSize:9.5 }}>★</span>
            <span style={{ fontSize:9.5,color:"rgba(240,232,216,0.5)",fontFamily:"Inter,sans-serif" }}>{item.rating?.toFixed(1)||"4.5"}</span>
          </div>
        </div>
        {rp && <div style={{ position:"absolute",left:rp.x-16,top:rp.y-16,width:32,height:32,borderRadius:"50%",background:`${T.gold}38`,animation:"ripple 0.6s ease-out forwards",pointerEvents:"none" }}/>}
      </div>
      {/* Body */}
      <div style={{ padding:"9px 12px 12px" }}>
        <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:15.5,fontWeight:600,color:T.text,margin:"0 0 2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{item.name}</p>
        <p style={{ fontSize:9.5,color:T.textS,margin:"0 0 9px",lineHeight:1.4,fontFamily:"Inter,sans-serif",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{item.description||"Premium quality item"}</p>
        <button onClick={e=>{e.stopPropagation();if(item.isAvailable)onTap();}} className="tap"
          style={{ width:"100%",padding:"8.5px",borderRadius:11,border:`1px solid ${qty>0?T.gold:T.glB}`,background:qty>0?GG:T.gl,color:qty>0?T.bg:T.textS,fontWeight:700,fontSize:11.5,cursor:item.isAvailable?"pointer":"not-allowed",fontFamily:"Inter,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all 0.22s ease",boxShadow:qty>0?`0 4px 14px ${T.goldGl}`:"none" }}>
          {!item.isAvailable?"⛔ Out of Stock":qty>0?<><span>✓</span>Added ({qty})</>:<><span style={{fontSize:13}}>+</span>Add to Cart</>}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// SCROLL ROW (horizontal cards)
// ════════════════════════════════════════════════
function ScrollRow({ title, subtitle, items, cart, onTap, favs, onFav }: { title:string; subtitle?:string; items:MenuItem[]; cart:ECI[]; onTap:(i:MenuItem)=>void; favs:Set<string>; onFav:(id:string)=>void }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ padding:"0 14px",marginBottom:10,display:"flex",alignItems:"flex-end",justifyContent:"space-between" }}>
        <div>
          <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:800,color:T.text,margin:"0 0 1px" }}>{title}</h3>
          {subtitle && <p style={{ fontSize:10.5,color:T.textS,margin:0,fontFamily:"Inter,sans-serif" }}>{subtitle}</p>}
        </div>
        <button style={{ fontSize:11.5,color:T.gold,background:"none",border:"none",cursor:"pointer",fontWeight:600,fontFamily:"Inter,sans-serif",display:"flex",alignItems:"center",gap:2 }}>See All ›</button>
      </div>
      <div className="hs" style={{ display:"flex",gap:10,overflowX:"auto",paddingLeft:14,paddingRight:14,scrollSnapType:"x mandatory" }}>
        {items.map((item,i)=>{
          const qty = cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
          return <div key={item._id} style={{ flexShrink:0,width:154,scrollSnapAlign:"start" }}><ItemCard item={item} qty={qty} isFav={favs.has(item._id)} onFav={()=>onFav(item._id)} onTap={()=>onTap(item)} delay={i*0.055}/></div>;
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// COMPACT HORIZONTAL ROW
// ════════════════════════════════════════════════
function CompactRow({ title, items, cart, onTap }: { title:string; items:MenuItem[]; cart:ECI[]; onTap:(i:MenuItem)=>void }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ padding:"0 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:800,color:T.text,margin:0 }}>{title}</h3>
        <button style={{ fontSize:11.5,color:T.gold,background:"none",border:"none",cursor:"pointer",fontWeight:600,fontFamily:"Inter,sans-serif" }}>See All ›</button>
      </div>
      <div className="hs" style={{ display:"flex",gap:9,overflowX:"auto",paddingLeft:14,paddingRight:14 }}>
        {items.slice(0,7).map((item,i) => {
          const qty = cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
          return (
            <div key={item._id} style={{ flexShrink:0,width:155,background:CARD_BG,borderRadius:14,border:`1px solid ${qty>0?T.gold:T.glB}`,overflow:"hidden",cursor:item.isAvailable?"pointer":"not-allowed",animation:`fadeUp 0.38s ${i*0.06}s ease both`,boxShadow:qty>0?`0 0 14px ${T.goldGl}`:"none" }} onClick={()=>item.isAvailable&&onTap(item)}>
              <div style={{ display:"flex",gap:9,padding:"9px 11px",alignItems:"center" }}>
                <div style={{ width:48,height:48,borderRadius:11,overflow:"hidden",flexShrink:0,background:`linear-gradient(135deg,${T.bg4},${T.bg3})` }}>
                  {item.imageUrl && <img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} loading="lazy"/>}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:13.5,fontWeight:600,color:T.text,margin:"0 0 1px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{item.name}</p>
                  <p style={{ fontSize:9,color:T.textS,margin:"0 0 4px",lineHeight:1.3,fontFamily:"Inter,sans-serif",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{item.description||""}</p>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                    <span style={{ fontFamily:"'DM Mono',monospace",fontSize:12.5,color:T.gold }}>₹{item.price}</span>
                    <button onClick={e=>{e.stopPropagation();if(item.isAvailable)onTap(item);}} className="tap" style={{ width:24,height:24,borderRadius:"50%",border:`1.5px solid ${T.gold}`,background:qty>0?GG:"transparent",color:qty>0?T.bg:T.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,transition:"all 0.18s ease" }}>+</button>
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
function PromoBanner({ onTap }: { onTap: ()=>void }) {
  return (
    <div style={{ margin:"0 14px 22px" }}>
      <div style={{ background:`linear-gradient(145deg,#2C1A08,#1A0D04)`,borderRadius:18,padding:18,position:"relative",overflow:"hidden",border:`1px solid ${T.gold}25`,boxShadow:`0 8px 28px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.04)` }}>
        <div style={{ position:"absolute",right:-12,top:"50%",transform:"translateY(-50%)",width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle,${T.gold}1E,transparent)`,pointerEvents:"none" }}/>
        <div style={{ position:"absolute",right:14,bottom:0,fontSize:40,opacity:0.15,pointerEvents:"none" }}>☕</div>
        <p style={{ fontSize:9,color:T.gold,fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",margin:"0 0 3px",fontFamily:"Inter,sans-serif" }}>Special For You</p>
        <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:T.gold,margin:"0 0 4px",lineHeight:1 }}>Flat 20% Off</h3>
        <p style={{ fontSize:11.5,color:"rgba(240,232,216,0.55)",margin:"0 0 14px",fontFamily:"Inter,sans-serif" }}>on all beverages this evening!</p>
        <button onClick={onTap} className="tap" style={{ display:"flex",alignItems:"center",gap:6,background:"none",border:`1.5px solid ${T.gold}65`,borderRadius:99,padding:"7px 16px",color:T.gold,fontSize:11.5,fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif" }}>Order Now <span style={{ fontSize:15 }}>›</span></button>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════
// PRODUCT DETAIL MODAL
// ════════════════════════════════════════════════
function ProductModal({ item, open, onClose, onAdd }: { item:MenuItem|null; open:boolean; onClose:()=>void; onAdd:(i:MenuItem,qty:number,v:{groupName:string;selected:string[]}[],mod:number)=>void }) {
  const [qty, setQty] = useState(1);
  const [sel, setSel] = useState<Record<string,string[]>>({});
  const [note, setNote] = useState("");

  useEffect(() => {
    if (item) {
      setQty(1); setNote("");
      const d: Record<string,string[]> = {};
      item.variantGroups?.forEach(g => { const def=g.options.find(o=>o.isDefault); d[g.name]=def?[def.name]:g.required&&g.options.length?[g.options[0].name]:[]; });
      setSel(d);
    }
  }, [item]);

  if (!open || !item) return null;

  const toggle = (gn:string, on:string, ms:boolean) => setSel(prev => {
    const cur = prev[gn]||[];
    if (ms) return {...prev,[gn]:cur.includes(on)?cur.filter(n=>n!==on):[...cur,on]};
    return {...prev,[gn]:[on]};
  });

  let mod = 0;
  item.variantGroups?.forEach(g => (sel[g.name]||[]).forEach(n => { const o=g.options.find(o=>o.name===n); if(o) mod+=o.priceModifier; }));
  const total = (item.price+mod)*qty;
  const vs = Object.entries(sel).map(([gn,s])=>({groupName:gn,selected:s}));

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(22px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.bg1,width:"100%",maxWidth:480,maxHeight:"92dvh",borderRadius:"24px 24px 0 0",overflow:"hidden",display:"flex",flexDirection:"column",animation:"slideUp 0.38s cubic-bezier(0.32,0.72,0,1)",border:`1px solid ${T.glB}`,borderBottom:"none" }}>
        {/* Gold top bar */}
        <div style={{ height:3,background:GG,flexShrink:0 }}/>
        {/* Image */}
        <div style={{ position:"relative",height:230,overflow:"hidden",flexShrink:0,background:T.bg3 }}>
          {item.imageUrl?<img src={getHeroUrl(item.imageUrl)} alt={item.name} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:<div style={{ width:"100%",height:"100%",background:`linear-gradient(145deg,${T.bg4},${T.bg3})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:88 }}>☕</div>}
          <div style={{ position:"absolute",bottom:0,left:0,right:0,height:90,background:`linear-gradient(to top,${T.bg1},transparent)` }}/>
          <button onClick={onClose} style={{ position:"absolute",top:14,right:14,width:34,height:34,borderRadius:"50%",background:"rgba(0,0,0,0.7)",border:`1px solid ${T.glB}`,color:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,backdropFilter:"blur(8px)" }}>✕</button>
          <div style={{ position:"absolute",top:14,left:14,display:"flex",gap:5 }}>
            <span style={{ background:T.green,color:"white",fontSize:9,fontWeight:800,padding:"2.5px 9px",borderRadius:99 }}>🌿 VEG</span>
            {item.tags?.includes("bestseller")&&<GBadge>⭐ BESTSELLER</GBadge>}
          </div>
        </div>
        {/* Scrollable content */}
        <div style={{ flex:1,overflowY:"auto",padding:"18px 18px 0" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:800,color:T.text,margin:0,flex:1 }}>{item.name}</h2>
            <div style={{ display:"flex",alignItems:"center",gap:3,background:T.gl,padding:"4px 9px",borderRadius:99,flexShrink:0,marginLeft:10 }}>
              <span style={{ color:T.gold,fontSize:11 }}>★</span>
              <span style={{ fontSize:11.5,fontWeight:700,color:T.text,fontFamily:"'DM Mono',monospace" }}>{item.rating?.toFixed(1)||"4.5"}</span>
            </div>
          </div>
          {item.description&&<p style={{ fontSize:12.5,color:T.textS,margin:"0 0 16px",lineHeight:1.65,fontFamily:"Inter,sans-serif" }}>{item.description}</p>}

          {item.variantGroups?.map((g: VariantGroup) => (
            <div key={g.name} style={{ marginBottom:16 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9 }}>
                <h4 style={{ fontSize:11.5,fontWeight:700,color:T.text,margin:0,letterSpacing:"0.07em",textTransform:"uppercase",fontFamily:"Inter,sans-serif" }}>{g.name}</h4>
                {g.required&&<span style={{ background:`${T.red}1E`,color:T.red,fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:99 }}>Required</span>}
              </div>
              <div style={{ display:"grid",gridTemplateColumns:g.options.length>3?"1fr 1fr":`repeat(${g.options.length},1fr)`,gap:7 }}>
                {g.options.map(opt => {
                  const s = sel[g.name]?.includes(opt.name);
                  return (
                    <button key={opt.name} onClick={()=>toggle(g.name,opt.name,g.multiSelect)} className="tap"
                      style={{ padding:"10px 8px",background:s?`${T.gold}18`:T.gl,border:`1.5px solid ${s?T.gold:T.glB}`,borderRadius:11,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,boxShadow:s?`0 0 12px ${T.goldGl}`:"none",transition:"all 0.2s ease" }}>
                      <span style={{ fontWeight:700,fontSize:12.5,color:s?T.gold:T.text,fontFamily:"Inter,sans-serif" }}>{opt.name}</span>
                      {opt.priceModifier!==0&&<span style={{ fontSize:10.5,color:s?`${T.gold}88`:T.textS,fontFamily:"'DM Mono',monospace" }}>{opt.priceModifier>0?`+₹${opt.priceModifier}`:`-₹${Math.abs(opt.priceModifier)}`}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{ marginBottom:8 }}>
            <label style={{ fontSize:11,fontWeight:700,color:T.textD,letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"Inter,sans-serif" }}>Special Instructions (Optional)</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add any special instructions..." rows={2}
              style={{ width:"100%",padding:"10px 12px",borderRadius:11,border:`1px solid ${T.glB}`,background:T.gl,color:T.text,fontSize:13,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"Inter,sans-serif",lineHeight:1.5 }}/>
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding:"14px 18px 24px",borderTop:`1px solid ${T.glB}`,flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
            <span style={{ fontSize:11,color:T.textD,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",fontFamily:"Inter,sans-serif" }}>Quantity</span>
            <div style={{ display:"flex",alignItems:"center",background:T.gl,border:`1px solid ${T.glB}`,borderRadius:99 }}>
              <button onClick={()=>setQty(Math.max(1,qty-1))} style={{ width:42,height:42,background:"none",border:"none",color:T.gold,cursor:"pointer",fontSize:22 }}>−</button>
              <span style={{ minWidth:34,textAlign:"center",color:T.text,fontWeight:800,fontSize:17,fontFamily:"'DM Mono',monospace" }}>{qty}</span>
              <button onClick={()=>setQty(qty+1)} style={{ width:42,height:42,background:"none",border:"none",color:T.gold,cursor:"pointer",fontSize:22 }}>+</button>
            </div>
          </div>
          <button onClick={()=>{onAdd(item,qty,vs,mod);onClose();}} className="tap"
            style={{ width:"100%",background:GG,color:T.bg,border:"none",borderRadius:14,padding:"16px 22px",fontWeight:800,fontSize:15.5,cursor:"pointer",boxShadow:`0 8px 28px ${T.goldGl}`,display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:"Inter,sans-serif" }}>
            <span>Add to Cart</span>
            <span style={{ fontFamily:"'DM Mono',monospace",fontSize:16 }}>₹{total.toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════
// SCREEN 1: CART — exact photo match
// ════════════════════════════════════════════════
function CartScreen({ cart, onUpdateQty, onCheckout, discount, onDiscountChange, allItems, onAddMore }:
  { cart:ECI[]; onUpdateQty:(k:string,d:number)=>void; onCheckout:()=>void; discount:Disc|null; onDiscountChange:(d:Disc|null)=>void; allItems:MenuItem[]; onAddMore:(i:MenuItem)=>void }) {

  const [promo, setPromo] = useState(""); const [validating, setValidating] = useState(false); const [promoErr, setPromoErr] = useState("");
  const sub  = cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
  const disc = discount?.discount||0;
  const tax  = Math.max(0,sub-disc)*0.05;
  const total= Math.max(0,sub-disc)+tax;

  useEffect(()=>{
    if (!cart.length||discount?.type==="code"){if(!cart.length)onDiscountChange(null);return;}
    const items=cart.map(c=>({menuItemId:c.menuItemId,name:c.name,price:c.price+(c.totalPriceModifier||0),quantity:c.quantity}));
    const api=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
    fetch(`${api}/promotions/calculate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items,subtotal:sub})}).then(r=>r.json()).then(d=>{if(d.success&&d.data?.applied)onDiscountChange({...d.data.applied,type:"auto"});else if(discount?.type==="auto")onDiscountChange(null);}).catch(()=>{});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[cart.length,sub]);

  const applyCode = async () => {
    if (!promo.trim()) return; setValidating(true); setPromoErr("");
    try {
      const items=cart.map(c=>({menuItemId:c.menuItemId,name:c.name,price:c.price+(c.totalPriceModifier||0),quantity:c.quantity}));
      const api=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
      const res=await fetch(`${api}/promotions/codes/validate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:promo.trim(),items,subtotal:sub})});
      const d=await res.json();
      if(!d.success){setPromoErr(d.message||"Invalid code");return;}
      onDiscountChange({...d.data,type:"code",code:d.data.code}); setPromo("");
    } catch(e:unknown){setPromoErr(e instanceof Error?e.message:"Failed");}
    finally{setValidating(false);}
  };

  const suggs = allItems.filter(i=>i.isAvailable&&!cart.find(c=>c.menuItemId===i._id)).slice(0,6);

  return (
    <div style={{ minHeight:"100dvh", background:T.bg }}>
      {/* Header */}
      <div style={{ padding:"14px 16px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${T.glB}` }}>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:800, color:T.text, margin:"0 0 1px" }}>Your Cart</h2>
          <p style={{ fontSize:11.5, color:T.textS, margin:0, fontFamily:"Inter,sans-serif" }}>{cart.reduce((s,i)=>s+i.quantity,0)} Items</p>
        </div>
        <button style={{ width:32,height:32,borderRadius:9,background:T.gl,border:`1px solid ${T.glB}`,color:T.textS,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>🗑️</button>
      </div>

      <div style={{ padding:"0 0 150px" }}>
        {/* Savings banner — exact photo: green pill with "You are saving ₹40 / YAY! Coupons applied" */}
        {disc>0 && (
          <div style={{ margin:"12px 14px", background:`linear-gradient(135deg,${T.green}18,${T.green}0A)`, borderRadius:12, padding:"11px 14px 11px 11px", border:`1px solid ${T.green}28`, display:"flex", alignItems:"center", gap:10, animation:"fadeUp 0.3s ease" }}>
            <div style={{ width:32,height:32,borderRadius:9,background:`${T.green}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>🏷️</div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:12,fontWeight:700,color:T.green,margin:"0 0 0.5px",fontFamily:"Inter,sans-serif" }}>You are saving ₹{disc}</p>
              <p style={{ fontSize:10.5,color:T.textS,margin:0,fontFamily:"Inter,sans-serif" }}>YAY! {discount?.type==="code"?`Code "${discount.code}" applied`:"Coupons applied"}</p>
            </div>
            <span style={{ fontSize:16, color:T.gold }}>›</span>
          </div>
        )}

        {/* Cart items — each with image, name, variants, price, qty controls */}
        <div style={{ padding:"10px 14px 0" }}>
          {cart.map((item, idx) => (
            <div key={item.menuItemId+JSON.stringify(item.variants)} style={{ background:CARD_BG, borderRadius:14, padding:"11px 13px", marginBottom:9, border:`1px solid ${T.glB}`, display:"flex", gap:11, alignItems:"center", animation:`fadeUp 0.3s ${idx*0.05}s ease both` }}>
              {/* Image */}
              <div style={{ flexShrink:0 }}>
                {item.imageUrl
                  ? <img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ width:58,height:58,borderRadius:11,objectFit:"cover" }}/>
                  : <div style={{ width:58,height:58,borderRadius:11,background:`linear-gradient(135deg,${T.bg4},${T.bg3})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>☕</div>
                }
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:16,color:T.text,margin:"0 0 2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{item.name}</p>
                {/* Variants row — e.g. "Regular · Regular Milk" */}
                {item.variants?.some(v=>v.selected.length>0) && (
                  <p style={{ fontSize:10,color:T.textS,margin:"0 0 3px",fontFamily:"Inter,sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                    {item.variants?.flatMap(v=>v.selected).join(" · ")}
                  </p>
                )}
                <p style={{ fontFamily:"'DM Mono',monospace",fontSize:15,color:T.gold,margin:0,fontWeight:500 }}>₹{((item.price+(item.totalPriceModifier||0))*item.quantity).toFixed(0)}</p>
              </div>
              {/* Qty controls — exact photo: − 1 + */}
              <div style={{ display:"flex",alignItems:"center",background:T.gl,border:`1px solid ${T.glB}`,borderRadius:99,flexShrink:0 }}>
                <button onClick={()=>onUpdateQty(item.menuItemId+JSON.stringify(item.variants),-1)} style={{ width:30,height:30,background:"none",border:"none",color:T.gold,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>−</button>
                <span style={{ fontWeight:800,color:T.text,fontSize:13.5,minWidth:18,textAlign:"center",fontFamily:"'DM Mono',monospace" }}>{item.quantity}</span>
                <button onClick={()=>onUpdateQty(item.menuItemId+JSON.stringify(item.variants),1)} style={{ width:30,height:30,background:"none",border:"none",color:T.gold,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Add more from your favorites — small circles row */}
        {suggs.length>0 && (
          <div style={{ padding:"10px 0 2px" }}>
            <p style={{ fontSize:12.5,fontWeight:700,color:T.text,margin:"0 0 10px",padding:"0 14px",fontFamily:"Inter,sans-serif" }}>Add more from your favorites</p>
            <div className="hs" style={{ display:"flex",gap:10,overflowX:"auto",paddingLeft:14,paddingRight:14 }}>
              {suggs.map(item => (
                <div key={item._id} style={{ flexShrink:0,width:104,textAlign:"center",animation:"fadeUp 0.35s ease" }}>
                  <div style={{ width:76,height:76,borderRadius:13,overflow:"hidden",margin:"0 auto 5px",background:`linear-gradient(135deg,${T.bg4},${T.bg3})` }}>
                    {item.imageUrl&&<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} loading="lazy"/>}
                  </div>
                  <p style={{ fontSize:10.5,fontWeight:600,color:T.text,margin:"0 0 1.5px",fontFamily:"Inter,sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{item.name}</p>
                  <p style={{ fontSize:10.5,color:T.gold,margin:"0 0 4px",fontFamily:"'DM Mono',monospace" }}>₹{item.price}</p>
                  <button onClick={()=>onAddMore(item)} className="tap" style={{ width:24,height:24,borderRadius:"50%",border:`1.5px solid ${T.gold}`,background:"transparent",color:T.gold,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,margin:"0 auto" }}>+</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promo code input */}
        {(!discount||discount.type==="auto") && (
          <div style={{ margin:"10px 14px 0",background:CARD_BG,borderRadius:13,padding:13,border:`1px dashed ${T.glB2}` }}>
            <p style={{ fontSize:10,fontWeight:700,color:T.textD,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 8px",fontFamily:"Inter,sans-serif" }}>Promo Code</p>
            <div style={{ display:"flex",gap:7 }}>
              <input value={promo} onChange={e=>{setPromo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""));setPromoErr("");}} placeholder="Enter code..." style={{ flex:1,padding:"9px 12px",borderRadius:9,border:`1px solid ${promoErr?T.red:T.glB}`,background:T.gl,color:T.text,fontSize:13.5,outline:"none",fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em" }}/>
              <button onClick={applyCode} disabled={!promo.trim()||validating} className="tap" style={{ padding:"9px 16px",borderRadius:9,background:promo.trim()?GG:T.gl,color:promo.trim()?T.bg:T.textD,border:"none",fontWeight:800,fontSize:11.5,cursor:promo.trim()?"pointer":"not-allowed",fontFamily:"Inter,sans-serif",boxShadow:promo.trim()?`0 3px 12px ${T.goldGl}`:"none" }}>{validating?"...":"Apply"}</button>
            </div>
            {promoErr && <p style={{ fontSize:11,color:T.red,margin:"5px 0 0",fontWeight:700,fontFamily:"Inter,sans-serif" }}>⚠ {promoErr}</p>}
          </div>
        )}

        {/* Bill summary — exact photo: Subtotal / Discount / Total */}
        <div style={{ margin:"10px 14px 0",background:CARD_BG,borderRadius:14,padding:14,border:`1px solid ${T.glB}` }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:7 }}>
            <span style={{ fontSize:13,color:T.textS,fontFamily:"Inter,sans-serif" }}>Subtotal</span>
            <span style={{ fontSize:13,color:T.textS,fontFamily:"'DM Mono',monospace" }}>₹{sub.toFixed(0)}</span>
          </div>
          {disc>0 && <div style={{ display:"flex",justifyContent:"space-between",marginBottom:7 }}>
            <span style={{ fontSize:13,color:T.green,fontFamily:"Inter,sans-serif" }}>Discount</span>
            <span style={{ fontSize:13,color:T.green,fontFamily:"'DM Mono',monospace" }}>-₹{disc.toFixed(0)}</span>
          </div>}
          <HR/>
          <div style={{ display:"flex",justifyContent:"space-between",paddingTop:8 }}>
            <span style={{ fontSize:16,fontWeight:700,color:T.text,fontFamily:"Inter,sans-serif" }}>Total</span>
            <span style={{ fontSize:22,fontWeight:900,color:T.text,fontFamily:"'DM Mono',monospace" }}>₹{(sub-disc).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,padding:"12px 14px 28px",background:`linear-gradient(to top,${T.bg} 65%,transparent)`,zIndex:40 }}>
        <button onClick={onCheckout} className="tap"
          style={{ width:"100%",padding:"17px",borderRadius:14,border:"none",background:GG,color:T.bg,fontWeight:800,fontSize:16,cursor:"pointer",fontFamily:"Inter,sans-serif",boxShadow:`0 8px 28px ${T.goldGl}`,display:"flex",alignItems:"center",justifyContent:"center",gap:10 }}>
          Proceed to Checkout <span style={{ fontSize:20 }}>→</span>
        </button>
        <p style={{ textAlign:"center",fontSize:11,color:T.textD,margin:"9px 0 0",fontFamily:"Inter,sans-serif",cursor:"pointer" }}>Continue Shopping</p>
        {/* Trust badges */}
        <div style={{ display:"flex",justifyContent:"center",gap:18,marginTop:8 }}>
          {["🔒 Secure Checkout","✅ Best Quality","⚡ On-time Served"].map(t=><span key={t} style={{ fontSize:9.5,color:T.textD,fontFamily:"Inter,sans-serif" }}>{t}</span>)}
        </div>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════
// SCREEN 2: CHECKOUT — exact photo match
// ════════════════════════════════════════════════
function CheckoutScreen({ cart, table, discount, onBack, onPay, isPlacing }:
  { cart:ECI[]; table:Table|null; discount:Disc|null; onBack:()=>void; onPay:(method:string,tip:number,note:string)=>void; isPlacing:boolean }) {

  const [method, setMethod] = useState("upi");
  const [tip,    setTip   ] = useState(20);  // photo shows ₹20 selected
  const [note,   setNote  ] = useState("");

  const sub  = cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
  const disc = discount?.discount||0;
  const tax  = Math.max(0,sub-disc)*0.05;
  const total= Math.max(0,sub-disc)+tax+tip;

  const METHODS = [
    { id:"upi",    icon:"📱", name:"UPI",               sub:"Google Pay, PhonePe..." },
    { id:"card",   icon:"💳", name:"Credit / Debit Card",sub:"Visa, Mastercard, RuPay" },
    { id:"wallet", icon:"👛", name:"Wallets",             sub:"Paytm, Amazon Pay..." },
    { id:"cash",   icon:"💵", name:"Cash on Delivery",    sub:"Pay at the counter" },
  ];

  return (
    <div style={{ minHeight:"100dvh", background:T.bg }}>
      {/* Header */}
      <div style={{ padding:"14px 16px 12px", display:"flex", alignItems:"center", gap:12, borderBottom:`1px solid ${T.glB}` }}>
        <button onClick={onBack} style={{ width:34,height:34,borderRadius:9,background:T.gl,border:`1px solid ${T.glB}`,color:T.text,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17 }}>←</button>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:800, color:T.text, margin:"0 0 1px" }}>Checkout</h2>
          <p style={{ fontSize:11, color:T.textS, margin:0, fontFamily:"Inter,sans-serif" }}>Step 1 of 3</p>
        </div>
      </div>

      {/* Progress bar — 3 dots, first filled gold */}
      <div style={{ position:"relative", height:5, background:T.bg3, margin:"0" }}>
        <div style={{ position:"absolute",left:0,top:0,height:"100%",width:"33%",background:GG,borderRadius:99,transition:"width 0.5s ease" }}/>
        {[0,1,2].map(i=>(
          <div key={i} style={{ position:"absolute",top:"50%",left:`${i*50}%`,transform:"translate(-50%,-50%)",width:11,height:11,borderRadius:"50%",background:i===0?GG:T.bg3,border:`2px solid ${i===0?T.gold:T.glB2}`,transition:"all 0.4s ease" }}/>
        ))}
      </div>

      <div style={{ padding:"16px 14px 150px" }}>
        {/* Table selection */}
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:11.5,fontWeight:700,color:T.textS,margin:"0 0 9px",fontFamily:"Inter,sans-serif" }}>Where are we serving?</p>
          <div style={{ background:CARD_BG,borderRadius:13,padding:"12px 15px",border:`1px solid ${T.glB}`,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div style={{ display:"flex",alignItems:"center",gap:9 }}>
              <span style={{ fontSize:19 }}>🪑</span>
              <span style={{ fontSize:14.5,fontWeight:700,color:T.text,fontFamily:"Inter,sans-serif" }}>Table {table?.tableNumber||"?"}</span>
            </div>
            <button style={{ background:T.gl,border:`1px solid ${T.glB}`,borderRadius:8,padding:"5px 12px",color:T.gold,fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif" }}>Change</button>
          </div>
        </div>

        {/* Special instructions */}
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:11.5,fontWeight:700,color:T.textS,margin:"0 0 9px",fontFamily:"Inter,sans-serif" }}>
            Special Instructions <span style={{ color:T.textD,fontWeight:400 }}>(Optional)</span>
          </p>
          <div style={{ position:"relative" }}>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add any special instructions..." rows={2}
              style={{ width:"100%",padding:"11px 38px 11px 13px",borderRadius:12,border:`1px solid ${T.glB}`,background:CARD_BG,color:T.text,fontSize:13,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"Inter,sans-serif",lineHeight:1.5 }}/>
            <span style={{ position:"absolute",right:13,top:13,fontSize:14,color:T.textD }}>✏️</span>
          </div>
        </div>

        {/* Payment method grid — 2×2 */}
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:11.5,fontWeight:700,color:T.textS,margin:"0 0 9px",fontFamily:"Inter,sans-serif" }}>Payment Method</p>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9 }}>
            {METHODS.map(m => (
              <button key={m.id} onClick={()=>setMethod(m.id)} className="tap"
                style={{ background:method===m.id?`${T.gold}14`:CARD_BG,borderRadius:13,padding:"12px 13px",border:`1.5px solid ${method===m.id?T.gold:T.glB}`,cursor:"pointer",textAlign:"left",boxShadow:method===m.id?`0 0 16px ${T.goldGl}`:"none",transition:"all 0.22s ease" }}>
                <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:3 }}>
                  <span style={{ fontSize:17 }}>{m.icon}</span>
                  <span style={{ fontSize:12.5,fontWeight:700,color:method===m.id?T.gold:T.text,fontFamily:"Inter,sans-serif",flex:1 }}>{m.name}</span>
                  {m.id==="upi" && <span style={{ width:7,height:7,borderRadius:"50%",background:T.gold,display:"inline-block",marginLeft:"auto" }}/>}
                </div>
                <p style={{ fontSize:9.5,color:T.textS,margin:0,fontFamily:"Inter,sans-serif" }}>{m.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tip — ₹10 / ₹20 (selected) / ₹50 / Other */}
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:11.5,fontWeight:700,color:T.textS,margin:"0 0 9px",fontFamily:"Inter,sans-serif" }}>
            Add a tip for our baristas? <span style={{ color:T.textD,fontWeight:400,fontSize:10.5 }}>100% goes to our team 🙌</span>
          </p>
          <div style={{ display:"flex",gap:8 }}>
            {([10,20,50,null] as (number|null)[]).map((t,i) => (
              <button key={i} onClick={()=>setTip(t===null?0:(tip===t?0:t))} className="tap"
                style={{ flex:1,padding:"10px 6px",borderRadius:11,border:`1.5px solid ${tip===t&&t!==null?T.gold:T.glB}`,background:tip===t&&t!==null?`${T.gold}18`:T.gl,color:tip===t&&t!==null?T.gold:T.textS,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Mono',monospace",transition:"all 0.2s ease" }}>
                {t===null?"Other":`₹${t}`}
              </button>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div style={{ background:CARD_BG,borderRadius:14,padding:14,border:`1px solid ${T.glB}` }}>
          {[["Item Total",`₹${sub.toFixed(0)}`],...(tip>0?[["Tip",`₹${tip}`]]:[]),(["GST (5%)",`₹${tax.toFixed(0)}`] as [string,string])].map(([l,v],i)=>(
            <div key={i} style={{ display:"flex",justifyContent:"space-between",marginBottom:7 }}>
              <span style={{ fontSize:13,color:T.textS,fontFamily:"Inter,sans-serif" }}>{l}</span>
              <span style={{ fontSize:13,color:T.textS,fontFamily:"'DM Mono',monospace" }}>{v}</span>
            </div>
          ))}
          <HR/>
          <div style={{ display:"flex",justifyContent:"space-between",paddingTop:8 }}>
            <span style={{ fontSize:15,fontWeight:800,color:T.text,fontFamily:"Inter,sans-serif" }}>Total Payable</span>
            <span style={{ fontSize:24,fontWeight:900,color:T.text,fontFamily:"'DM Mono',monospace" }}>₹{total.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,padding:"12px 14px 28px",background:`linear-gradient(to top,${T.bg} 65%,transparent)`,zIndex:40 }}>
        <button onClick={()=>!isPlacing&&onPay(method,tip,note)} className="tap"
          style={{ width:"100%",padding:"17px",borderRadius:14,border:"none",background:isPlacing?T.bg3:GG,color:isPlacing?T.textD:T.bg,fontWeight:800,fontSize:16,cursor:isPlacing?"not-allowed":"pointer",fontFamily:"Inter,sans-serif",boxShadow:isPlacing?"none":`0 8px 28px ${T.goldGl}`,display:"flex",alignItems:"center",justifyContent:"center",gap:9,transition:"all 0.25s ease" }}>
          {isPlacing?<><Spinner s={18} c={T.textD}/>Placing Order...</>:<>🔒 Pay ₹{total.toFixed(0)} Securely</>}
        </button>
        <p style={{ textAlign:"center",fontSize:11,color:T.textD,margin:"9px 0 0",fontFamily:"Inter,sans-serif" }}>🛡️ Your payment is 100% secure</p>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════
// SCREEN 3: ORDER PLACED — exact photo match
// ════════════════════════════════════════════════
function OrderPlacedScreen({ order, onTrack, onHome }: { order:Order; onTrack:()=>void; onHome:()=>void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(()=>setShow(true), 300); return ()=>clearTimeout(t); }, []);

  const STEPS = [
    {icon:"☕",label:"Order\nReceived"},
    {icon:"🔥",label:"Brewing"},
    {icon:"✋",label:"Preparing"},
    {icon:"🍽️",label:"Ready to\nServe"},
  ];

  return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"28px 18px", position:"relative", overflow:"hidden" }}>
      {/* Dark radial background glow */}
      <div style={{ position:"absolute",inset:0,background:`radial-gradient(ellipse 75% 55% at 50% 38%,${T.gold}14 0%,transparent 70%)`,pointerEvents:"none" }}/>
      {/* Particles when shown */}
      {show && Array.from({length:14}).map((_,i) => (
        <div key={i} style={{ position:"absolute",width:i%2===0?7:5,height:i%2===0?7:5,borderRadius:"50%",background:i%3===0?T.gold:i%3===1?T.goldM:"rgba(200,146,42,0.45)",top:"38%",left:"50%",
          ["--dx" as string]:`${(Math.random()-0.5)*240}px`,["--dy" as string]:`${-Math.random()*220-40}px`,
          animation:`particleFly 1.3s ${i*0.08}s ease-out forwards`,pointerEvents:"none"}} />
      ))}

      <div style={{ textAlign:"center", zIndex:1, maxWidth:360, width:"100%" }}>
        {/* Glowing success ring — gold circle with white checkmark */}
        <div style={{ width:104,height:104,borderRadius:"50%",background:`radial-gradient(circle,${T.gold}28,${T.gold}0A)`,border:`3px solid ${T.gold}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 22px",animation:show?"ringIn 0.65s cubic-bezier(0.34,1.56,0.64,1) both":"none",boxShadow:show?`0 0 0 14px ${T.gold}0A, 0 0 44px ${T.gold}40`:"none" }}>
          <svg width={48} height={48} viewBox="0 0 48 48" fill="none">
            <path d="M11 24L21 34L37 15" stroke={T.gold} strokeWidth={3.8} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={85} strokeDashoffset={show?0:85} style={{ transition:"stroke-dashoffset 0.65s 0.3s ease" }}/>
          </svg>
        </div>

        {/* Title + subtitle */}
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,color:T.text,margin:"0 0 8px",lineHeight:1.05,animation:show?"fadeUp 0.5s 0.4s ease both":"none",opacity:show?1:0 }}>
          Order Placed!
        </h1>
        <p style={{ fontSize:14,color:T.textS,margin:"0 0 26px",lineHeight:1.65,fontFamily:"Inter,sans-serif",animation:show?"fadeUp 0.5s 0.5s ease both":"none",opacity:show?1:0 }}>
          We've received your order and<br/>it's being crafted with love.
        </p>

        {/* Order details card */}
        <div style={{ background:CARD_BG,borderRadius:18,padding:16,marginBottom:18,border:`1px solid ${T.glB}`,animation:show?"fadeUp 0.5s 0.6s ease both":"none",opacity:show?1:0,textAlign:"left" }}>
          {[
            ["Order ID",  `GB${order._id?.slice(-6).toUpperCase()}`],
            ["Order Time",`Today, ${new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}`],
            ["Delivering To",`Table ${order.tableNumber||"?"}`],
            ["Items",     `${order.items?.length||0} Items`],
            ["Total Paid",`₹${order.totalAmount?.toFixed(0)||"—"}`],
          ].map(([l,v]) => (
            <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${T.glB}` }}>
              <span style={{ fontSize:12,color:T.textS,fontFamily:"Inter,sans-serif" }}>{l}</span>
              <span style={{ fontSize:12,fontWeight:700,color:l==="Total Paid"?T.gold:T.text,fontFamily:l==="Order ID"||l==="Total Paid"?"'DM Mono',monospace":"Inter,sans-serif" }}>{v}</span>
            </div>
          ))}
          {/* Beans earned row */}
          <div style={{ marginTop:11,background:`${T.gold}0E`,borderRadius:10,padding:"9px 11px",display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:19 }}>⭐</span>
            <p style={{ fontSize:11.5,fontWeight:600,color:T.textS,margin:0,fontFamily:"Inter,sans-serif" }}>
              You will earn <strong style={{ color:T.gold }}>33 Beans</strong>
              <br/><span style={{ fontSize:10,color:T.textD }}>once this order is delivered.</span>
            </p>
          </div>
        </div>

        {/* What's Next? — 4 steps with connecting line */}
        <div style={{ marginBottom:22,animation:show?"fadeUp 0.5s 0.7s ease both":"none",opacity:show?1:0 }}>
          <p style={{ fontSize:11.5,fontWeight:700,color:T.textS,letterSpacing:"0.06em",textTransform:"uppercase",margin:"0 0 12px",fontFamily:"Inter,sans-serif" }}>What's Next?</p>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center" }}>
            {STEPS.map((step,i)=>(
              <div key={i} style={{ display:"flex",alignItems:"center" }}>
                <div style={{ textAlign:"center",width:58 }}>
                  <div style={{ width:38,height:38,borderRadius:"50%",background:i===0?GG:`${T.gold}1C`,border:`2px solid ${i===0?T.gold:T.glB2}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 5px",fontSize:17,boxShadow:i===0?`0 0 14px ${T.goldGl}`:"none" }}>{step.icon}</div>
                  <p style={{ fontSize:9,color:i===0?T.gold:T.textD,margin:0,fontFamily:"Inter,sans-serif",fontWeight:i===0?700:400,lineHeight:1.25,whiteSpace:"pre-line" }}>{step.label}</p>
                </div>
                {i<STEPS.length-1 && <div style={{ width:18,height:1.5,background:T.glB,flexShrink:0,marginBottom:16 }}/>}
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ animation:show?"fadeUp 0.5s 0.8s ease both":"none",opacity:show?1:0 }}>
          <button onClick={onTrack} className="tap" style={{ width:"100%",padding:"17px",borderRadius:14,border:"none",background:GG,color:T.bg,fontWeight:800,fontSize:16,cursor:"pointer",fontFamily:"Inter,sans-serif",boxShadow:`0 8px 28px ${T.goldGl}`,display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:14 }}>
            Track Order <span style={{ fontSize:20 }}>→</span>
          </button>
          <button onClick={onHome} style={{ background:"none",border:"none",color:T.textS,cursor:"pointer",fontSize:13,fontWeight:500,fontFamily:"Inter,sans-serif",display:"block",width:"100%",textAlign:"center" }}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// SCREEN 4: ORDER TRACKING — exact photo match
// ════════════════════════════════════════════════
function OrderTrackingScreen({ order, onReady }: { order:Order; onReady:()=>void }) {
  const STAGES = [
    { key:"received", label:"Order Received", icon:"✅" },
    { key:"brewing",  label:"Brewing",         icon:"🔥" },
    { key:"preparing",label:"Preparing",        icon:"👨‍🍳" },
    { key:"ready",    label:"Ready to Serve",   icon:"🍽️" },
  ];

  const getStage = (status:string) => {
    if (["open","kotSent"].includes(status)) return 0;
    if (status==="preparing") return 1;
    if (status==="ready")     return 2;
    if (status==="settled")   return 3;
    return 0;
  };
  const cur = getStage(order.status||"open");
  useEffect(()=>{ if(order.status==="settled") onReady(); },[order.status,onReady]);

  return (
    <div style={{ minHeight:"100dvh", background:T.bg }}>
      {/* Hero — coffee image/placeholder */}
      <div style={{ position:"relative", height:"42vw", maxHeight:220, overflow:"hidden", background:`linear-gradient(145deg,${T.bg3},#000)`, display:"flex",alignItems:"center",justifyContent:"center" }}>
        <span style={{ fontSize:80, animation:"float 2.8s ease-in-out infinite", filter:"drop-shadow(0 0 30px rgba(200,146,42,0.5))" }}>☕</span>
        <div style={{ position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 0%,rgba(8,5,1,0.9) 100%)" }}/>
        {/* Golden Beans logo overlay like photo */}
        <div style={{ position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",textAlign:"center" }}>
          <div style={{ width:42,height:42,borderRadius:"50%",background:`${T.gold}28`,border:`1.5px solid ${T.gold}55`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 4px",fontSize:19 }}>☕</div>
          <p style={{ fontSize:9.5,color:"rgba(200,146,42,0.7)",fontWeight:700,letterSpacing:"0.12em",fontFamily:"Inter,sans-serif",margin:0 }}>GOLDEN BEANS</p>
        </div>
      </div>

      <div style={{ padding:"18px 14px" }}>
        <p style={{ fontSize:12,color:T.textS,margin:"0 0 2px",fontFamily:"Inter,sans-serif" }}>Order ID · GB{order._id?.slice(-6).toUpperCase()}</p>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:800,color:T.text,margin:"0 0 20px" }}>Order Tracking</h2>

        {/* Brewing highlight card — shown when status = brewing */}
        {cur===1 && (
          <div style={{ background:`linear-gradient(145deg,#2C1A08,#1A0D04)`,borderRadius:16,padding:18,marginBottom:18,border:`1px solid ${T.gold}28`,textAlign:"center" }}>
            <div style={{ fontSize:34,marginBottom:7,filter:`drop-shadow(0 0 20px ${T.gold}80)`,animation:"float 2s ease-in-out infinite" }}>☕</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:T.gold,margin:"0 0 4px" }}>Brewing</h3>
            <p style={{ fontSize:12,color:T.textS,margin:"0 0 8px",fontFamily:"Inter,sans-serif" }}>Your coffee is brewing to perfection ☕</p>
            <p style={{ fontSize:12,color:T.textD,margin:0,fontFamily:"Inter,sans-serif" }}>Estimated time: <strong style={{ color:T.gold,fontFamily:"'DM Mono',monospace" }}>07 mins</strong></p>
          </div>
        )}

        {/* Timeline */}
        <div style={{ background:CARD_BG,borderRadius:16,padding:16,marginBottom:14,border:`1px solid ${T.glB}` }}>
          {STAGES.map((stage,i) => {
            const done   = i < cur;
            const active = i === cur;
            return (
              <div key={stage.key} style={{ display:"flex",alignItems:"center",gap:13,marginBottom:i<STAGES.length-1?14:0 }}>
                <div style={{ position:"relative",flexShrink:0 }}>
                  <div style={{ width:30,height:30,borderRadius:"50%",background:done?T.green:active?GG:T.bg3,border:`2px solid ${done?T.green:active?T.gold:T.glB2}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,boxShadow:active?`0 0 14px ${T.goldGl}`:"none",transition:"all 0.45s ease" }}>
                    {done?"✓":stage.icon}
                  </div>
                  {i<STAGES.length-1 && <div style={{ position:"absolute",left:"50%",top:"100%",transform:"translateX(-50%)",width:2,height:14,background:done?T.green:T.bg3,marginTop:2,transition:"background 0.45s ease" }}/>}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13.5,fontWeight:active?700:500,color:active?T.text:done?T.textS:T.textD,margin:0,fontFamily:"Inter,sans-serif" }}>{stage.label}</p>
                  <p style={{ fontSize:10.5,color:T.textD,margin:"1px 0 0",fontFamily:"Inter,sans-serif" }}>
                    {done ? new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : active?"In Progress":"Upcoming"}
                  </p>
                </div>
                {active && <div style={{ width:8,height:8,borderRadius:"50%",background:T.gold,animation:"pulse 1.4s ease-in-out infinite",flexShrink:0 }}/>}
              </div>
            );
          })}
        </div>

        {/* Buzz notification */}
        <div style={{ background:CARD_BG,borderRadius:13,padding:13,border:`1px solid ${T.glB}`,display:"flex",gap:11,alignItems:"center" }}>
          <span style={{ fontSize:21 }}>🔔</span>
          <p style={{ fontSize:12,color:T.textS,margin:0,fontFamily:"Inter,sans-serif",lineHeight:1.55 }}>
            You can relax,<br/><strong style={{ color:T.text }}>we'll buzz you when it's ready!</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// SCREEN 5: ORDER READY — exact photo match
// ════════════════════════════════════════════════
function OrderReadyScreen({ order, onRestart }: { order:Order|null; onRestart:()=>void }) {
  const [rating,  setRating ] = useState(0);
  const [done,    setDone   ] = useState(false);
  const [submitting,setSub  ] = useState(false);
  const [beanAnim,setBeanAnim]= useState(0);

  const EMOJIS = [
    { e:"😞",l:"Bad" }, { e:"😐",l:"Okay" }, { e:"🙂",l:"Good" }, { e:"😊",l:"Great" },
    { e:"🤩",l:"Amazing" },
  ];

  useEffect(() => {
    if (done) {
      let c=0;
      const iv=setInterval(()=>{ c+=2; setBeanAnim(Math.min(c,33)); if(c>=33)clearInterval(iv); },45);
      return ()=>clearInterval(iv);
    }
  }, [done]);

  const submitFeedback = async (r:number) => {
    setRating(r); setSub(true);
    try {
      const API="https://golden-beans-server.onrender.com/api";
      await fetch(`${API}/feedback/submit`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:localStorage.getItem("gb_settled_order_id")||order?._id||"unknown",tableId:localStorage.getItem("gb_settled_table")||"unknown",tableNumber:localStorage.getItem("gb_settled_table")||"unknown",rating:r,categories:{},comment:""})});
    } catch{}
    setSub(false); setDone(true);
  };

  return (
    <div style={{ minHeight:"100dvh",background:T.bg,position:"relative",overflow:"hidden" }}>
      {/* Background glow */}
      <div style={{ position:"absolute",inset:0,background:`radial-gradient(ellipse 72% 55% at 50% 28%,${T.gold}12 0%,transparent 68%)`,pointerEvents:"none" }}/>

      <div style={{ padding:"36px 18px 110px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",position:"relative",zIndex:1 }}>
        {/* Product image with gold glow ring */}
        <div style={{ position:"relative",marginBottom:24 }}>
          <div style={{ width:156,height:156,borderRadius:"50%",overflow:"hidden",border:`3px solid ${T.gold}60`,boxShadow:`0 0 0 14px ${T.gold}0C, 0 0 60px ${T.gold}2A`,animation:"goldGlow 2.2s ease-in-out infinite",background:CARD_BG,display:"flex",alignItems:"center",justifyContent:"center" }}>
            {order?.items?.[0] ? (
              <div style={{ fontSize:72,filter:`drop-shadow(0 0 20px ${T.gold}88)` }}>☕</div>
            ) : (
              <div style={{ fontSize:72,filter:`drop-shadow(0 0 20px ${T.gold}88)` }}>☕</div>
            )}
          </div>
          {/* Heart button top-right */}
          <button style={{ position:"absolute",top:6,right:6,width:30,height:30,borderRadius:"50%",background:CARD_BG,border:`1px solid ${T.glB}`,color:"rgba(239,68,68,0.55)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>🤍</button>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,color:T.gold,margin:"0 0 8px",lineHeight:1.15,animation:"fadeUp 0.55s ease" }}>
          Your Order is<br/>Ready!
        </h1>
        <p style={{ fontSize:13.5,color:T.textS,margin:"0 0 28px",fontFamily:"Inter,sans-serif",lineHeight:1.65 }}>
          Head to the counter and<br/>enjoy your perfect brew.
        </p>

        {/* Feedback section */}
        <div style={{ width:"100%",maxWidth:340,marginBottom:20 }}>
          <p style={{ fontSize:15.5,fontWeight:700,color:T.text,margin:"0 0 3px",fontFamily:"'Playfair Display',serif" }}>How was your experience?</p>
          <p style={{ fontSize:11.5,color:T.textS,margin:"0 0 14px",fontFamily:"Inter,sans-serif" }}>Your feedback helps us brew better ☕</p>
          {/* 5 emoji buttons — photo style */}
          <div style={{ display:"flex",justifyContent:"center",gap:9 }}>
            {EMOJIS.map((f,i) => (
              <button key={i} onClick={()=>!done&&!submitting&&submitFeedback(i+1)} disabled={done||submitting}
                style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:rating===i+1?`${T.gold}1A`:"none",border:`1.5px solid ${rating===i+1?T.gold:T.glB}`,borderRadius:13,padding:"9px 7px",cursor:done?"default":"pointer",transition:"all 0.22s ease",boxShadow:rating===i+1?`0 0 14px ${T.goldGl}`:"none",minWidth:50,
                  // Last one (Amazing) has special active look in photo
                  ...(i===4&&rating!==5?{border:`1.5px solid ${T.glB2}`}:{}) }}>
                <span style={{ fontSize:rating===i+1?27:21,transition:"font-size 0.22s ease",filter:done&&rating!==i+1?"grayscale(1) opacity(0.35)":"none" }}>{f.e}</span>
                <span style={{ fontSize:9,fontWeight:rating===i+1?800:500,color:rating===i+1?T.gold:T.textD,fontFamily:"Inter,sans-serif" }}>{f.l}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Beans earned — 2-column card */}
        {done && (
          <div style={{ width:"100%",maxWidth:340,background:CARD_BG,borderRadius:16,padding:14,marginBottom:18,border:`1px solid ${T.glB}`,animation:"fadeUp 0.5s ease",display:"flex" }}>
            <div style={{ flex:1,borderRight:`1px solid ${T.glB}`,paddingRight:14 }}>
              <p style={{ fontSize:10.5,color:T.textD,margin:"0 0 3px",fontFamily:"Inter,sans-serif" }}>You earned</p>
              <p style={{ fontSize:22,fontWeight:900,color:T.gold,margin:0,fontFamily:"'DM Mono',monospace",animation:"countUp 0.5s ease" }}>+{beanAnim} Beans</p>
            </div>
            <div style={{ flex:1,paddingLeft:14 }}>
              <p style={{ fontSize:10.5,color:T.textD,margin:"0 0 3px",fontFamily:"Inter,sans-serif" }}>Total Balance</p>
              <p style={{ fontSize:22,fontWeight:900,color:T.text,margin:"0 0 5px",fontFamily:"'DM Mono',monospace" }}>132 Beans</p>
              <div style={{ height:3.5,background:T.bg3,borderRadius:99,overflow:"hidden" }}>
                <div style={{ height:"100%",width:"34%",background:GG,borderRadius:99,transition:"width 1.2s ease" }}/>
              </div>
              <p style={{ fontSize:9,color:T.textD,margin:"3px 0 0",fontFamily:"Inter,sans-serif" }}>68 away from free coffee</p>
            </div>
          </div>
        )}

        {/* Order Again + Back */}
        <div style={{ width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:9 }}>
          <button onClick={onRestart} className="tap" style={{ width:"100%",padding:"16px",borderRadius:14,border:"none",background:GG,color:T.bg,fontWeight:800,fontSize:15.5,cursor:"pointer",fontFamily:"Inter,sans-serif",boxShadow:`0 8px 28px ${T.goldGl}`,display:"flex",alignItems:"center",justifyContent:"center",gap:9 }}>
            <span style={{ fontSize:17 }}>🔄</span> Order Again
          </button>
          <button onClick={onRestart} style={{ background:"none",border:"none",color:T.textS,cursor:"pointer",fontSize:13,fontWeight:500,fontFamily:"Inter,sans-serif",padding:"9px" }}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════
// TOP CANCEL BAR
// ════════════════════════════════════════════════
function TopCancelBar({ order, onCancelled }: { order:Order; onCancelled:()=>void }) {
  const placed = new Date(order.createdAt).getTime();
  const [s, setS] = useState(()=>Math.max(0,120-Math.floor((Date.now()-placed)/1000)));
  const [cancelling, setCancelling] = useState(false);
  useEffect(()=>{ const iv=setInterval(()=>setS(Math.max(0,120-Math.floor((Date.now()-placed)/1000))),1000); return()=>clearInterval(iv); },[placed]);
  if (s<=0) return null;
  const urgent = s<=30;
  const mins = Math.floor(s/60); const secs = s%60;
  const cancel = async () => {
    if (cancelling||!confirm(`Cancel order #${order.orderNumber}?`)) return;
    setCancelling(true);
    try { await orderApi.cancelOrder(order._id); localStorage.removeItem("gb_active_order"); onCancelled(); }
    catch { alert("Failed to cancel"); setCancelling(false); }
  };
  return (
    <div style={{ position:"sticky",top:0,zIndex:45,background:urgent?"linear-gradient(135deg,#7f1d1d,#b91c1c)":"linear-gradient(135deg,#0f3d2e,#166534)",borderBottom:`1px solid ${urgent?"#ef4444":T.gold}` }}>
      <div style={{ padding:"8px 14px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:9 }}>
          <div style={{ background:"rgba(255,255,255,0.12)",borderRadius:7,padding:"4px 9px",border:`1px solid ${urgent?"rgba(255,255,255,0.35)":T.gold}` }}>
            <span style={{ fontFamily:"'DM Mono',monospace",fontSize:12.5,color:"white",fontWeight:600 }}>{mins}:{String(secs).padStart(2,"0")}</span>
          </div>
          <p style={{ fontWeight:700,fontSize:11.5,color:"white",margin:0,fontFamily:"Inter,sans-serif" }}>{urgent?"⚠️ Last chance!":"Cancel within 2 min"}</p>
        </div>
        <button onClick={cancel} disabled={cancelling} style={{ background:"rgba(255,255,255,0.88)",color:urgent?"#b91c1c":"#166534",border:"none",borderRadius:7,padding:"5px 13px",fontWeight:800,fontSize:11,cursor:cancelling?"wait":"pointer",fontFamily:"Inter,sans-serif" }}>{cancelling?"...":"✕ CANCEL"}</button>
      </div>
      <div style={{ height:2,background:"rgba(0,0,0,0.22)" }}>
        <div style={{ height:"100%",width:`${(s/120)*100}%`,background:urgent?"linear-gradient(90deg,#fca5a5,white)":GG,transition:"width 1s linear" }}/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// FLOATING CART BAR — exact photo style
// ════════════════════════════════════════════════
function FloatingCartBar({ cart, discount, onView }: { cart:ECI[]; discount:Disc|null; onView:()=>void }) {
  const sub   = cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
  const disc  = discount?.discount||0;
  const total = (Math.max(0,sub-disc)*1.05).toFixed(0);
  const items = cart.reduce((s,i)=>s+i.quantity,0);
  const [bump,setBump] = useState(false);
  const prev = useRef(0);
  useEffect(()=>{ if(cart.length!==prev.current){setBump(true);setTimeout(()=>setBump(false),420);} prev.current=cart.length; },[cart.length]);
  if (!cart.length) return null;
  return (
    <div style={{ position:"fixed",bottom:74,left:12,right:12,zIndex:50,animation:"slideUp 0.45s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <button onClick={onView}
        style={{ width:"100%",background:T.bg2,borderRadius:16,padding:"11px 14px",border:`1px solid ${T.gold}40`,boxShadow:`0 8px 32px rgba(0,0,0,0.75),0 0 0 1px ${T.gold}14,0 0 22px ${T.goldGl}`,backdropFilter:"blur(18px)",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transform:bump?"scale(1.025)":"scale(1)",transition:"transform 0.28s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:11 }}>
          <div style={{ position:"relative" }}>
            <div style={{ width:42,height:42,borderRadius:12,background:`${T.gold}1E`,border:`1.5px solid ${T.gold}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19 }}>🛒</div>
            <div style={{ position:"absolute",top:-6,right:-6,width:19,height:19,borderRadius:"50%",background:GG,color:T.bg,fontSize:9.5,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${T.bg2}`,animation:bump?"cartBump 0.42s ease":"none" }}>{items}</div>
          </div>
          <div style={{ textAlign:"left" }}>
            <p style={{ fontWeight:800,fontSize:16,color:T.text,margin:0,fontFamily:"Inter,sans-serif" }}>₹{total}</p>
            {disc>0 && <p style={{ fontSize:9.5,color:T.green,margin:0,fontWeight:700,fontFamily:"Inter,sans-serif" }}>You Save ₹{disc} 🎉</p>}
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:7,background:GG,borderRadius:11,padding:"9px 17px",boxShadow:`0 4px 14px ${T.goldGl}` }}>
          <span style={{ fontWeight:900,fontSize:13.5,color:T.bg,fontFamily:"Inter,sans-serif" }}>View Cart</span>
          <span style={{ color:T.bg,fontSize:17 }}>›</span>
        </div>
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════
// BOTTOM NAV — 5 tabs
// ════════════════════════════════════════════════
function BottomNav({ active, onChange, orderBadge, cartBadge }:
  { active:Tab; onChange:(t:Tab)=>void; orderBadge:boolean; cartBadge:number }) {
  const TABS: { id:Tab; icon:string; label:string }[] = [
    { id:"home",    icon:"🏠", label:"Home"    },
    { id:"menu",    icon:"🍽️", label:"Menu"    },
    { id:"orders",  icon:"📋", label:"Orders"  },
    { id:"cart",    icon:"🛒", label:"Cart"    },
    { id:"profile", icon:"👤", label:"Profile" },
  ];
  return (
    <nav style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:40,background:"rgba(8,5,1,0.97)",backdropFilter:"blur(22px)",borderTop:`1px solid ${T.glB}`,paddingTop:7,paddingBottom:"max(9px,env(safe-area-inset-bottom))" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-around",maxWidth:480,margin:"0 auto",padding:"0 6px" }}>
        {TABS.map(tab => {
          const isA = active===tab.id;
          return (
            <button key={tab.id} onClick={()=>onChange(tab.id)}
              style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"3px 12px",position:"relative",flex:1 }}>
              {isA && <div style={{ position:"absolute",top:-7,left:"50%",transform:"translateX(-50%)",width:22,height:2.5,background:GG,borderRadius:99 }}/>}
              <span style={{ fontSize:21,transition:"all 0.22s ease",transform:isA?"scale(1.16)":"scale(1)",filter:isA?"none":"grayscale(0.85) opacity(0.38)" }}>{tab.icon}</span>
              <span style={{ fontSize:9,fontWeight:isA?700:500,color:isA?T.gold:T.textD,fontFamily:"Inter,sans-serif",letterSpacing:"0.02em",transition:"color 0.2s ease" }}>{tab.label}</span>
              {/* Order badge */}
              {tab.id==="orders" && orderBadge && (
                <div style={{ position:"absolute",top:1,right:8,width:8,height:8,borderRadius:"50%",background:GG,border:`1.5px solid ${T.bg}` }}/>
              )}
              {/* Cart count badge */}
              {tab.id==="cart" && cartBadge>0 && (
                <div style={{ position:"absolute",top:1,right:8,minWidth:17,height:17,borderRadius:99,background:GG,color:T.bg,fontSize:9.5,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`1.5px solid ${T.bg}`,fontFamily:"'DM Mono',monospace",animation:"cartBump 0.4s ease" }}>{cartBadge}</div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
// ════════════════════════════════════════════════
// CINEMATIC HOME PAGE — inline component
// ════════════════════════════════════════════════

const D = {
  void:"#030201",deep:"#070604",dark:"#0D0B08",surface:"#13110D",raised:"#1A1710",
  goldDeep:"#7A5010",gold:"#C8922A",goldMid:"#E8B84B",goldLt:"#F5CC6A",
  glow0:"rgba(200,146,42,0)",glow10:"rgba(200,146,42,0.10)",glow20:"rgba(200,146,42,0.20)",
  glow35:"rgba(200,146,42,0.35)",glow55:"rgba(200,146,42,0.55)",
  ink:"#F5EDD8",inkDim:"#B8A888",inkMute:"#7A6B50",inkGhost:"#3D3428",
  glassWk:"rgba(255,255,255,0.025)",glassMd:"rgba(255,255,255,0.05)",glassBd:"rgba(255,255,255,0.06)",
};
const DG  = `linear-gradient(135deg,${D.gold} 0%,${D.goldMid} 55%,${D.goldLt} 100%)`;
const DGV = `linear-gradient(180deg,${D.gold} 0%,${D.goldMid} 100%)`;
const DSP = "cubic-bezier(0.34,1.56,0.64,1)";
const DEA = "cubic-bezier(0.25,0.46,0.45,0.94)";

const CINEMA_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@300;400;500&display=swap');
@keyframes kBurns{from{transform:scale(1) translate(0%,0%)}to{transform:scale(1.09) translate(-1%,-0.5%)}}
@keyframes breathGold{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.72;transform:scale(1.07)}}
@keyframes smokeUp{0%{opacity:0;transform:translateY(0) scaleX(1)}35%{opacity:.6}100%{opacity:0;transform:translateY(-54px) scaleX(2.2)}}
@keyframes fadeRise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@keyframes staggerIn{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes ripOut{from{transform:scale(.6);opacity:.8}to{transform:scale(2.6);opacity:0}}
@keyframes lineSweep{from{transform:translateX(-100%)}to{transform:translateX(500%)}}
@keyframes cartBump{0%{transform:scale(1)}30%{transform:scale(1.55)}65%{transform:scale(.88)}100%{transform:scale(1)}}
@keyframes skGlow{0%{background-position:200% center}100%{background-position:-200% center}}
.csk{background:linear-gradient(90deg,#13110D 25%,#1A1710 50%,#13110D 75%);background-size:200% 100%;animation:skGlow 2s ease-in-out infinite;}
`;

// ── Cinematic Hero ──
function CHero({items,cart,onTap,onExplore,greeting,name}:{items:MenuItem[];cart:ECI[];onTap:(i:MenuItem)=>void;onExplore:()=>void;greeting:string;name?:string}) {
  const [active,setActive]=useState(0);
  const [drag,setDrag]=useState(0);
  const [isDrag,setIsDrag]=useState(false);
  const [shown,setShown]=useState(false);
  const sx=useRef(0); const tmr=useRef<NodeJS.Timeout|null>(null);
  const slides=items.filter(i=>i.isAvailable).slice(0,5);
  const next=useCallback(()=>setActive(p=>(p+1)%slides.length),[slides.length]);
  const prev=useCallback(()=>setActive(p=>(p-1+slides.length)%slides.length),[slides.length]);
  useEffect(()=>{const t=setTimeout(()=>setShown(true),60);return()=>clearTimeout(t);},[]);
  useEffect(()=>{if(isDrag||!slides.length)return;tmr.current=setInterval(next,5400);return()=>{if(tmr.current)clearInterval(tmr.current);};},[next,isDrag,active,slides.length]);
  if(!slides.length)return null;
  const s=slides[active];
  const qty=cart.filter(c=>c.menuItemId===s._id).reduce((t,c)=>t+c.quantity,0);
  return(
    <div style={{position:"relative",width:"100%",height:"100svh",maxHeight:680,minHeight:460,overflow:"hidden",background:D.void,userSelect:"none"}}
      onTouchStart={e=>{setIsDrag(true);sx.current=e.touches[0].clientX;if(tmr.current)clearInterval(tmr.current);}}
      onTouchMove={e=>{if(isDrag)setDrag(e.touches[0].clientX-sx.current);}}
      onTouchEnd={()=>{if(Math.abs(drag)>46)drag<0?next():prev();setIsDrag(false);setDrag(0);}}
      onMouseDown={e=>{setIsDrag(true);sx.current=e.clientX;if(tmr.current)clearInterval(tmr.current);}}
      onMouseMove={e=>{if(isDrag)setDrag(e.clientX-sx.current);}}
      onMouseUp={()=>{if(Math.abs(drag)>46)drag<0?next():prev();setIsDrag(false);setDrag(0);}}>
      {/* Images */}
      {slides.map((sl,i)=>(
        <div key={sl._id} style={{position:"absolute",inset:"-5%",transition:isDrag?"none":`all 0.75s ${DEA}`,opacity:i===active?1:0,transform:i===active?`translateX(${drag*.4}px) scale(1)`:i<active?`translateX(calc(-110% + ${drag*.4}px)) scale(.96)`:`translateX(calc(110% + ${drag*.4}px)) scale(.96)`,zIndex:i===active?1:0}}>
          {sl.imageUrl?<img src={getHeroUrl(sl.imageUrl)} alt={sl.name} style={{width:"100%",height:"100%",objectFit:"cover",animation:i===active?"kBurns 10s ease-out forwards":"none"}}/>:<div style={{width:"100%",height:"100%",background:`radial-gradient(ellipse 80% 80% at 60% 40%,#3D2010 0%,#1A0E06 40%,${D.void} 100%)`}}/>}
        </div>
      ))}
      {/* Vignettes */}
      <div style={{position:"absolute",inset:0,zIndex:3,pointerEvents:"none",background:`linear-gradient(to top,${D.void} 0%,rgba(7,6,4,.9) 16%,rgba(7,6,4,.6) 34%,rgba(7,6,4,.22) 54%,transparent 72%)`}}/>
      <div style={{position:"absolute",inset:0,zIndex:3,pointerEvents:"none",background:`linear-gradient(to right,rgba(7,6,4,.88) 0%,rgba(7,6,4,.5) 38%,transparent 68%)`}}/>
      <div style={{position:"absolute",top:"-10%",right:"-5%",width:"55%",height:"60%",zIndex:2,pointerEvents:"none",background:`radial-gradient(ellipse at top right,${D.glow10} 0%,transparent 65%)`,animation:"breathGold 6s ease-in-out infinite"}}/>
      {/* Steam */}
      {[0,1,2,3].map(i=><div key={i} style={{position:"absolute",zIndex:4,pointerEvents:"none",bottom:"28%",left:`${36+i*6}%`,width:5+i*1.5,height:28+i*8,borderRadius:99,background:`linear-gradient(to top,rgba(245,204,106,.32),transparent)`,animation:`smokeUp ${2.4+i*.5}s ${i*.65}s ease-out infinite`,filter:"blur(2px)",opacity:0}}/>)}
      {/* Scan lines */}
      <div style={{position:"absolute",inset:0,zIndex:4,pointerEvents:"none",opacity:.018,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(255,255,255,.05) 1px,rgba(255,255,255,.05) 2px)",backgroundSize:"100% 4px"}}/>
      {/* Content */}
      <div style={{position:"absolute",inset:0,zIndex:5,display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"0 22px 38px"}}>
        {shown&&<div style={{marginBottom:6,animation:`fadeRise 0.55s 0.08s ${DEA} both`}}><span style={{fontSize:11.5,color:D.goldMid,fontFamily:"'DM Sans',sans-serif",fontWeight:500,letterSpacing:".12em",textTransform:"uppercase"}}>{greeting}{name?`, ${name}`:""} ✦</span></div>}
        {shown&&<div style={{marginBottom:15,animation:`fadeRise 0.65s 0.18s ${DEA} both`}}><h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(36px,11vw,56px)",fontWeight:300,color:D.ink,lineHeight:1.06,margin:0,letterSpacing:"-.01em"}}>Brewed to<br/><em style={{fontStyle:"italic",fontWeight:600,color:D.goldLt}}>perfection,</em><br/><span style={{fontWeight:300}}>just for you.</span></h1></div>}
        {shown&&<div style={{marginBottom:22,animation:`fadeRise 0.65s 0.3s ${DEA} both`}}><p style={{fontSize:12.5,color:D.inkDim,fontFamily:"'DM Sans',sans-serif",fontWeight:400,margin:0,lineHeight:1.5,maxWidth:230}}>{s.description||"Handcrafted with rare single-origin beans."}</p></div>}
        {shown&&<div style={{display:"flex",gap:12,alignItems:"center",animation:`fadeRise 0.65s 0.42s ${DEA} both`}}>
          <button onClick={onExplore} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(200,146,42,0.16)",backdropFilter:"blur(20px)",border:"1px solid rgba(200,146,42,0.38)",borderRadius:99,padding:"11px 22px",color:D.goldLt,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",boxShadow:"inset 0 1px 0 rgba(255,255,255,.07)"}}>Explore Menu <svg width={14} height={14} viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke={D.goldLt} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <button onClick={()=>onTap(s)} style={{position:"relative",width:46,height:46,borderRadius:"50%",background:qty>0?DG:"rgba(200,146,42,0.11)",border:`1.5px solid ${qty>0?D.goldMid:"rgba(200,146,42,0.42)"}`,color:qty>0?D.void:D.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,fontWeight:800,backdropFilter:"blur(12px)",boxShadow:qty>0?`0 0 0 4px ${D.glow10},0 8px 24px ${D.glow35}`:"none",transition:`all 0.3s ${DSP}`}}>
            {qty>0?"✓":"+"}
            {qty>0&&<div style={{position:"absolute",top:-5,right:-5,width:18,height:18,borderRadius:"50%",background:DG,color:D.void,fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${D.void}`,animation:"cartBump .45s ease",fontFamily:"'DM Mono',monospace"}}>{qty}</div>}
          </button>
        </div>}
      </div>
      {/* Vertical dot nav */}
      <div style={{position:"absolute",right:18,bottom:"50%",transform:"translateY(50%)",zIndex:6,display:"flex",flexDirection:"column",gap:6,alignItems:"center"}}>
        <span style={{fontSize:10,color:D.gold,fontFamily:"'DM Mono',monospace",fontWeight:500,marginBottom:4}}>0{active+1}</span>
        {slides.map((_,i)=><button key={i} onClick={()=>setActive(i)} style={{width:i===active?2.5:2,height:i===active?22:7,borderRadius:99,background:i===active?DGV:"rgba(200,146,42,.25)",border:"none",cursor:"pointer",padding:0,transition:`all 0.4s ${DSP}`,boxShadow:i===active?`0 0 8px ${D.glow35}`:"none"}}/>)}
        <span style={{fontSize:10,color:D.inkGhost,fontFamily:"'DM Mono',monospace",marginTop:4}}>0{slides.length}</span>
      </div>
      {/* Item name tag */}
      {shown&&<div style={{position:"absolute",right:22,bottom:88,zIndex:6,textAlign:"right",animation:`fadeRise 0.6s 0.5s ${DEA} both`}}>
        <p style={{fontSize:10.5,color:D.gold,fontFamily:"'DM Mono',monospace",margin:"0 0 3px",letterSpacing:".1em",textTransform:"uppercase"}}>Featured</p>
        <p style={{fontSize:15,color:D.ink,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,margin:"0 0 1px"}}>{s.name}</p>
        <p style={{fontSize:13,color:D.gold,fontFamily:"'DM Mono',monospace",fontWeight:400}}>₹{s.price}</p>
      </div>}
    </div>
  );
}

// ── Glass Category Bar ──
function CGlassBar({cats,active,onSelect}:{cats:MenuCategory[];active:string;onSelect:(id:string)=>void}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const el=ref.current?.querySelector('[data-active="true"]') as HTMLElement;el?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});},[active]);
  return(
    <div style={{padding:"22px 0 8px"}}>
      <div style={{padding:"0 22px",marginBottom:12}}><span style={{fontSize:10,color:D.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".18em",textTransform:"uppercase"}}>✦ Explore</span></div>
      <div ref={ref} className="hs" style={{display:"flex",gap:10,overflowX:"auto",padding:"4px 22px 8px"}}>
        {cats.map((cat,idx)=>{const isA=cat._id===active;return(
          <button key={cat._id} data-active={isA} onClick={()=>onSelect(cat._id)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:8,background:isA?"linear-gradient(135deg,rgba(200,146,42,0.22),rgba(232,184,75,0.12))":D.glassWk,backdropFilter:"blur(24px)",border:`1px solid ${isA?"rgba(200,146,42,0.52)":D.glassBd}`,borderRadius:99,padding:"9px 18px 9px 12px",cursor:"pointer",boxShadow:isA?`0 0 24px ${D.glow20},inset 0 1px 0 rgba(255,255,255,.06),0 4px 16px rgba(0,0,0,.4)`:"inset 0 1px 0 rgba(255,255,255,.04),0 2px 8px rgba(0,0,0,.3)",transition:`all 0.32s ${DSP}`,animation:`staggerIn 0.45s ${idx*.06}s ${DEA} both`,position:"relative",overflow:"hidden"}}>
            {isA&&<div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",borderRadius:99}}><div style={{position:"absolute",top:0,left:0,width:"30%",height:"100%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent)",animation:"lineSweep 2.5s ease-in-out infinite"}}/></div>}
            <span style={{fontSize:20,lineHeight:1}}>{cat.icon}</span>
            <span style={{fontSize:12.5,fontWeight:isA?700:500,color:isA?D.goldLt:D.inkDim,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{cat.name}</span>
            {isA&&<div style={{width:5,height:5,borderRadius:"50%",background:D.gold,boxShadow:`0 0 6px ${D.gold}`,marginLeft:2}}/>}
          </button>
        );})}
      </div>
    </div>
  );
}

// ── Cinematic Card ──
function CCard({item,qty,isFav,onFav,onTap,delay=0,size="normal"}:{item:MenuItem;qty:number;isFav:boolean;onFav:()=>void;onTap:()=>void;delay?:number;size?:"normal"|"large"|"compact"}) {
  const [pressed,setPressed]=useState(false);
  const [rp,setRp]=useState<{x:number;y:number}|null>(null);
  const W=size==="large"?218:size==="compact"?148:170;
  const H=size==="large"?178:size==="compact"?126:154;
  const tap=(e:React.MouseEvent)=>{if(!item.isAvailable)return;const r=(e.currentTarget as HTMLElement).getBoundingClientRect();setRp({x:e.clientX-r.left,y:e.clientY-r.top});setTimeout(()=>setRp(null),700);onTap();};
  return(
    <div onClick={tap} onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{flexShrink:0,width:W,borderRadius:20,overflow:"hidden",cursor:item.isAvailable?"pointer":"not-allowed",opacity:item.isAvailable?1:0.4,background:`linear-gradient(160deg,${D.raised} 0%,${D.surface} 100%)`,border:`1px solid ${qty>0?"rgba(200,146,42,0.45)":D.glassBd}`,boxShadow:qty>0?`0 0 0 1px ${D.glow20},0 8px 32px ${D.glow20},0 2px 8px rgba(0,0,0,.6)`:"0 4px 20px rgba(0,0,0,.5),0 1px 0 rgba(255,255,255,.04)",transform:pressed?"scale(0.955) translateY(2px)":"scale(1)",transition:`all 0.28s ${DSP}`,animation:`staggerIn 0.5s ${delay}s ${DEA} both`,position:"relative"}}>
      <div style={{position:"relative",height:H,overflow:"hidden"}}>
        {item.imageUrl?<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.5s ease",transform:pressed?"scale(1.06)":"scale(1.01)"}} loading="lazy"/>:<div style={{width:"100%",height:"100%",background:`radial-gradient(ellipse at 50% 30%,#3D2010 0%,#1A0E06 50%,${D.surface} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:50,opacity:.7}}>☕</div>}
        <div style={{position:"absolute",inset:0,background:`linear-gradient(to top,${D.surface} 0%,rgba(19,17,13,.55) 44%,transparent 68%)`}}/>
        {item.tags?.includes("bestseller")&&<div style={{position:"absolute",top:10,left:10,background:DG,color:D.void,fontSize:8.5,fontWeight:800,padding:"2.5px 9px",borderRadius:99,letterSpacing:".06em",fontFamily:"'DM Sans',sans-serif",boxShadow:`0 2px 8px ${D.glow35}`}}>⭐ BEST</div>}
        {!item.isAvailable&&<div style={{position:"absolute",top:10,left:10,background:"rgba(229,57,53,.85)",color:"white",fontSize:8,fontWeight:800,padding:"2px 8px",borderRadius:99}}>SOLD OUT</div>}
        {qty>0&&<div style={{position:"absolute",top:8,right:40,width:22,height:22,borderRadius:"50%",background:DG,color:D.void,fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${D.surface}`,animation:"cartBump .45s ease",fontFamily:"'DM Mono',monospace"}}>{qty}</div>}
        <button onClick={e=>{e.stopPropagation();onFav();}} style={{position:"absolute",top:8,right:8,width:30,height:30,borderRadius:"50%",background:"rgba(7,6,4,.65)",backdropFilter:"blur(8px)",border:`1px solid ${isFav?"rgba(229,57,53,.6)":D.glassBd}`,color:isFav?"#ef4444":D.inkDim,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,transition:`all 0.2s ${DEA}`}}>{isFav?"❤":"🤍"}</button>
        <div style={{position:"absolute",bottom:9,left:11,right:11,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <span style={{fontSize:16.5,fontWeight:500,color:D.gold,fontFamily:"'DM Mono',monospace"}}>₹{item.price}</span>
          {item.rating&&<div style={{display:"flex",alignItems:"center",gap:3}}><span style={{color:D.gold,fontSize:10}}>★</span><span style={{fontSize:10,color:"rgba(245,237,216,.5)",fontFamily:"'DM Mono',monospace"}}>{item.rating.toFixed(1)}</span></div>}
        </div>
        {rp&&<div style={{position:"absolute",left:rp.x-18,top:rp.y-18,width:36,height:36,borderRadius:"50%",background:"rgba(200,146,42,.32)",animation:"ripOut .7s ease-out forwards",pointerEvents:"none"}}/>}
      </div>
      <div style={{padding:"10px 12px 12px"}}>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:D.ink,margin:"0 0 3px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</p>
        {size!=="compact"&&<p style={{fontSize:10.5,color:D.inkMute,margin:"0 0 10px",lineHeight:1.45,fontFamily:"'DM Sans',sans-serif",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{item.description||"Artisanal quality, crafted with care"}</p>}
        <button onClick={e=>{e.stopPropagation();if(item.isAvailable)onTap();}} style={{width:"100%",padding:"9px 0",borderRadius:11,border:`1px solid ${qty>0?"rgba(200,146,42,0.55)":D.glassBd}`,background:qty>0?"linear-gradient(135deg,rgba(200,146,42,.22),rgba(232,184,75,.12))":D.glassWk,color:qty>0?D.goldLt:D.inkDim,fontWeight:600,fontSize:12,cursor:item.isAvailable?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:`all 0.25s ${DEA}`,backdropFilter:"blur(8px)",boxShadow:qty>0?`0 4px 16px ${D.glow20}`:"none"}}>
          {!item.isAvailable?<><span style={{opacity:.5}}>⛔</span>Unavailable</>:qty>0?<><span style={{fontSize:13}}>✓</span>Added ({qty})</>:<><span style={{fontSize:15,fontWeight:700}}>+</span>Add to Cart</>}
        </button>
      </div>
    </div>
  );
}

// ── Section Row ──
function CRow({title,eyebrow,items,cart,onTap,favs,onFav,featured=false}:{title:string;eyebrow?:string;items:MenuItem[];cart:ECI[];onTap:(i:MenuItem)=>void;favs:Set<string>;onFav:(id:string)=>void;featured?:boolean}) {
  if(!items.length)return null;
  return(
    <section style={{marginBottom:38,position:"relative"}}>
      <div style={{padding:"0 22px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>{eyebrow&&<p style={{fontSize:10,color:D.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".15em",textTransform:"uppercase",margin:"0 0 4px"}}>{eyebrow}</p>}<h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:D.ink,margin:0,letterSpacing:"-.01em"}}>{title}</h3></div>
        <button style={{fontSize:12,color:D.gold,background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,opacity:.75,display:"flex",alignItems:"center",gap:4}}>See all<svg width={12} height={12} viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4" stroke={D.gold} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      </div>
      <div className="hs" style={{display:"flex",gap:12,overflowX:"auto",padding:"4px 22px 12px",scrollSnapType:"x mandatory"}}>
        {items.map((item,idx)=>{const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);return(<div key={item._id} style={{flexShrink:0,scrollSnapAlign:"start"}}><CCard item={item} qty={qty} isFav={favs.has(item._id)} onFav={()=>onFav(item._id)} onTap={()=>onTap(item)} delay={idx*.055} size={featured&&idx===0?"large":idx>3?"compact":"normal"}/></div>);})}
      </div>
      <div style={{position:"absolute",right:0,top:"30%",width:56,height:"50%",pointerEvents:"none",background:`linear-gradient(to left,${D.deep},transparent)`}}/>
    </section>
  );
}

// ── Compact List Row ──
function CCompact({title,eyebrow,items,cart,onTap}:{title:string;eyebrow?:string;items:MenuItem[];cart:ECI[];onTap:(i:MenuItem)=>void}) {
  if(!items.length)return null;
  return(
    <section style={{marginBottom:34,padding:"0 22px"}}>
      <div style={{marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>{eyebrow&&<p style={{fontSize:10,color:D.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".15em",textTransform:"uppercase",margin:"0 0 4px"}}>{eyebrow}</p>}<h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,fontWeight:600,color:D.ink,margin:0}}>{title}</h3></div>
        <button style={{fontSize:12,color:D.gold,background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>See all</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {items.slice(0,5).map((item,idx)=>{
          const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
          return(
            <div key={item._id} onClick={()=>item.isAvailable&&onTap(item)} style={{display:"flex",gap:13,alignItems:"center",background:`linear-gradient(135deg,${D.surface} 0%,${D.raised} 100%)`,borderRadius:16,padding:"11px 13px",border:`1px solid ${qty>0?"rgba(200,146,42,.38)":D.glassBd}`,boxShadow:qty>0?`0 0 0 1px ${D.glow10},0 4px 16px rgba(0,0,0,.4)`:"0 2px 12px rgba(0,0,0,.35)",cursor:item.isAvailable?"pointer":"not-allowed",opacity:item.isAvailable?1:.45,animation:`staggerIn 0.4s ${idx*.07}s ${DEA} both`,transition:`all 0.25s ${DEA}`}}>
              <div style={{width:56,height:56,borderRadius:13,overflow:"hidden",flexShrink:0,background:`linear-gradient(135deg,#3D2010,${D.surface})`}}>{item.imageUrl&&<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>}</div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:D.ink,margin:"0 0 2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</p>
                <p style={{fontSize:10,color:D.inkMute,margin:"0 0 5px",fontFamily:"'DM Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.description||"Premium quality"}</p>
                <span style={{fontSize:14,fontWeight:500,color:D.gold,fontFamily:"'DM Mono',monospace"}}>₹{item.price}</span>
              </div>
              <button onClick={e=>{e.stopPropagation();if(item.isAvailable)onTap(item);}} style={{width:32,height:32,borderRadius:"50%",border:`1.5px solid ${qty>0?"rgba(200,146,42,.7)":D.glassBd}`,background:qty>0?"linear-gradient(135deg,rgba(200,146,42,.25),rgba(232,184,75,.12))":"transparent",color:qty>0?D.goldLt:D.inkDim,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,transition:`all 0.22s ${DSP}`,boxShadow:qty>0?`0 0 12px ${D.glow20}`:"none"}}>{qty>0?"✓":"+"}</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Promo Card ──
function CPromo({onTap}:{onTap:()=>void}) {
  return(
    <div style={{margin:"0 22px 36px"}}>
      <div onClick={onTap} style={{background:`radial-gradient(ellipse 100% 100% at 80% 50%,rgba(60,30,8,.9) 0%,rgba(30,14,4,.98) 60%,${D.surface} 100%)`,borderRadius:22,padding:"22px 20px",position:"relative",overflow:"hidden",border:"1px solid rgba(200,146,42,.28)",boxShadow:`0 8px 36px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.04)`,cursor:"pointer"}}>
        <div style={{position:"absolute",right:-24,top:"50%",transform:"translateY(-50%)",width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle,${D.glow20} 0%,transparent 70%)`,animation:"breathGold 5s ease-in-out infinite"}}/>
        {[0,1].map(i=><div key={i} style={{position:"absolute",right:40+i*14,bottom:"50%",width:4,height:20,borderRadius:99,background:`linear-gradient(to top,${D.glow35},transparent)`,animation:`smokeUp 2s ${i*.7}s ease-out infinite`,filter:"blur(1px)",opacity:0}}/>)}
        <div style={{position:"absolute",right:10,bottom:-8,fontSize:72,opacity:.08,pointerEvents:"none",userSelect:"none"}}>☕</div>
        <p style={{fontSize:9.5,color:D.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".18em",textTransform:"uppercase",margin:"0 0 5px"}}>Special For You</p>
        <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:700,color:D.goldLt,margin:"0 0 5px",lineHeight:1}}>Flat 20% Off</h3>
        <p style={{fontSize:12.5,color:D.inkDim,margin:"0 0 18px",fontFamily:"'DM Sans',sans-serif",maxWidth:200}}>On all beverages this evening</p>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,rgba(200,146,42,.14),rgba(200,146,42,.06))",backdropFilter:"blur(12px)",border:"1px solid rgba(200,146,42,.35)",borderRadius:99,padding:"8px 16px",width:"fit-content",boxShadow:"inset 0 1px 0 rgba(255,255,255,.07)"}}>
          <span style={{fontSize:12,color:D.goldLt,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Order Now</span>
          <svg width={13} height={13} viewBox="0 0 13 13"><path d="M2 6.5h9M7 2.5l4 4-4 4" stroke={D.goldLt} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
    </div>
  );
}

// ── Ambient Divider ──
function CDivider() {
  return(
    <div style={{position:"relative",height:1,margin:"6px 22px 30px",overflow:"visible"}}>
      <div style={{height:1,background:`linear-gradient(90deg,transparent,${D.glow20},${D.glow35},${D.glow20},transparent)`}}/>
      <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",width:6,height:6,borderRadius:"50%",background:D.gold,boxShadow:`0 0 12px ${D.glow55},0 0 24px ${D.glow20}`}}/>
    </div>
  );
}

// ── Skeleton ──
function CSkeleton() {
  return(
    <div>
      <div className="csk" style={{width:"100%",height:"60vh",maxHeight:520,minHeight:380}}/>
      <div style={{display:"flex",gap:10,padding:"20px 22px",overflow:"hidden"}}>{[80,100,90,110,85].map((w,i)=><div key={i} className="csk" style={{flexShrink:0,width:w,height:38,borderRadius:99}}/>)}</div>
      {[0,1].map(r=><div key={r} style={{padding:"10px 22px 20px"}}><div className="csk" style={{width:140,height:15,borderRadius:7,marginBottom:12}}/><div style={{display:"flex",gap:12,overflow:"hidden"}}>{[170,170,148,148].map((w,i)=><div key={i} style={{flexShrink:0,width:w}}><div className="csk" style={{height:154,borderRadius:"20px 20px 0 0"}}/><div style={{background:D.surface,borderRadius:"0 0 20px 20px",padding:12}}><div className="csk" style={{height:13,borderRadius:5,marginBottom:7,width:"80%"}}/><div className="csk" style={{height:29,borderRadius:11}}/></div></div>)}</div></div>)}
    </div>
  );
}

// ── MAIN CinematicHome component ──
function CinematicHome({menu,cart,loading,customerData,table,onItemTap,onCategorySelect,activeCategoryId,onViewCart,onExploreMenu,favs,onToggleFav}:{
  menu:MenuCategory[];cart:ECI[];loading:boolean;
  customerData:{name:string;phone:string}|null;table:{tableNumber:string}|null;
  onItemTap:(i:MenuItem)=>void;onCategorySelect:(id:string)=>void;activeCategoryId:string;
  onViewCart:()=>void;onExploreMenu:()=>void;favs:Set<string>;onToggleFav:(id:string)=>void;
}) {
  const allItems=menu.flatMap(c=>c.items as MenuItem[]);
  const bestsellers=allItems.filter(i=>i.tags?.includes("bestseller")&&i.isAvailable);
  const catItems=(menu.find(c=>c._id===activeCategoryId)?.items||[]) as MenuItem[];
  const hour=new Date().getHours();
  const greeting=hour<5?"Still Up Late?":hour<12?"Good Morning":hour<17?"Good Afternoon":hour<21?"Good Evening":"Good Night";
  const [scrolled,setScrolled]=useState(false);
  const scrollRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{const el=scrollRef.current;if(!el)return;const fn=()=>setScrolled(el.scrollTop>72);el.addEventListener("scroll",fn);return()=>el.removeEventListener("scroll",fn);},[]);

  return(
    <div style={{position:"relative",minHeight:"100dvh",background:D.deep}}>
      <style>{CINEMA_CSS}</style>

      {/* Sticky transparent→solid header */}
      <header style={{position:"sticky",top:0,zIndex:30,background:scrolled?"rgba(7,6,4,0.97)":"transparent",backdropFilter:scrolled?"blur(24px)":"none",padding:"13px 18px",borderBottom:scrolled?`1px solid ${D.glassBd}`:"none",transition:`all 0.35s ${DEA}`,marginBottom:"-60px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:11}}>
            <div style={{width:40,height:40,borderRadius:13,overflow:"hidden",border:`1.5px solid rgba(200,146,42,${scrolled?.55:.3})`,boxShadow:`0 0 16px ${D.glow20}`,transition:`all 0.3s ${DEA}`}}>
              <img src="/logo-small.png" alt="GB" style={{width:"100%",height:"100%",objectFit:"contain"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
            </div>
            <div>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17.5,fontWeight:600,color:scrolled?D.ink:"rgba(245,237,216,.9)",margin:0,lineHeight:1.1,transition:`color 0.3s ${DEA}`}}>Golden Beans</p>
              <p style={{fontSize:10,color:scrolled?D.inkMute:"rgba(245,237,216,.42)",margin:0,fontFamily:"'DM Sans',sans-serif",transition:`color 0.3s ${DEA}`}}>{table?`Table ${table.tableNumber} ✦ `:""}{customerData?customerData.name:"Cafe & Bistro"}</p>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {["🔍","🔔"].map((ic,i)=><button key={i} style={{width:38,height:38,borderRadius:12,background:`rgba(255,255,255,${scrolled?.06:.04})`,border:`1px solid ${D.glassBd}`,backdropFilter:"blur(12px)",color:D.ink,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,transition:`all 0.3s ${DEA}`}}>{ic}</button>)}
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <div ref={scrollRef} style={{overflowY:"auto",overflowX:"hidden",paddingBottom:cart.length>0?160:96}}>
        {loading?<CSkeleton/>:(
          <>
            <CHero items={allItems} cart={cart} onTap={onItemTap} onExplore={onExploreMenu} greeting={greeting} name={customerData?.name}/>
            <CGlassBar cats={menu} active={activeCategoryId} onSelect={onCategorySelect}/>
            <CDivider/>
            {bestsellers.length>0&&<CRow eyebrow="✦ Smart Pick" title={`Made For You${customerData?`, ${customerData.name.split(" ")[0]}`:""}`} items={bestsellers} cart={cart} onTap={onItemTap} favs={favs} onFav={onToggleFav} featured/>}
            <CPromo onTap={onExploreMenu}/>
            {catItems.length>0&&<CRow eyebrow="✦ From The Menu" title={`${menu.find(c=>c._id===activeCategoryId)?.icon||""} ${menu.find(c=>c._id===activeCategoryId)?.name||""}`} items={catItems.filter(i=>i.isAvailable)} cart={cart} onTap={onItemTap} favs={favs} onFav={onToggleFav}/>}
            <CCompact eyebrow="✦ Quick Picks" title="Continue Your Favorites" items={allItems.filter(i=>i.isAvailable).slice(4,9)} cart={cart} onTap={onItemTap}/>
            <CDivider/>
            {menu.slice(0,4).map(cat=><CRow key={cat._id} eyebrow={`✦ ${cat.name}`} title={`${cat.icon} ${cat.name}`} items={(cat.items as MenuItem[]).filter(i=>i.isAvailable).slice(0,8)} cart={cart} onTap={onItemTap} favs={favs} onFav={onToggleFav}/>)}
            <div style={{textAlign:"center",padding:"18px 22px 10px"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:6}}>
                <div style={{width:32,height:1,background:`linear-gradient(to right,transparent,${D.glow35})`}}/>
                <span style={{fontSize:11,color:D.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".12em"}}>🌿 100% Pure Vegetarian</span>
                <div style={{width:32,height:1,background:`linear-gradient(to left,transparent,${D.glow35})`}}/>
              </div>
              <p style={{fontSize:10,color:D.inkGhost,margin:"5px 0 0",fontFamily:"'DM Sans',sans-serif"}}>Crafted with passion · Served with love</p>
            </div>
          </>
        )}
      </div>

      {/* Floating Cart */}
      {cart.length>0&&(()=>{
        const total=cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
        const items=cart.reduce((s,i)=>s+i.quantity,0);
        return(
          <div style={{position:"fixed",bottom:76,left:14,right:14,zIndex:50,animation:`staggerIn 0.5s ${DSP}`}}>
            <button onClick={onViewCart} style={{width:"100%",background:"linear-gradient(135deg,rgba(19,17,13,0.97),rgba(26,23,16,0.97))",backdropFilter:"blur(28px)",borderRadius:20,padding:"12px 14px",border:"1px solid rgba(200,146,42,0.42)",boxShadow:`0 8px 40px rgba(0,0,0,.75),0 0 0 1px ${D.glow10},0 0 28px ${D.glow20}`,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{position:"relative"}}>
                  <div style={{width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,rgba(200,146,42,.2),rgba(232,184,75,.1))",border:"1.5px solid rgba(200,146,42,.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🛒</div>
                  <div style={{position:"absolute",top:-7,right:-7,width:20,height:20,borderRadius:"50%",background:DG,color:D.void,fontSize:9.5,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${D.dark}`,fontFamily:"'DM Mono',monospace",boxShadow:`0 2px 8px ${D.glow35}`}}>{items}</div>
                </div>
                <div style={{textAlign:"left"}}>
                  <p style={{fontFamily:"'DM Mono',monospace",fontWeight:500,fontSize:17,color:D.ink,margin:0,lineHeight:1}}>₹{(total*1.05).toFixed(0)}</p>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:7,background:DG,borderRadius:13,padding:"10px 18px",boxShadow:`0 4px 20px ${D.glow35}`}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13.5,color:D.void}}>View Cart</span>
                <svg width={14} height={14} viewBox="0 0 14 14"><path d="M2 7h10M8 3l4 4-4 4" stroke={D.void} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </button>
          </div>
        );
      })()}
    </div>
  );
}

// ════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ════════════════════════════════════════════════
export default function CustomerOrderPage() {
  const params = useParams(); const router = useRouter();
  const tableId = params.tableId as string;

  // Security
  const [secStatus, setSecStatus] = useState<"checking"|"passed"|"failed">("checking");
  const [secResult, setSecResult] = useState<SecRes|null>(null);

  // Data
  const [menu,          setMenu         ] = useState<MenuCategory[]>([]);
  const [table,         setTable        ] = useState<Table|null>(null);
  const [existingOrder, setExistingOrder] = useState<Order|null>(null);
  const [allOrders,     setAllOrders    ] = useState<Order[]>([]);
  const [loading,       setLoading      ] = useState(true);

  // Cart & flow
  const [cart,       setCart      ] = useState<ECI[]>([]);
  const [discount,   setDiscount  ] = useState<Disc|null>(null);
  const [isPlacing,  setIsPlacing ] = useState(false);
  const [placedOrder,setPlacedOrder]=useState<Order|null>(null);
  const [sessionEnded,setSessionEnded]=useState(false);

  // Navigation
  const [screen,      setScreen    ] = useState<Screen>("security");
  const [activeTab,   setActiveTab ] = useState<Tab>("home");
  const [selectedItem,setSelectedItem]=useState<MenuItem|null>(null);
  const [activeCat,   setActiveCat ] = useState("");
  const [customer,    setCustomer  ] = useState<{name:string;phone:string}|null>(null);
  const [favs,        setFavs      ] = useState<Set<string>>(new Set());

  const prevStatus = useRef<string|null>(null);
  const pollTimer  = useRef<NodeJS.Timeout|null>(null);

  const onPassed  = useCallback(()=>{ setSecStatus("passed"); setScreen("home"); },[]);
  const onFailed  = useCallback((r:SecRes)=>{ setSecResult(r); setSecStatus("failed"); },[]);
  const onRetry   = useCallback(()=> setSecStatus("checking"),[]);

  // Load customer from localStorage
  useEffect(()=>{
    if (secStatus!=="passed") return;
    const saved = localStorage.getItem("gb_customer");
    if (saved) { try { const d=JSON.parse(saved); setCustomer({name:d.name,phone:d.phone}); } catch {} }
    const onSt = ()=>{ const u=localStorage.getItem("gb_customer"); if(u){try{const d=JSON.parse(u);setCustomer({name:d.name,phone:d.phone});}catch{}} };
    window.addEventListener("storage",onSt);
    const iv=setInterval(()=>{ const u=localStorage.getItem("gb_customer"); if(u){try{const d=JSON.parse(u);setCustomer(p=>p?.name===JSON.parse(u).name?p:{name:d.name,phone:d.phone});}catch{}} },2000);
    return ()=>{ window.removeEventListener("storage",onSt); clearInterval(iv); };
  },[secStatus]);

  // Load menu + table + existing order
  useEffect(()=>{
    if (secStatus!=="passed") return;
    async function load() {
      try {
        setLoading(true);
        const [mR,tR] = await Promise.all([menuApi.getMenu(), tableApi.getTable(tableId)]);
        setMenu(mR.data.data); setTable(tR.data.data);
        if (mR.data.data.length>0) setActiveCat(mR.data.data[0]._id);
        const oR = await orderApi.getOrderByTable(tableId);
        if (oR.data.data) {
          const o:Order=oR.data.data;
          if (["settled","cancelled"].includes(o.status)) { localStorage.removeItem("gb_active_order"); setExistingOrder(null); }
          else { setExistingOrder(o); prevStatus.current=o.status; localStorage.setItem("gb_active_order",o._id); }
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  },[tableId,secStatus]);

  // Poll for order status updates
  useEffect(()=>{
    if (secStatus!=="passed") return;
    let alive = true;
    const check = async () => {
      if (!alive) return;
      try {
        if (existingOrder) {
          const r = await orderApi.getOrder(existingOrder._id);
          const o:Order|null = r.data?.data;
          if (o) {
            if (o.status==="settled") {
              localStorage.setItem("gb_settled_order_id",existingOrder._id);
              localStorage.setItem("gb_settled_table",existingOrder.tableNumber||tableId);
              localStorage.removeItem("gb_active_order"); localStorage.removeItem("gb_customer");
              setSessionEnded(true); setPlacedOrder(existingOrder); setScreen("ready"); return;
            }
            if (o.status==="cancelled") { localStorage.removeItem("gb_active_order"); setExistingOrder(null); return; }
            setExistingOrder(o);
          }
        }
        const [oR,aR] = await Promise.all([orderApi.getOrderByTable(tableId), orderApi.getKdsOrders()]);
        if (!alive) return;
        if (aR.data.data) setAllOrders(aR.data.data);
        const nO:Order|null = oR.data.data;
        if (!nO) return;
        prevStatus.current=nO.status; setExistingOrder(nO);
      } catch {}
    };
    pollTimer.current = setInterval(check, 5000);
    const onVis = ()=>{ if(document.visibilityState==="visible") check(); };
    document.addEventListener("visibilitychange",onVis); window.addEventListener("focus",check);
    check();
    return ()=>{ alive=false; if(pollTimer.current)clearInterval(pollTimer.current); document.removeEventListener("visibilitychange",onVis); window.removeEventListener("focus",check); };
  },[secStatus,tableId,existingOrder]);

  const queuePos = existingOrder
    ? allOrders.filter(o=>["kotSent","open"].includes(o.status)&&o._id!==existingOrder._id&&new Date(o.createdAt).getTime()<new Date(existingOrder.createdAt).getTime()).length
    : undefined;

  // Cart operations
  const addToCart = (item:MenuItem, qty:number, variants:{groupName:string;selected:string[]}[], mod:number) => {
    const key = item._id+JSON.stringify(variants);
    setCart(prev=>{
      const ex=prev.find(c=>(c.menuItemId+JSON.stringify(c.variants))===key);
      if (ex) return prev.map(c=>(c.menuItemId+JSON.stringify(c.variants))===key?{...c,quantity:c.quantity+qty}:c);
      return [...prev,{menuItemId:item._id,name:item.name,price:item.price,quantity:qty,notes:"",isVeg:true,variants,totalPriceModifier:mod,imageUrl:item.imageUrl}];
    });
    setSelectedItem(null);
  };

  const updateQty = (key:string, d:number) => setCart(prev=>{
    const ex=prev.find(c=>(c.menuItemId+JSON.stringify(c.variants))===key);
    if (!ex) return prev;
    if (ex.quantity+d<=0) return prev.filter(c=>(c.menuItemId+JSON.stringify(c.variants))!==key);
    return prev.map(c=>(c.menuItemId+JSON.stringify(c.variants))===key?{...c,quantity:c.quantity+d}:c);
  });

  // Payment + order placement
  const handlePay = async (method:string, tip:number, note:string) => {
    if (!cart.length) return;
    try {
      const API=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
      const pm=(await fetch(`${API}/settings/payment_mode`).then(r=>r.json())).data||"counter";
      if ((pm==="online"||pm==="both")&&method!=="cash") { await initiateRazorpay(tip,note); }
      else { await placeOrder(tip,note); }
    } catch { await placeOrder(tip,note); }
  };

  const initiateRazorpay = async (tip:number, note:string) => {
    const sub=cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
    const disc=discount?.discount||0;
    const total=Math.round(Math.max(0,sub-disc)*1.05)+tip;
    const API=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
    setIsPlacing(true);
    try {
      const orderData=await fetch(`${API}/payment/create-order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:total,tableNumber:table?.tableNumber})}).then(r=>r.json());
      if (!orderData.success) throw new Error(orderData.message);
      await new Promise<void>((resolve,reject)=>{ if((window as any).Razorpay){resolve();return;} const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.onload=()=>resolve();s.onerror=()=>reject();document.body.appendChild(s); });
      await new Promise<void>((resolve,reject)=>{ new (window as any).Razorpay({key:orderData.data?.keyId,amount:total*100,currency:"INR",name:"Golden Beans Café",order_id:orderData.data?.orderId,prefill:{name:customer?.name||"",contact:customer?.phone||""},theme:{color:T.gold},handler:async(r:any)=>{try{const v=await fetch(`${API}/payment/verify`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)}).then(r=>r.json());if(v.success){await placeOrder(tip,note,r.razorpay_payment_id);resolve();}else reject();}catch(e){reject(e);}},modal:{ondismiss:()=>reject(new Error("cancelled"))}}).open(); });
    } catch(e:any){ if(e?.message!=="cancelled") alert(e?.message||"Payment failed"); }
    finally { setIsPlacing(false); }
  };

  const placeOrder = async (tip=0, note="", paymentId?:string) => {
    if (!cart.length) return;
    setIsPlacing(true);
    try {
      const res=await orderApi.createOrder({tableId,items:cart.map(c=>({menuItemId:c.menuItemId,name:c.name,price:c.price+(c.totalPriceModifier||0),quantity:c.quantity,notes:c.variants?.flatMap(v=>v.selected).join(", ")||note,isVeg:c.isVeg})),createdBy:"customer",customerName:customer?.name||"",customerPhone:customer?.phone||"",discount:discount?.discount||0,appliedPromoId:discount?.promotionId||null,appliedPromoCode:discount?.code||null,razorpayPaymentId:paymentId||null});
      const nO:Order=res.data.data;
      setCart([]); setDiscount(null); setExistingOrder(nO); prevStatus.current=nO.status;
      localStorage.setItem("gb_active_order",nO._id);
      setPlacedOrder(nO); setScreen("placed");
    } catch(e:unknown){ alert(e instanceof Error?e.message:"Failed to place order"); }
    finally { setIsPlacing(false); }
  };

  // Derived data
  const allItems    = menu.flatMap(c=>c.items as MenuItem[]);
  const bestsellers = allItems.filter(i=>i.tags?.includes("bestseller")&&i.isAvailable);
  const catItems    = (menu.find(c=>c._id===activeCat)?.items||[]) as MenuItem[];
  const cartCount   = cart.reduce((s,i)=>s+i.quantity,0);
  const hour        = new Date().getHours();
  const greeting    = hour<12?"Good Morning ☀️":hour<17?"Good Afternoon ☕":"Good Evening 🌙";

  const toggleFav = (id:string) => setFavs(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });

  // ── Tab navigation handler ──
  const handleTabChange = (tab:Tab) => {
    if (tab==="cart")   { setScreen("cart"); }
    else if (tab==="orders") { if(existingOrder) setScreen("tracking"); else setActiveTab("orders"); }
    else { setScreen("home"); setActiveTab(tab); }
  };

  // ════════════════════════════════════════════════
  // SECURITY GATE
  // ════════════════════════════════════════════════
  if (screen==="security") {
    if (secStatus==="checking") return <><style>{CSS}</style><SecurityCheckScreen onPassed={onPassed} onFailed={onFailed}/></>;
    if (secStatus==="failed"&&secResult) return <><style>{CSS}</style><AwarenessScreen result={secResult} onRetry={onRetry}/></>;
    return null;
  }

  // ════════════════════════════════════════════════
  // FULL-SCREEN FLOW SCREENS
  // ════════════════════════════════════════════════
  if (screen==="ready") {
    return (
      <div style={{ minHeight:"100dvh", background:T.bg }}><style>{CSS}</style>
        <OrderReadyScreen order={placedOrder} onRestart={()=>{ setSessionEnded(false); setScreen("home"); setCart([]); setDiscount(null); setExistingOrder(null); setPlacedOrder(null); router.replace("/"); }}/>
      </div>
    );
  }

  if (screen==="cart") return (
    <div style={{ minHeight:"100dvh", background:T.bg }}><style>{CSS}</style>
      {existingOrder&&!["settled","cancelled"].includes(existingOrder.status)&&<TopCancelBar order={existingOrder} onCancelled={()=>{setExistingOrder(null);prevStatus.current=null;}}/>}
      <CartScreen cart={cart} onUpdateQty={updateQty} onCheckout={()=>setScreen("checkout")} discount={discount} onDiscountChange={setDiscount} allItems={allItems} onAddMore={item=>setSelectedItem(item)}/>
      <ProductModal item={selectedItem} open={!!selectedItem} onClose={()=>setSelectedItem(null)} onAdd={addToCart}/>
    </div>
  );

  if (screen==="checkout") return (
    <div style={{ minHeight:"100dvh", background:T.bg }}><style>{CSS}</style>
      <CheckoutScreen cart={cart} table={table} discount={discount} onBack={()=>setScreen("cart")} onPay={handlePay} isPlacing={isPlacing}/>
    </div>
  );

  if (screen==="placed"&&placedOrder) return (
    <div style={{ minHeight:"100dvh", background:T.bg }}><style>{CSS}</style>
      <OrderPlacedScreen order={placedOrder} onTrack={()=>setScreen("tracking")} onHome={()=>setScreen("home")}/>
    </div>
  );

  if (screen==="tracking"&&existingOrder) return (
    <div style={{ minHeight:"100dvh", background:T.bg }}><style>{CSS}</style>
      {!["settled","cancelled"].includes(existingOrder.status)&&<TopCancelBar order={existingOrder} onCancelled={()=>{setExistingOrder(null);prevStatus.current=null;setScreen("home");}}/>}
      <OrderTrackingScreen order={existingOrder} onReady={()=>{ setScreen("ready"); setSessionEnded(true); }}/>
    </div>
  );

  // ════════════════════════════════════════════════
  // MAIN APP — Home / Menu / Orders / Profile tabs
  // ════════════════════════════════════════════════
  return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", flexDirection:"column", overflowX:"hidden" }}>
      <style>{CSS}</style>

      {existingOrder&&!["settled","cancelled"].includes(existingOrder.status)&&
        <TopCancelBar order={existingOrder} onCancelled={()=>{setExistingOrder(null);prevStatus.current=null;}}/>
      }

      {/* ── HEADER ── */}
      <header style={{ position:"sticky",top:0,zIndex:30,background:"rgba(8,5,1,0.97)",backdropFilter:"blur(22px)",padding:"11px 14px",borderBottom:`1px solid ${T.glB}` }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:11 }}>
            <div style={{ width:42,height:42,borderRadius:13,overflow:"hidden",border:`1.5px solid ${T.gold}50`,boxShadow:`0 0 14px ${T.goldGl}`,flexShrink:0,background:T.bg3,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <img src="/logo-small.png" alt="GB" style={{ width:"100%",height:"100%",objectFit:"contain" }} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
            </div>
            <div>
              <p style={{ fontFamily:"'Playfair Display',serif",fontSize:16.5,fontWeight:800,color:T.text,margin:0,lineHeight:1.1 }}>Golden Beans</p>
              <p style={{ fontSize:10,color:T.textS,margin:0,fontFamily:"Inter,sans-serif" }}>Café &amp; Bistro{table?` · Table ${table.tableNumber}`:""}</p>
            </div>
          </div>
          <div style={{ display:"flex",gap:7 }}>
            <button style={{ width:38,height:38,borderRadius:11,background:T.gl,border:`1px solid ${T.glB}`,color:T.text,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17 }}>🔍</button>
            <button style={{ width:38,height:38,borderRadius:11,background:T.gl,border:`1px solid ${T.glB}`,color:T.text,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17 }}>🔔</button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex:1, paddingBottom:cart.length>0?146:78 }}>

        {/* ── HOME TAB — CINEMATIC ── */}
        {activeTab==="home" && (
          <CinematicHome
            menu={menu}
            cart={cart}
            loading={loading}
            customerData={customer}
            table={table}
            onItemTap={item=>setSelectedItem(item)}
            onCategorySelect={id=>{setActiveCat(id);setActiveTab("menu");}}
            activeCategoryId={activeCat}
            onViewCart={()=>setScreen("cart")}
            onExploreMenu={()=>setActiveTab("menu")}
            favs={favs}
            onToggleFav={toggleFav}
          />
        )}

        {/* ── MENU TAB ── */}
        {activeTab==="menu" && (
          <div>
            <CategoryRow cats={menu} active={activeCat} onSelect={setActiveCat}/>
            <div style={{ padding:"0 14px",marginBottom:10 }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,color:T.text,margin:"0 0 2px" }}>
                {menu.find(c=>c._id===activeCat)?.icon} {menu.find(c=>c._id===activeCat)?.name}
              </h3>
              <p style={{ fontSize:11,color:T.textS,margin:0,fontFamily:"Inter,sans-serif" }}>{catItems.filter(i=>i.isAvailable).length} items</p>
            </div>
            {loading ? (
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"0 14px" }}>
                {[1,2,3,4,5,6].map(i=><SkCard key={i}/>)}
              </div>
            ) : catItems.length===0 ? (
              <div style={{ textAlign:"center",padding:"58px 20px" }}>
                <div style={{ fontSize:46,marginBottom:12 }}>☕</div>
                <p style={{ color:T.textS,fontFamily:"Inter,sans-serif" }}>No items in this category yet</p>
              </div>
            ) : (
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"0 14px 20px" }}>
                {catItems.map((item,idx)=>{
                  const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
                  return <ItemCard key={item._id} item={item} qty={qty} isFav={favs.has(item._id)} onFav={()=>toggleFav(item._id)} onTap={()=>setSelectedItem(item)} delay={idx*0.04}/>;
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab==="orders" && (
          <div style={{ padding:"18px 14px" }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:24,color:T.text,margin:"0 0 16px" }}>My Orders</h2>
            {existingOrder ? (
              <LiveOrderTracker order={existingOrder} queuePosition={queuePos}/>
            ) : (
              <div style={{ textAlign:"center",padding:"58px 20px" }}>
                <div style={{ fontSize:52,marginBottom:14,animation:"float 3s ease-in-out infinite" }}>📋</div>
                <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:T.text,margin:"0 0 7px" }}>No Active Orders</h3>
                <p style={{ fontSize:13,color:T.textS,fontFamily:"Inter,sans-serif" }}>Browse the menu and place an order!</p>
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab==="profile" && (
          <div style={{ padding:"18px 14px" }}>
            {/* Cafe info card */}
            <div style={{ background:`linear-gradient(145deg,#2C1A08,#1A0D04)`,borderRadius:18,padding:22,marginBottom:14,border:`1px solid ${T.gold}22`,position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:-18,right:-18,width:110,height:110,borderRadius:"50%",background:`radial-gradient(circle,${T.gold}14,transparent)`,pointerEvents:"none" }}/>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
                <div style={{ width:50,height:50,borderRadius:13,background:T.bg3,border:`1px solid ${T.gold}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>☕</div>
                <div>
                  <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,color:T.gold,margin:"0 0 2px" }}>Golden Beans</h3>
                  <p style={{ fontSize:9.5,color:"rgba(200,146,42,0.6)",margin:0,letterSpacing:"0.15em",fontFamily:"Inter,sans-serif" }}>CAFE &amp; BISTRO</p>
                </div>
              </div>
              <p style={{ fontSize:12.5,color:"rgba(240,232,216,0.7)",margin:0,lineHeight:1.65,fontFamily:"Inter,sans-serif" }}>Premium 100% pure vegetarian cafe. Handcrafted coffee &amp; fresh snacks.</p>
            </div>
            {table && (
              <div style={{ background:CARD_BG,borderRadius:14,padding:14,marginBottom:11,border:`1px solid ${T.glB}`,display:"flex",alignItems:"center",gap:13 }}>
                <span style={{ fontSize:30 }}>🪑</span>
                <div>
                  <p style={{ fontSize:10,color:T.textD,letterSpacing:"0.09em",textTransform:"uppercase",margin:0,fontFamily:"Inter,sans-serif" }}>Your Table</p>
                  <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:21,color:T.text,margin:"1px 0 0" }}>Table {table.tableNumber}</p>
                </div>
              </div>
            )}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9 }}>
              {[{i:"🌿",l:"100% Vegetarian",c:T.green},{i:"☕",l:"Handcrafted Coffee",c:T.gold},{i:"⚡",l:"Fast Service",c:"#5b9bd5"},{i:"❤️",l:"Made with Love",c:T.red}].map(f=>(
                <div key={f.l} style={{ background:CARD_BG,borderRadius:13,padding:14,border:`1px solid ${T.glB}`,textAlign:"center" }}>
                  <p style={{ fontSize:24,margin:"0 0 5px" }}>{f.i}</p>
                  <p style={{ fontSize:10.5,fontWeight:700,color:f.c,margin:0,fontFamily:"Inter,sans-serif" }}>{f.l}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <CRMCaptureCard tableId={tableId}/>
        <WaiterHelpSheet tableId={tableId} tableNumber={table?.tableNumber||tableId}/>
      </main>

      {/* Floating cart bar */}
      {cart.length>0 && <FloatingCartBar cart={cart} discount={discount} onView={()=>setScreen("cart")}/>}

      {/* Bottom nav */}
      <BottomNav active={activeTab} onChange={handleTabChange} orderBadge={!!existingOrder} cartBadge={cartCount}/>

      {/* Product modal */}
      <ProductModal item={selectedItem} open={!!selectedItem} onClose={()=>setSelectedItem(null)} onAdd={addToCart}/>
    </div>
  );
}
