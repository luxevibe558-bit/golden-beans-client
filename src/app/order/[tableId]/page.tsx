"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import CRMCaptureCard from "@/components/CRMCaptureCard";
import WaiterHelpSheet from "@/components/WaiterHelpSheet";
import { menuApi, orderApi, tableApi } from "@/lib/api";
import { getThumbnailUrl, getHeroUrl } from "@/lib/cloudinary";
import LiveOrderTracker from "@/components/LiveOrderTracker";
import {
  getSessionCustomer,
  clearSessionCustomer,
  earnPoints,
  type CustomerProfile,
} from "@/lib/CustomerIdentitySystem";
import type { MenuCategory, MenuItem, CartItem, Table, Order, VariantGroup } from "@/types";

// ═══════════════════════════════════════════════════
// DESIGN SYSTEM — Cinematic Luxury
// ═══════════════════════════════════════════════════
const C = {
  // Void backgrounds — layered darkness
  void:   "#020100",
  abyss:  "#060503",
  deep:   "#0B0906",
  dark:   "#12100C",
  surface:"#1A1712",
  raise:  "#232018",
  lift:   "#2C2820",
  // Gold spectrum — warm ember
  goldSm: "#6B3D0A",
  gold:   "#C8922A",
  goldM:  "#E8B84B",
  goldL:  "#F5CC6A",
  goldXL: "#FAE0A0",
  // Glows
  g0:  "rgba(200,146,42,0)",
  g08: "rgba(200,146,42,0.08)",
  g15: "rgba(200,146,42,0.15)",
  g25: "rgba(200,146,42,0.25)",
  g40: "rgba(200,146,42,0.40)",
  g60: "rgba(200,146,42,0.60)",
  // Text
  ink:    "#F5EDD8",
  inkSub: "#C4AA80",
  inkDim: "#7A6448",
  inkGh:  "#352C1C",
  // Glass layers
  gl1: "rgba(255,255,255,0.022)",
  gl2: "rgba(255,255,255,0.048)",
  gl3: "rgba(255,255,255,0.075)",
  glBd:"rgba(255,255,255,0.065)",
  // Status
  emerald:"#2E7D52",
  ruby:   "#C0392B",
};

const GG   = `linear-gradient(135deg, ${C.gold} 0%, ${C.goldM} 52%, ${C.goldL} 100%)`;
const GGV  = `linear-gradient(180deg, ${C.goldL} 0%, ${C.gold} 100%)`;
const EASE = "cubic-bezier(0.25,0.46,0.45,0.94)";
const SPR  = "cubic-bezier(0.34,1.56,0.64,1)";
const CINC = "cubic-bezier(0.16,1,0.3,1)";

// ═══════════════════════════════════════════════════
// GLOBAL CINEMATIC CSS
// ═══════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@300;400;500&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
  margin: 0; padding: 0;
}

html, body {
  background: ${C.void};
  overflow-x: hidden;
  overscroll-behavior: none;
}

img { user-select:none; pointer-events:none; -webkit-user-drag:none; }
input, textarea { -webkit-user-select:text!important; user-select:text!important; }
.hs { scrollbar-width:none; -ms-overflow-style:none; }
.hs::-webkit-scrollbar { display:none; }
.press:active { transform:scale(0.93)!important; transition:transform 0.09s ease!important; }

/* Keyframes */
@keyframes kBurns  { from{transform:scale(1) translate(0,0)} to{transform:scale(1.09) translate(-1.2%,-0.8%)} }
@keyframes fadeRise{ from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes stgIn   { from{opacity:0;transform:translateY(20px) scale(.95)} to{opacity:1;transform:none} }
@keyframes ripOut  { from{transform:scale(.5);opacity:.85} to{transform:scale(3);opacity:0} }
@keyframes cartPop { 0%{transform:scale(1)} 35%{transform:scale(1.6)} 70%{transform:scale(.85)} 100%{transform:scale(1)} }
@keyframes breathG { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.7;transform:scale(1.08)} }
@keyframes smokeUp { 0%{opacity:0;transform:translateY(0) scaleX(1)} 35%{opacity:.55} 100%{opacity:0;transform:translateY(-58px) scaleX(2.4)} }
@keyframes sweep   { from{transform:translateX(-100%)} to{transform:translateX(600%)} }
@keyframes spin    { to{transform:rotate(360deg)} }
@keyframes pulseRg { 0%,100%{box-shadow:0 0 0 0 ${C.g25}} 50%{box-shadow:0 0 0 10px ${C.g0}} }
@keyframes sk      { from{background-position:200% center} to{background-position:-200% center} }
@keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
@keyframes scaleIn { from{opacity:0;transform:scale(0.82)} to{opacity:1;transform:scale(1)} }
@keyframes floatY  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes checkDraw { from{stroke-dashoffset:90} to{stroke-dashoffset:0} }
@keyframes countUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes glowExp { 0%{box-shadow:0 0 0 0 ${C.g25}} 100%{box-shadow:0 0 0 18px ${C.g0}} }

.sk { background:linear-gradient(90deg,${C.dark} 25%,${C.surface} 50%,${C.dark} 75%); background-size:200% 100%; animation:sk 2s ease-in-out infinite; }
.gt { background:${GG}; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
`;

// ═══════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════
interface ECI extends CartItem {
  variants?: { groupName:string; selected:string[] }[];
  totalPriceModifier?: number;
  imageUrl?: string;
}
interface Disc {
  promotionId:string; name:string; description:string;
  discount:number; type:"auto"|"code"; code?:string; promoCodeId?:string;
}
interface SecRes {
  allowed:boolean; ipAllowed:boolean; gpsAllowed:boolean; gpsRequired:boolean;
  ipRequired:boolean; distance:number|null; cafeName:string; cafeAddress:string;
  cafePhone:string; wifiName:string; reason:string;
}
type Screen = "security"|"home"|"cart"|"checkout"|"placed"|"tracking"|"ready";
type Tab    = "home"|"menu"|"orders"|"cart"|"profile";
// ═══════════════════════════════════════════════════
// SECURITY — Welcome + Check
// ═══════════════════════════════════════════════════
function WelcomeScreen({ onDone }: { onDone:()=>void }) {
  const [n,      setN     ] = useState(3);
  const [phase,  setPhase ] = useState(0);
  const [numKey, setNumKey] = useState(0);
  const [exiting,setExiting] = useState(false);
  const circumference = 2*Math.PI*52;
  const filled = circumference*(1-(n-1)/3);

  const BEANS=[
    {x:8, y:12,r:-35,s:.7, d:0.3},{x:82,y:8, r:25, s:.65,d:0.6},
    {x:6, y:38,r:15, s:.55,d:0.9},{x:88,y:28,r:-20,s:.6, d:0.4},
    {x:15,y:65,r:40, s:.5, d:0.7},{x:78,y:62,r:-30,s:.58,d:0.2},
    {x:72,y:18,r:50, s:.45,d:1.0},{x:22,y:22,r:-15,s:.52,d:0.5},
    {x:90,y:52,r:20, s:.48,d:0.8},{x:5, y:78,r:-45,s:.4, d:1.1},
  ];
  const RPTS=Array.from({length:14},(_,i)=>({angle:(i/14)*360,r:52+i%3*4,size:2+i%3,delay:i*.07}));

  useEffect(()=>{const t=setTimeout(()=>setPhase(1),80);return()=>clearTimeout(t);},[]);
  useEffect(()=>{
    const iv=setInterval(()=>setN(p=>{
      if(p<=1){clearInterval(iv);setExiting(true);setTimeout(onDone,550);return 0;}
      setNumKey(k=>k+1);return p-1;
    }),1000);
    return()=>clearInterval(iv);
  },[onDone]);

  const WS=`
    @keyframes ws-breathe {0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.72;transform:scale(1.1)}}
    @keyframes ws-breathe2{0%,100%{opacity:.2;transform:scale(1)}50%{opacity:.48;transform:scale(1.07)}}
    @keyframes ws-float   {0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
    @keyframes ws-steam   {0%{opacity:0;transform:translateY(0) scaleX(1)}20%{opacity:.58}80%{opacity:.18}100%{opacity:0;transform:translateY(-68px) scaleX(2.6) rotate(5deg)}}
    @keyframes ws-ring    {0%{box-shadow:0 0 0 0 rgba(200,146,42,.5),0 0 28px rgba(200,146,42,.25)}70%{box-shadow:0 0 0 13px rgba(200,146,42,0),0 0 28px rgba(200,146,42,.25)}100%{box-shadow:0 0 0 0 rgba(200,146,42,0),0 0 28px rgba(200,146,42,.25)}}
    @keyframes ws-numPop  {0%{opacity:0;transform:scale(1.5)}100%{opacity:1;transform:scale(1)}}
    @keyframes ws-shimmer {0%,100%{opacity:.05}50%{opacity:.18}}
    @keyframes ws-iconIn  {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes ws-exit    {from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(1.06)}}
  `;

  return(
    <div style={{position:"fixed",inset:0,zIndex:999,background:"#030201",overflow:"hidden",
      display:"flex",flexDirection:"column",alignItems:"center",
      animation:exiting?`ws-exit 0.55s cubic-bezier(0.4,0,1,1) both`:undefined}}>
      <style>{WS}</style>

      {/* Layered bg */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",background:`radial-gradient(ellipse 90% 70% at 50% 35%, #2A1A06 0%, #0F0A04 45%, #030201 100%)`}}/>
      <div style={{position:"absolute",top:"-5%",left:"50%",transform:"translateX(-50%)",width:"60%",height:"45%",pointerEvents:"none",background:`radial-gradient(ellipse at 50% 0%, rgba(200,146,42,0.2) 0%, rgba(200,146,42,0.07) 40%, transparent 75%)`,animation:"ws-breathe 5s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:"10%",left:"50%",transform:"translateX(-50%)",width:"80%",height:"40%",pointerEvents:"none",background:`radial-gradient(ellipse at 50% 100%, rgba(120,60,10,0.32) 0%, rgba(80,35,5,0.12) 50%, transparent 75%)`,animation:"ws-breathe2 6s 1s ease-in-out infinite"}}/>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:.022,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(255,255,255,.06) 1px,rgba(255,255,255,.06) 2px)",backgroundSize:"100% 4px"}}/>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",background:`radial-gradient(ellipse 110% 110% at 50% 50%, transparent 50%, rgba(2,1,0,0.65) 100%)`}}/>
      {/* Gold frame */}
      <div style={{position:"absolute",inset:8,borderRadius:20,pointerEvents:"none",border:"1px solid rgba(200,146,42,0.16)"}}/>
      {[{top:8,left:8,borderTop:"2px solid",borderLeft:"2px solid",borderRadius:"20px 0 0 0"},
        {top:8,right:8,borderTop:"2px solid",borderRight:"2px solid",borderRadius:"0 20px 0 0"},
        {bottom:8,left:8,borderBottom:"2px solid",borderLeft:"2px solid",borderRadius:"0 0 0 20px"},
        {bottom:8,right:8,borderBottom:"2px solid",borderRight:"2px solid",borderRadius:"0 0 20px 0"},
      ].map((s,i)=><div key={i} style={{position:"absolute",width:28,height:28,pointerEvents:"none",borderColor:"rgba(200,146,42,0.5)",opacity:phase>=1?1:0,transition:`opacity 0.8s ${i*.15}s ease`,...s}}/>)}

      {/* Coffee beans */}
      {BEANS.map((b,i)=>(
        <div key={i} style={{position:"absolute",left:`${b.x}%`,top:`${b.y}%`,
          width:14*b.s,height:20*b.s,borderRadius:"50% 50% 50% 50% / 60% 60% 40% 40%",
          background:`radial-gradient(ellipse at 35% 35%, #6B3A12, #2A1205)`,
          transform:`rotate(${b.r}deg)`,opacity:phase>=1?0.52:0,
          transition:`opacity 0.8s ${0.3+b.d}s ease`,
          boxShadow:`0 2px 5px rgba(0,0,0,0.55)`,
          animation:phase>=1?`ws-float ${3+b.d}s ${b.d}s ease-in-out infinite`:undefined}}>
          <div style={{position:"absolute",top:"50%",left:"10%",right:"10%",height:1,background:"rgba(0,0,0,0.35)",borderRadius:1}}/>
        </div>
      ))}

      {/* Content */}
      <div style={{position:"relative",zIndex:10,width:"100%",maxWidth:420,flex:1,
        display:"flex",flexDirection:"column",alignItems:"center",
        padding:"0 28px",justifyContent:"space-between",
        paddingTop:"8dvh",paddingBottom:"6dvh"}}>

        {/* Logo */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",
          opacity:phase>=1?1:0,transform:phase>=1?"translateY(0) scale(1)":"translateY(-20px) scale(0.88)",
          transition:`all 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.1s`}}>
          <div style={{position:"relative",marginBottom:4}}>
            <div style={{position:"absolute",inset:-10,borderRadius:"50%",background:`radial-gradient(circle, rgba(200,146,42,0.16) 0%, transparent 70%)`,animation:"ws-breathe 3.5s ease-in-out infinite"}}/>
            <div style={{position:"absolute",inset:-4,borderRadius:"50%",border:"1px solid rgba(200,146,42,0.28)",animation:"ws-ring 2.5s ease-in-out infinite"}}/>
            <div style={{width:108,height:108,borderRadius:"50%",overflow:"hidden",border:"2.5px solid rgba(200,146,42,0.55)",
              boxShadow:`0 0 0 1px rgba(200,146,42,0.1), 0 8px 32px rgba(0,0,0,0.8), 0 0 40px rgba(200,146,42,0.12)`,
              background:"#0D0904",animation:"ws-float 4s ease-in-out infinite"}}>
              <img src="/logo-large.png" alt="GB" style={{width:"100%",height:"100%",objectFit:"cover"}}
                onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{textAlign:"center",width:"100%"}}>
          <p style={{fontSize:11,letterSpacing:".36em",textTransform:"uppercase",color:"rgba(200,146,42,0.72)",fontFamily:"'DM Mono',monospace",fontWeight:400,margin:"0 0 9px",opacity:phase>=1?1:0,transform:phase>=1?"none":"translateY(12px)",transition:`all 0.7s ease 0.4s`}}>WELCOME TO</p>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(44px,12vw,66px)",fontWeight:600,color:"#F5EDD8",margin:"0 0 4px",lineHeight:.95,letterSpacing:"-.015em",textShadow:"0 4px 32px rgba(200,146,42,0.18)",opacity:phase>=1?1:0,transform:phase>=1?"none":"translateY(18px)",transition:`all 0.8s ease 0.5s`}}>Golden Beans</h1>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,margin:"8px 0 6px",opacity:phase>=1?1:0,transition:`opacity 0.7s 0.68s ease`}}>
            <div style={{height:1,width:50,background:"linear-gradient(to right, transparent, rgba(200,146,42,0.55))"}}/>
            <span style={{fontSize:13,color:"rgba(200,146,42,0.65)"}}>🍃☕🍃</span>
            <div style={{height:1,width:50,background:"linear-gradient(to left, transparent, rgba(200,146,42,0.55))"}}/>
          </div>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:400,fontStyle:"italic",color:"rgba(200,146,42,0.78)",margin:0,letterSpacing:".06em",opacity:phase>=1?1:0,transform:phase>=1?"none":"translateY(10px)",transition:`all 0.7s ease 0.65s`}}>Cafe &amp; Bistro</p>
        </div>

        {/* Coffee cup */}
        <div style={{position:"relative",width:"100%",maxWidth:260,
          opacity:phase>=1?1:0,transform:phase>=1?"none":"scale(0.85) translateY(20px)",
          transition:`all 1s cubic-bezier(0.34,1.56,0.64,1) 0.55s`,
          animation:phase>=1?"ws-float 5s 1s ease-in-out infinite":undefined}}>
          <div style={{position:"absolute",bottom:"-5%",left:"50%",transform:"translateX(-50%)",width:"80%",height:"40%",background:`radial-gradient(ellipse, rgba(150,75,10,0.38) 0%, transparent 70%)`,filter:"blur(12px)",animation:"ws-breathe2 4s ease-in-out infinite"}}/>
          {[{l:"30%",d:0,w:5,h:30},{l:"43%",d:.5,w:6,h:38},{l:"54%",d:.9,w:4,h:26},{l:"64%",d:.3,w:5,h:34},{l:"73%",d:1.2,w:3,h:22}].map((s,i)=>(
            <div key={i} style={{position:"absolute",bottom:"62%",left:s.l,width:s.w,height:s.h,borderRadius:99,background:`linear-gradient(to top, rgba(240,180,80,0.42), rgba(255,220,140,0.08), transparent)`,filter:"blur(2px)",opacity:0,animation:`ws-steam ${2.1+i*.4}s ${s.d}s ease-out infinite`}}/>
          ))}
          <img src="/coffee-cup.png" alt="Coffee"
            style={{width:"100%",position:"relative",zIndex:2,filter:"drop-shadow(0 12px 32px rgba(0,0,0,0.8)) drop-shadow(0 0 40px rgba(120,60,10,0.38))"}}
            onError={e=>{
              const el=e.target as HTMLImageElement;el.style.display="none";
              const p=el.parentElement!;
              const fb=document.createElement("div");
              fb.style.cssText=`width:180px;height:180px;margin:0 auto;border-radius:50%;background:radial-gradient(ellipse at 40% 30%,#5C2E0A,#1A0A03);display:flex;align-items:center;justify-content:center;font-size:82px;position:relative;z-index:2;border:2px solid rgba(200,146,42,0.3);box-shadow:0 0 40px rgba(120,60,10,0.35)`;
              fb.textContent="☕";p.appendChild(fb);
            }}/>
        </div>

        {/* Countdown ring */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,
          opacity:phase>=1?1:0,transform:phase>=1?"none":"translateY(20px) scale(0.88)",
          transition:`all 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.75s`}}>
          <div style={{position:"relative",width:118,height:118}}>
            <div style={{position:"absolute",inset:-6,borderRadius:"50%",background:`radial-gradient(circle, rgba(200,146,42,0.14) 0%, transparent 70%)`,animation:"ws-breathe 2.5s ease-in-out infinite"}}/>
            {RPTS.map((p,i)=>{
              const rad=(p.angle-90)*Math.PI/180;
              const px=59+p.r*Math.cos(rad),py=59+p.r*Math.sin(rad);
              return<div key={i} style={{position:"absolute",left:px-p.size/2,top:py-p.size/2,width:p.size,height:p.size,borderRadius:"50%",background:`rgba(200,146,42,${.35+i*.03})`,boxShadow:`0 0 ${p.size*2}px rgba(200,146,42,0.55)`,animation:`ws-shimmer ${1.8+i*.1}s ${p.delay}s ease-in-out infinite`}}/>;
            })}
            <svg width={118} height={118} style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
              <circle cx={59} cy={59} r={52} fill="none" stroke="rgba(200,146,42,0.11)" strokeWidth={3}/>
              <circle cx={59} cy={59} r={52} fill="none" stroke="url(#wsGrad)" strokeWidth={3.5} strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={circumference-filled}
                style={{transition:"stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)",filter:"drop-shadow(0 0 4px rgba(200,146,42,0.8))"}}/>
              <defs><linearGradient id="wsGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#C8922A"/><stop offset="50%" stopColor="#F5CC6A"/><stop offset="100%" stopColor="#E8B84B"/></linearGradient></defs>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <span key={numKey} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:600,color:"#F5CC6A",lineHeight:1,textShadow:`0 0 20px rgba(200,146,42,0.8)`,animation:`ws-numPop 0.4s cubic-bezier(0.34,1.56,0.64,1)`}}>{n}</span>
              <span style={{fontSize:7.5,color:"rgba(200,146,42,0.58)",fontFamily:"'DM Mono',monospace",letterSpacing:".1em",textTransform:"uppercase",marginTop:2,textAlign:"center",lineHeight:1.3}}>GETTING THINGS<br/>READY FOR YOU</span>
            </div>
          </div>
        </div>

        {/* Bottom icons */}
        <div style={{display:"flex",justifyContent:"space-around",width:"100%",
          opacity:phase>=1?1:0,transition:`opacity 0.8s 0.9s ease`}}>
          {[{icon:"☕",label:"PREMIUM COFFEE"},{icon:"🌿",label:"QUALITY INGREDIENTS"},{icon:"❤️",label:"MADE WITH LOVE"}].map((item,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,
              animation:phase>=1?`ws-iconIn 0.6s ${0.9+i*.12}s ease both`:undefined,opacity:0}}>
              <div style={{width:33,height:33,borderRadius:"50%",border:"1px solid rgba(200,146,42,0.28)",background:"rgba(200,146,42,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{item.icon}</div>
              <span style={{fontSize:7.5,color:"rgba(200,146,42,0.52)",fontFamily:"'DM Mono',monospace",letterSpacing:".08em",textTransform:"uppercase",textAlign:"center",lineHeight:1.3}}>{item.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function SecurityCheckScreen({ onPassed, onFailed }: { onPassed:()=>void; onFailed:(r:SecRes)=>void }) {
  type CS = "pending"|"loading"|"ok"|"fail";
  const [gps,setGps]=useState<CS>("pending");
  const [net,setNet]=useState<CS>("pending");
  const [welcome,setWelcome]=useState(false);
  useEffect(()=>{
    let ok=true;
    async function run(){
      try{
        setGps("loading"); await new Promise(r=>setTimeout(r,420));
        const api=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
        const s=(await fetch(`${api}/security/settings`).then(r=>r.json())).data;
        if(s&&!s.ipWhitelistEnabled&&!s.geofenceEnabled){if(ok){setGps("ok");setNet("ok");setWelcome(true);}return;}
        if(!("geolocation"in navigator)){if(ok){setGps("fail");await new Promise(r=>setTimeout(r,500));onFailed({allowed:false,ipAllowed:false,gpsAllowed:false,gpsRequired:true,ipRequired:true,distance:null,cafeName:"Golden Beans",cafeAddress:"",cafePhone:"",wifiName:"GoldenBeans-WiFi",reason:"GPS not supported"});}return;}
        let pos:GeolocationPosition|null=null;
        if(s?.geofenceEnabled)pos=await new Promise<GeolocationPosition>((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:true,timeout:15000,maximumAge:0})).catch(e=>{throw new Error(e.code===1?"DENIED":"TIMEOUT");});
        if(ok)setGps("ok");
        await new Promise(r=>setTimeout(r,500));
        if(ok)setNet("loading");
        const res=await fetch(`${api}/security/check`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({latitude:pos?.coords.latitude,longitude:pos?.coords.longitude})});
        const d=await res.json();
        if(!d.success)throw new Error(d.message);
        const r=d.data;
        if(ok){if(r.securityDisabled){setGps("ok");setNet("ok");setWelcome(true);return;}setGps(r.gpsAllowed?"ok":"fail");setNet(r.ipAllowed?"ok":"fail");await new Promise(x=>setTimeout(x,750));if(r.allowed)setWelcome(true);else onFailed(r);}
      }catch(e:unknown){
        if(!ok)return;
        const m=e instanceof Error?e.message:"";
        const gf=m==="DENIED"||m.includes("denied");
        if(gf||m==="TIMEOUT")setGps("fail");else setNet("fail");
        await new Promise(r=>setTimeout(r,750));
        onFailed({allowed:false,ipAllowed:true,gpsAllowed:!gf,gpsRequired:true,ipRequired:true,distance:null,cafeName:"Golden Beans",cafeAddress:"Pramukh Darshan, Dabholi, Surat",cafePhone:"",wifiName:"GoldenBeans-WiFi",reason:gf?"Location access denied":m==="TIMEOUT"?"Location timed out":"Connect to cafe WiFi"});
      }
    }
    run(); return()=>{ok=false;};
  },[onPassed,onFailed]);

  if(welcome)return<WelcomeScreen onDone={onPassed}/>;

  const Row=({state,icon,title,sub}:{state:CS;icon:string;title:string;sub:string})=>{
    const col=state==="ok"?C.emerald:state==="fail"?C.ruby:state==="loading"?C.gold:C.inkGh;
    return(
      <div style={{background:C.gl1,border:`1px solid ${col}28`,borderRadius:16,padding:"14px 17px",display:"flex",alignItems:"center",gap:13,marginBottom:10,transition:`all 0.4s ${EASE}`}}>
        <span style={{fontSize:21}}>{icon}</span>
        <div style={{flex:1}}><p style={{fontSize:13,fontWeight:600,color:col,margin:"0 0 2px",fontFamily:"'DM Sans',sans-serif"}}>{title}</p><p style={{fontSize:11,color:C.inkSub,margin:0,fontFamily:"'DM Sans',sans-serif"}}>{sub}</p></div>
        {state==="loading"&&<div style={{width:18,height:18,borderRadius:"50%",border:`2.5px solid ${col}30`,borderTopColor:col,animation:"spin 0.72s linear infinite"}}/>}
        {state==="ok"&&<div style={{width:22,height:22,borderRadius:"50%",background:C.emerald,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,animation:"scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}>✓</div>}
        {state==="fail"&&<div style={{width:22,height:22,borderRadius:"50%",background:C.ruby,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>✗</div>}
      </div>
    );
  };
  return(
    <div style={{minHeight:"100dvh",background:C.void,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{maxWidth:340,width:"100%",textAlign:"center"}}>
        <div style={{width:76,height:76,borderRadius:"50%",overflow:"hidden",margin:"0 auto 20px",border:`1.5px solid ${C.g40}`,boxShadow:`0 0 36px ${C.g25}`}}>
          <img src="/logo-large.png" alt="GB" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        </div>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:500,color:C.ink,margin:"0 0 6px"}}>Verifying Access</h2>
        <p style={{fontSize:12,color:C.inkSub,margin:"0 0 26px",fontFamily:"'DM Sans',sans-serif"}}>Confirming you're at Golden Beans</p>
        <Row state={gps} icon="📍" title="Location" sub={gps==="loading"?"Getting your location...":gps==="ok"?"You're at the cafe ✓":gps==="fail"?"Location not verified":"Waiting..."}/>
        <Row state={net} icon="📶" title="Network"  sub={net==="loading"?"Verifying network...":net==="ok"?"Cafe network confirmed ✓":net==="fail"?"Not on cafe network":"Waiting..."}/>
        <p style={{fontSize:10,color:C.inkGh,marginTop:18,fontFamily:"'DM Mono',monospace",letterSpacing:".06em"}}>🔒 SECURE · PRIVATE · PROTECTED</p>
      </div>
    </div>
  );
}

function AwarenessScreen({ result, onRetry }: { result:SecRes; onRetry:()=>void }) {
  return(
    <div style={{minHeight:"100dvh",background:C.void,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{maxWidth:360,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:56,marginBottom:14,animation:"floatY 3s ease-in-out infinite"}}>🚫</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:500,color:C.gold,margin:"0 0 10px"}}>Access Restricted</h1>
        <p style={{fontSize:13.5,color:C.inkSub,margin:"0 0 26px",lineHeight:1.7,fontFamily:"'DM Sans',sans-serif"}}>{result.reason}</p>
        {!result.ipAllowed&&<div style={{background:C.gl1,border:`1px solid ${C.g15}`,borderRadius:14,padding:14,marginBottom:9,textAlign:"left"}}><p style={{color:C.gold,fontWeight:600,fontSize:13,margin:"0 0 2px",fontFamily:"'DM Sans',sans-serif"}}>📶 Connect to Cafe WiFi</p><p style={{color:C.inkSub,fontSize:12,margin:0,fontFamily:"'DM Sans',sans-serif"}}>{result.wifiName}</p></div>}
        {!result.gpsAllowed&&<div style={{background:C.gl1,border:`1px solid ${C.g15}`,borderRadius:14,padding:14,marginBottom:9,textAlign:"left"}}><p style={{color:C.gold,fontWeight:600,fontSize:13,margin:"0 0 2px",fontFamily:"'DM Sans',sans-serif"}}>📍 Enable Location</p><p style={{color:C.inkSub,fontSize:12,margin:0,fontFamily:"'DM Sans',sans-serif"}}>{result.distance?`${result.distance}m from cafe`:"Allow in browser settings"}</p></div>}
        <button onClick={onRetry} className="press" style={{width:"100%",padding:"16px",borderRadius:14,border:"none",background:GG,color:C.void,fontWeight:700,fontSize:15,fontFamily:"'DM Sans',sans-serif",boxShadow:`0 8px 24px ${C.g25}`,marginTop:6,cursor:"pointer"}}>Try Again</button>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════
// C-COMPONENTS: Hero, GlassBar, Card, Row, Compact
// ═══════════════════════════════════════════════════

function CHero({items,cart,onTap,onExplore,greeting,name,mktBanners=[]}:{items:MenuItem[];cart:ECI[];onTap:(i:MenuItem)=>void;onExplore:()=>void;greeting:string;name?:string;mktBanners?:any[]}) {
  const [active,setActive]=useState(0);
  const [drag,setDrag]=useState(0);
  const [isDrag,setIsDrag]=useState(false);
  const [shown,setShown]=useState(false);
  const sx=useRef(0);const tmr=useRef<NodeJS.Timeout|null>(null);
  // Use marketing banners if admin set them, else fall back to menu items
  const mktSlides=mktBanners.map(b=>({_id:b._id,name:b.title,description:b.subtitle,price:0,isAvailable:true,imageUrl:b.imageUrl,_bg:b.bg,_btn:b.btn,_tag:b.tag,_opacity:b.opacity,_isMkt:true}));
  const slides:(MenuItem|any)[]= mktSlides.length>0?mktSlides:items.filter(i=>i.isAvailable).slice(0,5);
  const next=useCallback(()=>setActive(p=>(p+1)%slides.length),[slides.length]);
  const prev=useCallback(()=>setActive(p=>(p-1+slides.length)%slides.length),[slides.length]);
  useEffect(()=>{const t=setTimeout(()=>setShown(true),60);return()=>clearTimeout(t);},[]);
  useEffect(()=>{if(isDrag||!slides.length)return;tmr.current=setInterval(next,5400);return()=>{if(tmr.current)clearInterval(tmr.current);};},[next,isDrag,active,slides.length]);
  if(!slides.length)return null;
  const s=slides[active];
  const qty=cart.filter(c=>c.menuItemId===s._id).reduce((t,c)=>t+c.quantity,0);
  return(
    <div style={{position:"relative",width:"100%",height:"100svh",maxHeight:680,minHeight:460,overflow:"hidden",background:C.void,userSelect:"none"}}
      onTouchStart={e=>{setIsDrag(true);sx.current=e.touches[0].clientX;if(tmr.current)clearInterval(tmr.current);}}
      onTouchMove={e=>{if(isDrag)setDrag(e.touches[0].clientX-sx.current);}}
      onTouchEnd={()=>{if(Math.abs(drag)>46)drag<0?next():prev();setIsDrag(false);setDrag(0);}}
      onMouseDown={e=>{setIsDrag(true);sx.current=e.clientX;}}
      onMouseMove={e=>{if(isDrag)setDrag(e.clientX-sx.current);}}
      onMouseUp={()=>{if(Math.abs(drag)>46)drag<0?next():prev();setIsDrag(false);setDrag(0);}}>
      {/* Images */}
      {slides.map((sl,i)=>(
        <div key={sl._id} style={{position:"absolute",inset:"-5%",transition:isDrag?"none":`all 0.75s ${EASE}`,opacity:i===active?1:0,
          transform:i===active?`translateX(${drag*.4}px) scale(1)`:i<active?`translateX(calc(-110% + ${drag*.4}px)) scale(.96)`:`translateX(calc(110% + ${drag*.4}px)) scale(.96)`,zIndex:i===active?1:0}}>
          {sl.imageUrl?<img src={getHeroUrl(sl.imageUrl)} alt={sl.name} style={{width:"100%",height:"100%",objectFit:"cover",animation:i===active?"kBurns 10s ease-out forwards":"none"}}/>
          :<div style={{width:"100%",height:"100%",background:`radial-gradient(ellipse 80% 80% at 60% 40%,#3D2010 0%,#1A0E06 40%,${C.void} 100%)`}}/>}
        </div>
      ))}
      {/* Vignettes */}
      <div style={{position:"absolute",inset:0,zIndex:3,pointerEvents:"none",background:`linear-gradient(to top,${C.void} 0%,rgba(11,9,6,.9) 16%,rgba(11,9,6,.6) 34%,rgba(11,9,6,.22) 54%,transparent 72%)`}}/>
      <div style={{position:"absolute",inset:0,zIndex:3,pointerEvents:"none",background:`linear-gradient(to right,rgba(11,9,6,.88) 0%,rgba(11,9,6,.5) 38%,transparent 68%)`}}/>
      <div style={{position:"absolute",top:"-10%",right:"-5%",width:"55%",height:"60%",zIndex:2,pointerEvents:"none",background:`radial-gradient(ellipse at top right,${C.g08} 0%,transparent 65%)`,animation:"breathG 6s ease-in-out infinite"}}/>
      {/* Steam */}
      {[0,1,2,3].map(i=><div key={i} style={{position:"absolute",zIndex:4,pointerEvents:"none",bottom:"28%",left:`${36+i*6}%`,width:5+i*1.5,height:28+i*8,borderRadius:99,background:`linear-gradient(to top,rgba(245,204,106,.32),transparent)`,animation:`smokeUp ${2.4+i*.5}s ${i*.65}s ease-out infinite`,filter:"blur(2px)",opacity:0}}/>)}
      {/* Scan lines */}
      <div style={{position:"absolute",inset:0,zIndex:4,pointerEvents:"none",opacity:.018,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(255,255,255,.05) 1px,rgba(255,255,255,.05) 2px)",backgroundSize:"100% 4px"}}/>
      {/* Content */}
      <div style={{position:"absolute",inset:0,zIndex:5,display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"0 22px 38px"}}>
        {shown&&<div style={{marginBottom:6,animation:`fadeRise 0.55s .08s ${EASE} both`}}><span style={{fontSize:11.5,color:C.goldM,fontFamily:"'DM Sans',sans-serif",fontWeight:500,letterSpacing:".12em",textTransform:"uppercase"}}>{greeting}{name?`, ${name}`:""} ✦</span></div>}
        {shown&&<div style={{marginBottom:15,animation:`fadeRise 0.65s .18s ${EASE} both`}}>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(36px,11vw,56px)",fontWeight:300,color:C.ink,lineHeight:1.06,margin:0,letterSpacing:"-.01em"}}>
            Brewed to<br/><em style={{fontStyle:"italic",fontWeight:600,color:C.goldL}}>perfection,</em><br/><span style={{fontWeight:300}}>just for you.</span>
          </h1>
        </div>}
        {shown&&<div style={{marginBottom:22,animation:`fadeRise 0.65s .3s ${EASE} both`}}><p style={{fontSize:12.5,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",fontWeight:400,margin:0,lineHeight:1.5,maxWidth:230}}>{s.description||"Handcrafted with rare single-origin beans."}</p></div>}
        {shown&&<div style={{display:"flex",gap:12,alignItems:"center",animation:`fadeRise 0.65s .42s ${EASE} both`}}>
          <button onClick={onExplore} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(200,146,42,0.16)",backdropFilter:"blur(20px)",border:"1px solid rgba(200,146,42,0.38)",borderRadius:99,padding:"11px 22px",color:C.goldL,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",boxShadow:"inset 0 1px 0 rgba(255,255,255,.07)"}}>
            Explore Menu <svg width={14} height={14} viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke={C.goldL} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button onClick={()=>{ if((s as any)._isMkt){ onExplore(); } else { onTap(s as MenuItem); } }} style={{position:"relative",width:46,height:46,borderRadius:"50%",background:qty>0?GG:"rgba(200,146,42,0.11)",border:`1.5px solid ${qty>0?C.goldM:"rgba(200,146,42,0.42)"}`,color:qty>0?C.void:C.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,fontWeight:800,backdropFilter:"blur(12px)",transition:`all 0.3s ${SPR}`}}>
            {qty>0?"✓":"+"}
            {qty>0&&<div style={{position:"absolute",top:-5,right:-5,width:18,height:18,borderRadius:"50%",background:GG,color:C.void,fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${C.void}`,animation:"cartPop .45s ease",fontFamily:"'DM Mono',monospace"}}>{qty}</div>}
          </button>
        </div>}
      </div>
      {/* Dot nav */}
      <div style={{position:"absolute",right:18,bottom:"50%",transform:"translateY(50%)",zIndex:6,display:"flex",flexDirection:"column",gap:6,alignItems:"center"}}>
        <span style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",fontWeight:500,marginBottom:4}}>0{active+1}</span>
        {slides.map((_,i)=><button key={i} onClick={()=>setActive(i)} style={{width:i===active?2.5:2,height:i===active?22:7,borderRadius:99,background:i===active?GGV:"rgba(200,146,42,.25)",border:"none",cursor:"pointer",padding:0,transition:`all 0.4s ${SPR}`}}/>)}
        <span style={{fontSize:10,color:C.inkGh,fontFamily:"'DM Mono',monospace",marginTop:4}}>0{slides.length}</span>
      </div>
      {/* Item name */}
      {shown&&<div style={{position:"absolute",right:22,bottom:88,zIndex:6,textAlign:"right",animation:`fadeRise 0.6s .5s ${EASE} both`}}>
        <p style={{fontSize:10.5,color:C.gold,fontFamily:"'DM Mono',monospace",margin:"0 0 3px",letterSpacing:".1em",textTransform:"uppercase"}}>Featured</p>
        <p style={{fontSize:15,color:C.ink,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,margin:"0 0 1px"}}>{s.name}</p>
        <p style={{fontSize:13,color:C.gold,fontFamily:"'DM Mono',monospace"}}>₹{s.price}</p>
      </div>}
    </div>
  );
}

function CGlassBar({cats,active,onSelect}:{cats:MenuCategory[];active:string;onSelect:(id:string)=>void}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const el=ref.current?.querySelector('[data-active="true"]') as HTMLElement;el?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});},[active]);
  return(
    <div style={{padding:"22px 0 8px"}}>
      <div style={{padding:"0 22px",marginBottom:11}}><span style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".18em",textTransform:"uppercase"}}>✦ Explore</span></div>
      <div ref={ref} className="hs" style={{display:"flex",gap:10,overflowX:"auto",padding:"4px 22px 8px"}}>
        {cats.map((cat,idx)=>{const isA=cat._id===active;return(
          <button key={cat._id} data-active={isA} onClick={()=>onSelect(cat._id)}
            style={{flexShrink:0,display:"flex",alignItems:"center",gap:8,background:isA?`linear-gradient(135deg,rgba(200,146,42,.22),rgba(232,184,75,.12))`:C.gl1,backdropFilter:"blur(24px)",border:`1px solid ${isA?"rgba(200,146,42,.52)":C.glBd}`,borderRadius:99,padding:"9px 18px 9px 12px",cursor:"pointer",transition:`all 0.32s ${SPR}`,animation:`stgIn 0.45s ${idx*.06}s ${EASE} both`,position:"relative",overflow:"hidden",
            boxShadow:isA?`0 0 24px ${C.g15},inset 0 1px 0 rgba(255,255,255,.06)`:"inset 0 1px 0 rgba(255,255,255,.04)"}}>
            {isA&&<div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",borderRadius:99}}><div style={{position:"absolute",top:0,left:0,width:"30%",height:"100%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent)",animation:"sweep 2.5s ease-in-out infinite"}}/></div>}
            <span style={{fontSize:20,lineHeight:1}}>{cat.icon}</span>
            <span style={{fontSize:12.5,fontWeight:isA?700:500,color:isA?C.goldL:C.inkSub,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{cat.name}</span>
            {isA&&<div style={{width:5,height:5,borderRadius:"50%",background:C.gold,boxShadow:`0 0 6px ${C.gold}`,marginLeft:2}}/>}
          </button>
        );})}
      </div>
    </div>
  );
}

function CCard({item,qty,isFav,onFav,onTap,delay=0,size="normal"}:{item:MenuItem;qty:number;isFav:boolean;onFav:()=>void;onTap:()=>void;delay?:number;size?:"normal"|"large"|"compact"}) {
  const [pressed,setPressed]=useState(false);
  const [rp,setRp]=useState<{x:number;y:number}|null>(null);
  const W=size==="large"?218:size==="compact"?148:170;
  const H=size==="large"?178:size==="compact"?126:154;
  const tap=(e:React.MouseEvent)=>{if(!item.isAvailable)return;const r=(e.currentTarget as HTMLElement).getBoundingClientRect();setRp({x:e.clientX-r.left,y:e.clientY-r.top});setTimeout(()=>setRp(null),700);onTap();};
  return(
    <div onClick={tap} onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{flexShrink:0,width:W,borderRadius:20,overflow:"hidden",cursor:item.isAvailable?"pointer":"not-allowed",opacity:item.isAvailable?1:.4,
        background:`linear-gradient(160deg,${C.raise} 0%,${C.surface} 100%)`,
        border:`1px solid ${qty>0?"rgba(200,146,42,0.45)":C.glBd}`,
        boxShadow:qty>0?`0 0 0 1px ${C.g15},0 8px 32px ${C.g15},0 2px 8px rgba(0,0,0,.6)`:"0 4px 20px rgba(0,0,0,.5)",
        transform:pressed?"scale(0.955) translateY(2px)":"scale(1)",transition:`all 0.28s ${SPR}`,
        animation:`stgIn 0.5s ${delay}s ${EASE} both`,position:"relative"}}>
      <div style={{position:"relative",height:H,overflow:"hidden"}}>
        {item.imageUrl?<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .5s ease",transform:pressed?"scale(1.06)":"scale(1.01)"}} loading="lazy"/>
        :<div style={{width:"100%",height:"100%",background:`radial-gradient(ellipse at 50% 30%,#3D2010,${C.surface})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:50,opacity:.7}}>☕</div>}
        <div style={{position:"absolute",inset:0,background:`linear-gradient(to top,${C.surface} 0%,rgba(26,23,18,.55) 44%,transparent 68%)`}}/>
        {item.tags?.includes("bestseller")&&<div style={{position:"absolute",top:9,left:9,background:GG,color:C.void,fontSize:8.5,fontWeight:800,padding:"2.5px 9px",borderRadius:99,letterSpacing:".06em",fontFamily:"'DM Sans',sans-serif",boxShadow:`0 2px 8px ${C.g40}`}}>⭐ BEST</div>}
        {!item.isAvailable&&<div style={{position:"absolute",inset:0,background:"rgba(2,1,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:9,color:"rgba(255,255,255,.55)",fontFamily:"'DM Mono',monospace",letterSpacing:".1em",textTransform:"uppercase"}}>Sold Out</span></div>}
        {qty>0&&<div style={{position:"absolute",top:8,right:38,width:21,height:21,borderRadius:"50%",background:GG,color:C.void,fontSize:9.5,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${C.surface}`,animation:"cartPop .45s ease",fontFamily:"'DM Mono',monospace"}}>{qty}</div>}
        <button onClick={e=>{e.stopPropagation();onFav();}} style={{position:"absolute",top:8,right:8,width:29,height:29,borderRadius:"50%",background:"rgba(2,1,0,0.65)",backdropFilter:"blur(8px)",border:`1px solid ${isFav?"rgba(239,68,68,.55)":C.glBd}`,color:isFav?"#ef4444":C.inkSub,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,transition:`all .2s ${EASE}`}}>{isFav?"❤":"🤍"}</button>
        <div style={{position:"absolute",bottom:9,left:10}}>
          <span style={{fontSize:16,fontWeight:500,color:C.gold,fontFamily:"'DM Mono',monospace"}}>₹{item.price}</span>
        </div>
        {rp&&<div style={{position:"absolute",left:rp.x-18,top:rp.y-18,width:36,height:36,borderRadius:"50%",background:"rgba(200,146,42,.32)",animation:"ripOut .7s ease-out forwards",pointerEvents:"none"}}/>}
      </div>
      <div style={{padding:"9px 11px 11px"}}>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:C.ink,margin:"0 0 3px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</p>
        {size!=="compact"&&<p style={{fontSize:10.5,color:C.inkDim,margin:"0 0 8px",lineHeight:1.45,fontFamily:"'DM Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.description||"Artisanal quality"}</p>}
        <button onClick={e=>{e.stopPropagation();if(item.isAvailable)onTap();}} style={{width:"100%",padding:"8px 0",borderRadius:10,border:`1px solid ${qty>0?"rgba(200,146,42,.5)":C.glBd}`,background:qty>0?`linear-gradient(135deg,${C.g15},${C.g08})`:C.gl1,color:qty>0?C.goldL:C.inkDim,fontWeight:600,fontSize:11.5,cursor:item.isAvailable?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:`all .22s ${EASE}`}}>
          {qty>0?<><span>✓</span>Added ({qty})</>:<><span style={{fontSize:14,fontWeight:700}}>+</span>Add</>}
        </button>
      </div>
    </div>
  );
}

function CRow({title,eyebrow,items,cart,onTap,favs,onFav,featured=false}:{title:string;eyebrow?:string;items:MenuItem[];cart:ECI[];onTap:(i:MenuItem)=>void;favs:Set<string>;onFav:(id:string)=>void;featured?:boolean}) {
  if(!items.length)return null;
  return(
    <section style={{marginBottom:38,position:"relative"}}>
      <div style={{padding:"0 22px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>{eyebrow&&<p style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".15em",textTransform:"uppercase",margin:"0 0 4px"}}>{eyebrow}</p>}<h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:C.ink,margin:0}}>{title}</h3></div>
        <button style={{fontSize:12,color:C.gold,background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,opacity:.75,display:"flex",alignItems:"center",gap:4}}>See all<svg width={12} height={12} viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4" stroke={C.gold} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      </div>
      <div className="hs" style={{display:"flex",gap:12,overflowX:"auto",padding:"4px 22px 12px",scrollSnapType:"x mandatory"}}>
        {items.map((item,idx)=>{const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);return(<div key={item._id} style={{flexShrink:0,scrollSnapAlign:"start"}}><CCard item={item} qty={qty} isFav={favs.has(item._id)} onFav={()=>onFav(item._id)} onTap={()=>onTap(item)} delay={idx*.055} size={featured&&idx===0?"large":idx>3?"compact":"normal"}/></div>);})}
      </div>
      <div style={{position:"absolute",right:0,top:"30%",width:52,height:"50%",pointerEvents:"none",background:`linear-gradient(to left,${C.deep},transparent)`}}/>
    </section>
  );
}

function CCompact({title,eyebrow,items,cart,onTap}:{title:string;eyebrow?:string;items:MenuItem[];cart:ECI[];onTap:(i:MenuItem)=>void}) {
  if(!items.length)return null;
  return(
    <section style={{marginBottom:34,padding:"0 22px"}}>
      <div style={{marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>{eyebrow&&<p style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".15em",textTransform:"uppercase",margin:"0 0 4px"}}>{eyebrow}</p>}<h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,fontWeight:600,color:C.ink,margin:0}}>{title}</h3></div>
        <button style={{fontSize:12,color:C.gold,background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>See all</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {items.slice(0,5).map((item,idx)=>{
          const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
          return(
            <div key={item._id} onClick={()=>item.isAvailable&&onTap(item)}
              style={{display:"flex",gap:12,alignItems:"center",background:`linear-gradient(135deg,${C.surface},${C.raise})`,borderRadius:16,padding:"11px 13px",
                border:`1px solid ${qty>0?"rgba(200,146,42,.38)":C.glBd}`,
                boxShadow:qty>0?`0 0 0 1px ${C.g08},0 4px 16px rgba(0,0,0,.4)`:"0 2px 12px rgba(0,0,0,.35)",
                cursor:item.isAvailable?"pointer":"not-allowed",opacity:item.isAvailable?1:.45,
                animation:`stgIn 0.4s ${idx*.07}s ${EASE} both`,transition:`all .25s ${EASE}`}}>
              <div style={{width:56,height:56,borderRadius:13,overflow:"hidden",flexShrink:0,background:`linear-gradient(135deg,#3D2010,${C.surface})`}}>
                {item.imageUrl&&<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:C.ink,margin:"0 0 2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</p>
                <p style={{fontSize:10,color:C.inkDim,margin:"0 0 5px",fontFamily:"'DM Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.description||"Premium quality"}</p>
                <span style={{fontSize:14,fontWeight:500,color:C.gold,fontFamily:"'DM Mono',monospace"}}>₹{item.price}</span>
              </div>
              <button onClick={e=>{e.stopPropagation();if(item.isAvailable)onTap(item);}} style={{width:32,height:32,borderRadius:"50%",border:`1.5px solid ${qty>0?"rgba(200,146,42,.7)":C.glBd}`,background:qty>0?`linear-gradient(135deg,rgba(200,146,42,.25),rgba(232,184,75,.12))`:"transparent",color:qty>0?C.goldL:C.inkDim,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,transition:`all .22s ${SPR}`}}>{qty>0?"✓":"+"}</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CPromo({onTap,mktBanners=[]}:{onTap:()=>void;mktBanners?:any[]}){const promoBanner=mktBanners.find((b:any)=>b.status==='active');return(
  <div style={{margin:"0 22px 34px"}}>
    <div onClick={onTap} style={{background:`radial-gradient(ellipse 100% 100% at 80% 50%,rgba(60,30,8,.9) 0%,rgba(30,14,4,.98) 60%,${C.surface} 100%)`,borderRadius:22,padding:"22px 20px",position:"relative",overflow:"hidden",border:`1px solid rgba(200,146,42,.28)`,boxShadow:`0 8px 36px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.04)`,cursor:"pointer"}}>
      <div style={{position:"absolute",right:-24,top:"50%",transform:"translateY(-50%)",width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle,${C.g15} 0%,transparent 70%)`,animation:"breathG 5s ease-in-out infinite"}}/>
      {[0,1].map(i=><div key={i} style={{position:"absolute",right:40+i*14,bottom:"50%",width:4,height:20,borderRadius:99,background:`linear-gradient(to top,${C.g40},transparent)`,animation:`smokeUp 2s ${i*.7}s ease-out infinite`,filter:"blur(1px)",opacity:0}}/>)}
      <div style={{position:"absolute",right:10,bottom:-8,fontSize:72,opacity:.08,pointerEvents:"none",userSelect:"none"}}>☕</div>
      <p style={{fontSize:9.5,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".18em",textTransform:"uppercase",margin:"0 0 5px"}}>Special For You</p>
      <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:700,color:C.goldL,margin:"0 0 5px",lineHeight:1}}>Flat 20% Off</h3>
      <p style={{fontSize:12.5,color:C.inkSub,margin:"0 0 18px",fontFamily:"'DM Sans',sans-serif",maxWidth:200}}>On all beverages this evening</p>
      <div style={{display:"flex",alignItems:"center",gap:8,background:`linear-gradient(135deg,${C.g15},${C.g08})`,backdropFilter:"blur(12px)",border:`1px solid rgba(200,146,42,.35)`,borderRadius:99,padding:"8px 16px",width:"fit-content",boxShadow:"inset 0 1px 0 rgba(255,255,255,.07)"}}>
        <span style={{fontSize:12,color:C.goldL,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Order Now</span>
        <svg width={13} height={13} viewBox="0 0 13 13"><path d="M2 6.5h9M7 2.5l4 4-4 4" stroke={C.goldL} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
    </div>
  </div>
);}

function CDivider(){return(<div style={{position:"relative",height:1,margin:"6px 22px 30px",overflow:"visible"}}><div style={{height:1,background:`linear-gradient(90deg,transparent,${C.g15},${C.g40},${C.g15},transparent)`}}/><div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",width:6,height:6,borderRadius:"50%",background:C.gold,boxShadow:`0 0 12px ${C.g60},0 0 24px ${C.g15}`}}/></div>);}

function CSkel(){return(<div><div className="sk" style={{width:"100%",height:"60vh",maxHeight:500,minHeight:370}}/><div style={{display:"flex",gap:10,padding:"18px 22px",overflow:"hidden"}}>{[80,100,90,110,85].map((w,i)=><div key={i} className="sk" style={{flexShrink:0,width:w,height:38,borderRadius:99}}/>)}</div>{[0,1].map(r=><div key={r} style={{padding:"10px 22px 20px"}}><div className="sk" style={{width:140,height:15,borderRadius:7,marginBottom:11}}/><div style={{display:"flex",gap:12,overflow:"hidden"}}>{[170,170,148,148].map((w,i)=><div key={i} style={{flexShrink:0,width:w}}><div className="sk" style={{height:154,borderRadius:"18px 18px 0 0"}}/><div style={{background:C.surface,borderRadius:"0 0 18px 18px",padding:12}}><div className="sk" style={{height:13,borderRadius:5,marginBottom:7,width:"80%"}}/><div className="sk" style={{height:28,borderRadius:11}}/></div></div>)}</div></div>)}</div>);}

// ═══════════════════════════════════════════════════
// CINEMATIC SEARCH OVERLAY
// Full-screen premium search with live results
// ═══════════════════════════════════════════════════
function CSearchOverlay({ open, onClose, allItems, cart, onTap, favs, onFav }: {
  open:boolean; onClose:()=>void;
  allItems:MenuItem[]; cart:ECI[];
  onTap:(i:MenuItem)=>void;
  favs:Set<string>; onFav:(id:string)=>void;
}) {
  const [query,    setQuery   ] = useState("");
  const [category, setCategory] = useState("All");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(()=>{
    if(open) { setQuery(""); setTimeout(()=>inputRef.current?.focus(), 100); }
  },[open]);

  // Close on Escape
  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{ if(e.key==="Escape") onClose(); };
    document.addEventListener("keydown",fn);
    return()=>document.removeEventListener("keydown",fn);
  },[onClose]);

  // Get all unique categories from results
  const q = query.trim().toLowerCase();
  const filtered = !q ? [] : allItems.filter(i=>
    i.name.toLowerCase().includes(q) ||
    i.description?.toLowerCase().includes(q) ||
    (i.category as string)?.toLowerCase().includes(q)
  );

  // Category filter on results
  const catFiltered = category==="All"
    ? filtered
    : filtered.filter(i=>(i.category as string)===category);

  // Unique categories from filtered
  const cats = ["All", ...Array.from(new Set(filtered.map(i=>(i.category as string)).filter(Boolean)))];

  // Popular searches
  const POPULAR = ["Cappuccino","Cold Coffee","Sandwich","Brownie","Mojito","Latte"];

  const EASE_S = "cubic-bezier(0.25,0.46,0.45,0.94)";
  const SPR_S  = "cubic-bezier(0.34,1.56,0.64,1)";

  return(
    <div style={{
      position:"fixed",inset:0,zIndex:80,
      opacity: open?1:0,
      pointerEvents: open?"all":"none",
      transition:`opacity 0.28s ${EASE_S}`,
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:"absolute",inset:0,
        background:"rgba(2,1,0,0.94)",
        backdropFilter:"blur(22px)",
        WebkitBackdropFilter:"blur(22px)",
      }}/>

      {/* Search panel */}
      <div style={{
        position:"relative",zIndex:1,
        height:"100%",display:"flex",flexDirection:"column",
        transform: open?"translateY(0)":"translateY(-18px)",
        transition:`transform 0.35s ${SPR_S}`,
      }}>

        {/* ── Search bar ── */}
        <div style={{
          padding:"14px 18px",flexShrink:0,
          borderBottom:`1px solid rgba(255,255,255,0.06)`,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {/* Search input */}
            <div style={{flex:1,position:"relative"}}>
              <div style={{position:"absolute",left:14,top:"50%",
                transform:"translateY(-50%)",
                color:query?C.gold:C.inkDim,fontSize:16,
                transition:`color 0.2s ${EASE_S}`,
                pointerEvents:"none"}}>
                <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                  <circle cx={8} cy={8} r={5.5} stroke="currentColor" strokeWidth={1.6}/>
                  <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
                </svg>
              </div>
              <input
                ref={inputRef}
                value={query}
                onChange={e=>setQuery(e.target.value)}
                placeholder="Search menu — coffee, snacks, desserts..."
                style={{
                  width:"100%",padding:"13px 14px 13px 44px",
                  borderRadius:14,
                  border:`1.5px solid ${query?"rgba(200,146,42,0.55)":"rgba(255,255,255,0.1)"}`,
                  background:"rgba(255,255,255,0.055)",
                  color:C.ink,fontSize:15,
                  fontFamily:"'DM Sans',sans-serif",
                  outline:"none",boxSizing:"border-box",
                  boxShadow: query?`0 0 0 3px rgba(200,146,42,0.12)`:"none",
                  transition:`all 0.25s ${EASE_S}`,
                }}
              />
              {query&&(
                <button onClick={()=>setQuery("")} style={{
                  position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                  width:22,height:22,borderRadius:"50%",
                  background:"rgba(255,255,255,0.1)",border:"none",
                  color:C.inkDim,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,
                }}>✕</button>
              )}
            </div>
            {/* Cancel */}
            <button onClick={onClose} style={{
              flexShrink:0,padding:"9px 14px",borderRadius:11,
              background:"none",border:"none",
              color:C.gold,fontSize:13.5,fontWeight:600,
              fontFamily:"'DM Sans',sans-serif",cursor:"pointer",
            }}>Cancel</button>
          </div>
        </div>

        {/* ── Results / Empty state ── */}
        <div className="hs" style={{flex:1,overflowY:"auto",paddingBottom:100}}>

          {!query ? (
            /* No query — show popular + categories */
            <div style={{padding:"22px 20px"}}>
              <p style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",
                letterSpacing:".16em",textTransform:"uppercase",margin:"0 0 14px"}}>
                ✦ Popular Searches
              </p>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:28}}>
                {POPULAR.map((p,i)=>(
                  <button key={p} onClick={()=>setQuery(p)}
                    style={{
                      padding:"8px 16px",borderRadius:99,
                      border:`1px solid rgba(200,146,42,0.25)`,
                      background:"rgba(200,146,42,0.07)",
                      color:C.inkSub,fontSize:13,cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif",fontWeight:500,
                      animation:`stgIn 0.4s ${i*.05}s ease both`,
                      transition:`all 0.2s ${EASE_S}`,
                    }}>
                    {p}
                  </button>
                ))}
              </div>

              <p style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",
                letterSpacing:".16em",textTransform:"uppercase",margin:"0 0 14px"}}>
                ✦ Recently Loved
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {allItems.filter(i=>i.isAvailable).slice(0,4).map((item,i)=>{
                  const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
                  return(
                    <button key={item._id} onClick={()=>{onTap(item);onClose();}}
                      style={{
                        display:"flex",alignItems:"center",gap:12,
                        padding:"11px 14px",borderRadius:14,
                        background:"rgba(255,255,255,0.03)",
                        border:`1px solid rgba(255,255,255,0.06)`,
                        cursor:"pointer",textAlign:"left",width:"100%",
                        animation:`stgIn 0.4s ${i*.06}s ease both`,
                        transition:`all 0.2s ${EASE_S}`,
                      }}>
                      <div style={{width:46,height:46,borderRadius:11,overflow:"hidden",
                        background:`linear-gradient(135deg,#3D2010,${C.surface})`,flexShrink:0}}>
                        {item.imageUrl&&<img src={getThumbnailUrl(item.imageUrl)} alt={item.name}
                          style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,
                          fontWeight:600,color:C.ink,margin:"0 0 2px",
                          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</p>
                        <span style={{fontSize:13,color:C.gold,fontFamily:"'DM Mono',monospace"}}>₹{item.price}</span>
                      </div>
                      {qty>0&&<div style={{width:22,height:22,borderRadius:"50%",
                        background:GG,color:C.void,fontSize:10,fontWeight:900,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontFamily:"'DM Mono',monospace",flexShrink:0}}>{qty}</div>}
                    </button>
                  );
                })}
              </div>
            </div>

          ) : catFiltered.length===0 ? (
            /* No results */
            <div style={{textAlign:"center",padding:"52px 24px",
              animation:`stgIn 0.4s ease`}}>
              <div style={{fontSize:52,marginBottom:14,opacity:.3,
                animation:"floatY 3s ease-in-out infinite"}}>🔍</div>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,
                fontWeight:500,color:C.inkSub,margin:"0 0 8px"}}>
                No results for "{query}"
              </h3>
              <p style={{fontSize:13,color:C.inkDim,fontFamily:"'DM Sans',sans-serif",
                lineHeight:1.6,margin:"0 0 20px"}}>
                Try searching for coffee, snacks, or desserts
              </p>
              {/* Suggestions */}
              <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
                {POPULAR.slice(0,4).map(p=>(
                  <button key={p} onClick={()=>setQuery(p)}
                    style={{padding:"7px 15px",borderRadius:99,
                      border:`1px solid rgba(200,146,42,0.25)`,
                      background:"rgba(200,146,42,0.07)",
                      color:C.inkSub,fontSize:12.5,cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif"}}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

          ) : (
            /* Results */
            <div>
              {/* Result count + category filter */}
              <div style={{padding:"14px 20px 10px"}}>
                <div style={{display:"flex",alignItems:"center",
                  justifyContent:"space-between",marginBottom:10}}>
                  <p style={{fontSize:11.5,color:C.inkDim,
                    fontFamily:"'DM Sans',sans-serif",margin:0}}>
                    <span style={{color:C.gold,fontWeight:700}}>{catFiltered.length}</span>
                    {" "}result{catFiltered.length!==1?"s":""} for "{query}"
                  </p>
                </div>
                {/* Category pills */}
                {cats.length>2&&(
                  <div className="hs" style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
                    {cats.map(cat=>(
                      <button key={cat} onClick={()=>setCategory(cat)}
                        style={{flexShrink:0,padding:"6px 14px",borderRadius:99,
                          border:`1px solid ${category===cat?"rgba(200,146,42,0.5)":"rgba(255,255,255,0.08)"}`,
                          background:category===cat?"rgba(200,146,42,0.14)":"transparent",
                          color:category===cat?C.goldL:C.inkSub,
                          fontSize:12,cursor:"pointer",
                          fontFamily:"'DM Sans',sans-serif",fontWeight:category===cat?700:400,
                          transition:`all 0.2s ${EASE_S}`}}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Result items */}
              <div style={{padding:"0 18px",display:"flex",flexDirection:"column",gap:9}}>
                {catFiltered.map((item,i)=>{
                  const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
                  // Highlight matching text
                  const highlightName=(text:string)=>{
                    const idx=text.toLowerCase().indexOf(q);
                    if(idx<0) return <span>{text}</span>;
                    return<span>{text.slice(0,idx)}<span style={{color:C.gold,fontWeight:700}}>{text.slice(idx,idx+q.length)}</span>{text.slice(idx+q.length)}</span>;
                  };
                  return(
                    <div key={item._id}
                      onClick={()=>{ if(item.isAvailable){onTap(item);onClose();} }}
                      style={{
                        display:"flex",alignItems:"center",gap:13,
                        background:`linear-gradient(135deg,${C.surface},${C.raise})`,
                        borderRadius:16,padding:"12px 14px",
                        border:`1px solid ${qty>0?"rgba(200,146,42,0.38)":"rgba(255,255,255,0.06)"}`,
                        cursor:item.isAvailable?"pointer":"not-allowed",
                        opacity:item.isAvailable?1:0.4,
                        boxShadow:qty>0?`0 0 0 1px rgba(200,146,42,0.1),0 4px 16px rgba(200,146,42,0.12)`:"none",
                        animation:`stgIn 0.4s ${i*.045}s ease both`,
                        transition:`all 0.22s ${EASE_S}`,
                      }}>
                      {/* Image */}
                      <div style={{width:60,height:60,borderRadius:13,overflow:"hidden",
                        flexShrink:0,background:`linear-gradient(135deg,#3D2010,${C.surface})`}}>
                        {item.imageUrl&&<img src={getThumbnailUrl(item.imageUrl)} alt={item.name}
                          style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>}
                      </div>
                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,
                          fontWeight:600,color:C.ink,margin:"0 0 2px",
                          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                          {highlightName(item.name)}
                        </p>
                        <p style={{fontSize:11,color:C.inkDim,margin:"0 0 5px",
                          fontFamily:"'DM Sans',sans-serif",
                          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                          {item.description||"Premium quality"}
                        </p>
                        <span style={{fontSize:14.5,fontWeight:500,color:C.gold,
                          fontFamily:"'DM Mono',monospace"}}>₹{item.price}</span>
                      </div>
                      {/* Add button */}
                      <button
                        onClick={e=>{e.stopPropagation();if(item.isAvailable)onTap(item);}}
                        style={{width:36,height:36,borderRadius:"50%",flexShrink:0,
                          border:`1.5px solid ${qty>0?"rgba(200,146,42,0.7)":"rgba(255,255,255,0.12)"}`,
                          background:qty>0?`linear-gradient(135deg,rgba(200,146,42,0.25),rgba(232,184,75,0.12))`:"transparent",
                          color:qty>0?C.goldL:C.inkSub,cursor:"pointer",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:18,fontWeight:700,
                          transition:`all 0.22s ${SPR_S}`,
                          boxShadow:qty>0?`0 0 12px rgba(200,146,42,0.2)`:"none",
                        }}>
                        {qty>0?"✓":"+"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CinematicHome({menu,cart,loading,customerData,table,onItemTap,onCategorySelect,activeCategoryId,onViewCart,onExploreMenu,favs,onToggleFav}:{
  menu:MenuCategory[];cart:ECI[];loading:boolean;customerData:{name:string;phone:string}|null;table:{tableNumber:string}|null;
  onItemTap:(i:MenuItem)=>void;onCategorySelect:(id:string)=>void;activeCategoryId:string;
  onViewCart:()=>void;onExploreMenu:()=>void;favs:Set<string>;onToggleFav:(id:string)=>void;
}) {
  const allItems=menu.flatMap(c=>c.items as MenuItem[]);
  const bestsellers=allItems.filter(i=>i.tags?.includes("bestseller")&&i.isAvailable);
  const catItems=(menu.find(c=>c._id===activeCategoryId)?.items||[]) as MenuItem[];
  const hour=new Date().getHours();
  const greeting=hour<5?"Still Up Late?":hour<12?"Good Morning":hour<17?"Good Afternoon":hour<21?"Good Evening":"Good Night";
  const [scrolled,setScrolled]=useState(false);
  const [searchOpen,setSearchOpen]=useState(false);
  const scrollRef=useRef<HTMLDivElement>(null);

  // ── Marketing Banners from Admin ──
  const [mktBanners, setMktBanners] = useState<any[]>([]);
  useEffect(()=>{
    const API_URL=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
    fetch(`${API_URL}/marketing/banners?status=active`)
      .then(r=>r.json())
      .then(d=>{ if(d.success && d.data?.length) setMktBanners(d.data); })
      .catch(()=>{}); // Silently fail — fallback to menu items
  },[]);

  useEffect(()=>{const el=scrollRef.current;if(!el)return;const fn=()=>setScrolled(el.scrollTop>72);el.addEventListener("scroll",fn);return()=>el.removeEventListener("scroll",fn);},[]);

  return(
    <div style={{position:"relative",minHeight:"100dvh",background:C.deep}}>
      {/* Cinematic Search Overlay */}
      <CSearchOverlay
        open={searchOpen}
        onClose={()=>setSearchOpen(false)}
        allItems={allItems}
        cart={cart}
        onTap={(item)=>{ onItemTap(item); setSearchOpen(false); }}
        favs={favs}
        onFav={onToggleFav}
      />
      {/* Sticky header */}
      <header style={{position:"sticky",top:0,zIndex:30,background:scrolled?"rgba(11,9,6,0.97)":"transparent",backdropFilter:scrolled?"blur(24px)":"none",padding:"13px 18px",borderBottom:scrolled?`1px solid ${C.gl2}`:"none",transition:`all .35s ${EASE}`,marginBottom:"-60px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:11}}>
            <div style={{width:40,height:40,borderRadius:13,overflow:"hidden",border:`1.5px solid rgba(200,146,42,${scrolled?.55:.3})`,boxShadow:`0 0 16px ${C.g15}`,transition:`all .3s ${EASE}`}}>
              <img src="/logo-small.png" alt="GB" style={{width:"100%",height:"100%",objectFit:"contain"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
            </div>
            <div>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17.5,fontWeight:600,color:scrolled?C.ink:"rgba(245,237,216,.9)",margin:0,lineHeight:1.1}}> Golden Beans</p>
              <p style={{fontSize:10,color:scrolled?C.inkDim:"rgba(245,237,216,.42)",margin:0,fontFamily:"'DM Sans',sans-serif"}}>{table?`Table ${table.tableNumber} ✦ `:""}{customerData?customerData.name:"Cafe & Bistro"}</p>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setSearchOpen(true)} style={{width:38,height:38,borderRadius:12,background:`rgba(255,255,255,${scrolled?.06:.04})`,border:`1px solid ${C.glBd}`,backdropFilter:"blur(12px)",color:C.ink,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🔍</button>
            <button style={{width:38,height:38,borderRadius:12,background:`rgba(255,255,255,${scrolled?.06:.04})`,border:`1px solid ${C.glBd}`,backdropFilter:"blur(12px)",color:C.ink,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🔔</button>
          </div>
        </div>
      </header>

      {/* Scrollable */}
      <div ref={scrollRef} style={{overflowY:"auto",overflowX:"hidden",paddingBottom:cart.length>0?160:96}}>
        {loading?<CSkel/>:(
          <>
            <CHero items={allItems} cart={cart} onTap={onItemTap} onExplore={onExploreMenu} greeting={greeting} name={customerData?.name} mktBanners={mktBanners}/>
            <CGlassBar cats={menu} active={activeCategoryId} onSelect={onCategorySelect}/>
            <CDivider/>
            {bestsellers.length>0&&<CRow eyebrow="✦ Smart Pick" title={`Made For You${customerData?`, ${customerData.name.split(" ")[0]}`:""}`} items={bestsellers} cart={cart} onTap={onItemTap} favs={favs} onFav={onToggleFav} featured/>}
            <CPromo onTap={onExploreMenu} mktBanners={mktBanners}/>
            {catItems.length>0&&<CRow eyebrow="✦ From The Menu" title={`${menu.find(c=>c._id===activeCategoryId)?.icon||""} ${menu.find(c=>c._id===activeCategoryId)?.name||""}`} items={catItems.filter(i=>i.isAvailable)} cart={cart} onTap={onItemTap} favs={favs} onFav={onToggleFav}/>}
            <CCompact eyebrow="✦ Quick Picks" title="Continue Your Favorites" items={allItems.filter(i=>i.isAvailable).slice(4,9)} cart={cart} onTap={onItemTap}/>
            <CDivider/>
            {menu.slice(0,4).map(cat=><CRow key={cat._id} eyebrow={`✦ ${cat.name}`} title={`${cat.icon} ${cat.name}`} items={(cat.items as MenuItem[]).filter(i=>i.isAvailable).slice(0,8)} cart={cart} onTap={onItemTap} favs={favs} onFav={onToggleFav}/>)}
            <div style={{textAlign:"center",padding:"18px 22px 10px"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:6}}>
                <div style={{width:32,height:1,background:`linear-gradient(to right,transparent,${C.g40})`}}/>
                <span style={{fontSize:11,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".12em"}}>🌿 100% Pure Vegetarian</span>
                <div style={{width:32,height:1,background:`linear-gradient(to left,transparent,${C.g40})`}}/>
              </div>
              <p style={{fontSize:10,color:C.inkGh,margin:"5px 0 0",fontFamily:"'DM Sans',sans-serif"}}>Crafted with passion · Served with love</p>
            </div>
          </>
        )}
      </div>

      {/* Floating cart */}
      {cart.length>0&&(()=>{
        const total=cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
        const items=cart.reduce((s,i)=>s+i.quantity,0);
        return(
          <div style={{position:"fixed",bottom:76,left:14,right:14,zIndex:50}}>
            <button onClick={onViewCart} style={{width:"100%",background:"linear-gradient(135deg,rgba(18,16,12,.97),rgba(26,23,16,.97))",backdropFilter:"blur(28px)",borderRadius:20,padding:"12px 14px",border:"1px solid rgba(200,146,42,.42)",boxShadow:`0 8px 40px rgba(0,0,0,.75),0 0 0 1px ${C.g08},0 0 28px ${C.g15}`,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{position:"relative"}}>
                  <div style={{width:44,height:44,borderRadius:14,background:`linear-gradient(135deg,${C.g25},${C.g15})`,border:`1.5px solid rgba(200,146,42,.45)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🛒</div>
                  <div style={{position:"absolute",top:-7,right:-7,width:20,height:20,borderRadius:"50%",background:GG,color:C.void,fontSize:9.5,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${C.dark}`,fontFamily:"'DM Mono',monospace",boxShadow:`0 2px 8px ${C.g40}`}}>{items}</div>
                </div>
                <p style={{fontFamily:"'DM Mono',monospace",fontWeight:500,fontSize:17,color:C.ink,margin:0}}>₹{(total*1.05).toFixed(0)}</p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:7,background:GG,borderRadius:13,padding:"10px 18px",boxShadow:`0 4px 20px ${C.g40}`}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13.5,color:C.void}}>View Cart</span>
                <svg width={14} height={14} viewBox="0 0 14 14"><path d="M2 7h10M8 3l4 4-4 4" stroke={C.void} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </button>
          </div>
        );
      })()}
    </div>
  );
}
// ═══════════════════════════════════════════════════
// MENU TAB — Cinematic full grid
// ═══════════════════════════════════════════════════
function MenuTab({ menu, cart, loading, activeCat, onCatSelect, onItemTap, favs, onFav, onBack }: {
  menu:MenuCategory[]; cart:ECI[]; loading:boolean; activeCat:string;
  onCatSelect:(id:string)=>void; onItemTap:(i:MenuItem)=>void;
  favs:Set<string>; onFav:(id:string)=>void; onBack:()=>void;
}) {
  const catItems=(menu.find(c=>c._id===activeCat)?.items||[]) as MenuItem[];

  return(
    <div style={{minHeight:"100dvh",background:C.void,paddingBottom:120}}>
      {/* Section header */}
      <div style={{padding:"16px 18px 0",display:"flex",alignItems:"center",gap:13,animation:`fadeRise 0.5s ${EASE} both`}}>
        <button onClick={onBack} style={{width:38,height:38,borderRadius:12,background:C.gl1,border:`1px solid ${C.glBd}`,color:C.ink,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width={18} height={18} viewBox="0 0 18 18" fill="none"><path d="M11 4l-5 5 5 5" stroke={C.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div>
          <p style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".18em",textTransform:"uppercase",margin:"0 0 3px"}}>✦ Menu</p>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:600,color:C.ink,margin:0}}>Our Offerings</h2>
        </div>
      </div>

      {/* Sticky glass category bar */}
      <div style={{position:"sticky",top:0,zIndex:20,background:"rgba(2,1,0,0.92)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.gl2}`,marginTop:12}}>
        <div className="hs" style={{display:"flex",gap:8,padding:"10px 18px",overflowX:"auto"}}>
          {menu.map((cat,idx)=>{
            const isA=cat._id===activeCat;
            return(
              <button key={cat._id} onClick={()=>onCatSelect(cat._id)}
                style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,
                  background:isA?`linear-gradient(135deg,${C.g15},${C.g08})`:C.gl1,
                  border:`1px solid ${isA?"rgba(200,146,42,0.48)":C.glBd}`,
                  borderRadius:99,padding:"8px 16px 8px 10px",cursor:"pointer",
                  transition:`all 0.3s ${SPR}`,
                  boxShadow:isA?`0 0 20px ${C.g15},inset 0 1px 0 rgba(255,255,255,.06)`:"none",
                  animation:`stgIn 0.4s ${idx*.05}s ${EASE} both`,
                }}>
                <span style={{fontSize:18}}>{cat.icon}</span>
                <span style={{fontSize:12,fontWeight:isA?700:500,color:isA?C.goldL:C.inkSub,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{cat.name}</span>
                {isA&&<div style={{width:4,height:4,borderRadius:"50%",background:C.gold,boxShadow:`0 0 6px ${C.gold}`,marginLeft:2}}/>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category title */}
      <div style={{padding:"16px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:C.ink,margin:0}}>
            {menu.find(c=>c._id===activeCat)?.icon} {menu.find(c=>c._id===activeCat)?.name}
          </h3>
          <p style={{fontSize:11,color:C.inkDim,margin:"2px 0 0",fontFamily:"'DM Mono',monospace"}}>
            {catItems.filter(i=>i.isAvailable).length} items available
          </p>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,padding:"0 18px"}}>
          {[1,2,3,4,5,6].map(i=>(
            <div key={i}>
              <div className="sk" style={{height:158,borderRadius:"18px 18px 0 0"}}/>
              <div style={{background:C.surface,borderRadius:"0 0 18px 18px",padding:11}}>
                <div className="sk" style={{height:13,borderRadius:5,marginBottom:7,width:"75%"}}/>
                <div className="sk" style={{height:28,borderRadius:9}}/>
              </div>
            </div>
          ))}
        </div>
      ) : catItems.length===0 ? (
        <div style={{textAlign:"center",padding:"64px 20px",animation:`fadeIn 0.5s ${EASE}`}}>
          <div style={{fontSize:52,marginBottom:14,animation:"floatY 3s ease-in-out infinite"}}>☕</div>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:500,color:C.inkSub,margin:"0 0 6px"}}>Nothing here yet</h3>
          <p style={{fontSize:13,color:C.inkDim,fontFamily:"'DM Sans',sans-serif"}}>Check back soon!</p>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,padding:"0 18px"}}>
          {catItems.map((item,idx)=>{
            const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
            return(
              <div key={item._id} onClick={()=>item.isAvailable&&onItemTap(item)}
                style={{borderRadius:18,overflow:"hidden",cursor:item.isAvailable?"pointer":"not-allowed",
                  opacity:item.isAvailable?1:0.45,
                  background:`linear-gradient(160deg,${C.raise} 0%,${C.surface} 100%)`,
                  border:`1px solid ${qty>0?"rgba(200,146,42,0.44)":C.glBd}`,
                  boxShadow:qty>0?`0 0 0 1px ${C.g15},0 6px 24px ${C.g15},0 2px 8px rgba(0,0,0,.55)`:"0 3px 16px rgba(0,0,0,.4)",
                  transition:`all 0.28s ${SPR}`,
                  animation:`stgIn 0.5s ${idx*.05}s ${EASE} both`,
                }}>
                {/* Image */}
                <div style={{position:"relative",height:148,overflow:"hidden"}}>
                  {item.imageUrl
                    ?<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>
                    :<div style={{width:"100%",height:"100%",background:`radial-gradient(ellipse at 50% 30%,#3D2010,${C.surface})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,opacity:.65}}>☕</div>
                  }
                  <div style={{position:"absolute",inset:0,background:`linear-gradient(to top,${C.surface} 0%,transparent 55%)`}}/>
                  {item.tags?.includes("bestseller")&&<div style={{position:"absolute",top:8,left:8,background:GG,color:C.void,fontSize:8,fontWeight:800,padding:"2px 8px",borderRadius:99,letterSpacing:".06em",fontFamily:"'DM Sans',sans-serif",boxShadow:`0 2px 8px ${C.g40}`}}>⭐ BEST</div>}
                  {!item.isAvailable&&<div style={{position:"absolute",inset:0,background:"rgba(2,1,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontFamily:"'DM Mono',monospace",letterSpacing:".1em",textTransform:"uppercase"}}>Sold Out</span></div>}
                  {qty>0&&<div style={{position:"absolute",top:7,right:34,width:20,height:20,borderRadius:"50%",background:GG,color:C.void,fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${C.surface}`,animation:"cartPop .45s ease",fontFamily:"'DM Mono',monospace"}}>{qty}</div>}
                  <button onClick={e=>{e.stopPropagation();onFav(item._id);}} style={{position:"absolute",top:7,right:7,width:28,height:28,borderRadius:"50%",background:"rgba(2,1,0,0.65)",backdropFilter:"blur(8px)",border:`1px solid ${favs.has(item._id)?"rgba(239,68,68,.55)":C.glBd}`,color:favs.has(item._id)?"#ef4444":C.inkDim,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,transition:`all 0.2s ${EASE}`}}>{favs.has(item._id)?"❤":"🤍"}</button>
                  <div style={{position:"absolute",bottom:8,left:10}}>
                    <span style={{fontSize:15.5,fontWeight:500,color:C.gold,fontFamily:"'DM Mono',monospace"}}>₹{item.price}</span>
                  </div>
                </div>
                {/* Info */}
                <div style={{padding:"9px 11px 11px"}}>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15.5,fontWeight:600,color:C.ink,margin:"0 0 8px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</p>
                  <button onClick={e=>{e.stopPropagation();if(item.isAvailable)onItemTap(item);}}
                    style={{width:"100%",padding:"8px 0",borderRadius:10,
                      border:`1px solid ${qty>0?"rgba(200,146,42,0.5)":C.glBd}`,
                      background:qty>0?`linear-gradient(135deg,${C.g15},${C.g08})`:C.gl1,
                      color:qty>0?C.goldL:C.inkDim,fontWeight:600,fontSize:11.5,
                      cursor:item.isAvailable?"pointer":"not-allowed",
                      fontFamily:"'DM Sans',sans-serif",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:4,
                      transition:`all 0.22s ${EASE}`,
                      backdropFilter:"blur(8px)",
                    }}>
                    {qty>0?<><span style={{fontSize:12}}>✓</span>Added ({qty})</>:<><span style={{fontSize:14,fontWeight:700}}>+</span>Add</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════
// PRODUCT DETAIL MODAL — Full-screen bottom sheet
// ═══════════════════════════════════════════════════
function ProductModal({ item, open, onClose, onAdd }: {
  item:MenuItem|null; open:boolean; onClose:()=>void;
  onAdd:(i:MenuItem,qty:number,v:{groupName:string;selected:string[]}[],mod:number)=>void;
}) {
  const [qty,   setQty  ] = useState(1);
  const [vars,  setVars ] = useState<{groupName:string;selected:string[]}[]>([]);
  const [note,  setNote ] = useState("");

  useEffect(()=>{
    if(!item){setQty(1);setVars([]);setNote("");return;}
    const vg=(item.variantGroups||[]) as VariantGroup[];
    setVars(vg.map(g=>({groupName:g.name,selected:g.required&&g.options?.length?[g.options[0].name]:[]})));
  },[item]);

  const mod = vars.flatMap(v=>v.selected).reduce((s,name)=>{
    const vg=(item?.variantGroups||[]) as VariantGroup[];
    return s+(vg.flatMap(g=>g.options||[]).find(o=>o.name===name)?.priceModifier||0);
  },0);

  if(!item) return null;

  const finalPrice = (item.price+mod)*qty;

  return(
    <div style={{position:"fixed",inset:0,zIndex:90,display:"flex",alignItems:"flex-end",justifyContent:"center",
      opacity:open?1:0,pointerEvents:open?"all":"none",transition:`opacity 0.32s ${EASE}`}}>
      {/* Backdrop */}
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(2,1,0,0.88)",backdropFilter:"blur(18px)"}}/>

      {/* Sheet */}
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:520,maxHeight:"92dvh",
        background:C.dark,borderRadius:"28px 28px 0 0",overflow:"hidden",
        transform:open?"translateY(0)":"translateY(100%)",
        transition:`transform 0.48s ${CINC}`,
        display:"flex",flexDirection:"column",
        border:`1px solid ${C.glBd}`,borderBottom:"none",
        boxShadow:`0 -16px 60px rgba(0,0,0,0.8)`,
      }}>
        {/* Gold top bar */}
        <div style={{height:3,background:GG,flexShrink:0}}/>

        {/* Drag handle */}
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 0",flexShrink:0}}>
          <div style={{width:38,height:4,borderRadius:2,background:C.gl3}}/>
        </div>

        {/* Hero image */}
        <div style={{position:"relative",height:230,flexShrink:0,overflow:"hidden"}}>
          {item.imageUrl
            ? <img src={getHeroUrl(item.imageUrl)} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <div style={{width:"100%",height:"100%",background:`radial-gradient(ellipse at 50% 30%,#3D2010,${C.deep})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:72,opacity:.6}}>☕</div>
          }
          {/* Gradient */}
          <div style={{position:"absolute",inset:0,background:`linear-gradient(to top,${C.dark} 0%,rgba(18,16,12,.5) 50%,transparent 80%)`}}/>
          {/* Close */}
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,width:36,height:36,borderRadius:"50%",background:"rgba(2,1,0,0.7)",backdropFilter:"blur(12px)",border:`1px solid ${C.glBd}`,color:C.ink,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700}}>✕</button>
          {/* Veg badge */}
          <div style={{position:"absolute",top:14,left:14,background:"rgba(46,125,82,0.9)",backdropFilter:"blur(8px)",borderRadius:8,padding:"4px 10px",border:"1px solid rgba(46,125,82,0.5)"}}>
            <span style={{fontSize:10,color:"#7EF4A8",fontWeight:700,fontFamily:"'DM Sans',sans-serif",letterSpacing:".05em"}}>🌿 VEG</span>
          </div>
          {/* Price overlay */}
          <div style={{position:"absolute",bottom:16,left:18}}>
            {item.tags?.includes("bestseller")&&<div style={{display:"inline-block",background:GG,color:C.void,fontSize:9,fontWeight:800,padding:"3px 10px",borderRadius:99,marginBottom:6,letterSpacing:".06em",fontFamily:"'DM Sans',sans-serif"}}>⭐ BESTSELLER</div>}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="hs" style={{flex:1,overflowY:"auto",padding:"0 20px 0"}}>
          {/* Title + price */}
          <div style={{padding:"16px 0 12px",borderBottom:`1px solid ${C.gl2}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600,color:C.ink,margin:0,lineHeight:1.1,flex:1}}>{item.name}</h2>
              <div style={{textAlign:"right",flexShrink:0}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:500,color:C.gold,margin:0}}>₹{item.price+mod}</p>
                {mod!==0&&<p style={{fontSize:10,color:C.inkDim,margin:"2px 0 0",fontFamily:"'DM Mono',monospace"}}>{mod>0?`+₹${mod}`:``}</p>}
              </div>
            </div>
            {item.description&&<p style={{fontSize:13,color:C.inkSub,margin:"8px 0 0",lineHeight:1.6,fontFamily:"'DM Sans',sans-serif"}}>{item.description}</p>}
            {item.rating&&<div style={{display:"flex",alignItems:"center",gap:5,marginTop:9}}>
              <div style={{background:`${C.gold}18`,border:`1px solid ${C.g15}`,borderRadius:99,padding:"3px 10px",display:"flex",alignItems:"center",gap:4}}>
                <span style={{color:C.gold,fontSize:12}}>★</span>
                <span style={{fontSize:12,color:C.goldM,fontFamily:"'DM Mono',monospace",fontWeight:500}}>{item.rating.toFixed(1)}</span>
              </div>
            </div>}
          </div>

          {/* Variants */}
          {((item.variantGroups||[]) as VariantGroup[]).map((vg,vi)=>(
            <div key={vi} style={{padding:"14px 0",borderBottom:`1px solid ${C.gl2}`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}>
                <p style={{fontSize:13,fontWeight:700,color:C.ink,margin:0,fontFamily:"'DM Sans',sans-serif"}}>{vg.name}</p>
                <span style={{fontSize:9.5,color:vg.required?C.gold:C.inkDim,background:vg.required?`${C.gold}18`:`${C.gl2}`,border:`1px solid ${vg.required?C.g15:C.gl2}`,borderRadius:99,padding:"2px 8px",fontFamily:"'DM Mono',monospace"}}>{vg.required?"Required":"Optional"}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {(vg.options||[]).map((opt,oi)=>{
                  const selGroup = vars.find(v=>v.groupName===vg.name);
                  const isSel = selGroup?.selected.includes(opt.name)||false;
                  return(
                    <button key={oi} onClick={()=>{
                      setVars(prev=>prev.map(v=>{
                        if(v.groupName!==vg.name)return v;
                        if((vg as any).maxSelect===1)return{...v,selected:[opt.name]};
                        const s=v.selected.includes(opt.name)?v.selected.filter(x=>x!==opt.name):[...v.selected,opt.name];
                        return{...v,selected:s};
                      }));
                    }} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:isSel?`linear-gradient(135deg,${C.g08},${C.g15})`:C.gl1,border:`1.5px solid ${isSel?C.gold:C.glBd}`,borderRadius:13,padding:"11px 14px",cursor:"pointer",boxShadow:isSel?`0 0 16px ${C.g15}`:"none",transition:`all 0.22s ${EASE}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:19,height:19,borderRadius:(vg as any).maxSelect===1?"50%":5,border:`2px solid ${isSel?C.gold:C.glBd}`,background:isSel?GG:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:`all 0.2s ${EASE}`}}>
                          {isSel&&<div style={{width:7,height:7,borderRadius:"50%",background:C.void}}/>}
                        </div>
                        <span style={{fontSize:13.5,color:isSel?C.goldL:C.inkSub,fontFamily:"'DM Sans',sans-serif",fontWeight:isSel?600:400}}>{opt.name}</span>
                      </div>
                      {opt.priceModifier!==0&&opt.priceModifier!==undefined&&(
                        <span style={{fontSize:12,color:isSel?C.goldM:C.inkDim,fontFamily:"'DM Mono',monospace",fontWeight:500}}>
                          {opt.priceModifier>0?`+₹${opt.priceModifier}`:`-₹${Math.abs(opt.priceModifier)}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Note */}
          <div style={{padding:"14px 0 6px"}}>
            <p style={{fontSize:11,fontWeight:700,color:C.inkDim,letterSpacing:".08em",textTransform:"uppercase",margin:"0 0 9px",fontFamily:"'DM Sans',sans-serif"}}>Special Request</p>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Any customization? e.g. extra sugar, less spice..." rows={2}
              style={{width:"100%",padding:"12px 14px",borderRadius:13,border:`1px solid ${C.glBd}`,background:C.gl1,color:C.ink,fontSize:13,outline:"none",resize:"none",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}/>
          </div>
        </div>

        {/* Footer — qty + add */}
        <div style={{padding:"14px 20px 24px",borderTop:`1px solid ${C.gl2}`,background:C.dark,flexShrink:0}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            {/* Qty stepper */}
            <div style={{display:"flex",alignItems:"center",gap:0,background:C.gl1,border:`1px solid ${C.glBd}`,borderRadius:13,overflow:"hidden",flexShrink:0}}>
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:42,height:48,background:"none",border:"none",color:C.inkSub,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
              <span style={{width:32,textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:500,color:C.ink}}>{qty}</span>
              <button onClick={()=>setQty(q=>q+1)} style={{width:42,height:48,background:"none",border:"none",color:C.gold,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
            </div>
            {/* Add CTA */}
            <button onClick={()=>{if(item.isAvailable)onAdd(item,qty,vars,mod);}} disabled={!item.isAvailable}
              style={{flex:1,padding:"14px 0",borderRadius:13,border:"none",background:item.isAvailable?GG:C.gl1,
                color:item.isAvailable?C.void:C.inkDim,fontWeight:700,fontSize:15,
                fontFamily:"'DM Sans',sans-serif",cursor:item.isAvailable?"pointer":"not-allowed",
                boxShadow:item.isAvailable?`0 8px 28px ${C.g40}`:"none",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <span>Add to Cart</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:14}}>· ₹{finalPrice}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════
// CART SCREEN — Cinematic
// ═══════════════════════════════════════════════════
function CartScreen({ cart, onUpdateQty, onCheckout, discount, onDiscountChange, allItems, onAddMore, onBack, customerPoints=0, onRedeemPoints, redeemedPoints=0 }:{
  cart:ECI[];onUpdateQty:(k:string,d:number)=>void;onCheckout:()=>void;onBack:()=>void;
  discount:Disc|null;onDiscountChange:(d:Disc|null)=>void;
  allItems:MenuItem[];onAddMore:(i:MenuItem)=>void;
  customerPoints?:number; onRedeemPoints?:(pts:number)=>void; redeemedPoints?:number;
}) {
  const [code,setCode]=useState("");
  const [applying,setApplying]=useState(false);
  const [codeErr,setCodeErr]=useState("");
  const [showPointsPanel,setShowPointsPanel]=useState(false);
  const [pointsInput,setPointsInput]=useState("");

  const sub  = cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
  const disc = discount?.discount||0;
  const ptsDisc = Math.floor(redeemedPoints/10); // 100pts = ₹10
  const tax  = Math.round((sub-disc-ptsDisc)*0.05);
  const total= sub-disc-ptsDisc+tax;

  // Max redeemable — min of available pts value and 50% of subtotal
  const maxPtsRedeemable = Math.min(customerPoints, Math.floor(sub*5)); // 50% of sub in pts
  const minPtsToRedeem   = 100; // 100 pts minimum

  const applyCode = async () => {
    if(!code.trim())return;
    setApplying(true);setCodeErr("");
    try {
      const API=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
      const r=await fetch(`${API}/promotions/validate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:code.trim().toUpperCase(),orderAmount:sub})}).then(r=>r.json());
      if(r.success&&r.data){onDiscountChange({promotionId:r.data.promotionId,name:r.data.name,description:r.data.description,discount:r.data.discountAmount,type:"code",code:code.trim().toUpperCase(),promoCodeId:r.data.promoCodeId});}
      else setCodeErr(r.message||"Invalid code");
    }catch{setCodeErr("Could not apply code");}
    setApplying(false);
  };

  const handleRedeemSubmit = ()=>{
    const pts = Math.min(Number(pointsInput)||0, maxPtsRedeemable);
    if(pts < minPtsToRedeem){ setCodeErr(`Minimum ${minPtsToRedeem} points required`); return; }
    onRedeemPoints?.(pts);
    setShowPointsPanel(false);
    setPointsInput("");
  };

  if(!cart.length) return(
    <div style={{minHeight:"100dvh",background:C.void,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,textAlign:"center"}}>
      <div style={{fontSize:62,marginBottom:16,animation:"floatY 3s ease-in-out infinite",opacity:.6}}>🛒</div>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:500,color:C.inkSub,margin:"0 0 8px"}}>Cart is Empty</h2>
      <p style={{fontSize:13,color:C.inkDim,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>Explore our menu and add something delicious</p>
    </div>
  );

  return(
    <div style={{minHeight:"100dvh",background:C.void,display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{padding:"16px 18px 14px",background:C.void,borderBottom:`1px solid ${C.gl2}`,flexShrink:0,display:"flex",alignItems:"center",gap:13}}>
        <button onClick={onBack} style={{width:38,height:38,borderRadius:12,background:C.gl1,border:`1px solid ${C.glBd}`,color:C.ink,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width={18} height={18} viewBox="0 0 18 18" fill="none"><path d="M11 4l-5 5 5 5" stroke={C.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div>
          <p style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".15em",textTransform:"uppercase",margin:"0 0 1px"}}>✦ Your Order</p>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:600,color:C.ink,margin:0}}>Cart</h2>
        </div>
        {/* Points balance badge in header */}
        {customerPoints>0&&(
          <div style={{marginLeft:"auto",background:C.g08,border:`1px solid ${C.g25}`,borderRadius:99,padding:"5px 12px",display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:13}}>🫘</span>
            <span style={{fontSize:12,fontWeight:700,color:C.goldM,fontFamily:"'DM Mono',monospace"}}>{customerPoints} pts</span>
          </div>
        )}
      </div>

      <div className="hs" style={{flex:1,overflowY:"auto",padding:"16px 18px",paddingBottom:160}}>
        {/* Cart items */}
        {cart.map((ci,idx)=>{
          const key=ci.menuItemId+JSON.stringify(ci.variants);
          const linePrice=(ci.price+(ci.totalPriceModifier||0))*ci.quantity;
          return(
            <div key={key} style={{display:"flex",gap:13,alignItems:"center",
              background:`linear-gradient(135deg,${C.surface},${C.raise})`,
              borderRadius:17,padding:"12px 14px",marginBottom:10,
              border:`1px solid ${C.glBd}`,boxShadow:`0 2px 14px rgba(0,0,0,.45)`,
              animation:`stgIn 0.4s ${idx*.06}s ${EASE} both`}}>
              <div style={{width:60,height:60,borderRadius:13,overflow:"hidden",flexShrink:0,background:`linear-gradient(135deg,#3D2010,${C.surface})`}}>
                {ci.imageUrl&&<img src={getThumbnailUrl(ci.imageUrl)} alt={ci.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:C.ink,margin:"0 0 1px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ci.name}</p>
                {ci.variants&&ci.variants.flatMap(v=>v.selected).length>0&&<p style={{fontSize:10,color:C.inkDim,margin:"0 0 5px",fontFamily:"'DM Sans',sans-serif"}}>{ci.variants.flatMap(v=>v.selected).join(", ")}</p>}
                <span style={{fontSize:14,fontWeight:500,color:C.gold,fontFamily:"'DM Mono',monospace"}}>₹{linePrice}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:0,background:C.gl1,border:`1px solid ${C.glBd}`,borderRadius:11,overflow:"hidden",flexShrink:0}}>
                <button onClick={()=>onUpdateQty(key,-1)} style={{width:34,height:34,background:"none",border:"none",color:C.inkSub,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                <span style={{width:26,textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:600,color:C.ink}}>{ci.quantity}</span>
                <button onClick={()=>onUpdateQty(key,1)} style={{width:34,height:34,background:"none",border:"none",color:C.gold,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
            </div>
          );
        })}

        {/* ── LOYALTY POINTS REDEMPTION ── */}
        {customerPoints >= minPtsToRedeem && (
          <div style={{marginBottom:12,borderRadius:16,overflow:"hidden",
            border:`1.5px solid ${redeemedPoints>0?"rgba(200,146,42,0.5)":"rgba(200,146,42,0.2)"}`,
            background:redeemedPoints>0?`linear-gradient(135deg,${C.g15},${C.g08})`:C.gl1,
            transition:`all 0.3s ${EASE}`}}>

            {redeemedPoints > 0 ? (
              /* Points applied */
              <div style={{padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:10,background:GG,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,
                    boxShadow:`0 4px 12px ${C.g40}`}}>🫘</div>
                  <div>
                    <p style={{fontSize:13,fontWeight:700,color:C.goldL,
                      fontFamily:"'DM Sans',sans-serif",margin:"0 0 1px"}}>
                      {redeemedPoints} points applied!
                    </p>
                    <p style={{fontSize:11,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",margin:0}}>
                      Saving ₹{ptsDisc} · {customerPoints-redeemedPoints} pts remaining
                    </p>
                  </div>
                </div>
                <button onClick={()=>onRedeemPoints?.(0)}
                  style={{fontSize:11,color:C.ruby,background:"none",border:"none",
                    cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,flexShrink:0}}>
                  Remove
                </button>
              </div>
            ) : (
              /* Points available — show option */
              <div>
                <button onClick={()=>setShowPointsPanel(p=>!p)}
                  style={{width:"100%",padding:"13px 16px",background:"none",border:"none",
                    cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                  <div style={{width:36,height:36,borderRadius:10,
                    background:`linear-gradient(135deg,${C.g15},${C.g08})`,
                    border:`1px solid ${C.g25}`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🫘</div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:13,fontWeight:700,color:C.ink,
                      fontFamily:"'DM Sans',sans-serif",margin:"0 0 1px"}}>
                      Use Loyalty Points
                    </p>
                    <p style={{fontSize:11,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",margin:0}}>
                      You have <span style={{color:C.gold,fontWeight:700}}>{customerPoints} pts</span>
                      {" "}= ₹{Math.floor(customerPoints/10)} discount available
                    </p>
                  </div>
                  <span style={{fontSize:16,color:C.gold,
                    transform:showPointsPanel?"rotate(180deg)":"none",
                    transition:`transform 0.2s ${EASE}`}}>⌄</span>
                </button>

                {/* Points input panel */}
                {showPointsPanel&&(
                  <div style={{padding:"0 16px 14px",borderTop:`1px solid ${C.gl2}`,
                    animation:`stgIn 0.3s ${EASE}`}}>
                    <p style={{fontSize:11,color:C.inkDim,fontFamily:"'DM Sans',sans-serif",
                      margin:"10px 0 10px"}}>
                      Min {minPtsToRedeem} pts · Max {maxPtsRedeemable} pts (50% of order)
                    </p>

                    {/* Quick select buttons */}
                    <div style={{display:"flex",gap:8,marginBottom:10}}>
                      {[100,200,500].filter(v=>v<=maxPtsRedeemable).map(pts=>(
                        <button key={pts} onClick={()=>setPointsInput(String(pts))}
                          style={{flex:1,padding:"8px 4px",borderRadius:9,
                            border:`1px solid ${pointsInput===String(pts)?"rgba(200,146,42,0.55)":C.glBd}`,
                            background:pointsInput===String(pts)?C.g15:C.gl1,
                            color:pointsInput===String(pts)?C.goldL:C.inkSub,
                            fontWeight:700,fontSize:12,cursor:"pointer",
                            fontFamily:"'DM Mono',monospace",
                            transition:`all 0.2s ${EASE}`}}>
                          {pts}
                          <span style={{display:"block",fontSize:9,fontWeight:400,
                            color:pointsInput===String(pts)?C.goldM:C.inkDim}}>
                            =₹{Math.floor(pts/10)}
                          </span>
                        </button>
                      ))}
                      <button onClick={()=>setPointsInput(String(maxPtsRedeemable))}
                        style={{flex:1,padding:"8px 4px",borderRadius:9,
                          border:`1px solid ${pointsInput===String(maxPtsRedeemable)?"rgba(200,146,42,0.55)":C.glBd}`,
                          background:pointsInput===String(maxPtsRedeemable)?C.g15:C.gl1,
                          color:pointsInput===String(maxPtsRedeemable)?C.goldL:C.inkSub,
                          fontWeight:700,fontSize:11,cursor:"pointer",
                          fontFamily:"'DM Mono',monospace",
                          transition:`all 0.2s ${EASE}`}}>
                        Max
                        <span style={{display:"block",fontSize:9,fontWeight:400,
                          color:pointsInput===String(maxPtsRedeemable)?C.goldM:C.inkDim}}>
                          =₹{Math.floor(maxPtsRedeemable/10)}
                        </span>
                      </button>
                    </div>

                    <div style={{display:"flex",gap:9}}>
                      <input type="number" value={pointsInput}
                        onChange={e=>setPointsInput(e.target.value)}
                        placeholder={`Enter points (${minPtsToRedeem}-${maxPtsRedeemable})`}
                        style={{flex:1,padding:"10px 13px",borderRadius:10,
                          border:`1px solid ${C.glBd}`,background:C.gl1,
                          color:C.ink,fontSize:13,outline:"none",
                          fontFamily:"'DM Mono',monospace"}}/>
                      <button onClick={handleRedeemSubmit}
                        disabled={!pointsInput||Number(pointsInput)<minPtsToRedeem}
                        style={{padding:"10px 16px",borderRadius:10,border:"none",
                          background:pointsInput&&Number(pointsInput)>=minPtsToRedeem?GG:C.gl1,
                          color:pointsInput&&Number(pointsInput)>=minPtsToRedeem?C.void:C.inkDim,
                          fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0,
                          fontFamily:"'DM Sans',sans-serif",
                          transition:`all 0.22s ${EASE}`}}>
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Promo code */}
        <div style={{background:C.gl1,border:`1px solid ${C.glBd}`,borderRadius:16,padding:"14px 16px",marginBottom:14,marginTop:2}}>
          <p style={{fontSize:10.5,fontWeight:700,color:C.inkDim,letterSpacing:".08em",textTransform:"uppercase",margin:"0 0 10px",fontFamily:"'DM Sans',sans-serif"}}>Promo Code</p>
          {discount ? (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <p style={{fontSize:13,fontWeight:700,color:C.emerald,margin:"0 0 1px",fontFamily:"'DM Sans',sans-serif"}}>✓ {discount.code} applied!</p>
                <p style={{fontSize:11,color:C.inkSub,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Saving ₹{discount.discount}</p>
              </div>
              <button onClick={()=>onDiscountChange(null)} style={{fontSize:11,color:C.ruby,background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Remove</button>
            </div>
          ):(
            <div style={{display:"flex",gap:9}}>
              <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&applyCode()} placeholder="Enter promo code"
                style={{flex:1,padding:"10px 13px",borderRadius:11,border:`1px solid ${codeErr?C.ruby:C.glBd}`,background:C.gl1,color:C.ink,fontSize:13,outline:"none",fontFamily:"'DM Mono',monospace",letterSpacing:".05em"}}/>
              <button onClick={applyCode} disabled={applying||!code.trim()}
                style={{padding:"10px 18px",borderRadius:11,border:"none",background:code.trim()?GG:C.gl1,color:code.trim()?C.void:C.inkDim,fontWeight:700,fontSize:13,cursor:code.trim()?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",flexShrink:0,transition:`all 0.22s ${EASE}`}}>
                {applying?"...":"Apply"}
              </button>
            </div>
          )}
          {codeErr&&<p style={{fontSize:11,color:C.ruby,margin:"7px 0 0",fontFamily:"'DM Sans',sans-serif"}}>{codeErr}</p>}
        </div>

        {/* Bill summary */}
        <div style={{background:`linear-gradient(135deg,${C.surface},${C.raise})`,border:`1px solid ${C.glBd}`,borderRadius:17,overflow:"hidden",marginBottom:10}}>
          <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.gl2}`}}>
            <p style={{fontSize:11,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".12em",textTransform:"uppercase",margin:0}}>Bill Summary</p>
          </div>
          {[
            {l:"Subtotal",v:`₹${sub}`},
            ...(disc>0?[{l:`Promo (${discount?.code||""})`,v:`−₹${disc}`,green:true}]:[]),
            ...(ptsDisc>0?[{l:`Points (${redeemedPoints} pts)`,v:`−₹${ptsDisc}`,green:true}]:[]),
            {l:"Taxes (5% GST)",v:`₹${tax}`},
          ].map(row=>(
            <div key={row.l} style={{display:"flex",justifyContent:"space-between",padding:"11px 16px",borderBottom:`1px solid ${C.gl1}`}}>
              <span style={{fontSize:13,color:C.inkSub,fontFamily:"'DM Sans',sans-serif"}}>{row.l}</span>
              <span style={{fontSize:13,color:(row as any).green?C.emerald:C.inkSub,fontFamily:"'DM Mono',monospace"}}>{row.v}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:"14px 16px"}}>
            <span style={{fontSize:15,fontWeight:700,color:C.ink,fontFamily:"'DM Sans',sans-serif"}}>Total</span>
            <span style={{fontSize:19,fontWeight:500,color:C.gold,fontFamily:"'DM Mono',monospace"}}>₹{total}</span>
          </div>
        </div>

        {/* Points preview — earn on this order */}
        <div style={{background:C.g08,border:`1px solid ${C.g15}`,borderRadius:12,
          padding:"10px 14px",display:"flex",alignItems:"center",gap:9,marginBottom:4}}>
          <span style={{fontSize:16}}>🫘</span>
          <p style={{fontSize:11.5,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",margin:0}}>
            You'll earn <span style={{color:C.gold,fontWeight:700}}>+{Math.floor(total/10)} points</span> on this order
          </p>
        </div>
      </div>

      {/* CTA */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"12px 18px 0",paddingBottom:"calc(68px + env(safe-area-inset-bottom))",background:`linear-gradient(to top,${C.void} 55%,transparent)`,zIndex:20}}>
        <button onClick={onCheckout} className="press"
          style={{width:"100%",padding:"17px",borderRadius:16,border:"none",background:GG,
            color:C.void,fontWeight:800,fontSize:16,fontFamily:"'DM Sans',sans-serif",
            boxShadow:`0 8px 32px ${C.g40}`,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:9}}>
          Proceed to Checkout
          <svg width={16} height={16} viewBox="0 0 16 16"><path d="M2 8h12M9 3l5 5-5 5" stroke={C.void} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// CHECKOUT SCREEN — Cinematic 3-step
// ═══════════════════════════════════════════════════
function CheckoutScreen({ cart, table, discount, onBack, onPay, isPlacing }:{
  cart:ECI[];table:Table|null;discount:Disc|null;
  onBack:()=>void;onPay:(method:string,tip:number,note:string)=>void;isPlacing:boolean;
}) {
  const [method,setMethod]=useState("upi");
  const [tip,   setTip   ]=useState<number>(0);
  const [note,  setNote  ]=useState("");
  const sub  = cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
  const disc = discount?.discount||0;
  const tax  = Math.round((sub-disc)*0.05);
  const total= sub-disc+tax+tip;

  const PAY_METHODS=[
    {id:"upi",   icon:"📱",label:"UPI / BHIM"},
    {id:"card",  icon:"💳",label:"Card"},
    {id:"wallet",icon:"👛",label:"Wallet"},
    {id:"cash",  icon:"💵",label:"Cash"},
  ];
  const TIPS=[0,10,20,50];

  return(
    <div style={{minHeight:"100dvh",background:C.void,display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{padding:"18px 20px 14px",display:"flex",alignItems:"center",gap:13,borderBottom:`1px solid ${C.gl2}`,flexShrink:0}}>
        <button onClick={onBack} style={{width:38,height:38,borderRadius:12,background:C.gl1,border:`1px solid ${C.glBd}`,color:C.ink,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>←</button>
        <div>
          <p style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".15em",textTransform:"uppercase",margin:"0 0 1px"}}>✦ Step 2 of 3</p>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:600,color:C.ink,margin:0}}>Checkout</h2>
        </div>
      </div>

      <div className="hs" style={{flex:1,overflowY:"auto",padding:"16px 20px",paddingBottom:160}}>
        {/* Table info */}
        <div style={{background:`linear-gradient(135deg,${C.surface},${C.raise})`,borderRadius:16,padding:"14px 16px",marginBottom:14,border:`1px solid ${C.glBd}`,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:28}}>🪑</span>
          <div>
            <p style={{fontSize:10.5,color:C.inkDim,fontFamily:"'DM Mono',monospace",letterSpacing:".08em",margin:"0 0 2px",textTransform:"uppercase"}}>Dine In</p>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,color:C.ink,margin:0}}>Table {table?.tableNumber||"—"}</p>
          </div>
          <div style={{marginLeft:"auto",background:C.g08,border:`1px solid ${C.g15}`,borderRadius:8,padding:"4px 12px"}}>
            <span style={{fontSize:11,color:C.goldM,fontFamily:"'DM Mono',monospace",fontWeight:500}}>✓ Confirmed</span>
          </div>
        </div>

        {/* Special note */}
        <div style={{marginBottom:14}}>
          <p style={{fontSize:11,fontWeight:700,color:C.inkDim,letterSpacing:".08em",textTransform:"uppercase",margin:"0 0 9px",fontFamily:"'DM Sans',sans-serif"}}>Special Instructions</p>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Any special requests for the kitchen..."
            rows={2} style={{width:"100%",padding:"12px 14px",borderRadius:13,border:`1px solid ${C.glBd}`,background:C.gl1,color:C.ink,fontSize:13,outline:"none",resize:"none",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}/>
        </div>

        {/* Payment method */}
        <div style={{marginBottom:14}}>
          <p style={{fontSize:11,fontWeight:700,color:C.inkDim,letterSpacing:".08em",textTransform:"uppercase",margin:"0 0 10px",fontFamily:"'DM Sans',sans-serif"}}>Payment Method</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
            {PAY_METHODS.map(pm=>{
              const isSel=method===pm.id;
              return(
                <button key={pm.id} onClick={()=>setMethod(pm.id)}
                  style={{display:"flex",alignItems:"center",gap:9,
                    background:isSel?`linear-gradient(135deg,${C.g15},${C.g08})`:C.gl1,
                    border:`1.5px solid ${isSel?"rgba(200,146,42,0.55)":C.glBd}`,
                    borderRadius:14,padding:"12px 14px",cursor:"pointer",
                    boxShadow:isSel?`0 0 18px ${C.g15},inset 0 1px 0 rgba(255,255,255,.05)`:"none",
                    transition:`all 0.25s ${SPR}`,
                  }}>
                  <span style={{fontSize:22}}>{pm.icon}</span>
                  <span style={{fontSize:13,fontWeight:isSel?700:500,color:isSel?C.goldL:C.inkSub,fontFamily:"'DM Sans',sans-serif"}}>{pm.label}</span>
                  {isSel&&<div style={{marginLeft:"auto",width:16,height:16,borderRadius:"50%",background:GG,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:6,height:6,borderRadius:"50%",background:C.void}}/></div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tip */}
        <div style={{marginBottom:14}}>
          <p style={{fontSize:11,fontWeight:700,color:C.inkDim,letterSpacing:".08em",textTransform:"uppercase",margin:"0 0 10px",fontFamily:"'DM Sans',sans-serif"}}>Add a Tip <span style={{color:C.inkGh,fontWeight:400,fontSize:10}}>100% to our team 🙌</span></p>
          <div style={{display:"flex",gap:8}}>
            {TIPS.map(t=>(
              <button key={t} onClick={()=>setTip(tip===t&&t!==0?0:t)}
                style={{flex:1,padding:"10px 4px",borderRadius:11,
                  border:`1.5px solid ${tip===t&&t!==0?"rgba(200,146,42,0.55)":C.glBd}`,
                  background:tip===t&&t!==0?`linear-gradient(135deg,${C.g15},${C.g08})`:C.gl1,
                  color:tip===t&&t!==0?C.goldL:C.inkSub,fontWeight:700,fontSize:13,cursor:"pointer",
                  fontFamily:"'DM Mono',monospace",transition:`all 0.2s ${EASE}`,
                }}>
                {t===0?"None":`₹${t}`}
              </button>
            ))}
          </div>
        </div>

        {/* Bill */}
        <div style={{background:`linear-gradient(135deg,${C.surface},${C.raise})`,border:`1px solid ${C.glBd}`,borderRadius:16,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.gl2}`}}>
            <p style={{fontSize:11,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".12em",textTransform:"uppercase",margin:0}}>Bill Summary</p>
          </div>
          {[
            {l:"Subtotal",         v:`₹${sub}`},
            ...(disc>0?[{l:`Discount`,v:`−₹${disc}`,g:true}]:[]),
            {l:"GST (5%)",         v:`₹${tax}`},
            ...(tip>0?[{l:"Tip",  v:`₹${tip}`}]:[]),
          ].map(r=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderBottom:`1px solid ${C.gl1}`}}>
              <span style={{fontSize:13,color:C.inkSub,fontFamily:"'DM Sans',sans-serif"}}>{r.l}</span>
              <span style={{fontSize:13,color:(r as any).g?C.emerald:C.inkSub,fontFamily:"'DM Mono',monospace"}}>{r.v}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:"14px 16px"}}>
            <span style={{fontSize:15,fontWeight:700,color:C.ink,fontFamily:"'DM Sans',sans-serif"}}>Total</span>
            <span style={{fontSize:21,fontWeight:500,color:C.gold,fontFamily:"'DM Mono',monospace"}}>₹{total}</span>
          </div>
        </div>
      </div>

      {/* Pay CTA */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"12px 18px 0",paddingBottom:"calc(68px + env(safe-area-inset-bottom))",background:`linear-gradient(to top,${C.void} 55%,transparent)`,zIndex:20}}>
        <button onClick={()=>onPay(method,tip,note)} disabled={isPlacing} className="press"
          style={{width:"100%",padding:"17px",borderRadius:16,border:"none",
            background:isPlacing?C.gl1:GG,
            color:isPlacing?C.inkDim:C.void,fontWeight:800,fontSize:16,
            fontFamily:"'DM Sans',sans-serif",
            boxShadow:isPlacing?"none":`0 8px 32px ${C.g40}`,
            cursor:isPlacing?"not-allowed":"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {isPlacing
            ? <><div style={{width:18,height:18,borderRadius:"50%",border:`2.5px solid ${C.inkDim}30`,borderTopColor:C.inkDim,animation:"spin .75s linear infinite"}}/> Placing Order...</>
            : <><span>🔒</span> Pay ₹{total} Securely</>
          }
        </button>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════
// ORDER PLACED — Emotional success screen
// ═══════════════════════════════════════════════════
function OrderPlacedScreen({ order, onTrack, onHome }:{order:Order;onTrack:()=>void;onHome:()=>void}) {
  const [phase,setPhase]=useState(0);
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase(1),400);
    const t2=setTimeout(()=>setPhase(2),900);
    const t3=setTimeout(()=>setPhase(3),1400);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[]);
  const beans=Math.floor(order.totalAmount/10);

  return(
    <div style={{minHeight:"100dvh",background:C.void,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"28px 24px",textAlign:"center",overflow:"hidden"}}>
      {/* Ambient glow */}
      <div style={{position:"fixed",top:"20%",left:"50%",transform:"translateX(-50%)",width:300,height:300,borderRadius:"50%",background:`radial-gradient(circle,${C.g15} 0%,transparent 70%)`,pointerEvents:"none",animation:"breathG 4s ease-in-out infinite"}}/>

      {/* Success ring */}
      <div style={{position:"relative",width:120,height:120,marginBottom:28,
        opacity:phase>=1?1:0,transform:phase>=1?"scale(1)":"scale(0.7)",
        transition:`all 0.65s ${SPR} 0.1s`}}>
        {/* Outer pulse ring */}
        <div style={{position:"absolute",inset:-12,borderRadius:"50%",border:`1px solid ${C.g40}`,animation:phase>=1?"glowExp 2s ease-out infinite":"none"}}/>
        {/* Ring */}
        <svg width={120} height={120} style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
          <circle cx={60} cy={60} r={52} fill="none" stroke={`${C.gold}18`} strokeWidth={3}/>
          <circle cx={60} cy={60} r={52} fill="none" stroke={C.gold} strokeWidth={3}
            strokeDasharray={`${2*Math.PI*52}`} strokeDashoffset={phase>=1?"0":`${2*Math.PI*52}`}
            strokeLinecap="round" style={{transition:"stroke-dashoffset 1.1s cubic-bezier(0.65,0,0.35,1) 0.2s"}}
            filter={`drop-shadow(0 0 8px ${C.gold})`}/>
        </svg>
        {/* Center icon */}
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:68,height:68,borderRadius:"50%",background:`radial-gradient(circle,${C.g25},${C.g08})`,border:`1px solid ${C.g40}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>✓</div>
        </div>
      </div>

      {/* Text */}
      <div style={{opacity:phase>=2?1:0,transform:phase>=2?"translateY(0)":"translateY(18px)",transition:`all 0.5s ${EASE} 0.15s`,marginBottom:6}}>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:300,color:C.ink,margin:"0 0 6px",letterSpacing:"-.01em"}}>
          Order <em style={{fontStyle:"italic",color:C.goldL,fontWeight:600}}>Placed!</em>
        </h1>
        <p style={{fontSize:13,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>
          Your order is confirmed. Our kitchen is preparing your food with care.
        </p>
      </div>

      {/* Order details card */}
      <div style={{width:"100%",maxWidth:360,background:`linear-gradient(135deg,${C.surface},${C.raise})`,borderRadius:18,padding:"16px 18px",marginTop:22,border:`1px solid ${C.glBd}`,
        opacity:phase>=2?1:0,transform:phase>=2?"translateY(0)":"translateY(18px)",transition:`all 0.5s ${EASE} 0.3s`}}>
        {[
          {l:"Order ID", v:`#${order.orderNumber||order._id.slice(-6).toUpperCase()}`},
          {l:"Table",    v:`Table ${order.tableNumber}`},
          {l:"Items",    v:`${order.items.length} item${order.items.length!==1?"s":""}`},
          {l:"Total",    v:`₹${order.totalAmount}`,gold:true},
        ].map(r=>(
          <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.gl1}`}}>
            <span style={{fontSize:12,color:C.inkDim,fontFamily:"'DM Mono',monospace"}}>{r.l}</span>
            <span style={{fontSize:13,fontWeight:600,color:(r as any).gold?C.gold:C.ink,fontFamily:"'DM Mono',monospace"}}>{r.v}</span>
          </div>
        ))}
      </div>

      {/* Beans earned */}
      <div style={{marginTop:14,padding:"12px 22px",background:`linear-gradient(135deg,${C.g08},${C.g15})`,border:`1px solid ${C.g25}`,borderRadius:99,
        opacity:phase>=3?1:0,transform:phase>=3?"scale(1)":"scale(0.85)",transition:`all 0.5s ${SPR} 0.1s`,
        display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:20}}>🫘</span>
        <span style={{fontSize:13,fontWeight:600,color:C.goldL,fontFamily:"'DM Sans',sans-serif"}}>+{beans} Beans earned!</span>
      </div>

      {/* CTAs */}
      <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:10,marginTop:26,
        opacity:phase>=3?1:0,transform:phase>=3?"translateY(0)":"translateY(14px)",transition:`all 0.5s ${EASE} 0.2s`}}>
        <button onClick={onTrack} className="press"
          style={{padding:"16px",borderRadius:14,border:"none",background:GG,color:C.void,fontWeight:700,fontSize:15,fontFamily:"'DM Sans',sans-serif",boxShadow:`0 8px 28px ${C.g40}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <span>Track My Order</span>
          <svg width={15} height={15} viewBox="0 0 15 15"><path d="M2 7.5h11M8 3l5 4.5-5 4.5" stroke={C.void} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button onClick={onHome} style={{padding:"14px",borderRadius:14,border:`1px solid ${C.glBd}`,background:C.gl1,color:C.inkSub,fontWeight:600,fontSize:14,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",backdropFilter:"blur(12px)"}}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ORDER TRACKING — Cinematic live timeline
// ═══════════════════════════════════════════════════
function OrderTrackingScreen({ order, onReady, onBack }:{order:Order;onReady:()=>void;onBack:()=>void}) {
  const stages=[
    {id:"open",      icon:"📝",label:"Order Confirmed",  sub:"Kitchen has received your order"},
    {id:"kotSent",   icon:"👨‍🍳",label:"Being Prepared",   sub:"Our chef is crafting your items"},
    {id:"ready",     icon:"✅",label:"Ready to Serve",    sub:"Your order is ready"},
    {id:"delivered", icon:"🍽️",label:"Served",            sub:"Enjoy your meal!"},
  ];
  const stageIdx = stages.findIndex(s=>s.id===order.status);
  const curIdx   = stageIdx>=0?stageIdx:0;

  useEffect(()=>{if(order.status==="settled")onReady();},[order.status,onReady]);

  return(
    <div style={{minHeight:"100dvh",background:C.void,display:"flex",flexDirection:"column"}}>
      {/* Hero */}
      <div style={{position:"relative",height:220,overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 100% 100% at 50% 0%,#3D2010 0%,${C.void} 70%)`}}/>
        {[0,1,2,3].map(i=><div key={i} style={{position:"absolute",bottom:"30%",left:`${38+i*8}%`,width:5,height:24,borderRadius:99,background:`linear-gradient(to top,${C.g60},transparent)`,animation:`smokeUp ${2.4+i*.55}s ${i*.7}s ease-out infinite`,filter:"blur(1.5px)",opacity:0}}/>)}
        {/* Back button */}
        <button onClick={onBack} style={{position:"absolute",top:16,left:16,zIndex:10,width:38,height:38,borderRadius:12,background:"rgba(2,1,0,0.65)",backdropFilter:"blur(12px)",border:`1px solid ${C.glBd}`,color:C.ink,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width={18} height={18} viewBox="0 0 18 18" fill="none"><path d="M11 4l-5 5 5 5" stroke={C.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:52,marginBottom:10,animation:"floatY 3s ease-in-out infinite"}}>☕</div>
          <div style={{background:`${C.gold}18`,border:`1px solid ${C.g25}`,borderRadius:99,padding:"6px 18px",marginBottom:6}}>
            <p style={{fontSize:11,color:C.goldM,fontFamily:"'DM Mono',monospace",fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",margin:0}}>{stages[curIdx]?.label||"Processing"}</p>
          </div>
          <p style={{fontSize:12,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",margin:0}}>{stages[curIdx]?.sub}</p>
        </div>
        <div style={{position:"absolute",bottom:0,inset:"auto 0 0 0",height:60,background:`linear-gradient(to top,${C.void},transparent)`}}/>
      </div>

      {/* Timeline */}
      <div style={{padding:"24px 24px",flex:1}}>
        <p style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".15em",textTransform:"uppercase",margin:"0 0 20px"}}>Order Progress</p>
        {stages.map((stage,i)=>{
          const done=i<curIdx;const active=i===curIdx;const future=i>curIdx;
          return(
            <div key={stage.id} style={{display:"flex",gap:14,marginBottom:i<stages.length-1?0:0}}>
              {/* Line + dot */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:22,flexShrink:0}}>
                <div style={{width:22,height:22,borderRadius:"50%",
                  background:done?GG:active?`linear-gradient(135deg,${C.g25},${C.g15})`:`${C.gl1}`,
                  border:`2px solid ${done?C.gold:active?"rgba(200,146,42,0.55)":C.glBd}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,flexShrink:0,
                  boxShadow:active?`0 0 0 4px ${C.g15},0 0 16px ${C.g25}`:"none",
                  transition:`all 0.5s ${EASE}`,
                  animation:active?"pulseRg 2s ease-in-out infinite":"none",
                }}>
                  {done?<span style={{color:C.void,fontSize:10}}>✓</span>:<span style={{fontSize:12}}>{stage.icon}</span>}
                </div>
                {i<stages.length-1&&<div style={{width:2,flex:1,minHeight:28,background:done?`linear-gradient(to bottom,${C.gold},${C.g40})`:`${C.gl2}`,margin:"3px 0",borderRadius:1,transition:`background 0.5s ${EASE}`}}/>}
              </div>
              {/* Content */}
              <div style={{paddingBottom:i<stages.length-1?20:0,flex:1,opacity:future?0.35:1,transition:`opacity 0.4s ${EASE}`}}>
                <p style={{fontSize:14.5,fontWeight:active?700:500,color:active?C.goldL:done?C.ink:C.inkDim,fontFamily:"'DM Sans',sans-serif",margin:"0 0 2px",transition:`color 0.3s ${EASE}`}}>{stage.label}</p>
                <p style={{fontSize:11.5,color:active?C.inkSub:C.inkDim,fontFamily:"'DM Sans',sans-serif",margin:0}}>{stage.sub}</p>
                {active&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:C.gold,animation:"pulseRg 1.5s ease-in-out infinite"}}/>
                  <span style={{fontSize:11,color:C.gold,fontFamily:"'DM Mono',monospace"}}>In progress...</span>
                </div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notification note */}
      <div style={{margin:"0 20px 24px",padding:"14px 16px",background:C.gl1,border:`1px solid ${C.glBd}`,borderRadius:15,display:"flex",gap:11,alignItems:"center"}}>
        <span style={{fontSize:20}}>🔔</span>
        <p style={{fontSize:12,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5,margin:0}}>We'll notify you when your order is ready to be served at your table.</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ORDER READY — Feedback + Beans
// ═══════════════════════════════════════════════════
function OrderReadyScreen({ order, onRestart }:{order:Order|null;onRestart:()=>void}) {
  const [rating,setRating]=useState(0);
  const [submitted,setSubmitted]=useState(false);
  const beans=order?Math.floor(order.totalAmount/10):0;
  const EMOJIS=[
    {v:1,e:"😞",l:"Bad"},
    {v:2,e:"😐",l:"Okay"},
    {v:3,e:"😊",l:"Good"},
    {v:4,e:"😄",l:"Great"},
    {v:5,e:"🤩",l:"Amazing"},
  ];

  return(
    <div style={{minHeight:"100dvh",background:C.void,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"28px 24px",textAlign:"center"}}>
      {/* Ambient */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",background:`radial-gradient(ellipse 70% 50% at 50% 60%,${C.g08} 0%,transparent 70%)`,animation:"breathG 5s ease-in-out infinite"}}/>

      {/* Coffee glow */}
      <div style={{position:"relative",width:100,height:100,marginBottom:22,animation:"floatY 3s ease-in-out infinite"}}>
        <div style={{position:"absolute",inset:-16,borderRadius:"50%",background:`radial-gradient(circle,${C.g25} 0%,transparent 70%)`,animation:"breathG 3s ease-in-out infinite"}}/>
        <div style={{width:100,height:100,borderRadius:"50%",overflow:"hidden",border:`2px solid ${C.g60}`,boxShadow:`0 0 40px ${C.g40}`}}>
          <div style={{width:"100%",height:"100%",background:`radial-gradient(circle at 40% 35%,#5C2E0A,#2A1205)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44}}>☕</div>
        </div>
      </div>

      <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:300,color:C.ink,margin:"0 0 6px",letterSpacing:"-.01em",animation:`fadeRise 0.6s 0.1s ${EASE} both`}}>
        Order <em style={{color:C.goldL,fontStyle:"italic",fontWeight:600}}>Ready!</em>
      </h1>
      <p style={{fontSize:13,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",margin:"0 0 26px",animation:`fadeRise 0.6s 0.2s ${EASE} both`}}>
        Your order is being served. Enjoy your meal!
      </p>

      {/* Beans earned */}
      <div style={{width:"100%",maxWidth:340,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24,animation:`stgIn 0.5s 0.3s ${EASE} both`}}>
        <div style={{background:`linear-gradient(135deg,${C.g15},${C.g08})`,border:`1px solid ${C.g25}`,borderRadius:15,padding:"14px 12px",textAlign:"center"}}>
          <p style={{fontSize:26,margin:"0 0 3px"}}>🫘</p>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:500,color:C.gold,margin:"0 0 2px"}}>+{beans}</p>
          <p style={{fontSize:11,color:C.inkDim,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Beans Earned</p>
        </div>
        <div style={{background:C.gl1,border:`1px solid ${C.glBd}`,borderRadius:15,padding:"14px 12px",textAlign:"center"}}>
          <p style={{fontSize:26,margin:"0 0 3px"}}>🧾</p>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:500,color:C.ink,margin:"0 0 2px"}}>₹{order?.totalAmount||0}</p>
          <p style={{fontSize:11,color:C.inkDim,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Total Paid</p>
        </div>
      </div>

      {/* Rating */}
      {!submitted ? (
        <div style={{width:"100%",maxWidth:340,animation:`stgIn 0.5s 0.4s ${EASE} both`}}>
          <p style={{fontSize:12,color:C.inkDim,fontFamily:"'DM Mono',monospace",letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 14px"}}>How was your experience?</p>
          <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:20}}>
            {EMOJIS.map(em=>(
              <button key={em.v} onClick={()=>setRating(em.v)}
                style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                  background:"none",border:"none",cursor:"pointer",
                  transform:rating===em.v?"scale(1.25)":"scale(1)",
                  transition:`transform 0.25s ${SPR}`,
                  filter:rating>0&&rating!==em.v?"grayscale(0.7) opacity(0.5)":"none",
                }}>
                <span style={{fontSize:28}}>{em.e}</span>
                <span style={{fontSize:9.5,color:rating===em.v?C.gold:C.inkDim,fontFamily:"'DM Mono',monospace",fontWeight:rating===em.v?600:400}}>{em.l}</span>
              </button>
            ))}
          </div>
          {rating>0&&(
            <button onClick={()=>setSubmitted(true)} className="press"
              style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:GG,color:C.void,fontWeight:700,fontSize:14,fontFamily:"'DM Sans',sans-serif",boxShadow:`0 6px 24px ${C.g40}`,cursor:"pointer",marginBottom:10,animation:`scaleIn 0.35s ${SPR}`}}>
              Submit Feedback
            </button>
          )}
        </div>
      ):(
        <div style={{marginBottom:20,animation:`scaleIn 0.4s ${SPR}`,textAlign:"center"}}>
          <p style={{fontSize:22,marginBottom:4}}>🙏</p>
          <p style={{fontSize:14,color:C.emerald,fontWeight:600,fontFamily:"'DM Sans',sans-serif",margin:"0 0 4px"}}>Thank you!</p>
          <p style={{fontSize:12,color:C.inkDim,fontFamily:"'DM Sans',sans-serif"}}>Your feedback helps us improve</p>
        </div>
      )}

      <button onClick={onRestart} style={{padding:"14px 32px",borderRadius:14,border:`1px solid ${C.glBd}`,background:C.gl1,color:C.inkSub,fontWeight:600,fontSize:14,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",backdropFilter:"blur(12px)"}}>
        Order Again 🔄
      </button>
    </div>
  );
}
// ═══════════════════════════════════════════════════
// TOP CANCEL BAR
// ═══════════════════════════════════════════════════
function TopCancelBar({ order, onCancelled }:{order:Order;onCancelled:()=>void}) {
  const [secs,setSecs]=useState(120);
  const [cancelling,setCancelling]=useState(false);
  useEffect(()=>{
    const placed=new Date(order.createdAt).getTime();
    const update=()=>{const elapsed=Math.floor((Date.now()-placed)/1000);setSecs(Math.max(0,120-elapsed));};
    update();const iv=setInterval(update,1000);return()=>clearInterval(iv);
  },[order.createdAt]);
  if(secs<=0)return null;
  const cancel=async()=>{
    if(!window.confirm("Cancel this order?"))return;
    setCancelling(true);
    try{await orderApi.cancelOrder(order._id);onCancelled();}catch{}
    setCancelling(false);
  };
  return(
    <div style={{background:`linear-gradient(135deg,rgba(192,57,43,0.12),rgba(192,57,43,0.06))`,backdropFilter:"blur(16px)",border:`1px solid rgba(192,57,43,0.3)`,borderRadius:12,margin:"10px 16px 0",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:C.ruby,animation:"pulseRg 1.5s ease-in-out infinite"}}/>
        <p style={{fontSize:12,color:"rgba(255,100,90,0.9)",margin:0,fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
          Cancel window closes in <span style={{fontFamily:"'DM Mono',monospace",color:C.ruby,fontWeight:700}}>{Math.floor(secs/60)}:{String(secs%60).padStart(2,"0")}</span>
        </p>
      </div>
      <button onClick={cancel} disabled={cancelling}
        style={{fontSize:11.5,color:C.ruby,background:"rgba(192,57,43,0.12)",border:`1px solid rgba(192,57,43,0.3)`,borderRadius:8,padding:"5px 12px",cursor:"pointer",fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>
        {cancelling?"...":"Cancel"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// FLOATING CART BAR
// ═══════════════════════════════════════════════════
function FloatingCartBar({ cart, discount, onView }:{cart:ECI[];discount:Disc|null;onView:()=>void}) {
  const total=cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
  const tax=Math.round(total*0.05);
  const disc=discount?.discount||0;
  const final=total+tax-disc;
  const items=cart.reduce((s,i)=>s+i.quantity,0);
  const [bump,setBump]=useState(false);
  const prev=useRef(0);
  useEffect(()=>{if(cart.length!==prev.current){setBump(true);setTimeout(()=>setBump(false),500);}prev.current=cart.length;},[cart.length]);
  if(!cart.length)return null;
  return(
    <div style={{position:"fixed",bottom:76,left:14,right:14,zIndex:50}}>
      <button onClick={onView}
        style={{width:"100%",
          background:`linear-gradient(135deg,rgba(18,16,12,0.97),rgba(26,23,16,0.97))`,
          backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",
          borderRadius:20,padding:"12px 14px",
          border:`1px solid rgba(200,146,42,0.42)`,
          boxShadow:`0 8px 40px rgba(0,0,0,0.75),0 0 0 1px ${C.g08},0 0 28px ${C.g15}`,
          display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",
          transform:bump?"scale(1.025)":"scale(1)",
          transition:`transform 0.35s ${SPR}`,
        }}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{position:"relative"}}>
            <div style={{width:44,height:44,borderRadius:14,background:`linear-gradient(135deg,${C.g25},${C.g15})`,border:`1.5px solid rgba(200,146,42,0.45)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,backdropFilter:"blur(8px)"}}>🛒</div>
            <div style={{position:"absolute",top:-7,right:-7,width:20,height:20,borderRadius:"50%",background:GG,color:C.void,fontSize:9.5,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${C.dark}`,animation:bump?"cartPop .45s ease":"none",boxShadow:`0 2px 8px ${C.g40}`,fontFamily:"'DM Mono',monospace"}}>{items}</div>
          </div>
          <div>
            <p style={{fontFamily:"'DM Mono',monospace",fontWeight:500,fontSize:17,color:C.ink,margin:0,lineHeight:1}}>₹{final}</p>
            {disc>0&&<p style={{fontSize:10,color:C.emerald,margin:"3px 0 0",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Saving ₹{disc} ✦</p>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,background:GG,borderRadius:13,padding:"10px 18px",boxShadow:`0 4px 20px ${C.g40}`}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13.5,color:C.void}}>View Cart</span>
          <svg width={14} height={14} viewBox="0 0 14 14"><path d="M2 7h10M8 3l4 4-4 4" stroke={C.void} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// BOTTOM NAV — Cinematic glass
// ═══════════════════════════════════════════════════
function BottomNav({ active, onChange, orderBadge, cartBadge }:{
  active:Tab;onChange:(t:Tab)=>void;orderBadge:boolean;cartBadge:number;
}) {
  const TABS=[
    {id:"home"   as Tab,icon:"🏠",label:"Home"},
    {id:"menu"   as Tab,icon:"📋",label:"Menu"},
    {id:"orders" as Tab,icon:"📦",label:"Orders"},
    {id:"cart"   as Tab,icon:"🛒",label:"Cart"},
    {id:"profile"as Tab,icon:"👤",label:"You"},
  ];
  return(
    <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:40,
      background:"rgba(6,5,3,0.96)",
      backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",
      borderTop:`1px solid ${C.gl2}`,
      paddingBottom:"env(safe-area-inset-bottom)",
    }}>
      {/* Gold top line */}
      <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.g25},${C.g40},${C.g25},transparent)`}}/>
      <div style={{display:"flex",justifyContent:"space-around",padding:"8px 0 4px"}}>
        {TABS.map(tab=>{
          const isA=active===tab.id;
          return(
            <button key={tab.id} onClick={()=>onChange(tab.id)}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                background:"none",border:"none",cursor:"pointer",
                padding:"6px 10px",borderRadius:13,
                color:isA?C.gold:C.inkDim,
                position:"relative",
                transition:`color 0.22s ${EASE}`,
              }}>
              {/* Active indicator dot */}
              {isA&&<div style={{position:"absolute",top:-1,left:"50%",transform:"translateX(-50%)",width:16,height:2,borderRadius:1,background:GG,boxShadow:`0 0 8px ${C.g60}`}}/>}
              {/* Icon */}
              <div style={{position:"relative"}}>
                <span style={{fontSize:22,filter:isA?`drop-shadow(0 0 6px ${C.gold})`:"none",transition:"filter 0.22s ease"}}>{tab.icon}</span>
                {/* Badges */}
                {tab.id==="orders"&&orderBadge&&<div style={{position:"absolute",top:-4,right:-4,width:9,height:9,borderRadius:"50%",background:C.gold,border:`1.5px solid rgba(6,5,3,0.96)`,animation:"pulseRg 2s ease-in-out infinite"}}/>}
                {tab.id==="cart"&&cartBadge>0&&<div style={{position:"absolute",top:-6,right:-8,minWidth:17,height:17,borderRadius:99,background:GG,color:C.void,fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`1.5px solid rgba(6,5,3,0.96)`,fontFamily:"'DM Mono',monospace",padding:"0 3px"}}>{cartBadge}</div>}
              </div>
              <span style={{fontSize:9.5,fontWeight:isA?700:400,letterSpacing:isA?".02em":".01em",fontFamily:"'DM Sans',sans-serif",transition:`font-weight 0.2s ${EASE}`}}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════
// ORDERS TAB (inline)
// ═══════════════════════════════════════════════════
function OrdersTab({ existingOrder, queuePos }:{existingOrder:Order|null;queuePos:number|undefined}) {
  return(
    <div style={{padding:"20px 20px",minHeight:"60dvh"}}>
      <p style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".15em",textTransform:"uppercase",margin:"0 0 4px"}}>✦ Orders</p>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600,color:C.ink,margin:"0 0 20px"}}>My Orders</h2>
      {existingOrder ? (
        <LiveOrderTracker order={existingOrder} queuePosition={queuePos}/>
      ):(
        <div style={{textAlign:"center",padding:"52px 20px",animation:`fadeIn 0.5s ${EASE}`}}>
          <div style={{fontSize:52,marginBottom:14,animation:"floatY 3s ease-in-out infinite",opacity:.5}}>📋</div>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:500,color:C.inkSub,margin:"0 0 7px"}}>No Active Orders</h3>
          <p style={{fontSize:13,color:C.inkDim,fontFamily:"'DM Sans',sans-serif"}}>Browse the menu and place an order!</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PROFILE TAB
// ═══════════════════════════════════════════════════
function ProfileTab({ table, customer }:{table:Table|null;customer:{name:string;phone:string}|null}) {
  const [profile,  setProfile ] = useState<any>(null);
  const [history,  setHistory ] = useState<any[]>([]);
  const [loading,  setLoading ] = useState(false);
  const [activeTab,setActiveTab] = useState<"overview"|"history"|"rewards">("overview");

  const TIER_CFG: Record<string,{label:string;color:string;icon:string;next:number}> = {
    bronze:   {label:"Bronze",  color:"#CD7F32",icon:"🥉",next:500},
    silver:   {label:"Silver",  color:"#C0C0C0",icon:"🥈",next:1000},
    gold:     {label:"Gold",    color:"#C8922A",icon:"🥇",next:2000},
    platinum: {label:"Platinum",color:"#E5E4E2",icon:"💎",next:9999},
  };

  useEffect(()=>{
    const session = getSessionCustomer();
    if(!session?._id) return;
    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
    Promise.all([
      fetch(`${API_URL}/customers/${session._id}/profile`).then(r=>r.json()),
      fetch(`${API_URL}/customers/${session._id}/history`).then(r=>r.json()),
    ]).then(([p,h])=>{
      if(p.success) setProfile(p.data);
      if(h.success) setHistory(h.data||[]);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[customer]);

  const session = getSessionCustomer();
  const tier    = profile?.customer?.tier||"bronze";
  const tierCfg = TIER_CFG[tier];
  const pts     = profile?.customer?.totalPoints||session?.totalPoints||0;
  const nextPts = tierCfg.next;
  const progress= tier==="platinum"?100:Math.min(100,(pts/nextPts)*100);

  // Not registered
  if(!customer && !session) return(
    <div style={{minHeight:"60dvh",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:"28px 24px",textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:16,animation:"floatY 3s ease-in-out infinite",opacity:.5}}>👤</div>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,
        fontWeight:500,color:C.inkSub,margin:"0 0 8px"}}>Not Signed In</h2>
      <p style={{fontSize:13,color:C.inkDim,fontFamily:"'DM Sans',sans-serif",
        lineHeight:1.6,maxWidth:260,margin:"0 0 20px"}}>
        Share your phone number to track loyalty points, order history and exclusive rewards.
      </p>
      <div style={{background:C.g08,border:`1px solid ${C.g15}`,borderRadius:14,
        padding:"14px 18px",display:"flex",gap:10,alignItems:"flex-start",maxWidth:280}}>
        <span style={{fontSize:18,flexShrink:0}}>💡</span>
        <p style={{fontSize:12,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",
          margin:0,lineHeight:1.6}}>
          The popup will appear after 15 seconds. Enter your phone to join!
        </p>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100dvh",background:C.void,paddingBottom:120}}>

      {/* ── HERO PROFILE CARD ── */}
      <div style={{background:`radial-gradient(ellipse 140% 100% at 80% 0%,rgba(60,30,8,0.85),rgba(11,9,6,0.98))`,
        padding:"22px 20px 20px",position:"relative",overflow:"hidden",
        borderBottom:`1px solid ${C.gl2}`}}>
        <div style={{position:"absolute",top:-30,right:-30,width:180,height:180,
          borderRadius:"50%",background:`radial-gradient(circle,${C.g15},transparent)`,
          pointerEvents:"none",animation:"breathG 5s ease-in-out infinite"}}/>

        {/* Name + tier */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
          <div style={{width:60,height:60,borderRadius:18,
            background:`linear-gradient(135deg,${C.g25},${C.g08})`,
            border:`2px solid ${tierCfg.color}60`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:26,flexShrink:0,
            boxShadow:`0 0 20px ${tierCfg.color}30`}}>
            {tierCfg.icon}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,
              fontWeight:600,color:C.ink,margin:"0 0 3px",
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {profile?.customer?.name||customer?.name||"Guest"}
            </h2>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:99,
                background:`${tierCfg.color}20`,color:tierCfg.color,
                fontFamily:"'DM Mono',monospace",letterSpacing:".06em",
                border:`1px solid ${tierCfg.color}40`}}>
                {tierCfg.icon} {tierCfg.label} Member
              </span>
              {(profile?.customer?.visits||0) > 1 && (
                <span style={{fontSize:10,color:C.inkDim,fontFamily:"'DM Mono',monospace"}}>
                  {profile?.customer?.visits} visits
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:16}}>
          {[
            {l:"Points",  v:String(pts),        sub:`₹${Math.floor(pts/10)} value`, gold:true},
            {l:"Orders",  v:String(profile?.customer?.totalOrders||0), sub:"lifetime"},
            {l:"Spent",   v:`₹${profile?.customer?.totalSpent||0}`,    sub:"total"},
          ].map(s=>(
            <div key={s.l} style={{background:"rgba(255,255,255,0.04)",borderRadius:12,
              padding:"11px 10px",textAlign:"center",
              border:`1px solid ${s.gold?"rgba(200,146,42,0.3)":"rgba(255,255,255,0.07)"}`}}>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:18,fontWeight:500,
                color:s.gold?C.goldL:C.ink,margin:"0 0 1px",lineHeight:1}}>{s.v}</p>
              <p style={{fontSize:10,color:C.inkDim,margin:"2px 0 0",
                fontFamily:"'DM Sans',sans-serif"}}>{s.l}</p>
              <p style={{fontSize:9,color:s.gold?C.gold:C.inkGh,margin:"1px 0 0",
                fontFamily:"'DM Mono',monospace"}}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tier progress */}
        {tier!=="platinum"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:10.5,color:C.inkSub,fontFamily:"'DM Sans',sans-serif"}}>
                {nextPts-pts} pts to {TIER_CFG[tier==="bronze"?"silver":tier==="silver"?"gold":"platinum"].icon} {TIER_CFG[tier==="bronze"?"silver":tier==="silver"?"gold":"platinum"].label}
              </span>
              <span style={{fontSize:10.5,color:C.gold,fontFamily:"'DM Mono',monospace"}}>
                {pts}/{nextPts}
              </span>
            </div>
            <div style={{height:5,borderRadius:3,background:"rgba(255,255,255,0.07)"}}>
              <div style={{height:"100%",borderRadius:3,background:GG,
                width:`${progress}%`,transition:"width 1.2s ease",
                boxShadow:`0 0 8px rgba(200,146,42,0.5)`}}/>
            </div>
          </div>
        )}
        {tier==="platinum"&&(
          <div style={{textAlign:"center",padding:"4px 0"}}>
            <span style={{fontSize:11,color:"#E5E4E2",fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>
              💎 Maximum tier reached — enjoy VIP perks!
            </span>
          </div>
        )}
      </div>

      {/* ── SUB TABS ── */}
      <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.gl2}`,
        background:"rgba(11,9,6,0.98)",position:"sticky",top:0,zIndex:10}}>
        {(["overview","history","rewards"] as const).map(t=>(
          <button key={t} onClick={()=>setActiveTab(t)}
            style={{flex:1,padding:"12px 0",background:"none",border:"none",
              borderBottom:`2px solid ${activeTab===t?C.gold:"transparent"}`,
              color:activeTab===t?C.gold:C.inkDim,
              fontWeight:activeTab===t?700:400,
              fontSize:12.5,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
              transition:`all 0.2s ${EASE}`,
              textTransform:"capitalize"}}>
            {t==="overview"?"Overview":t==="history"?"History":"Rewards"}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab==="overview"&&(
        <div style={{padding:"16px 18px"}}>
          {/* Phone */}
          <div style={{background:`linear-gradient(135deg,${C.surface},${C.raise})`,
            borderRadius:14,padding:"13px 16px",marginBottom:10,
            border:`1px solid ${C.glBd}`,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22}}>📱</span>
            <div>
              <p style={{fontSize:10,color:C.inkDim,fontFamily:"'DM Mono',monospace",
                letterSpacing:".08em",textTransform:"uppercase",margin:"0 0 1px"}}>Phone</p>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:16,
                fontWeight:500,color:C.ink,margin:0,letterSpacing:".05em"}}>
                {customer?.phone||profile?.customer?.phone||"—"}
              </p>
            </div>
          </div>

          {/* Table */}
          {table&&(
            <div style={{background:`linear-gradient(135deg,${C.surface},${C.raise})`,
              borderRadius:14,padding:"13px 16px",marginBottom:10,
              border:`1px solid ${C.glBd}`,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:22}}>🪑</span>
              <div>
                <p style={{fontSize:10,color:C.inkDim,fontFamily:"'DM Mono',monospace",
                  letterSpacing:".08em",textTransform:"uppercase",margin:"0 0 1px"}}>Current Table</p>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,
                  fontWeight:600,color:C.ink,margin:0}}>Table {table.tableNumber}</p>
              </div>
            </div>
          )}

          {/* First visit */}
          {profile?.customer?.firstVisit&&(
            <div style={{background:`linear-gradient(135deg,${C.surface},${C.raise})`,
              borderRadius:14,padding:"13px 16px",marginBottom:10,
              border:`1px solid ${C.glBd}`,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:22}}>📅</span>
              <div>
                <p style={{fontSize:10,color:C.inkDim,fontFamily:"'DM Mono',monospace",
                  letterSpacing:".08em",textTransform:"uppercase",margin:"0 0 1px"}}>Member Since</p>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,
                  fontWeight:500,color:C.ink,margin:0}}>
                  {new Date(profile.customer.firstVisit).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}
                </p>
              </div>
            </div>
          )}

          {/* Cafe card */}
          <div style={{background:`radial-gradient(ellipse 120% 120% at 80% 40%,rgba(60,30,8,0.9),rgba(18,16,12,0.98))`,
            borderRadius:16,padding:18,marginTop:6,border:`1px solid ${C.g15}`,
            position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-16,top:"50%",transform:"translateY(-50%)",
              width:100,height:100,borderRadius:"50%",
              background:`radial-gradient(circle,${C.g15},transparent)`,
              pointerEvents:"none"}}/>
            <div style={{position:"absolute",right:8,bottom:-4,fontSize:52,opacity:.08}}>☕</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{width:38,height:38,borderRadius:11,background:C.surface,
                border:`1px solid ${C.g25}`,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:18}}>☕</div>
              <div>
                <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,
                  color:C.gold,margin:0}}>Golden Beans</h3>
                <p style={{fontSize:8.5,color:"rgba(200,146,42,0.5)",margin:0,
                  letterSpacing:".15em",fontFamily:"'DM Mono',monospace",
                  textTransform:"uppercase"}}>Cafe &amp; Bistro</p>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["🌿 100% Veg","☕ Handcrafted","⚡ Fast Service","❤️ Made with Love"].map(f=>(
                <span key={f} style={{fontSize:11,color:"rgba(245,237,216,0.55)",
                  fontFamily:"'DM Sans',sans-serif",
                  background:"rgba(255,255,255,0.04)",borderRadius:99,
                  padding:"3px 10px",border:"1px solid rgba(255,255,255,0.06)"}}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab==="history"&&(
        <div style={{padding:"16px 18px"}}>
          {loading ? (
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {[1,2,3,4].map(i=>(
                <div key={i} className="sk" style={{height:64,borderRadius:14}}/>
              ))}
            </div>
          ) : history.length===0 ? (
            <div style={{textAlign:"center",padding:"44px 20px"}}>
              <div style={{fontSize:44,marginBottom:12,opacity:.35,
                animation:"floatY 3s ease-in-out infinite"}}>🫘</div>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,
                fontWeight:500,color:C.inkSub,margin:"0 0 6px"}}>No history yet</h3>
              <p style={{fontSize:12.5,color:C.inkDim,fontFamily:"'DM Sans',sans-serif"}}>
                Place your first order to start earning points!
              </p>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {history.map((tx:any,i:number)=>{
                const isEarn = tx.points > 0;
                const isBonus= tx.type==="bonus";
                return(
                  <div key={tx._id||i}
                    style={{background:`linear-gradient(135deg,${C.surface},${C.raise})`,
                      borderRadius:13,padding:"12px 14px",
                      border:`1px solid ${C.glBd}`,
                      display:"flex",alignItems:"center",gap:12,
                      animation:`stgIn 0.4s ${i*.05}s ${EASE} both`}}>
                    <div style={{width:40,height:40,borderRadius:11,flexShrink:0,
                      background:isEarn?`rgba(46,125,82,0.15)`:"rgba(192,57,43,0.1)",
                      border:`1px solid ${isEarn?"rgba(46,125,82,0.3)":"rgba(192,57,43,0.25)"}`,
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                      {isBonus?"🎉":isEarn?"🫘":"🔓"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:13,fontWeight:600,color:C.ink,
                        fontFamily:"'DM Sans',sans-serif",margin:"0 0 2px",
                        whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {tx.description}
                      </p>
                      <p style={{fontSize:10.5,color:C.inkDim,
                        fontFamily:"'DM Mono',monospace",margin:0}}>
                        {new Date(tx.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                        {" · "}Balance: {tx.balance} pts
                      </p>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:600,
                        color:isEarn?C.emerald:C.ruby,margin:0}}>
                        {isEarn?"+":""}{tx.points}
                      </p>
                      <p style={{fontSize:9.5,color:C.inkDim,margin:"1px 0 0",
                        fontFamily:"'DM Mono',monospace"}}>pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── REWARDS TAB ── */}
      {activeTab==="rewards"&&(
        <div style={{padding:"16px 18px"}}>
          {/* Points value */}
          <div style={{background:`linear-gradient(135deg,rgba(200,146,42,0.12),rgba(200,146,42,0.05))`,
            border:`1.5px solid rgba(200,146,42,0.35)`,borderRadius:18,
            padding:"18px 16px",marginBottom:14,textAlign:"center",
            boxShadow:`0 8px 28px rgba(200,146,42,0.1)`}}>
            <p style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",
              letterSpacing:".16em",textTransform:"uppercase",margin:"0 0 6px"}}>
              Your Points Value
            </p>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:48,
              fontWeight:700,color:C.goldL,margin:"0 0 4px",lineHeight:1}}>
              ₹{Math.floor(pts/10)}
            </p>
            <p style={{fontSize:12,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",margin:0}}>
              {pts} points · 100 pts = ₹10 discount
            </p>
          </div>

          {/* Redeem info */}
          <p style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",
            letterSpacing:".14em",textTransform:"uppercase",margin:"0 0 10px"}}>
            ✦ How to Redeem
          </p>
          {[
            {icon:"🛒",title:"Add items to cart",desc:"Select your favourite items"},
            {icon:"🫘",title:"Use points at cart",desc:"Tap 'Use Loyalty Points' in cart"},
            {icon:"💰",title:"Get instant discount",desc:"Points deducted from your total"},
            {icon:"🎉",title:"Earn more points",desc:"1 point per ₹10 spent"},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",
              marginBottom:10,padding:"12px 14px",
              background:`linear-gradient(135deg,${C.surface},${C.raise})`,
              borderRadius:13,border:`1px solid ${C.glBd}`,
              animation:`stgIn 0.4s ${i*.07}s ${EASE} both`}}>
              <div style={{width:38,height:38,borderRadius:11,
                background:C.g08,border:`1px solid ${C.g15}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:18,flexShrink:0}}>{s.icon}</div>
              <div>
                <p style={{fontSize:13.5,fontWeight:600,color:C.ink,
                  fontFamily:"'DM Sans',sans-serif",margin:"0 0 2px"}}>{s.title}</p>
                <p style={{fontSize:11.5,color:C.inkDim,
                  fontFamily:"'DM Sans',sans-serif",margin:0}}>{s.desc}</p>
              </div>
            </div>
          ))}

          {/* Tier benefits */}
          <p style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",
            letterSpacing:".14em",textTransform:"uppercase",margin:"14px 0 10px"}}>
            ✦ Tier Benefits
          </p>
          {Object.entries(TIER_CFG).map(([key,t],i)=>(
            <div key={key} style={{display:"flex",alignItems:"center",gap:12,
              padding:"11px 14px",marginBottom:8,
              background:key===tier?C.g08:`linear-gradient(135deg,${C.surface},${C.raise})`,
              borderRadius:13,
              border:`1px solid ${key===tier?"rgba(200,146,42,0.4)":C.glBd}`,
              opacity:i>["bronze","silver","gold","platinum"].indexOf(tier)?0.45:1}}>
              <span style={{fontSize:22,flexShrink:0}}>{t.icon}</span>
              <div style={{flex:1}}>
                <p style={{fontSize:13,fontWeight:700,
                  color:key===tier?t.color:C.inkSub,
                  fontFamily:"'DM Sans',sans-serif",margin:"0 0 1px"}}>{t.label}</p>
                <p style={{fontSize:11,color:C.inkDim,
                  fontFamily:"'DM Sans',sans-serif",margin:0}}>
                  {key==="bronze"?"0 pts":key==="silver"?"500+ pts":key==="gold"?"1000+ pts":"2000+ pts"}
                </p>
              </div>
              {key===tier&&(
                <span style={{fontSize:10,color:t.color,background:`${t.color}18`,
                  border:`1px solid ${t.color}40`,borderRadius:99,padding:"2px 10px",
                  fontFamily:"'DM Mono',monospace",fontWeight:700,flexShrink:0}}>
                  Current
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════
// MAIN PAGE — CustomerOrderPage
// ═══════════════════════════════════════════════════
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
  const [cart,        setCart       ] = useState<ECI[]>([]);
  const [discount,       setDiscount      ] = useState<Disc|null>(null);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [isPlacing,      setIsPlacing     ] = useState(false);
  const [placedOrder,    setPlacedOrder   ] = useState<Order|null>(null);

  // Navigation
  const [screen,       setScreen      ] = useState<Screen>("security");
  const [activeTab,    setActiveTab   ] = useState<Tab>("home");
  const [selectedItem, setSelectedItem] = useState<MenuItem|null>(null);
  const [activeCat,    setActiveCat   ] = useState("");
  const [customer,     setCustomer    ] = useState<{name:string;phone:string}|null>(null);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const favsLoaded = useRef(false);

  // ── Load favorites on mount ──
  // Priority: session customer → localStorage fallback
  useEffect(()=>{
    if(secStatus!=="passed" || favsLoaded.current) return;
    favsLoaded.current = true;

    // 1. Try server (if customer identified)
    const session = getSessionCustomer();
    if(session?._id) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
      fetch(`${API_URL}/customers/${session._id}/favorites`)
        .then(r=>r.json())
        .then(d=>{ if(d.success && d.data?.length) setFavs(new Set(d.data)); })
        .catch(()=>loadFavsFromStorage()); // fallback
    } else {
      loadFavsFromStorage();
    }
  },[secStatus]);

  // Reload favs when customer identifies (CRM popup completes)
  useEffect(()=>{
    if(!customer) return;
    const session = getSessionCustomer();
    if(!session?._id) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
    fetch(`${API_URL}/customers/${session._id}/favorites`)
      .then(r=>r.json())
      .then(d=>{ if(d.success && d.data?.length) setFavs(new Set(d.data)); })
      .catch(()=>{});
  },[customer]);

  const loadFavsFromStorage = ()=>{
    try {
      const saved = localStorage.getItem("gb_favs");
      if(saved) setFavs(new Set(JSON.parse(saved)));
    } catch {}
  };

  const saveFavsToStorage = (ids: string[])=>{
    try { localStorage.setItem("gb_favs", JSON.stringify(ids)); } catch {}
  };

  const prevStatus = useRef<string|null>(null);
  const pollTimer  = useRef<NodeJS.Timeout|null>(null);

  const onPassed = useCallback(()=>{ setSecStatus("passed"); setScreen("home"); },[]);
  const onFailed = useCallback((r:SecRes)=>{ setSecResult(r); setSecStatus("failed"); },[]);
  const onRetry  = useCallback(()=>setSecStatus("checking"),[]);

  // ── Customer Identity — session based (phone persistent across visits) ──
  useEffect(()=>{
    if(secStatus!=="passed") return;
    // Check current session
    const session = getSessionCustomer();
    if(session) setCustomer({ name:session.name, phone:session.phone });

    // Listen for session updates (when CRM popup completes)
    const onSession = ()=>{
      const s = getSessionCustomer();
      if(s) setCustomer({ name:s.name, phone:s.phone });
    };
    window.addEventListener("gb_customer_updated", onSession);
    // Poll every 2s in case CRM popup just completed
    const iv = setInterval(()=>{
      const s = getSessionCustomer();
      if(s) setCustomer(p => p?.phone===s.phone ? p : { name:s.name, phone:s.phone });
    }, 2000);
    return()=>{ window.removeEventListener("gb_customer_updated", onSession); clearInterval(iv); };
  },[secStatus]);

  // Load menu + table + orders
  useEffect(()=>{
    if(secStatus!=="passed")return;
    async function load(){
      try{
        setLoading(true);
        const [mR,tR]=await Promise.all([menuApi.getMenu(),tableApi.getTable(tableId)]);
        setMenu(mR.data.data);setTable(tR.data.data);
        if(mR.data.data.length>0)setActiveCat(mR.data.data[0]._id);
        const oR=await orderApi.getOrderByTable(tableId);
        if(oR.data.data){
          const o:Order=oR.data.data;
          if(["settled","cancelled"].includes(o.status)){localStorage.removeItem("gb_active_order");setExistingOrder(null);}
          else{setExistingOrder(o);prevStatus.current=o.status;localStorage.setItem("gb_active_order",o._id);}
        }
      }catch{}finally{setLoading(false);}
    }
    load();
  },[tableId,secStatus]);

  // Poll orders
  useEffect(()=>{
    if(secStatus!=="passed")return;
    let alive=true;
    const check=async()=>{
      if(!alive)return;
      try{
        if(existingOrder){
          const r=await orderApi.getOrder(existingOrder._id);
          const o:Order|null=r.data?.data;
          if(o){
            if(o.status==="settled"){
              // Earn loyalty points for this order
              const session = getSessionCustomer();
              if(session?._id) {
                earnPoints(session._id, existingOrder._id, existingOrder.totalAmount)
                  .catch(()=>{}); // background — don't block UI
              }
              // Clear session — next customer starts fresh
              clearSessionCustomer();
              localStorage.removeItem("gb_active_order");
              setPlacedOrder(existingOrder); setScreen("ready"); return;
            }
            if(o.status==="cancelled"){localStorage.removeItem("gb_active_order");setExistingOrder(null);return;}
            setExistingOrder(o);
          }
        }
        const [oR,aR]=await Promise.all([orderApi.getOrderByTable(tableId),orderApi.getKdsOrders()]);
        if(!alive)return;
        if(aR.data.data)setAllOrders(aR.data.data);
        const nO:Order|null=oR.data.data;
        if(!nO)return;
        prevStatus.current=nO.status;setExistingOrder(nO);
      }catch{}
    };
    pollTimer.current=setInterval(check,5000);
    const onVis=()=>{if(document.visibilityState==="visible")check();};
    document.addEventListener("visibilitychange",onVis);window.addEventListener("focus",check);
    check();
    return()=>{alive=false;if(pollTimer.current)clearInterval(pollTimer.current);document.removeEventListener("visibilitychange",onVis);window.removeEventListener("focus",check);};
  },[secStatus,tableId,existingOrder]);

  const queuePos=existingOrder
    ?allOrders.filter(o=>["kotSent","open"].includes(o.status)&&o._id!==existingOrder._id&&new Date(o.createdAt).getTime()<new Date(existingOrder.createdAt).getTime()).length
    :undefined;

  // Cart ops
  const addToCart=(item:MenuItem,qty:number,variants:{groupName:string;selected:string[]}[],mod:number)=>{
    const key=item._id+JSON.stringify(variants);
    setCart(prev=>{
      const ex=prev.find(c=>(c.menuItemId+JSON.stringify(c.variants))===key);
      if(ex)return prev.map(c=>(c.menuItemId+JSON.stringify(c.variants))===key?{...c,quantity:c.quantity+qty}:c);
      return[...prev,{menuItemId:item._id,name:item.name,price:item.price,quantity:qty,notes:"",isVeg:true,variants,totalPriceModifier:mod,imageUrl:item.imageUrl}];
    });
    setSelectedItem(null);
  };

  const updateQty=(key:string,d:number)=>setCart(prev=>{
    const ex=prev.find(c=>(c.menuItemId+JSON.stringify(c.variants))===key);
    if(!ex)return prev;
    if(ex.quantity+d<=0)return prev.filter(c=>(c.menuItemId+JSON.stringify(c.variants))!==key);
    return prev.map(c=>(c.menuItemId+JSON.stringify(c.variants))===key?{...c,quantity:c.quantity+d}:c);
  });

  // Payment
  const handlePay=async(method:string,tip:number,note:string)=>{
    if(!cart.length)return;
    try{
      const API=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
      const pm=(await fetch(`${API}/settings/payment_mode`).then(r=>r.json())).data||"counter";
      if((pm==="online"||pm==="both")&&method!=="cash"){await initiateRazorpay(tip,note);}
      else{await placeOrder(tip,note);}
    }catch{await placeOrder(tip,note);}
  };

  const initiateRazorpay=async(tip:number,note:string)=>{
    const sub=cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
    const disc=discount?.discount||0;
    const total=Math.round(Math.max(0,sub-disc)*1.05)+tip;
    const API=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
    setIsPlacing(true);
    try{
      const orderData=await fetch(`${API}/payment/create-order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:total,tableNumber:table?.tableNumber})}).then(r=>r.json());
      if(!orderData.success)throw new Error(orderData.message);
      await new Promise<void>((resolve,reject)=>{if((window as any).Razorpay){resolve();return;}const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.onload=()=>resolve();s.onerror=()=>reject();document.body.appendChild(s);});
      await new Promise<void>((resolve,reject)=>{new (window as any).Razorpay({key:orderData.data?.keyId,amount:total*100,currency:"INR",name:"Golden Beans Café",order_id:orderData.data?.orderId,prefill:{name:customer?.name||"",contact:customer?.phone||""},theme:{color:C.gold},handler:async(r:any)=>{try{const v=await fetch(`${API}/payment/verify`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)}).then(r=>r.json());if(v.success){await placeOrder(tip,note,r.razorpay_payment_id);resolve();}else reject();}catch(e){reject(e);}},modal:{ondismiss:()=>reject(new Error("cancelled"))}}).open();});
    }catch(e:any){if(e?.message!=="cancelled")alert(e?.message||"Payment failed");}
    finally{setIsPlacing(false);}
  };

  const placeOrder=async(tip=0,note="",paymentId?:string)=>{
    if(!cart.length)return;
    setIsPlacing(true);
    try{
      const res=await orderApi.createOrder({tableId,items:cart.map(c=>({menuItemId:c.menuItemId,name:c.name,price:c.price+(c.totalPriceModifier||0),quantity:c.quantity,notes:c.variants?.flatMap(v=>v.selected).join(", ")||note,isVeg:c.isVeg})),createdBy:"customer",customerName:customer?.name||"",customerPhone:customer?.phone||"",discount:discount?.discount||0,appliedPromoId:discount?.promotionId||null,appliedPromoCode:discount?.code||null,razorpayPaymentId:paymentId||null});
      const nO:Order=res.data.data;
      setCart([]);setDiscount(null);setRedeemedPoints(0);setExistingOrder(nO);prevStatus.current=nO.status;
      localStorage.setItem("gb_active_order",nO._id);
      setPlacedOrder(nO);setScreen("placed");
    }catch(e:unknown){alert(e instanceof Error?e.message:"Failed to place order");}
    finally{setIsPlacing(false);}
  };

  // Derived
  const allItems    = menu.flatMap(c=>c.items as MenuItem[]);
  const bestsellers = allItems.filter(i=>i.tags?.includes("bestseller")&&i.isAvailable);
  const catItems    = (menu.find(c=>c._id===activeCat)?.items||[]) as MenuItem[];
  const cartCount   = cart.reduce((s,i)=>s+i.quantity,0);
  const toggleFav = useCallback((id:string)=>{
    setFavs(prev=>{
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      const ids = Array.from(next);

      // Always save to localStorage (guest fallback)
      saveFavsToStorage(ids);

      // Sync to server if customer identified
      const session = getSessionCustomer();
      if(session?._id) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
        fetch(`${API_URL}/customers/${session._id}/favorites`, {
          method:"PUT",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ favorites: ids }),
        }).catch(()=>{}); // silent fail — localStorage already saved
      }
      return next;
    });
  },[]);


  // ── SECURITY GATE ──
  if(screen==="security"){
    if(secStatus==="checking")return<><style>{CSS}</style><SecurityCheckScreen onPassed={onPassed} onFailed={onFailed}/></>;
    if(secStatus==="failed"&&secResult)return<><style>{CSS}</style><AwarenessScreen result={secResult} onRetry={onRetry}/></>;
    return null;
  }

  // ── FULL SCREEN FLOWS ──
  if(screen==="ready")return(
    <div style={{minHeight:"100dvh",background:C.void}}><style>{CSS}</style>
      <OrderReadyScreen order={placedOrder} onRestart={()=>{setScreen("home");setCart([]);setDiscount(null);setRedeemedPoints(0);setExistingOrder(null);setPlacedOrder(null);router.replace("/");}}/>
    </div>
  );

  // ── MAIN SHELL — all screens share nav + help ──
  return(
    <div style={{minHeight:"100dvh",background:C.void,display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style>

      {/* TOP CANCEL BAR — always visible when order active */}
      {existingOrder&&!["settled","cancelled"].includes(existingOrder.status)&&(
        <TopCancelBar order={existingOrder} onCancelled={()=>{setExistingOrder(null);prevStatus.current=null;setScreen("home");}}/>
      )}

      {/* MAIN CONTENT AREA */}
      <main style={{flex:1,paddingBottom:screen==="home"&&cart.length>0?148:78,overflowX:"hidden"}}>

        {/* ── CART ── */}
        {screen==="cart"&&(
          <>
            <CartScreen cart={cart} onUpdateQty={updateQty} onCheckout={()=>setScreen("checkout")} onBack={()=>{setScreen("home");setActiveTab("home");}} discount={discount} onDiscountChange={setDiscount} allItems={allItems} onAddMore={item=>setSelectedItem(item)}
              customerPoints={getSessionCustomer()?.totalPoints||0}
              redeemedPoints={redeemedPoints}
              onRedeemPoints={(pts)=>{setRedeemedPoints(pts);}}
            />
            <ProductModal item={selectedItem} open={!!selectedItem} onClose={()=>setSelectedItem(null)} onAdd={addToCart}/>
          </>
        )}

        {/* ── CHECKOUT ── */}
        {screen==="checkout"&&(
          <CheckoutScreen cart={cart} table={table} discount={discount} onBack={()=>setScreen("cart")} onPay={handlePay} isPlacing={isPlacing}/>
        )}

        {/* ── ORDER PLACED ── */}
        {screen==="placed"&&placedOrder&&(
          <OrderPlacedScreen order={placedOrder} onTrack={()=>setScreen("tracking")} onHome={()=>setScreen("home")}/>
        )}

        {/* ── ORDER TRACKING ── */}
        {screen==="tracking"&&existingOrder&&(
          <OrderTrackingScreen order={existingOrder} onReady={()=>setScreen("ready")} onBack={()=>setScreen("home")}/>
        )}

        {/* ── HOME TABS ── */}
        {screen==="home"&&(
          <>
            {/* HOME TAB */}
            {activeTab==="home"&&(
              <CinematicHome
                menu={menu} cart={cart} loading={loading}
                customerData={customer} table={table}
                onItemTap={item=>setSelectedItem(item)}
                onCategorySelect={id=>{setActiveCat(id);setActiveTab("menu");}}
                activeCategoryId={activeCat}
                onViewCart={()=>setScreen("cart")}
                onExploreMenu={()=>setActiveTab("menu")}
                favs={favs} onToggleFav={toggleFav}
              />
            )}

            {/* MENU TAB */}
            {activeTab==="menu"&&(
              <MenuTab
                menu={menu} cart={cart} loading={loading}
                activeCat={activeCat} onCatSelect={setActiveCat}
                onItemTap={item=>setSelectedItem(item)}
                favs={favs} onFav={toggleFav}
                onBack={()=>setActiveTab("home")}
              />
            )}

            {/* ORDERS TAB */}
            {activeTab==="orders"&&<OrdersTab existingOrder={existingOrder} queuePos={queuePos}/>}

            {/* PROFILE TAB */}
            {activeTab==="profile"&&<ProfileTab table={table} customer={customer}/>}
          </>
        )}

        <CRMCaptureCard
          tableId={tableId}
          onCustomerIdentified={(profile: CustomerProfile)=>{
            setCustomer({ name:profile.name, phone:profile.phone });
            // Dispatch event so polling also catches it
            window.dispatchEvent(new Event("gb_customer_updated"));
          }}
        />
      </main>

      {/* FLOATING CART — show on home tabs only */}
      {screen==="home"&&cart.length>0&&<FloatingCartBar cart={cart} discount={discount} onView={()=>setScreen("cart")}/>}

      {/* BOTTOM NAV — always visible */}
      <BottomNav
        active={screen==="cart"?"cart":screen==="tracking"?"orders":screen==="placed"?"orders":activeTab}
        onChange={tab=>{
          if(tab==="cart")setScreen("cart");
          else if(tab==="orders"){if(existingOrder)setScreen("tracking");else{setScreen("home");setActiveTab("orders");}}
          else{setScreen("home");setActiveTab(tab);}
        }}
        orderBadge={!!existingOrder}
        cartBadge={cartCount}
      />

      {/* WAITER HELP — always visible */}
      <WaiterHelpSheet tableId={tableId} tableNumber={table?.tableNumber||tableId}/>

      {/* PRODUCT MODAL */}
      <ProductModal item={selectedItem} open={!!selectedItem} onClose={()=>setSelectedItem(null)} onAdd={addToCart}/>
    </div>
  );
}
