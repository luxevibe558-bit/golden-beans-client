"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import CRMCaptureCard from "@/components/CRMCaptureCard";
import WaiterHelpSheet from "@/components/WaiterHelpSheet";
import { menuApi, orderApi, tableApi } from "@/lib/api";
import { getThumbnailUrl, getHeroUrl } from "@/lib/cloudinary";
import LiveOrderTracker from "@/components/LiveOrderTracker";
import type { MenuCategory, MenuItem, CartItem, Table, Order, VariantGroup } from "@/types";

const D = {
  bg0:"#050505", bg1:"#0B0B0B", bg2:"#111111", bg3:"#1A1A1A", bg4:"#222222",
  gold:"#D4A44F", goldM:"#F5D27A", goldD:"#A56A1F", goldG:"rgba(212,164,79,0.28)",
  brown:"#4A2C1D", text:"#FFFFFF", textS:"#B7B7B7", textD:"#707070",
  green:"#3D9A5C", red:"#E53935", glass:"rgba(255,255,255,0.04)", glassB:"rgba(255,255,255,0.08)",
};
const GG = `linear-gradient(135deg, ${D.gold}, ${D.goldM})`;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Inter:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{background:#050505;overflow-x:hidden;overscroll-behavior:none;margin:0;padding:0;}
img{user-select:none;pointer-events:none;-webkit-user-drag:none;}
input,textarea{-webkit-user-select:text!important;user-select:text!important;}
.hs{scrollbar-width:none;-ms-overflow-style:none;}.hs::-webkit-scrollbar{display:none;}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes kenBurns{from{transform:scale(1)}to{transform:scale(1.07)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes goldPulse{0%,100%{box-shadow:0 0 0 0 rgba(212,164,79,0.28)}50%{box-shadow:0 0 0 12px transparent}}
@keyframes ripple{to{transform:scale(4);opacity:0}}
@keyframes cartBounce{0%{transform:scale(1)}25%{transform:scale(1.45)}60%{transform:scale(0.9)}100%{transform:scale(1)}}
@keyframes successRing{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes steamRise{0%{opacity:0;transform:translateY(0)}40%{opacity:0.5}100%{opacity:0;transform:translateY(-40px) scaleX(1.8)}}
@keyframes countUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes particle{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--px),var(--py)) scale(0);opacity:0}}
.sh{background:linear-gradient(90deg,#111 25%,#1A1A1A 50%,#111 75%);background-size:200% 100%;animation:shimmer 1.8s infinite;}
.gold-txt{background:linear-gradient(135deg,#D4A44F,#F5D27A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.press:active{transform:scale(0.95)!important;transition:transform 0.12s cubic-bezier(0.22,1,0.36,1)!important;}
`;

interface ECI extends CartItem {
  variants?:{groupName:string;selected:string[]}[];
  totalPriceModifier?:number; imageUrl?:string;
}
interface Discount {
  promotionId:string; name:string; description:string; discount:number;
  type:"auto"|"code"; code?:string; promoCodeId?:string;
}
interface SecResult {
  allowed:boolean; ipAllowed:boolean; gpsAllowed:boolean; gpsRequired:boolean;
  ipRequired:boolean; distance:number|null; cafeName:string; cafeAddress:string;
  cafePhone:string; wifiName:string; reason:string;
}
type Screen = "security"|"home"|"cart"|"checkout"|"orderPlaced"|"tracking"|"orderReady";
type Tab = "home"|"menu_detail"|"tracking"|"cart"|"info";

function Btn({children,onClick,variant="gold",fullWidth=false,size="md",disabled=false,loading=false}:{children:React.ReactNode;onClick?:()=>void;variant?:"gold"|"ghost"|"glass"|"danger";fullWidth?:boolean;size?:"sm"|"md"|"lg";disabled?:boolean;loading?:boolean}) {
  const bg=variant==="gold"?GG:variant==="ghost"?"transparent":variant==="danger"?D.red:D.glass;
  const color=variant==="gold"?D.bg0:D.text;
  const border=variant==="ghost"?`1.5px solid ${D.goldG}`:variant==="glass"?`1px solid ${D.glassB}`:"none";
  const pad=size==="sm"?"8px 16px":size==="lg"?"18px 32px":"13px 24px";
  const fs=size==="sm"?12:size==="lg"?16:14;
  return(
    <button onClick={disabled||loading?undefined:onClick} className="press"
      style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:fullWidth?"100%":undefined,padding:pad,borderRadius:14,border,background:disabled?"rgba(255,255,255,0.08)":bg,color:disabled?D.textD:color,fontSize:fs,fontWeight:700,cursor:disabled||loading?"not-allowed":"pointer",fontFamily:"Inter, sans-serif",opacity:disabled?0.5:1,transition:`all 0.25s ${EASE}`,boxShadow:variant==="gold"&&!disabled?`0 6px 24px ${D.goldG}`:"none",letterSpacing:"0.01em"}}>
      {loading?<div style={{width:16,height:16,borderRadius:"50%",border:`2.5px solid ${color}30`,borderTopColor:color,animation:"spin 0.75s linear infinite"}}/>:children}
    </button>
  );
}
function GoldBadge({children}:{children:React.ReactNode}) {
  return <span style={{background:GG,color:D.bg0,fontSize:8,fontWeight:900,padding:"2px 8px",borderRadius:99,letterSpacing:"0.06em",fontFamily:"Inter, sans-serif",display:"inline-block"}}>{children}</span>;
}
function Divider() {
  return <div style={{height:1,background:`linear-gradient(90deg,transparent,${D.glassB},transparent)`,margin:"4px 0"}}/>;
}
function WelcomeScreen({onDone}:{onDone:()=>void}) {
  const [n,setN]=useState(3);
  useEffect(()=>{const iv=setInterval(()=>setN(p=>{if(p<=1){clearInterval(iv);onDone();return 0;}return p-1;}),1000);return()=>clearInterval(iv);},[onDone]);
  return(
    <div style={{minHeight:"100vh",background:D.bg0,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 80% 60% at 50% 40%,${D.gold}15,transparent 70%)`,animation:"pulse 4s ease-in-out infinite"}}/>
      {[0,1,2].map(i=><div key={i} style={{position:"absolute",top:"38%",left:`${46+i*4}%`,width:5,height:22,background:`linear-gradient(to top,${D.gold}50,transparent)`,borderRadius:99,animation:`steamRise 2.2s ${i*0.7}s ease-out infinite`}}/>)}
      <div style={{textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{width:116,height:116,borderRadius:"50%",overflow:"hidden",margin:"0 auto 28px",border:`2px solid ${D.gold}55`,boxShadow:`0 0 0 10px ${D.gold}08,0 0 60px ${D.gold}25`,animation:"float 4s ease-in-out infinite,scaleIn 0.8s cubic-bezier(0.34,1.56,0.64,1)"}}>
          <img src="/logo-large.png" alt="GB" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        </div>
        <p style={{fontSize:10,color:D.gold,letterSpacing:"0.35em",textTransform:"uppercase",fontWeight:700,fontFamily:"Inter, sans-serif",marginBottom:8,animation:"fadeUp 0.5s 0.3s ease both"}}>Welcome to</p>
        <h1 style={{fontFamily:"'Playfair Display', serif",fontSize:50,fontWeight:800,color:D.text,lineHeight:1,marginBottom:6,animation:"fadeUp 0.5s 0.4s ease both"}}>Golden Beans</h1>
        <p style={{fontSize:14,color:D.textS,fontFamily:"Inter, sans-serif",marginBottom:44,fontWeight:300,animation:"fadeUp 0.5s 0.5s ease both"}}>Cafe &amp; Bistro</p>
        <div style={{width:62,height:62,margin:"0 auto",position:"relative",animation:"fadeUp 0.5s 0.6s ease both"}}>
          <svg width={62} height={62} style={{transform:"rotate(-90deg)"}}>
            <circle cx={31} cy={31} r={27} fill="none" stroke={`${D.gold}20`} strokeWidth={3}/>
            <circle cx={31} cy={31} r={27} fill="none" stroke={D.gold} strokeWidth={3} strokeDasharray={`${2*Math.PI*27}`} strokeDashoffset={`${2*Math.PI*27*(1-n/3)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.9s linear"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:22,fontWeight:800,color:D.gold,fontFamily:"'DM Mono', monospace"}}>{n}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityCheckScreen({onPassed,onFailed}:{onPassed:()=>void;onFailed:(r:SecResult)=>void}) {
  type CS="pending"|"loading"|"success"|"failed";
  const [gps,setGps]=useState<CS>("pending");
  const [wifi,setWifi]=useState<CS>("pending");
  const [showW,setShowW]=useState(false);
  useEffect(()=>{
    let mounted=true;
    async function run(){
      try{
        setGps("loading"); await new Promise(r=>setTimeout(r,400));
        const api=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
        const s=await fetch(`${api}/security/settings`).then(r=>r.json());
        const settings=s.data;
        if(settings&&!settings.ipWhitelistEnabled&&!settings.geofenceEnabled){if(mounted){setGps("success");setWifi("success");setShowW(true);}return;}
        if(!("geolocation"in navigator)){if(mounted){setGps("failed");await new Promise(r=>setTimeout(r,500));onFailed({allowed:false,ipAllowed:false,gpsAllowed:false,gpsRequired:true,ipRequired:true,distance:null,cafeName:"Golden Beans",cafeAddress:"",cafePhone:"",wifiName:"GoldenBeans-WiFi",reason:"GPS not supported"});}return;}
        let pos:GeolocationPosition|null=null;
        if(settings?.geofenceEnabled){pos=await new Promise<GeolocationPosition>((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:true,timeout:15000,maximumAge:0})).catch(e=>{throw new Error(e.code===1?"DENIED":"TIMEOUT");});}
        if(mounted)setGps("success");
        await new Promise(r=>setTimeout(r,500));
        if(mounted)setWifi("loading");
        const res=await fetch(`${api}/security/check`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({latitude:pos?.coords.latitude,longitude:pos?.coords.longitude})});
        const data=await res.json();
        if(!data.success)throw new Error(data.message);
        const result=data.data;
        if(mounted){if(result.securityDisabled){setGps("success");setWifi("success");setShowW(true);return;}setGps(result.gpsAllowed?"success":"failed");setWifi(result.ipAllowed?"success":"failed");await new Promise(r=>setTimeout(r,800));if(result.allowed)setShowW(true);else onFailed(result);}
      }catch(err:unknown){
        if(!mounted)return;
        const msg=err instanceof Error?err.message:"";
        const isGPS=msg==="DENIED"||msg.includes("denied");
        if(isGPS||msg==="TIMEOUT")setGps("failed");else setWifi("failed");
        await new Promise(r=>setTimeout(r,800));
        onFailed({allowed:false,ipAllowed:true,gpsAllowed:!isGPS,gpsRequired:true,ipRequired:true,distance:null,cafeName:"Golden Beans",cafeAddress:"Pramukh Darshan Society, Dabholi, Surat",cafePhone:"+91 XXXXX XXXXX",wifiName:"GoldenBeans-WiFi",reason:isGPS?"Location access denied":msg==="TIMEOUT"?"Location timed out":"Connect to cafe WiFi"});
      }
    }
    run(); return()=>{mounted=false;};
  },[onPassed,onFailed]);
  if(showW)return <WelcomeScreen onDone={onPassed}/>;
  const Row=({state,icon,lbl,desc}:{state:CS;icon:string;lbl:string;desc:string})=>{
    const c=state==="success"?D.green:state==="failed"?D.red:state==="loading"?D.gold:D.textD;
    return(
      <div style={{background:D.glass,border:`1px solid ${c}25`,borderRadius:16,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,marginBottom:10,transition:`all 0.4s ${EASE}`}}>
        <span style={{fontSize:22}}>{icon}</span>
        <div style={{flex:1}}><p style={{fontSize:13,fontWeight:600,color:c,margin:"0 0 2px",fontFamily:"Inter, sans-serif"}}>{lbl}</p><p style={{fontSize:11,color:D.textS,margin:0,fontFamily:"Inter, sans-serif"}}>{desc}</p></div>
        {state==="loading"&&<div style={{width:18,height:18,borderRadius:"50%",border:`2.5px solid ${c}30`,borderTopColor:c,animation:"spin 0.75s linear infinite"}}/>}
        {state==="success"&&<div style={{width:24,height:24,borderRadius:"50%",background:D.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,animation:"scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}>✓</div>}
        {state==="failed"&&<div style={{width:24,height:24,borderRadius:"50%",background:D.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>✗</div>}
      </div>
    );
  };
  return(
    <div style={{minHeight:"100vh",background:D.bg0,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{maxWidth:340,width:"100%",textAlign:"center"}}>
        <div style={{width:80,height:80,borderRadius:"50%",overflow:"hidden",margin:"0 auto 20px",border:`1.5px solid ${D.gold}50`,boxShadow:`0 0 40px ${D.gold}20`}}>
          <img src="/logo-large.png" alt="GB" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        </div>
        <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:24,color:D.text,margin:"0 0 6px"}}>Verifying Access</h2>
        <p style={{fontSize:12,color:D.textS,margin:"0 0 28px",fontFamily:"Inter, sans-serif"}}>Confirming you're at Golden Beans</p>
        <Row state={gps} icon="📍" lbl="Location" desc={gps==="loading"?"Getting your location...":gps==="success"?"You're at the cafe ✓":gps==="failed"?"Location not verified":"Waiting..."}/>
        <Row state={wifi} icon="📶" lbl="Network" desc={wifi==="loading"?"Verifying network...":wifi==="success"?"Cafe network confirmed ✓":wifi==="failed"?"Not on cafe network":"Waiting..."}/>
        <p style={{fontSize:10,color:D.textD,marginTop:20,fontFamily:"Inter, sans-serif"}}>🔒 Protecting against unauthorized orders</p>
      </div>
    </div>
  );
}

function AwarenessScreen({result,onRetry}:{result:SecResult;onRetry:()=>void}) {
  return(
    <div style={{minHeight:"100vh",background:D.bg0,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{maxWidth:360,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:58,marginBottom:16,animation:"float 3s ease-in-out infinite"}}>🚫</div>
        <h1 style={{fontFamily:"'Playfair Display', serif",fontSize:30,color:D.gold,margin:"0 0 10px"}}>Access Restricted</h1>
        <p style={{fontSize:14,color:D.textS,margin:"0 0 28px",lineHeight:1.7,fontFamily:"Inter, sans-serif"}}>{result.reason}</p>
        {!result.ipAllowed&&<div style={{background:D.glass,border:`1px solid ${D.gold}20`,borderRadius:14,padding:14,marginBottom:10,textAlign:"left"}}><p style={{color:D.gold,fontWeight:700,fontSize:13,margin:"0 0 3px",fontFamily:"Inter, sans-serif"}}>📶 Connect to Cafe WiFi</p><p style={{color:D.textS,fontSize:12,margin:0,fontFamily:"Inter, sans-serif"}}>{result.wifiName}</p></div>}
        {!result.gpsAllowed&&<div style={{background:D.glass,border:`1px solid ${D.gold}20`,borderRadius:14,padding:14,marginBottom:10,textAlign:"left"}}><p style={{color:D.gold,fontWeight:700,fontSize:13,margin:"0 0 3px",fontFamily:"Inter, sans-serif"}}>📍 Enable Location</p><p style={{color:D.textS,fontSize:12,margin:0,fontFamily:"Inter, sans-serif"}}>{result.distance?`${result.distance}m from cafe`:"Allow location in browser settings"}</p></div>}
        <Btn onClick={onRetry} variant="gold" fullWidth size="lg">Try Again</Btn>
      </div>
    </div>
  );
}

function SessionEndedScreen({reason,onRestart}:{reason:string;onRestart:()=>void}) {
  const [rating,setRating]=useState(0); const [done,setDone]=useState(false); const [submitting,setSubmitting]=useState(false);
  const API="https://golden-beans-server.onrender.com/api";
  useEffect(()=>{if(done){const t=setTimeout(()=>onRestart(),5000);return()=>clearTimeout(t);}},[done,onRestart]);
  const submit=async(r:number)=>{setRating(r);setSubmitting(true);try{await fetch(`${API}/feedback/submit`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:localStorage.getItem("gb_settled_order_id")||"unknown",tableId:localStorage.getItem("gb_settled_table")||"unknown",tableNumber:localStorage.getItem("gb_settled_table")||"unknown",rating:r,categories:{},comment:""})});}catch{}setSubmitting(false);setDone(true);};
  if(done)return(<div style={{minHeight:"100vh",background:D.bg0,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center",animation:"scaleIn 0.6s ease"}}><div style={{fontSize:72,marginBottom:16}}>🎉</div><h1 style={{fontFamily:"'Playfair Display', serif",fontSize:40,color:D.gold,margin:"0 0 10px"}}>Thank You!</h1><p style={{fontSize:14,color:D.textS,maxWidth:280,margin:"0 auto 20px",lineHeight:1.6,fontFamily:"Inter, sans-serif"}}>{reason}</p><p style={{fontSize:11,color:D.textD,fontFamily:"Inter, sans-serif"}}>Redirecting in 5 seconds...</p></div></div>);
  return(
    <div style={{minHeight:"100vh",background:D.bg0,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{maxWidth:380,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:28}}><div style={{fontSize:48,marginBottom:12}}>⭐</div><h1 style={{fontFamily:"'Playfair Display', serif",fontSize:28,color:D.gold,margin:"0 0 6px"}}>How was your visit?</h1><p style={{fontSize:13,color:D.textS,fontFamily:"Inter, sans-serif"}}>Your feedback helps us brew better</p></div>
        <div style={{background:D.bg2,borderRadius:24,padding:24,border:`1px solid ${D.glassB}`}}>
          <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:16}}>
            {[1,2,3,4,5].map(s=><button key={s} onClick={()=>!done&&submit(s)} disabled={done||submitting} style={{background:"none",border:"none",cursor:done?"default":"pointer",fontSize:rating>=s?40:32,filter:rating>=s?"none":"grayscale(1) opacity(0.3)",transition:`all 0.2s ${EASE}`,transform:rating>=s?"scale(1.15)":"scale(1)"}}>⭐</button>)}
          </div>
          {rating>0&&<p style={{textAlign:"center",fontSize:14,fontWeight:700,color:D.gold,marginBottom:12,fontFamily:"Inter, sans-serif",animation:"countUp 0.3s ease"}}>{["","😞 Poor","😐 Fair","🙂 Good","😊 Great","🤩 Excellent!"][rating]}</p>}
          <button onClick={()=>setDone(true)} style={{width:"100%",padding:13,borderRadius:12,border:`1px solid ${D.glassB}`,background:"transparent",color:D.textS,cursor:"pointer",fontFamily:"Inter, sans-serif",marginTop:8}}>Skip</button>
        </div>
      </div>
    </div>
  );
}
function HeroCarousel({items,cart,onTap,onExplore}:{items:MenuItem[];cart:ECI[];onTap:(i:MenuItem)=>void;onExplore:()=>void}) {
  const [active,setActive]=useState(0); const [drag,setDrag]=useState(0); const [dragging,setDragging]=useState(false);
  const sx=useRef(0); const timer=useRef<NodeJS.Timeout|null>(null);
  const slides=items.filter(i=>i.isAvailable).slice(0,3);
  const next=useCallback(()=>setActive(p=>(p+1)%slides.length),[slides.length]);
  const prev=useCallback(()=>setActive(p=>(p-1+slides.length)%slides.length),[slides.length]);
  useEffect(()=>{if(dragging||!slides.length)return;timer.current=setInterval(next,5000);return()=>{if(timer.current)clearInterval(timer.current);};},[next,dragging,active,slides.length]);
  if(!slides.length)return null;
  const item=slides[active];
  const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
  return(
    <div style={{position:"relative",width:"100%",height:"62vw",maxHeight:310,overflow:"hidden",userSelect:"none"}}
      onTouchStart={e=>{setDragging(true);sx.current=e.touches[0].clientX;if(timer.current)clearInterval(timer.current);}}
      onTouchMove={e=>{if(dragging)setDrag(e.touches[0].clientX-sx.current);}}
      onTouchEnd={()=>{if(Math.abs(drag)>55)drag<0?next():prev();setDragging(false);setDrag(0);}}
      onMouseDown={e=>{setDragging(true);sx.current=e.clientX;if(timer.current)clearInterval(timer.current);}}
      onMouseMove={e=>{if(dragging)setDrag(e.clientX-sx.current);}}
      onMouseUp={()=>{if(Math.abs(drag)>55)drag<0?next():prev();setDragging(false);setDrag(0);}}>
      {slides.map((s,i)=>(
        <div key={s._id} style={{position:"absolute",inset:0,transition:dragging?"none":`all 0.65s ${EASE}`,opacity:i===active?1:0,transform:i===active?`translateX(${drag}px)`:i<active?`translateX(calc(-100% + ${drag}px))`:`translateX(calc(100% + ${drag}px))`,zIndex:i===active?1:0}}>
          {s.imageUrl?<img src={getHeroUrl(s.imageUrl)} alt={s.name} style={{width:"100%",height:"100%",objectFit:"cover",animation:i===active?"kenBurns 8s ease-out forwards":"none"}}/>:<div style={{width:"100%",height:"100%",background:`linear-gradient(135deg,${D.brown},#000)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:90}}>☕</div>}
        </div>
      ))}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(5,5,5,0.92) 0%,rgba(5,5,5,0.45) 60%,transparent 100%)",zIndex:2,pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(5,5,5,0.85) 0%,transparent 50%)",zIndex:2,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:0,left:0,padding:"20px 18px 28px",zIndex:3,maxWidth:"62%"}}>
        {item.tags?.includes("bestseller")&&<GoldBadge>⭐ BESTSELLER</GoldBadge>}
        <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:"clamp(22px,6.5vw,34px)",fontWeight:800,color:D.text,margin:"8px 0 4px",lineHeight:1.15}}>Brewed to<br/><em style={{color:D.gold}}>perfection,</em><br/>just for you.</h2>
        <p style={{fontSize:11,color:"rgba(255,255,255,0.6)",margin:"0 0 14px",fontFamily:"Inter, sans-serif"}}>Discover our signature blends.</p>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={onExplore} className="press" style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.08)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.18)",borderRadius:99,padding:"9px 18px",color:D.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Inter, sans-serif"}}>Explore Menu <span>›</span></button>
          <button onClick={()=>onTap(item)} className="press" style={{width:36,height:36,borderRadius:"50%",border:`1.5px solid ${D.gold}`,background:qty>0?GG:"rgba(0,0,0,0.5)",color:qty>0?D.bg0:D.gold,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,backdropFilter:"blur(8px)",transition:`all 0.25s ${EASE}`}}>{qty>0?"✓":"+"}</button>
        </div>
      </div>
      <div style={{position:"absolute",bottom:28,right:16,zIndex:4,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:"rgba(255,255,255,0.7)"}}>0{active+1}</span>
        <div style={{width:34,height:1.5,background:"rgba(255,255,255,0.2)",position:"relative",borderRadius:99}}>
          <div style={{position:"absolute",left:0,top:0,height:"100%",background:GG,borderRadius:99,transition:`width 0.5s ${EASE}`,width:`${((active+1)/slides.length)*100}%`}}/>
        </div>
        <span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:D.textD}}>0{slides.length}</span>
      </div>
      <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5,zIndex:4}}>
        {slides.map((_,i)=><button key={i} onClick={()=>setActive(i)} style={{width:i===active?16:5,height:5,borderRadius:99,background:i===active?D.gold:"rgba(255,255,255,0.28)",border:"none",cursor:"pointer",transition:`all 0.35s ${EASE}`,padding:0}}/>)}
      </div>
    </div>
  );
}

function CategoryRow({cats,active,onSelect}:{cats:MenuCategory[];active:string;onSelect:(id:string)=>void}) {
  return(
    <div style={{padding:"16px 0 8px"}}>
      <div style={{padding:"0 16px",marginBottom:10}}><h3 style={{fontFamily:"'Playfair Display', serif",fontSize:18,color:D.text,margin:0}}>Beverage Categories</h3></div>
      <div className="hs" style={{display:"flex",gap:10,overflowX:"auto",paddingLeft:16,paddingRight:16}}>
        {cats.map((cat,idx)=>{
          const isA=cat._id===active;
          return(
            <button key={cat._id} onClick={()=>onSelect(cat._id)} className="press" style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:7,background:isA?`linear-gradient(135deg,${D.gold}18,${D.goldM}08)`:D.glass,backdropFilter:"blur(16px)",border:`1.5px solid ${isA?D.gold:D.glassB}`,borderRadius:18,padding:"13px 16px",cursor:"pointer",minWidth:74,boxShadow:isA?`0 0 24px ${D.goldG},inset 0 1px 0 rgba(255,255,255,0.06)`:"none",transition:`all 0.3s ${EASE}`,animation:`fadeUp 0.4s ${idx*0.05}s ease both`}}>
              <span style={{fontSize:24}}>{cat.icon}</span>
              <span style={{fontSize:10,fontWeight:isA?800:500,color:isA?D.gold:D.textS,whiteSpace:"nowrap",fontFamily:"Inter, sans-serif"}}>{cat.name}</span>
              {isA&&<div style={{width:14,height:2,background:GG,borderRadius:99}}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ItemCard({item,onTap,qty,isFav,onFav,delay=0}:{item:MenuItem;onTap:()=>void;qty:number;isFav:boolean;onFav:()=>void;delay?:number}) {
  const [pressed,setPressed]=useState(false);
  const [rp,setRp]=useState<{x:number;y:number}|null>(null);
  const handleTap=(e:React.MouseEvent)=>{if(!item.isAvailable)return;const r=(e.currentTarget as HTMLElement).getBoundingClientRect();setRp({x:e.clientX-r.left,y:e.clientY-r.top});setTimeout(()=>setRp(null),600);onTap();};
  return(
    <div style={{background:D.bg2,borderRadius:20,overflow:"hidden",cursor:item.isAvailable?"pointer":"not-allowed",opacity:item.isAvailable?1:0.45,border:`1px solid ${qty>0?D.gold:D.glassB}`,boxShadow:qty>0?`0 0 0 1px ${D.gold}30,0 8px 28px ${D.goldG}`:"0 4px 16px rgba(0,0,0,0.4)",transform:pressed?"scale(0.97)":"scale(1)",transition:`all 0.28s ${EASE}`,position:"relative",animation:`fadeUp 0.5s ${delay}s ease both`}}
      onClick={handleTap} onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}>
      <div style={{position:"relative",height:138,overflow:"hidden",background:D.bg3}}>
        {item.imageUrl?<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>:<div style={{width:"100%",height:"100%",background:`linear-gradient(135deg,${D.brown}80,#1a0a0280)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:52}}>☕</div>}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(17,17,17,0.92) 0%,transparent 55%)"}}/>
        <div style={{position:"absolute",top:9,left:9,display:"flex",gap:5}}>
          {item.tags?.includes("bestseller")&&<GoldBadge>⭐ POPULAR</GoldBadge>}
          {!item.isAvailable&&<span style={{background:"rgba(229,57,53,0.8)",color:"white",fontSize:8,fontWeight:800,padding:"2px 7px",borderRadius:99}}>SOLD OUT</span>}
        </div>
        <div style={{position:"absolute",top:9,right:9,display:"flex",gap:5}}>
          {qty>0&&<div style={{width:22,height:22,borderRadius:"50%",background:GG,color:D.bg0,fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",animation:"cartBounce 0.4s ease"}}>{qty}</div>}
          <button onClick={e=>{e.stopPropagation();onFav();}} style={{width:28,height:28,borderRadius:"50%",background:"rgba(0,0,0,0.55)",border:"1px solid rgba(255,255,255,0.1)",color:isFav?"#E53935":"rgba(255,255,255,0.75)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,transition:`all 0.2s ${EASE}`}}>{isFav?"❤️":"🤍"}</button>
        </div>
        <div style={{position:"absolute",bottom:8,left:10,right:10,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <span style={{fontFamily:"'DM Mono', monospace",fontSize:16,fontWeight:500,color:D.gold}}>₹{item.price}</span>
          <div style={{display:"flex",alignItems:"center",gap:2}}><span style={{color:D.gold,fontSize:10}}>★</span><span style={{fontSize:10,color:"rgba(255,255,255,0.55)",fontFamily:"Inter, sans-serif"}}>{item.rating?.toFixed(1)||"4.5"}</span></div>
        </div>
        {rp&&<div style={{position:"absolute",left:rp.x-18,top:rp.y-18,width:36,height:36,borderRadius:"50%",background:`${D.gold}40`,animation:"ripple 0.6s ease-out forwards",pointerEvents:"none"}}/>}
      </div>
      <div style={{padding:"10px 12px 12px"}}>
        <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:16,fontWeight:600,color:D.text,margin:"0 0 3px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</p>
        <p style={{fontSize:10,color:D.textS,margin:"0 0 10px",lineHeight:1.4,fontFamily:"Inter, sans-serif",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{item.description||"Premium quality item"}</p>
        <button onClick={e=>{e.stopPropagation();if(item.isAvailable)onTap();}} className="press" style={{width:"100%",padding:"9px",borderRadius:12,border:`1px solid ${qty>0?D.gold:D.glassB}`,background:qty>0?GG:D.glass,color:qty>0?D.bg0:D.textS,fontWeight:700,fontSize:12,cursor:item.isAvailable?"pointer":"not-allowed",fontFamily:"Inter, sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:`all 0.25s ${EASE}`,boxShadow:qty>0?`0 4px 16px ${D.goldG}`:"none"}}>
          {!item.isAvailable?"⛔ Out of Stock":qty>0?<><span>✓</span>Added ({qty})</>:<><span style={{fontSize:14}}>+</span>Add to Cart</>}
        </button>
      </div>
    </div>
  );
}

function CompactRow({title,items,cart,onTap}:{title:string;items:MenuItem[];cart:ECI[];onTap:(i:MenuItem)=>void}) {
  if(!items.length)return null;
  return(
    <div style={{marginBottom:24}}>
      <div style={{padding:"0 16px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <h3 style={{fontFamily:"'Playfair Display', serif",fontSize:18,color:D.text,margin:0}}>{title}</h3>
        <button style={{fontSize:12,color:D.gold,background:"none",border:"none",cursor:"pointer",fontWeight:600,fontFamily:"Inter, sans-serif"}}>See All ›</button>
      </div>
      <div className="hs" style={{display:"flex",gap:10,overflowX:"auto",paddingLeft:16,paddingRight:16}}>
        {items.slice(0,8).map((item,idx)=>{
          const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
          return(
            <div key={item._id} style={{flexShrink:0,width:158,background:D.bg2,borderRadius:16,border:`1px solid ${qty>0?D.gold:D.glassB}`,overflow:"hidden",cursor:item.isAvailable?"pointer":"not-allowed",animation:`fadeUp 0.4s ${idx*0.06}s ease both`,boxShadow:qty>0?`0 0 16px ${D.goldG}`:"none"}} onClick={()=>item.isAvailable&&onTap(item)}>
              <div style={{display:"flex",gap:10,padding:"10px 12px",alignItems:"center"}}>
                <div style={{width:50,height:50,borderRadius:12,overflow:"hidden",flexShrink:0,background:`linear-gradient(135deg,${D.brown}70,#000)`}}>
                  {item.imageUrl&&<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:14,fontWeight:600,color:D.text,margin:"0 0 2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</p>
                  <p style={{fontSize:9,color:D.textS,margin:"0 0 5px",lineHeight:1.3,fontFamily:"Inter, sans-serif",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{item.description||""}</p>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:D.gold}}>₹{item.price}</span>
                    <button onClick={e=>{e.stopPropagation();if(item.isAvailable)onTap(item);}} style={{width:26,height:26,borderRadius:"50%",border:`1.5px solid ${D.gold}`,background:qty>0?GG:"transparent",color:qty>0?D.bg0:D.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,transition:`all 0.2s ${EASE}`}}>+</button>
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

function PromoBanner({onTap}:{onTap:()=>void}) {
  return(
    <div style={{margin:"0 16px 28px"}}>
      <div style={{background:`linear-gradient(135deg,${D.brown},#2a160b)`,borderRadius:20,padding:20,position:"relative",overflow:"hidden",border:`1px solid ${D.gold}28`,boxShadow:`0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.05)`}}>
        <div style={{position:"absolute",right:-10,top:"50%",transform:"translateY(-50%)",width:130,height:130,borderRadius:"50%",background:`radial-gradient(circle,${D.gold}20,transparent)`,pointerEvents:"none"}}/>
        <p style={{fontSize:9,color:D.gold,fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",margin:"0 0 4px",fontFamily:"Inter, sans-serif"}}>Special For You</p>
        <h3 style={{fontFamily:"'Playfair Display', serif",fontSize:30,fontWeight:800,color:D.gold,margin:"0 0 5px",lineHeight:1}}>Flat 20% Off</h3>
        <p style={{fontSize:12,color:"rgba(255,255,255,0.6)",margin:"0 0 16px",fontFamily:"Inter, sans-serif"}}>on all beverages this evening!</p>
        <button onClick={onTap} className="press" style={{display:"flex",alignItems:"center",gap:6,background:"none",border:`1.5px solid ${D.gold}70`,borderRadius:99,padding:"8px 18px",color:D.gold,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Inter, sans-serif"}}>Order Now <span>›</span></button>
      </div>
    </div>
  );
}
function ProductDetailModal({item,isOpen,onClose,onAdd}:{item:MenuItem|null;isOpen:boolean;onClose:()=>void;onAdd:(i:MenuItem,qty:number,v:{groupName:string;selected:string[]}[],mod:number)=>void}) {
  const [qty,setQty]=useState(1); const [sel,setSel]=useState<Record<string,string[]>>({}); const [note,setNote]=useState("");
  useEffect(()=>{if(item){setQty(1);setNote("");const d:Record<string,string[]>={};item.variantGroups?.forEach(g=>{const def=g.options.find(o=>o.isDefault);if(def)d[g.name]=[def.name];else if(g.required&&g.options.length>0)d[g.name]=[g.options[0].name];else d[g.name]=[];});setSel(d);}},[item]);
  if(!isOpen||!item)return null;
  const toggle=(gn:string,on:string,ms:boolean)=>setSel(prev=>{const cur=prev[gn]||[];if(ms)return{...prev,[gn]:cur.includes(on)?cur.filter(n=>n!==on):[...cur,on]};return{...prev,[gn]:[on]};});
  let mod=0; item.variantGroups?.forEach(g=>(sel[g.name]||[]).forEach(n=>{const o=g.options.find(o=>o.name===n);if(o)mod+=o.priceModifier;}));
  const total=(item.price+mod)*qty;
  const vs=Object.entries(sel).map(([gn,s])=>({groupName:gn,selected:s}));
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(20px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:D.bg1,width:"100%",maxWidth:480,maxHeight:"93vh",borderRadius:"26px 26px 0 0",overflow:"hidden",display:"flex",flexDirection:"column",animation:`slideUp 0.4s ${EASE}`,border:`1px solid ${D.glassB}`,borderBottom:"none"}}>
        <div style={{height:3,background:GG,flexShrink:0}}/>
        <div style={{position:"relative",height:240,overflow:"hidden",flexShrink:0,background:D.bg3}}>
          {item.imageUrl?<img src={getHeroUrl(item.imageUrl)} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",background:`linear-gradient(135deg,${D.brown},#000)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:90}}>☕</div>}
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:80,background:`linear-gradient(to top,${D.bg1},transparent)`}}/>
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,width:36,height:36,borderRadius:"50%",background:"rgba(0,0,0,0.65)",border:`1px solid ${D.glassB}`,color:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,backdropFilter:"blur(8px)"}}>✕</button>
          <div style={{position:"absolute",top:16,left:16,display:"flex",gap:6}}>
            <span style={{background:D.green,color:"white",fontSize:9,fontWeight:800,padding:"3px 9px",borderRadius:99}}>🌿 VEG</span>
            {item.tags?.includes("bestseller")&&<GoldBadge>⭐ BESTSELLER</GoldBadge>}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"18px 20px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:28,fontWeight:800,color:D.text,margin:0,flex:1}}>{item.name}</h2>
            <div style={{display:"flex",alignItems:"center",gap:4,background:D.glass,padding:"4px 10px",borderRadius:99,flexShrink:0,marginLeft:12}}>
              <span style={{color:D.gold,fontSize:11}}>★</span>
              <span style={{fontSize:12,fontWeight:700,color:D.text,fontFamily:"'DM Mono', monospace"}}>{item.rating?.toFixed(1)||"4.5"}</span>
            </div>
          </div>
          {item.description&&<p style={{fontSize:13,color:D.textS,margin:"0 0 18px",lineHeight:1.6,fontFamily:"Inter, sans-serif"}}>{item.description}</p>}
          {item.variantGroups?.map((g:VariantGroup)=>(
            <div key={g.name} style={{marginBottom:18}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <h4 style={{fontSize:12,fontWeight:700,color:D.text,margin:0,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"Inter, sans-serif"}}>{g.name}</h4>
                {g.required&&<span style={{background:`${D.red}20`,color:D.red,fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:99}}>Required</span>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:g.options.length>3?"1fr 1fr":`repeat(${g.options.length},1fr)`,gap:8}}>
                {g.options.map(opt=>{const s=sel[g.name]?.includes(opt.name);return(
                  <button key={opt.name} onClick={()=>toggle(g.name,opt.name,g.multiSelect)} className="press" style={{padding:11,background:s?`${D.gold}18`:D.glass,border:`1.5px solid ${s?D.gold:D.glassB}`,borderRadius:12,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,boxShadow:s?`0 0 12px ${D.goldG}`:"none",transition:`all 0.22s ${EASE}`}}>
                    <span style={{fontWeight:700,fontSize:13,color:s?D.gold:D.text,fontFamily:"Inter, sans-serif"}}>{opt.name}</span>
                    {opt.priceModifier!==0&&<span style={{fontSize:11,color:s?"rgba(212,164,79,0.6)":D.textS,fontFamily:"'DM Mono', monospace"}}>{opt.priceModifier>0?`+₹${opt.priceModifier}`:`-₹${Math.abs(opt.priceModifier)}`}</span>}
                  </button>
                );})}
              </div>
            </div>
          ))}
          <div style={{marginBottom:8}}>
            <label style={{fontSize:11,fontWeight:700,color:D.textD,letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:8,fontFamily:"Inter, sans-serif"}}>Special Instructions (Optional)</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add any special instructions..." rows={2} style={{width:"100%",padding:"11px 13px",borderRadius:12,border:`1px solid ${D.glassB}`,background:D.glass,color:D.text,fontSize:13,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"Inter, sans-serif",lineHeight:1.5}}/>
          </div>
        </div>
        <div style={{padding:"14px 20px 24px",borderTop:`1px solid ${D.glassB}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <span style={{fontSize:11,color:D.textD,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"Inter, sans-serif"}}>Quantity</span>
            <div style={{display:"flex",alignItems:"center",background:D.glass,border:`1px solid ${D.glassB}`,borderRadius:99}}>
              <button onClick={()=>setQty(Math.max(1,qty-1))} style={{width:44,height:44,background:"none",border:"none",color:D.gold,cursor:"pointer",fontSize:22}}>−</button>
              <span style={{minWidth:36,textAlign:"center",color:D.text,fontWeight:800,fontSize:18,fontFamily:"'DM Mono', monospace"}}>{qty}</span>
              <button onClick={()=>setQty(qty+1)} style={{width:44,height:44,background:"none",border:"none",color:D.gold,cursor:"pointer",fontSize:22}}>+</button>
            </div>
          </div>
          <Btn onClick={()=>{onAdd(item,qty,vs,mod);onClose();}} variant="gold" fullWidth size="lg">
            Add to Cart · <span style={{fontFamily:"'DM Mono', monospace"}}>₹{total.toFixed(0)}</span>
          </Btn>
        </div>
      </div>
    </div>
  );
}
function CartScreen({cart,onUpdateQty,onCheckout,discount,onDiscountChange,allItems,onAddMore}:{cart:ECI[];onUpdateQty:(k:string,d:number)=>void;onCheckout:()=>void;discount:Discount|null;onDiscountChange:(d:Discount|null)=>void;allItems:MenuItem[];onAddMore:(i:MenuItem)=>void}) {
  const [promo,setPromo]=useState(""); const [validating,setValidating]=useState(false); const [promoErr,setPromoErr]=useState("");
  const sub=cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
  const disc=discount?.discount||0; const tax=Math.max(0,sub-disc)*0.05; const total=Math.max(0,sub-disc)+tax;

  useEffect(()=>{
    if(!cart.length||discount?.type==="code"){if(!cart.length)onDiscountChange(null);return;}
    const items=cart.map(c=>({menuItemId:c.menuItemId,name:c.name,price:c.price+(c.totalPriceModifier||0),quantity:c.quantity}));
    const api=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
    fetch(`${api}/promotions/calculate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items,subtotal:sub})}).then(r=>r.json()).then(d=>{if(d.success&&d.data?.applied)onDiscountChange({...d.data.applied,type:"auto"});else if(discount?.type==="auto")onDiscountChange(null);}).catch(()=>{});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[cart.length,sub]);

  const applyCode=async()=>{if(!promo.trim())return;setValidating(true);setPromoErr("");try{const items=cart.map(c=>({menuItemId:c.menuItemId,name:c.name,price:c.price+(c.totalPriceModifier||0),quantity:c.quantity}));const api=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";const res=await fetch(`${api}/promotions/codes/validate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:promo.trim(),items,subtotal:sub})});const d=await res.json();if(!d.success){setPromoErr(d.message||"Invalid code");return;}onDiscountChange({...d.data,type:"code",code:d.data.code});setPromo("");}catch(e:unknown){setPromoErr(e instanceof Error?e.message:"Failed");}finally{setValidating(false);}};
  const suggestions=allItems.filter(i=>i.isAvailable&&!cart.find(c=>c.menuItemId===i._id)).slice(0,6);

  return(
    <div style={{minHeight:"100vh",background:D.bg0}}>
      <div style={{padding:"16px 16px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${D.glassB}`}}>
        <div style={{flex:1}}>
          <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:24,color:D.text,margin:"0 0 2px"}}>Your Cart</h2>
          <p style={{fontSize:12,color:D.textS,margin:0,fontFamily:"Inter, sans-serif"}}>{cart.reduce((s,i)=>s+i.quantity,0)} Items</p>
        </div>
      </div>
      <div style={{padding:"0 0 140px"}}>
        {disc>0&&<div style={{margin:"12px 16px",background:`${D.green}18`,borderRadius:14,padding:"12px 16px",border:`1px solid ${D.green}30`,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🏷️</span>
          <div style={{flex:1}}><p style={{fontSize:12,fontWeight:700,color:D.green,margin:"0 0 1px",fontFamily:"Inter, sans-serif"}}>You are saving ₹{disc}</p><p style={{fontSize:11,color:D.textS,margin:0,fontFamily:"Inter, sans-serif"}}>YAY! {discount?.type==="code"?`Code "${discount.code}" applied`:"Auto promotion applied"}</p></div>
          <span style={{fontSize:16,color:D.gold}}>›</span>
        </div>}
        <div style={{padding:"12px 16px 0"}}>
          {cart.map((item,idx)=>(
            <div key={item.menuItemId+JSON.stringify(item.variants)} style={{background:D.bg2,borderRadius:16,padding:"12px 14px",marginBottom:10,border:`1px solid ${D.glassB}`,display:"flex",gap:12,alignItems:"center",animation:`fadeUp 0.35s ${idx*0.05}s ease both`}}>
              <div style={{flexShrink:0}}>
                {item.imageUrl?<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{width:60,height:60,borderRadius:12,objectFit:"cover"}}/>:<div style={{width:60,height:60,borderRadius:12,background:`linear-gradient(135deg,${D.brown}70,#000)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>☕</div>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontFamily:"'Cormorant Garamond', serif",fontWeight:600,fontSize:16,color:D.text,margin:"0 0 2px"}}>{item.name}</p>
                {item.variants?.some(v=>v.selected.length>0)&&<p style={{fontSize:10,color:D.textS,margin:"0 0 4px",fontFamily:"Inter, sans-serif"}}>{item.variants?.flatMap(v=>v.selected).join(" · ")}</p>}
                <p style={{fontFamily:"'DM Mono', monospace",fontSize:15,color:D.gold,margin:0,fontWeight:500}}>₹{((item.price+(item.totalPriceModifier||0))*item.quantity).toFixed(0)}</p>
              </div>
              <div style={{display:"flex",alignItems:"center",background:D.glass,border:`1px solid ${D.glassB}`,borderRadius:99}}>
                <button onClick={()=>onUpdateQty(item.menuItemId+JSON.stringify(item.variants),-1)} style={{width:32,height:32,background:"none",border:"none",color:D.gold,cursor:"pointer",fontSize:20}}>−</button>
                <span style={{fontWeight:800,color:D.text,fontSize:14,minWidth:20,textAlign:"center",fontFamily:"'DM Mono', monospace"}}>{item.quantity}</span>
                <button onClick={()=>onUpdateQty(item.menuItemId+JSON.stringify(item.variants),1)} style={{width:32,height:32,background:"none",border:"none",color:D.gold,cursor:"pointer",fontSize:20}}>+</button>
              </div>
            </div>
          ))}
        </div>
        {suggestions.length>0&&<div style={{padding:"8px 0"}}>
          <div style={{padding:"0 16px",marginBottom:10}}><p style={{fontSize:13,fontWeight:700,color:D.text,margin:0,fontFamily:"Inter, sans-serif"}}>Add more from your favorites</p></div>
          <div className="hs" style={{display:"flex",gap:10,overflowX:"auto",paddingLeft:16,paddingRight:16}}>
            {suggestions.map(item=>(
              <div key={item._id} style={{flexShrink:0,width:110,textAlign:"center"}}>
                <div style={{width:80,height:80,borderRadius:14,overflow:"hidden",margin:"0 auto 6px",background:`linear-gradient(135deg,${D.brown}70,#000)`}}>
                  {item.imageUrl&&<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>}
                </div>
                <p style={{fontSize:11,fontWeight:600,color:D.text,margin:"0 0 2px",fontFamily:"Inter, sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</p>
                <p style={{fontSize:11,color:D.gold,margin:"0 0 5px",fontFamily:"'DM Mono', monospace"}}>₹{item.price}</p>
                <button onClick={()=>onAddMore(item)} style={{width:26,height:26,borderRadius:"50%",border:`1.5px solid ${D.gold}`,background:"transparent",color:D.gold,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,margin:"0 auto"}}>+</button>
              </div>
            ))}
          </div>
        </div>}
        {(!discount||discount.type==="auto")&&<div style={{margin:"12px 16px 0",background:D.bg2,borderRadius:14,padding:14,border:`1px dashed ${D.glassB}`}}>
          <p style={{fontSize:10,fontWeight:700,color:D.textD,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 8px",fontFamily:"Inter, sans-serif"}}>Promo Code</p>
          <div style={{display:"flex",gap:8}}>
            <input value={promo} onChange={e=>{setPromo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""));setPromoErr("");}} placeholder="Enter code..." style={{flex:1,padding:"10px 13px",borderRadius:10,border:`1px solid ${promoErr?D.red:D.glassB}`,background:D.glass,color:D.text,fontSize:14,outline:"none",fontFamily:"'DM Mono', monospace",letterSpacing:"0.06em"}}/>
            <button onClick={applyCode} disabled={!promo.trim()||validating} className="press" style={{padding:"10px 18px",borderRadius:10,background:promo.trim()?GG:D.glass,color:promo.trim()?D.bg0:D.textD,border:"none",fontWeight:800,fontSize:12,cursor:promo.trim()?"pointer":"not-allowed",fontFamily:"Inter, sans-serif",boxShadow:promo.trim()?`0 4px 16px ${D.goldG}`:"none"}}>{validating?"...":"Apply"}</button>
          </div>
          {promoErr&&<p style={{fontSize:11,color:D.red,margin:"6px 0 0",fontWeight:700,fontFamily:"Inter, sans-serif"}}>⚠ {promoErr}</p>}
        </div>}
        <div style={{margin:"12px 16px 0",background:D.bg2,borderRadius:16,padding:16,border:`1px solid ${D.glassB}`}}>
          {[["Subtotal",`₹${sub.toFixed(0)}`,D.textS],...(disc>0?[["Discount",`-₹${disc.toFixed(0)}`,D.green] as [string,string,string]]:[]),(["GST (5%)",`₹${tax.toFixed(0)}`,D.textS] as [string,string,string])].map((row,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:13,color:row[2],fontFamily:"Inter, sans-serif"}}>{row[0]}</span>
              <span style={{fontSize:13,color:row[2],fontFamily:"'DM Mono', monospace",fontWeight:600}}>{row[1]}</span>
            </div>
          ))}
          <Divider/>
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:10}}>
            <span style={{fontSize:16,fontWeight:700,color:D.text,fontFamily:"Inter, sans-serif"}}>Total</span>
            <span style={{fontSize:22,fontWeight:800,color:D.gold,fontFamily:"'DM Mono', monospace"}}>₹{total.toFixed(0)}</span>
          </div>
        </div>
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"12px 16px 28px",background:`linear-gradient(to top,${D.bg0} 70%,transparent)`,zIndex:40}}>
        <Btn onClick={onCheckout} variant="gold" fullWidth size="lg"><span>Proceed to Checkout</span><span style={{fontSize:18}}>→</span></Btn>
        <p style={{textAlign:"center",fontSize:11,color:D.textD,margin:"10px 0 0",fontFamily:"Inter, sans-serif"}}>Continue Shopping</p>
        <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:8}}>
          {["🔒 Secure Checkout","✅ Best Quality","⚡ On-time Served"].map(t=><span key={t} style={{fontSize:10,color:D.textD,fontFamily:"Inter, sans-serif"}}>{t}</span>)}
        </div>
      </div>
    </div>
  );
}
function CheckoutScreen({cart,table,discount,onBack,onPay,isPlacing}:{cart:ECI[];table:Table|null;discount:Discount|null;onBack:()=>void;onPay:(paymentMethod:string,tip:number,note:string)=>void;isPlacing:boolean}) {
  const [payMethod,setPayMethod]=useState("upi"); const [tip,setTip]=useState(0); const [note,setNote]=useState("");
  const sub=cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
  const disc=discount?.discount||0; const tax=Math.max(0,sub-disc)*0.05; const total=Math.max(0,sub-disc)+tax+tip;
  const PAY=[{id:"upi",icon:"📱",label:"UPI",sub:"Google Pay, PhonePe..."},{id:"card",icon:"💳",label:"Credit / Debit Card",sub:"Visa, Mastercard, RuPay"},{id:"wallet",icon:"👛",label:"Wallets",sub:"Paytm, Amazon Pay..."},{id:"cash",icon:"💵",label:"Cash on Delivery",sub:"Pay at the counter"}];
  return(
    <div style={{minHeight:"100vh",background:D.bg0}}>
      <div style={{padding:"16px 16px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${D.glassB}`}}>
        <button onClick={onBack} style={{width:36,height:36,borderRadius:10,background:D.glass,border:`1px solid ${D.glassB}`,color:D.text,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>←</button>
        <div><h2 style={{fontFamily:"'Playfair Display', serif",fontSize:22,color:D.text,margin:"0 0 2px"}}>Checkout</h2><p style={{fontSize:11,color:D.textS,margin:0,fontFamily:"Inter, sans-serif"}}>Step 1 of 3</p></div>
      </div>
      <div style={{height:4,background:D.bg3,position:"relative"}}>
        <div style={{position:"absolute",left:0,top:0,height:"100%",width:"33%",background:GG,borderRadius:99}}/>
        {[0,1,2].map(s=><div key={s} style={{position:"absolute",top:"50%",left:`${s*50}%`,transform:"translate(-50%,-50%)",width:12,height:12,borderRadius:"50%",background:s===0?GG:D.bg3,border:`2px solid ${s===0?D.gold:D.glassB}`}}/>)}
      </div>
      <div style={{padding:"16px 16px 140px"}}>
        <div style={{marginBottom:16}}>
          <p style={{fontSize:12,fontWeight:700,color:D.textD,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px",fontFamily:"Inter, sans-serif"}}>Where are we serving?</p>
          <div style={{background:D.bg2,borderRadius:14,padding:"13px 16px",border:`1px solid ${D.glassB}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>🪑</span><span style={{fontSize:15,fontWeight:700,color:D.text,fontFamily:"Inter, sans-serif"}}>Table {table?.tableNumber||"?"}</span></div>
            <button style={{background:D.glass,border:`1px solid ${D.glassB}`,borderRadius:8,padding:"5px 12px",color:D.gold,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Inter, sans-serif"}}>Change</button>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <p style={{fontSize:12,fontWeight:700,color:D.textD,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px",fontFamily:"Inter, sans-serif"}}>Special Instructions <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(Optional)</span></p>
          <div style={{position:"relative"}}>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add any special instructions..." rows={2} style={{width:"100%",padding:"12px 40px 12px 14px",borderRadius:13,border:`1px solid ${D.glassB}`,background:D.bg2,color:D.text,fontSize:14,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"Inter, sans-serif",lineHeight:1.5}}/>
            <span style={{position:"absolute",right:14,top:14,fontSize:16,color:D.textD}}>✏️</span>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <p style={{fontSize:12,fontWeight:700,color:D.textD,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px",fontFamily:"Inter, sans-serif"}}>Payment Method</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {PAY.map(pm=>(
              <button key={pm.id} onClick={()=>setPayMethod(pm.id)} className="press" style={{background:payMethod===pm.id?`${D.gold}15`:D.bg2,borderRadius:14,padding:"13px 14px",border:`1.5px solid ${payMethod===pm.id?D.gold:D.glassB}`,cursor:"pointer",textAlign:"left",boxShadow:payMethod===pm.id?`0 0 16px ${D.goldG}`:"none",transition:`all 0.25s ${EASE}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:18}}>{pm.icon}</span>
                  <span style={{fontSize:13,fontWeight:700,color:payMethod===pm.id?D.gold:D.text,fontFamily:"Inter, sans-serif"}}>{pm.label}</span>
                  {pm.id==="upi"&&<span style={{background:D.goldG,color:D.gold,fontSize:8,fontWeight:800,padding:"1px 6px",borderRadius:99,marginLeft:"auto"}}>●</span>}
                </div>
                <p style={{fontSize:10,color:D.textS,margin:0,fontFamily:"Inter, sans-serif"}}>{pm.sub}</p>
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <p style={{fontSize:12,fontWeight:700,color:D.textD,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px",fontFamily:"Inter, sans-serif"}}>Add a tip for our baristas? <span style={{fontWeight:400,fontSize:11,textTransform:"none",letterSpacing:0}}>100% goes to our team 🙌</span></p>
          <div style={{display:"flex",gap:8}}>
            {[10,20,50,null].map((t,i)=>(
              <button key={i} onClick={()=>setTip(t===null?0:(tip===t?0:t as number))} className="press" style={{flex:1,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${tip===t&&t!==null?D.gold:D.glassB}`,background:tip===t&&t!==null?`${D.gold}15`:D.glass,color:tip===t&&t!==null?D.gold:D.textS,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Mono', monospace",transition:`all 0.22s ${EASE}`}}>
                {t===null?"Other":`₹${t}`}
              </button>
            ))}
          </div>
        </div>
        <div style={{background:D.bg2,borderRadius:16,padding:16,border:`1px solid ${D.glassB}`}}>
          <h4 style={{fontSize:12,fontWeight:700,color:D.textD,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 12px",fontFamily:"Inter, sans-serif"}}>Order Summary</h4>
          {[["Item Total",`₹${sub.toFixed(0)}`],...(tip>0?[["Tip",`₹${tip}`]]:[]),(["GST (5%)",`₹${tax.toFixed(0)}`] as [string,string])].map((row,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:13,color:D.textS,fontFamily:"Inter, sans-serif"}}>{row[0]}</span>
              <span style={{fontSize:13,color:D.textS,fontFamily:"'DM Mono', monospace"}}>{row[1]}</span>
            </div>
          ))}
          <Divider/>
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:10}}>
            <span style={{fontSize:14,fontWeight:800,color:D.text,fontFamily:"Inter, sans-serif"}}>Total Payable</span>
            <span style={{fontSize:22,fontWeight:900,color:D.gold,fontFamily:"'DM Mono', monospace"}}>₹{total.toFixed(0)}</span>
          </div>
        </div>
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"12px 16px 28px",background:`linear-gradient(to top,${D.bg0} 70%,transparent)`,zIndex:40}}>
        <Btn onClick={()=>onPay(payMethod,tip,note)} variant="gold" fullWidth size="lg" loading={isPlacing}>{!isPlacing&&<span>🔒</span>} Pay ₹{total.toFixed(0)} Securely</Btn>
        <p style={{textAlign:"center",fontSize:11,color:D.textD,margin:"10px 0 0",fontFamily:"Inter, sans-serif"}}>🛡️ Your payment is 100% secure</p>
      </div>
    </div>
  );
}

function OrderPlacedScreen({order,onTrack,onHome}:{order:Order;onTrack:()=>void;onHome:()=>void}) {
  const [show,setShow]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setShow(true),400);return()=>clearTimeout(t);},[]);
  const STEPS=[{icon:"☕",label:"Order Received"},{icon:"🔥",label:"Brewing"},{icon:"✋",label:"Preparing"},{icon:"🍽️",label:"Ready to Serve"}];
  return(
    <div style={{minHeight:"100vh",background:D.bg0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",position:"relative",overflow:"hidden"}}>
      {show&&Array.from({length:12}).map((_,i)=>(
        <div key={i} style={{position:"absolute",width:6,height:6,borderRadius:"50%",background:i%3===0?D.gold:i%3===1?D.goldM:"rgba(212,164,79,0.5)",top:"40%",left:"50%",
          ["--px" as string]:`${(Math.random()-0.5)*200}px`,["--py" as string]:`${-Math.random()*200-50}px`,
          animation:`particle 1.2s ${i*0.1}s ease-out forwards`,pointerEvents:"none"}}/>
      ))}
      <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 70% 50% at 50% 40%,${D.gold}12,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{textAlign:"center",zIndex:1,maxWidth:340,width:"100%"}}>
        <div style={{width:100,height:100,borderRadius:"50%",background:`${D.gold}18`,border:`3px solid ${D.gold}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",animation:show?"successRing 0.6s cubic-bezier(0.34,1.56,0.64,1) both":"none",boxShadow:show?`0 0 40px ${D.goldG}`:"none"}}>
          <svg width={46} height={46} viewBox="0 0 46 46" fill="none">
            <path d="M10 23L20 33L36 14" stroke={D.gold} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={100} strokeDashoffset={show?0:100} style={{transition:"stroke-dashoffset 0.6s 0.3s ease"}}/>
          </svg>
        </div>
        <h1 style={{fontFamily:"'Playfair Display', serif",fontSize:36,fontWeight:800,color:D.text,margin:"0 0 8px",animation:show?"fadeUp 0.5s 0.5s ease both":"none",opacity:show?1:0}}>Order Placed!</h1>
        <p style={{fontSize:14,color:D.textS,margin:"0 0 28px",lineHeight:1.6,fontFamily:"Inter, sans-serif",animation:show?"fadeUp 0.5s 0.6s ease both":"none",opacity:show?1:0}}>We've received your order and<br/>it's being crafted with love.</p>
        <div style={{background:D.bg2,borderRadius:18,padding:18,marginBottom:20,border:`1px solid ${D.glassB}`,animation:show?"fadeUp 0.5s 0.7s ease both":"none",opacity:show?1:0}}>
          {[["Order ID",`GB${order._id?.slice(-6).toUpperCase()}`],["Order Time",`Today, ${new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}`],["Delivering To",`Table ${order.tableNumber||"?"}`],["Items",`${order.items?.length||0} Items`],["Total Paid",`₹${order.totalAmount?.toFixed(0)||"—"}`]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${D.glassB}`}}>
              <span style={{fontSize:12,color:D.textS,fontFamily:"Inter, sans-serif"}}>{l}</span>
              <span style={{fontSize:12,fontWeight:700,color:l==="Total Paid"?D.gold:D.text,fontFamily:l==="Order ID"||l==="Total Paid"?"'DM Mono', monospace":"Inter, sans-serif"}}>{v}</span>
            </div>
          ))}
          <div style={{marginTop:12,background:`${D.gold}10`,borderRadius:10,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>⭐</span>
            <p style={{fontSize:12,fontWeight:600,color:D.textS,margin:0,fontFamily:"Inter, sans-serif"}}>You will earn <strong style={{color:D.gold}}>33 Beans</strong><br/><span style={{fontSize:10,color:D.textD}}>once this order is delivered.</span></p>
          </div>
        </div>
        <div style={{marginBottom:24,animation:show?"fadeUp 0.5s 0.8s ease both":"none",opacity:show?1:0}}>
          <p style={{fontSize:12,fontWeight:700,color:D.textD,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 12px",fontFamily:"Inter, sans-serif"}}>What's Next?</p>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
            {STEPS.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center"}}>
                <div style={{textAlign:"center",width:60}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:i===0?GG:`${D.gold}20`,border:`2px solid ${i===0?D.gold:D.glassB}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 5px",fontSize:16}}>{s.icon}</div>
                  <p style={{fontSize:9,color:i===0?D.gold:D.textD,margin:0,fontFamily:"Inter, sans-serif",fontWeight:i===0?700:400,lineHeight:1.2}}>{s.label}</p>
                </div>
                {i<STEPS.length-1&&<div style={{width:20,height:1.5,background:D.glassB,flexShrink:0,marginBottom:16}}/>}
              </div>
            ))}
          </div>
        </div>
        <Btn onClick={onTrack} variant="gold" fullWidth size="lg">Track Order <span>→</span></Btn>
        <button onClick={onHome} style={{background:"none",border:"none",color:D.textS,cursor:"pointer",fontSize:13,fontWeight:500,fontFamily:"Inter, sans-serif",marginTop:14,display:"block",width:"100%",textAlign:"center"}}>Back to Home</button>
      </div>
    </div>
  );
}

function OrderTrackingScreen({order,onOrderReady}:{order:Order;onOrderReady:()=>void}) {
  const STAGES=[{key:"received",label:"Order Received",icon:"✅"},{key:"brewing",label:"Brewing",icon:"🔥"},{key:"preparing",label:"Preparing",icon:"👨‍🍳"},{key:"ready",label:"Ready to Serve",icon:"🍽️"}];
  const statusToStage=(s:string)=>{if(["open","kotSent"].includes(s))return 0;if(s==="preparing")return 1;if(s==="ready")return 2;if(s==="settled")return 3;return 0;};
  const currentStage=statusToStage(order.status||"open");
  useEffect(()=>{if(order.status==="settled")onOrderReady();},[order.status,onOrderReady]);
  return(
    <div style={{minHeight:"100vh",background:D.bg0}}>
      <div style={{position:"relative",height:"45vw",maxHeight:240,overflow:"hidden",background:`linear-gradient(135deg,${D.brown},#000)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:90,animation:"float 3s ease-in-out infinite"}}>☕</span>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 0%,rgba(5,5,5,0.9) 100%)"}}/>
      </div>
      <div style={{padding:"20px 16px"}}>
        <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:28,color:D.text,margin:"0 0 4px"}}>Order Tracking</h2>
        <p style={{fontSize:12,color:D.textS,margin:"0 0 24px",fontFamily:"Inter, sans-serif"}}>Order ID · GB{order._id?.slice(-6).toUpperCase()}</p>
        {currentStage===1&&<div style={{background:`linear-gradient(135deg,${D.brown},#2a140a)`,borderRadius:18,padding:20,marginBottom:20,border:`1px solid ${D.gold}25`,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:8,animation:"float 2s ease-in-out infinite"}}>☕</div>
          <h3 style={{fontFamily:"'Playfair Display', serif",fontSize:24,color:D.gold,margin:"0 0 4px"}}>Brewing</h3>
          <p style={{fontSize:12,color:D.textS,margin:"0 0 10px",fontFamily:"Inter, sans-serif"}}>Your coffee is brewing to perfection ☕</p>
          <p style={{fontSize:12,color:D.textD,margin:0,fontFamily:"Inter, sans-serif"}}>Estimated time: <strong style={{color:D.gold}}>07 mins</strong></p>
        </div>}
        <div style={{background:D.bg2,borderRadius:18,padding:18,marginBottom:16,border:`1px solid ${D.glassB}`}}>
          {STAGES.map((stage,i)=>{
            const done=i<currentStage, active=i===currentStage;
            return(
              <div key={stage.key} style={{display:"flex",alignItems:"center",gap:14,marginBottom:i<STAGES.length-1?16:0}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:done?D.green:active?GG:D.bg3,border:`2px solid ${done?D.green:active?D.gold:D.glassB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,boxShadow:active?`0 0 16px ${D.goldG}`:"none",transition:`all 0.5s ${EASE}`}}>{done?"✓":stage.icon}</div>
                  {i<STAGES.length-1&&<div style={{position:"absolute",left:"50%",top:"100%",transform:"translateX(-50%)",width:2,height:16,background:done?D.green:D.bg3,marginTop:2,transition:`background 0.5s ${EASE}`}}/>}
                </div>
                <div style={{flex:1}}>
                  <p style={{fontSize:14,fontWeight:active?700:500,color:active?D.text:done?D.textS:D.textD,margin:0,fontFamily:"Inter, sans-serif"}}>{stage.label}</p>
                  <p style={{fontSize:11,color:D.textD,margin:"1px 0 0",fontFamily:"Inter, sans-serif"}}>{done?new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):active?"In Progress":"Upcoming"}</p>
                </div>
                {active&&<div style={{width:8,height:8,borderRadius:"50%",background:D.gold,animation:"pulse 1.5s ease-in-out infinite"}}/>}
              </div>
            );
          })}
        </div>
        <div style={{background:D.bg2,borderRadius:14,padding:14,border:`1px solid ${D.glassB}`,display:"flex",gap:12,alignItems:"center",marginBottom:20}}>
          <span style={{fontSize:22}}>🔔</span>
          <p style={{fontSize:12,color:D.textS,margin:0,fontFamily:"Inter, sans-serif",lineHeight:1.5}}>You can relax,<br/><strong style={{color:D.text}}>we'll buzz you when it's ready!</strong></p>
        </div>
        <LiveOrderTracker order={order}/>
      </div>
    </div>
  );
}

function OrderReadyScreen({order,onRestart}:{order:Order|null;onRestart:()=>void}) {
  const [feedback,setFeedback]=useState(0); const [done,setDone]=useState(false); const [submitting,setSubmitting]=useState(false); const [beanCount,setBeanCount]=useState(0);
  const EMOJIS=[{e:"😞",l:"Bad"},{e:"😐",l:"Okay"},{e:"🙂",l:"Good"},{e:"😊",l:"Great"},{e:"🤩",l:"Amazing"}];
  useEffect(()=>{if(done){let c=0;const iv=setInterval(()=>{c+=3;setBeanCount(Math.min(c,33));if(c>=33)clearInterval(iv);},40);return()=>clearInterval(iv);}},[done]);
  const submit=async(r:number)=>{setFeedback(r);setSubmitting(true);try{await fetch("https://golden-beans-server.onrender.com/api/feedback/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:localStorage.getItem("gb_settled_order_id")||order?._id||"unknown",tableId:localStorage.getItem("gb_settled_table")||"unknown",tableNumber:localStorage.getItem("gb_settled_table")||"unknown",rating:r,categories:{},comment:""})});}catch{}setSubmitting(false);setDone(true);};
  return(
    <div style={{minHeight:"100vh",background:D.bg0,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 70% 60% at 50% 30%,${D.gold}10,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{padding:"40px 20px 100px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{position:"relative",marginBottom:28}}>
          <div style={{width:160,height:160,borderRadius:"50%",overflow:"hidden",border:`3px solid ${D.gold}60`,boxShadow:`0 0 0 12px ${D.gold}10,0 0 60px ${D.gold}25`,animation:"goldPulse 2s ease-in-out infinite",background:D.bg2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:80}}>☕</div>
          <button style={{position:"absolute",top:8,right:8,width:32,height:32,borderRadius:"50%",background:D.bg2,border:`1px solid ${D.glassB}`,color:"rgba(229,57,53,0.6)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤍</button>
        </div>
        <h1 style={{fontFamily:"'Playfair Display', serif",fontSize:38,fontWeight:800,color:D.gold,margin:"0 0 8px",lineHeight:1.15}}>Your Order is<br/>Ready!</h1>
        <p style={{fontSize:14,color:D.textS,margin:"0 0 32px",fontFamily:"Inter, sans-serif",lineHeight:1.6}}>Head to the counter and<br/>enjoy your perfect brew.</p>
        <div style={{width:"100%",maxWidth:340,marginBottom:24}}>
          <p style={{fontSize:16,fontWeight:700,color:D.text,margin:"0 0 4px",fontFamily:"'Playfair Display', serif"}}>How was your experience?</p>
          <p style={{fontSize:12,color:D.textS,margin:"0 0 16px",fontFamily:"Inter, sans-serif"}}>Your feedback helps us brew better ☕</p>
          <div style={{display:"flex",justifyContent:"center",gap:12}}>
            {EMOJIS.map((f,i)=>(
              <button key={i} onClick={()=>!done&&submit(i+1)} disabled={done||submitting} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:feedback===i+1?`${D.gold}18`:"none",border:`1.5px solid ${feedback===i+1?D.gold:D.glassB}`,borderRadius:14,padding:"10px 8px",cursor:done?"default":"pointer",transition:`all 0.25s ${EASE}`,boxShadow:feedback===i+1?`0 0 16px ${D.goldG}`:"none",minWidth:52}}>
                <span style={{fontSize:feedback===i+1?28:22,transition:`font-size 0.25s ${EASE}`}}>{f.e}</span>
                <span style={{fontSize:9,fontWeight:feedback===i+1?800:500,color:feedback===i+1?D.gold:D.textD,fontFamily:"Inter, sans-serif"}}>{f.l}</span>
              </button>
            ))}
          </div>
        </div>
        {done&&<div style={{width:"100%",maxWidth:340,background:D.bg2,borderRadius:18,padding:16,marginBottom:20,border:`1px solid ${D.glassB}`,animation:"fadeUp 0.5s ease",display:"flex",gap:0}}>
          <div style={{flex:1,borderRight:`1px solid ${D.glassB}`,paddingRight:16}}>
            <p style={{fontSize:11,color:D.textD,margin:"0 0 4px",fontFamily:"Inter, sans-serif"}}>You earned</p>
            <p style={{fontSize:22,fontWeight:900,color:D.gold,margin:0,fontFamily:"'DM Mono', monospace",animation:"countUp 0.5s ease"}}>+{beanCount} Beans</p>
          </div>
          <div style={{flex:1,paddingLeft:16}}>
            <p style={{fontSize:11,color:D.textD,margin:"0 0 4px",fontFamily:"Inter, sans-serif"}}>Total Balance</p>
            <p style={{fontSize:22,fontWeight:900,color:D.text,margin:0,fontFamily:"'DM Mono', monospace"}}>132 Beans</p>
            <div style={{height:4,background:D.bg3,borderRadius:99,marginTop:4,overflow:"hidden"}}><div style={{height:"100%",width:"34%",background:GG,borderRadius:99}}/></div>
            <p style={{fontSize:9,color:D.textD,margin:"3px 0 0",fontFamily:"Inter, sans-serif"}}>68 away from free coffee</p>
          </div>
        </div>}
        <div style={{width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:10}}>
          <Btn onClick={onRestart} variant="gold" fullWidth size="lg"><span>🔄</span> Order Again</Btn>
          <button onClick={onRestart} style={{background:"none",border:"none",color:D.textS,cursor:"pointer",fontSize:13,fontWeight:500,fontFamily:"Inter, sans-serif",padding:"10px"}}>Back to Home</button>
        </div>
      </div>
    </div>
  );
}
function TopCancelBar({order,onCancelled}:{order:Order;onCancelled:()=>void}) {
  const placedAt=new Date(order.createdAt).getTime();
  const [s,setS]=useState(()=>Math.max(0,120-Math.floor((Date.now()-placedAt)/1000)));
  const [cancelling,setCancelling]=useState(false);
  useEffect(()=>{const iv=setInterval(()=>setS(Math.max(0,120-Math.floor((Date.now()-placedAt)/1000))),1000);return()=>clearInterval(iv);},[placedAt]);
  if(s<=0)return null;
  const isUrgent=s<=30; const pct=(s/120)*100; const mins=Math.floor(s/60); const secs=s%60;
  const cancel=async()=>{if(cancelling||!confirm(`Cancel order #${order.orderNumber}?`))return;setCancelling(true);try{await orderApi.cancelOrder(order._id);localStorage.removeItem("gb_active_order");onCancelled();}catch{alert("Failed");setCancelling(false);}};
  return(
    <div style={{position:"sticky",top:0,zIndex:45,background:isUrgent?"linear-gradient(135deg,#7f1d1d,#C0392B)":"linear-gradient(135deg,#0F3D2E,#1A5340)",borderBottom:`1px solid ${isUrgent?"#ef4444":D.gold}`}}>
      <div style={{padding:"9px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:"rgba(255,255,255,0.12)",borderRadius:8,padding:"5px 10px",border:`1px solid ${isUrgent?"rgba(255,255,255,0.4)":D.gold}`}}>
            <span style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:"white"}}>{mins}:{String(secs).padStart(2,"0")}</span>
          </div>
          <p style={{fontWeight:700,fontSize:12,color:"white",margin:0,fontFamily:"Inter, sans-serif"}}>{isUrgent?"⚠️ Last chance!":"Cancel within 2 min"}</p>
        </div>
        <button onClick={cancel} disabled={cancelling} style={{background:"rgba(255,255,255,0.9)",color:isUrgent?"#C0392B":"#0F3D2E",border:"none",borderRadius:8,padding:"6px 14px",fontWeight:800,fontSize:11,cursor:cancelling?"wait":"pointer",fontFamily:"Inter, sans-serif"}}>{cancelling?"...":"✕ CANCEL"}</button>
      </div>
      <div style={{height:2,background:"rgba(0,0,0,0.25)"}}><div style={{height:"100%",width:`${pct}%`,background:isUrgent?"linear-gradient(90deg,#fca5a5,white)":GG,transition:"width 1s linear"}}/></div>
    </div>
  );
}

function FloatingCartBar({cart,discount,onClick}:{cart:ECI[];discount:Discount|null;onClick:()=>void}) {
  const sub=cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
  const disc=discount?.discount||0; const total=(Math.max(0,sub-disc)*1.05).toFixed(0);
  const items=cart.reduce((s,i)=>s+i.quantity,0);
  const [bump,setBump]=useState(false); const prevLen=useRef(0);
  useEffect(()=>{if(cart.length!==prevLen.current){setBump(true);setTimeout(()=>setBump(false),400);}prevLen.current=cart.length;},[cart.length]);
  if(!cart.length)return null;
  return(
    <div style={{position:"fixed",bottom:76,left:14,right:14,zIndex:50,animation:"slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}>
      <button onClick={onClick} style={{width:"100%",background:D.bg2,borderRadius:18,padding:"12px 16px",border:`1px solid ${D.gold}45`,boxShadow:`0 8px 32px rgba(0,0,0,0.7),0 0 0 1px ${D.gold}15,0 0 24px ${D.goldG}`,backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transform:bump?"scale(1.02)":"scale(1)",transition:`transform 0.3s cubic-bezier(0.34,1.56,0.64,1)`}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{position:"relative"}}>
            <div style={{width:44,height:44,borderRadius:14,background:`${D.gold}20`,border:`1.5px solid ${D.gold}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🛒</div>
            <div style={{position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",background:GG,color:D.bg0,fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${D.bg2}`,animation:bump?"cartBounce 0.4s ease":"none"}}>{items}</div>
          </div>
          <div style={{textAlign:"left"}}>
            <p style={{fontWeight:800,fontSize:16,color:D.text,margin:0,fontFamily:"Inter, sans-serif"}}>₹{total}</p>
            {disc>0&&<p style={{fontSize:10,color:D.green,margin:0,fontWeight:700,fontFamily:"Inter, sans-serif"}}>You Save ₹{disc} 🎉</p>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:GG,borderRadius:12,padding:"10px 18px",boxShadow:`0 4px 16px ${D.goldG}`}}>
          <span style={{fontWeight:900,fontSize:14,color:D.bg0,fontFamily:"Inter, sans-serif"}}>View Cart</span>
          <span style={{color:D.bg0,fontSize:18}}>›</span>
        </div>
      </button>
    </div>
  );
}

function BottomNav({active,onChange,orderBadge,cartBadge}:{active:string;onChange:(t:Tab)=>void;orderBadge:boolean;cartBadge:number}) {
  const TABS=[{id:"home" as Tab,icon:"🏠",label:"Home"},{id:"menu_detail" as Tab,icon:"🍽️",label:"Menu"},{id:"tracking" as Tab,icon:"📋",label:"Orders"},{id:"cart" as Tab,icon:"🛒",label:"Cart"},{id:"info" as Tab,icon:"👤",label:"Profile"}];
  return(
    <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:40,background:"rgba(5,5,5,0.97)",backdropFilter:"blur(24px)",borderTop:`1px solid ${D.glassB}`,paddingTop:8,paddingBottom:"max(10px,env(safe-area-inset-bottom))"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-around",maxWidth:480,margin:"0 auto",padding:"0 8px"}}>
        {TABS.map(tab=>{
          const isA=active===tab.id;
          return(
            <button key={tab.id} onClick={()=>onChange(tab.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"4px 12px",position:"relative",flex:1}}>
              {isA&&<div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",width:24,height:3,background:GG,borderRadius:99}}/>}
              <span style={{fontSize:22,transition:`all 0.25s ${EASE}`,transform:isA?"scale(1.18)":"scale(1)",filter:isA?"none":"grayscale(0.9) opacity(0.4)"}}>{tab.icon}</span>
              <span style={{fontSize:9,fontWeight:isA?700:500,color:isA?D.gold:D.textD,fontFamily:"Inter, sans-serif",letterSpacing:"0.02em"}}>{tab.label}</span>
              {tab.id==="tracking"&&orderBadge&&<div style={{position:"absolute",top:1,right:8,width:9,height:9,borderRadius:"50%",background:GG,border:`2px solid #050505`}}/>}
              {tab.id==="cart"&&cartBadge>0&&<div style={{position:"absolute",top:1,right:8,minWidth:18,height:18,borderRadius:99,background:GG,color:D.bg0,fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid #050505`,fontFamily:"'DM Mono', monospace"}}>{cartBadge}</div>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
export default function CustomerOrderPage() {
  const params=useParams(); const router=useRouter();
  const tableId=params.tableId as string;
  const [secStatus,setSecStatus]=useState<"checking"|"passed"|"failed">("checking");
  const [secResult,setSecResult]=useState<SecResult|null>(null);
  const [menu,setMenu]=useState<MenuCategory[]>([]);
  const [table,setTable]=useState<Table|null>(null);
  const [existingOrder,setExistingOrder]=useState<Order|null>(null);
  const [allOrders,setAllOrders]=useState<Order[]>([]);
  const [loading,setLoading]=useState(true);
  const [cart,setCart]=useState<ECI[]>([]);
  const [discount,setDiscount]=useState<Discount|null>(null);
  const [isPlacing,setIsPlacing]=useState(false);
  const [placedOrder,setPlacedOrder]=useState<Order|null>(null);
  const [sessionEnded,setSessionEnded]=useState(false);
  const [sessionEndReason,setSessionEndReason]=useState("");
  const [screen,setScreen]=useState<Screen>("security");
  const [activeTab,setActiveTab]=useState<Tab>("home");
  const [selectedItem,setSelectedItem]=useState<MenuItem|null>(null);
  const [activeCategory,setActiveCategory]=useState("");
  const [customerData,setCustomerData]=useState<{name:string;phone:string}|null>(null);
  const [favs,setFavs]=useState<Set<string>>(new Set());
  const prevStatusRef=useRef<string|null>(null);
  const pollRef=useRef<NodeJS.Timeout|null>(null);

  const onPassed=useCallback(()=>{setSecStatus("passed");setScreen("home");},[]);
  const onFailed=useCallback((r:SecResult)=>{setSecResult(r);setSecStatus("failed");},[]);
  const onRetry=useCallback(()=>{setSecStatus("checking");},[]);

  useEffect(()=>{
    if(secStatus!=="passed")return;
    const saved=localStorage.getItem("gb_customer");
    if(saved){try{const d=JSON.parse(saved);setCustomerData({name:d.name,phone:d.phone});}catch{}}
    const onSt=()=>{const u=localStorage.getItem("gb_customer");if(u){try{const d=JSON.parse(u);setCustomerData({name:d.name,phone:d.phone});}catch{}}};
    window.addEventListener("storage",onSt);
    const iv=setInterval(()=>{const u=localStorage.getItem("gb_customer");if(u){try{const d=JSON.parse(u);setCustomerData(p=>p?.name===JSON.parse(u).name?p:{name:d.name,phone:d.phone});}catch{}}},2000);
    return()=>{window.removeEventListener("storage",onSt);clearInterval(iv);};
  },[secStatus]);

  useEffect(()=>{
    if(secStatus!=="passed")return;
    async function load(){try{setLoading(true);const[mR,tR]=await Promise.all([menuApi.getMenu(),tableApi.getTable(tableId)]);setMenu(mR.data.data);setTable(tR.data.data);if(mR.data.data.length>0)setActiveCategory(mR.data.data[0]._id);const oR=await orderApi.getOrderByTable(tableId);if(oR.data.data){const o=oR.data.data;if(["settled","cancelled"].includes(o.status)){localStorage.removeItem("gb_active_order");setExistingOrder(null);}else{setExistingOrder(o);prevStatusRef.current=o.status;localStorage.setItem("gb_active_order",o._id);}}}catch{}finally{setLoading(false);}}
    load();
  },[tableId,secStatus]);

  useEffect(()=>{
    if(secStatus!=="passed")return;
    let cancelled=false;
    const check=async()=>{
      if(cancelled)return;
      try{
        if(existingOrder){const dR=await orderApi.getOrder(existingOrder._id);const dO:Order|null=dR.data?.data;if(dO){if(dO.status==="settled"){localStorage.setItem("gb_settled_order_id",existingOrder._id);localStorage.setItem("gb_settled_table",existingOrder.tableNumber||tableId);localStorage.removeItem("gb_active_order");localStorage.removeItem("gb_customer");setSessionEndReason("Your bill has been settled. Thank you for visiting!");setSessionEnded(true);setScreen("orderReady");setPlacedOrder(existingOrder);return;}if(dO.status==="cancelled"){localStorage.removeItem("gb_active_order");setExistingOrder(null);return;}setExistingOrder(dO);}}
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

  const queuePos=existingOrder?allOrders.filter(o=>["kotSent","open"].includes(o.status)&&o._id!==existingOrder._id&&new Date(o.createdAt).getTime()<new Date(existingOrder.createdAt).getTime()).length:undefined;

  const addToCart=(item:MenuItem,qty:number,variants:{groupName:string;selected:string[]}[],mod:number)=>{
    const key=item._id+JSON.stringify(variants);
    setCart(prev=>{const ex=prev.find(c=>(c.menuItemId+JSON.stringify(c.variants))===key);if(ex)return prev.map(c=>(c.menuItemId+JSON.stringify(c.variants))===key?{...c,quantity:c.quantity+qty}:c);return[...prev,{menuItemId:item._id,name:item.name,price:item.price,quantity:qty,notes:"",isVeg:true,variants,totalPriceModifier:mod,imageUrl:item.imageUrl}];});
    setSelectedItem(null);
  };
  const updateQty=(key:string,d:number)=>setCart(prev=>{const ex=prev.find(c=>(c.menuItemId+JSON.stringify(c.variants))===key);if(!ex)return prev;if(ex.quantity+d<=0)return prev.filter(c=>(c.menuItemId+JSON.stringify(c.variants))!==key);return prev.map(c=>(c.menuItemId+JSON.stringify(c.variants))===key?{...c,quantity:c.quantity+d}:c);});

  const handlePay=async(paymentMethod:string,tip:number,note:string)=>{
    if(!cart.length)return;
    try{const API=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";const pm=(await fetch(`${API}/settings/payment_mode`).then(r=>r.json())).data||"counter";if((pm==="online"||pm==="both")&&paymentMethod!=="cash"){await initiateRazorpay(tip);}else{placeOrder(tip,note);}}catch{placeOrder(tip,note);}
  };

  const initiateRazorpay=async(tip:number)=>{
    const sub=cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);const disc=discount?.discount||0;const total=Math.round(Math.max(0,sub-disc)*1.05)+tip;
    const API=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";setIsPlacing(true);
    try{const res=await fetch(`${API}/payment/create-order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:total,tableNumber:table?.tableNumber})}).then(r=>r.json());if(!res.success)throw new Error(res.message);await new Promise<void>((resolve,reject)=>{if((window as any).Razorpay){resolve();return;}const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.onload=()=>resolve();s.onerror=()=>reject();document.body.appendChild(s);});await new Promise<void>((resolve,reject)=>{new (window as any).Razorpay({key:res.data.keyId,amount:total*100,currency:"INR",name:"Golden Beans Café",order_id:res.data.orderId,prefill:{name:customerData?.name||"",contact:customerData?.phone||""},theme:{color:D.gold},handler:async(r:any)=>{try{const v=await fetch(`${API}/payment/verify`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)}).then(r=>r.json());if(v.success){await placeOrder(tip,"",r.razorpay_payment_id);resolve();}else reject();}catch(e){reject(e);}},modal:{ondismiss:()=>reject(new Error("cancelled"))}}).open();});}catch(e:any){if(e?.message!=="cancelled")alert(e?.message||"Payment failed");}finally{setIsPlacing(false);}
  };

  const placeOrder=async(tip:number=0,note:string="",paymentId?:string)=>{
    if(!cart.length)return;setIsPlacing(true);
    try{const res=await orderApi.createOrder({tableId,items:cart.map(c=>({menuItemId:c.menuItemId,name:c.name,price:c.price+(c.totalPriceModifier||0),quantity:c.quantity,notes:c.variants?.flatMap(v=>v.selected).join(", ")||note,isVeg:c.isVeg})),createdBy:"customer",customerName:customerData?.name||"",customerPhone:customerData?.phone||"",discount:discount?.discount||0,appliedPromoId:discount?.promotionId||null,appliedPromoCode:discount?.code||null,razorpayPaymentId:paymentId||null});const nO:Order=res.data.data;setCart([]);setDiscount(null);setExistingOrder(nO);prevStatusRef.current=nO.status;localStorage.setItem("gb_active_order",nO._id);setPlacedOrder(nO);setScreen("orderPlaced");}catch(e:unknown){alert(e instanceof Error?e.message:"Failed");}finally{setIsPlacing(false);}
  };

  const allItems=menu.flatMap(c=>c.items as MenuItem[]);
  const bestsellers=allItems.filter(i=>i.tags?.includes("bestseller")&&i.isAvailable);
  const catItems=(menu.find(c=>c._id===activeCategory)?.items||[]) as MenuItem[];
  const totalCartItems=cart.reduce((s,i)=>s+i.quantity,0);
  const hour=new Date().getHours();
  const greeting=hour<12?"Good Morning":hour<17?"Good Afternoon":"Good Evening";

  // Security gates
  if(screen==="security"){
    if(secStatus==="checking")return <SecurityCheckScreen onPassed={onPassed} onFailed={onFailed}/>;
    if(secStatus==="failed"&&secResult)return <AwarenessScreen result={secResult} onRetry={onRetry}/>;
    return null;
  }

  // Session ended screens
  if(sessionEnded&&screen==="orderReady"){
    return <div style={{minHeight:"100vh",background:D.bg0}}><style>{CSS}</style><OrderReadyScreen order={placedOrder} onRestart={()=>{setSessionEnded(false);setScreen("home");setCart([]);setDiscount(null);setExistingOrder(null);setPlacedOrder(null);router.replace("/");}}/></div>;
  }

  // Full-screen flow screens
  if(screen==="cart") return <div style={{minHeight:"100vh",background:D.bg0}}><style>{CSS}</style>{existingOrder&&!["settled","cancelled"].includes(existingOrder.status)&&<TopCancelBar order={existingOrder} onCancelled={()=>{setExistingOrder(null);prevStatusRef.current=null;}}/>}<CartScreen cart={cart} onUpdateQty={updateQty} onCheckout={()=>setScreen("checkout")} discount={discount} onDiscountChange={setDiscount} allItems={allItems} onAddMore={item=>setSelectedItem(item)}/><ProductDetailModal item={selectedItem} isOpen={!!selectedItem} onClose={()=>setSelectedItem(null)} onAdd={addToCart}/></div>;

  if(screen==="checkout") return <div style={{minHeight:"100vh",background:D.bg0}}><style>{CSS}</style><CheckoutScreen cart={cart} table={table} discount={discount} onBack={()=>setScreen("cart")} onPay={handlePay} isPlacing={isPlacing}/></div>;

  if(screen==="orderPlaced"&&placedOrder) return <div style={{minHeight:"100vh",background:D.bg0}}><style>{CSS}</style><OrderPlacedScreen order={placedOrder} onTrack={()=>setScreen("tracking")} onHome={()=>setScreen("home")}/></div>;

  if(screen==="tracking"&&existingOrder) return <div style={{minHeight:"100vh",background:D.bg0}}><style>{CSS}</style>{existingOrder&&!["settled","cancelled"].includes(existingOrder.status)&&<TopCancelBar order={existingOrder} onCancelled={()=>{setExistingOrder(null);prevStatusRef.current=null;setScreen("home");}}/>}<OrderTrackingScreen order={existingOrder} onOrderReady={()=>{setScreen("orderReady");setSessionEnded(true);}}/></div>;

  const handleTabChange=(tab:Tab)=>{
    if(tab==="cart"){setScreen("cart");}
    else if(tab==="tracking"){if(existingOrder)setScreen("tracking");else setActiveTab("tracking");}
    else{setScreen("home");setActiveTab(tab);}
  };

  // MAIN APP
  return(
    <div style={{minHeight:"100vh",background:D.bg0,display:"flex",flexDirection:"column",overflowX:"hidden"}}>
      <style>{CSS}</style>
      {existingOrder&&!["settled","cancelled"].includes(existingOrder.status)&&<TopCancelBar order={existingOrder} onCancelled={()=>{setExistingOrder(null);prevStatusRef.current=null;}}/>}

      {/* HEADER */}
      <header style={{position:"sticky",top:0,zIndex:30,background:"rgba(5,5,5,0.97)",backdropFilter:"blur(24px)",padding:"12px 16px",borderBottom:`1px solid ${D.glassB}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:14,overflow:"hidden",border:`1.5px solid ${D.gold}55`,boxShadow:`0 0 16px ${D.goldG}`,flexShrink:0,background:D.bg2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
              <img src="/logo-small.png" alt="GB" style={{width:"100%",height:"100%",objectFit:"contain"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>☕
            </div>
            <div>
              <p style={{fontFamily:"'Playfair Display', serif",fontSize:17,fontWeight:800,color:D.text,margin:0,lineHeight:1.1}}>Golden Beans</p>
              <p style={{fontSize:10,color:D.textS,margin:0,fontFamily:"Inter, sans-serif"}}>Café &amp; Bistro{table?` · Table ${table.tableNumber}`:""}</p>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button style={{width:40,height:40,borderRadius:12,background:D.glass,border:`1px solid ${D.glassB}`,color:D.text,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>☕</button>
            <button style={{width:40,height:40,borderRadius:12,background:D.glass,border:`1px solid ${D.glassB}`,color:D.text,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🔍</button>
          </div>
        </div>
      </header>

      <main style={{flex:1,paddingBottom:cart.length>0?148:80}}>
        {/* HOME */}
        {activeTab==="home"&&(
          <div>
            {loading?(
              <div>
                <div className="sh" style={{height:290}}/>
                <div style={{padding:"16px 16px 0",display:"flex",gap:10}}>{[1,2,3,4].map(i=><div key={i} className="sh" style={{flexShrink:0,width:74,height:90,borderRadius:18}}/>)}</div>
                <div style={{padding:"20px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[1,2,3,4].map(i=><div key={i} style={{background:D.bg2,borderRadius:20,overflow:"hidden",border:`1px solid ${D.glassB}`}}><div className="sh" style={{height:138}}/><div style={{padding:"10px 12px"}}><div className="sh" style={{height:14,borderRadius:6,marginBottom:8,width:"70%"}}/><div className="sh" style={{height:11,borderRadius:6,width:"50%"}}/></div></div>)}
                </div>
              </div>
            ):(
              <>
                <HeroCarousel items={allItems} cart={cart} onTap={item=>setSelectedItem(item)} onExplore={()=>setActiveTab("menu_detail")}/>
                <div style={{padding:"16px 16px 4px"}}>
                  <p style={{fontSize:11,color:D.textS,margin:"0 0 2px",fontFamily:"Inter, sans-serif"}}>{greeting}{customerData?",":" ☕"}</p>
                  <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:26,fontWeight:800,color:D.text,margin:0}}>
                    {customerData?<><span className="gold-txt">{customerData.name}</span> 👋</>:"Welcome to Golden Beans"}
                  </h2>
                </div>
                <div style={{padding:"16px 0 0"}}>
                  <div style={{marginBottom:24}}>
                    <div style={{padding:"0 16px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <h3 style={{fontFamily:"'Playfair Display', serif",fontSize:18,color:D.text,margin:0}}>🔥 Popular Right Now</h3>
                      <button style={{fontSize:12,color:D.gold,background:"none",border:"none",cursor:"pointer",fontWeight:600,fontFamily:"Inter, sans-serif"}}>See All ›</button>
                    </div>
                    <div className="hs" style={{display:"flex",gap:12,overflowX:"auto",paddingLeft:16,paddingRight:16,scrollSnapType:"x mandatory"}}>
                      {(bestsellers.length>0?bestsellers:allItems.filter(i=>i.isAvailable).slice(0,6)).map((item,idx)=>{
                        const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
                        return <div key={item._id} style={{flexShrink:0,width:idx===0?"200px":"158px",scrollSnapAlign:"start"}}><ItemCard item={item} onTap={()=>setSelectedItem(item)} qty={qty} isFav={favs.has(item._id)} onFav={()=>setFavs(p=>{const n=new Set(p);n.has(item._id)?n.delete(item._id):n.add(item._id);return n;})} delay={idx*0.06}/></div>;
                      })}
                    </div>
                  </div>
                  <CategoryRow cats={menu} active={activeCategory} onSelect={id=>{setActiveCategory(id);setActiveTab("menu_detail");}}/>
                  <CompactRow title="Continue Your Favorites" items={catItems.filter(i=>i.isAvailable).slice(0,6)} cart={cart} onTap={item=>setSelectedItem(item)}/>
                  <PromoBanner onTap={()=>setActiveTab("menu_detail")}/>
                  {menu.slice(0,3).map(cat=>(
                    <div key={cat._id} style={{marginBottom:24}}>
                      <div style={{padding:"0 16px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <h3 style={{fontFamily:"'Playfair Display', serif",fontSize:18,color:D.text,margin:0}}>{cat.icon} {cat.name}</h3>
                        <button style={{fontSize:12,color:D.gold,background:"none",border:"none",cursor:"pointer",fontWeight:600,fontFamily:"Inter, sans-serif"}}>See All ›</button>
                      </div>
                      <div className="hs" style={{display:"flex",gap:12,overflowX:"auto",paddingLeft:16,paddingRight:16}}>
                        {(cat.items as MenuItem[]).filter(i=>i.isAvailable).slice(0,6).map((item,idx)=>{const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);return <div key={item._id} style={{flexShrink:0,width:158}}><ItemCard item={item} onTap={()=>setSelectedItem(item)} qty={qty} isFav={favs.has(item._id)} onFav={()=>setFavs(p=>{const n=new Set(p);n.has(item._id)?n.delete(item._id):n.add(item._id);return n;})} delay={idx*0.05}/></div>;})}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* MENU */}
        {activeTab==="menu_detail"&&(
          <div>
            <CategoryRow cats={menu} active={activeCategory} onSelect={setActiveCategory}/>
            <div style={{padding:"0 16px",marginBottom:10}}>
              <h3 style={{fontFamily:"'Playfair Display', serif",fontSize:20,color:D.text,margin:"0 0 3px"}}>{menu.find(c=>c._id===activeCategory)?.icon} {menu.find(c=>c._id===activeCategory)?.name}</h3>
              <p style={{fontSize:11,color:D.textS,margin:0,fontFamily:"Inter, sans-serif"}}>{catItems.filter(i=>i.isAvailable).length} items available</p>
            </div>
            {loading?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,padding:"0 16px"}}>{[1,2,3,4,5,6].map(i=><div key={i} style={{background:D.bg2,borderRadius:20,overflow:"hidden",border:`1px solid ${D.glassB}`}}><div className="sh" style={{height:138}}/><div style={{padding:"10px 12px"}}><div className="sh" style={{height:14,borderRadius:6,marginBottom:8,width:"70%"}}/></div></div>)}</div>
            :catItems.length===0?<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:48,marginBottom:12}}>☕</div><p style={{color:D.textS,fontFamily:"Inter, sans-serif"}}>No items yet</p></div>
            :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,padding:"0 16px 20px"}}>
              {catItems.map((item,idx)=>{const qty=cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);return <ItemCard key={item._id} item={item} onTap={()=>setSelectedItem(item)} qty={qty} isFav={favs.has(item._id)} onFav={()=>setFavs(p=>{const n=new Set(p);n.has(item._id)?n.delete(item._id):n.add(item._id);return n;})} delay={idx*0.04}/>;})}</div>}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab==="tracking"&&(
          <div style={{padding:"20px 16px"}}>
            <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:26,color:D.text,margin:"0 0 16px"}}>My Orders</h2>
            {existingOrder?<LiveOrderTracker order={existingOrder} queuePosition={queuePos}/>:<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:56,marginBottom:16,animation:"float 3s ease-in-out infinite"}}>📋</div><h3 style={{fontFamily:"'Playfair Display', serif",fontSize:22,color:D.text,margin:"0 0 8px"}}>No Active Orders</h3><p style={{fontSize:13,color:D.textS,fontFamily:"Inter, sans-serif"}}>Place an order to track it live</p></div>}
          </div>
        )}

        {/* INFO */}
        {activeTab==="info"&&(
          <div style={{padding:"20px 16px"}}>
            <div style={{background:`linear-gradient(135deg,${D.brown},#2a140a)`,borderRadius:20,padding:24,marginBottom:16,border:`1px solid ${D.gold}22`,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-20,right:-20,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle,${D.gold}15,transparent)`,pointerEvents:"none"}}/>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                <div style={{width:52,height:52,borderRadius:14,border:`1px solid ${D.gold}35`,background:D.bg2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>☕</div>
                <div><h3 style={{fontFamily:"'Playfair Display', serif",fontSize:22,color:D.gold,margin:"0 0 2px"}}>Golden Beans</h3><p style={{fontSize:10,color:"rgba(212,164,79,0.65)",margin:0,letterSpacing:"0.15em",fontFamily:"Inter, sans-serif"}}>CAFE &amp; BISTRO</p></div>
              </div>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.75)",margin:0,lineHeight:1.6,fontFamily:"Inter, sans-serif"}}>Premium 100% pure vegetarian cafe. Handcrafted coffee, fresh snacks &amp; artisanal beverages.</p>
            </div>
            {table&&<div style={{background:D.bg2,borderRadius:16,padding:16,marginBottom:12,border:`1px solid ${D.glassB}`,display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:32}}>🪑</span><div><p style={{fontSize:10,color:D.textD,letterSpacing:"0.1em",textTransform:"uppercase",margin:0,fontFamily:"Inter, sans-serif"}}>Your Table</p><p style={{fontFamily:"'Playfair Display', serif",fontWeight:700,fontSize:22,color:D.text,margin:"2px 0 0"}}>Table {table.tableNumber}</p></div></div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{i:"🌿",l:"100% Pure Vegetarian",c:D.green},{i:"☕",l:"Handcrafted Coffee",c:D.gold},{i:"⚡",l:"Fast Service",c:"#4A9EFF"},{i:"❤️",l:"Made with Love",c:D.red}].map(f=>(
                <div key={f.l} style={{background:D.bg2,borderRadius:14,padding:16,border:`1px solid ${D.glassB}`,textAlign:"center"}}><p style={{fontSize:26,margin:"0 0 6px"}}>{f.i}</p><p style={{fontSize:11,fontWeight:700,color:f.c,margin:0,fontFamily:"Inter, sans-serif"}}>{f.l}</p></div>
              ))}
            </div>
          </div>
        )}

        <CRMCaptureCard tableId={tableId}/>
        <WaiterHelpSheet tableId={tableId} tableNumber={table?.tableNumber||tableId}/>
      </main>

      {cart.length>0&&<FloatingCartBar cart={cart} discount={discount} onClick={()=>setScreen("cart")}/>}
      <BottomNav active={activeTab} onChange={handleTabChange} orderBadge={!!existingOrder} cartBadge={totalCartItems}/>
      <ProductDetailModal item={selectedItem} isOpen={!!selectedItem} onClose={()=>setSelectedItem(null)} onAdd={addToCart}/>
    </div>
  );
}
