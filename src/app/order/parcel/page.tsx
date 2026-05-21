"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { menuApi } from "@/lib/api";
import { getThumbnailUrl } from "@/lib/cloudinary";
import { getSessionCustomer, setSessionCustomer, clearSessionCustomer } from "@/lib/CustomerIdentitySystem";
import type { MenuCategory, MenuItem } from "@/types";

// ═══════════════════════════════════════════════════════════
// GOLDEN BEANS — PARCEL ORDER PAGE
// src/app/order/parcel/page.tsx
// Same security + theme as customer page
// ═══════════════════════════════════════════════════════════

const C = {
  void:"#030201",dark:"#0B0906",surface:"#15120E",raise:"#1E1A14",
  gold:"#C8922A",goldM:"#E8B84B",goldL:"#F5CC6A",
  ink:"#F5EDD8",inkSub:"#C4AA80",inkDim:"#7A6448",inkGh:"#2A2218",
  gl1:"rgba(255,255,255,0.03)",gl2:"rgba(255,255,255,0.06)",
  glBd:"rgba(255,255,255,0.08)",
  g08:"rgba(200,146,42,0.08)",g15:"rgba(200,146,42,0.15)",
  g25:"rgba(200,146,42,0.25)",g40:"rgba(200,146,42,0.40)",
  green:"#2E7D52",greenL:"rgba(46,125,82,0.15)",greenBd:"rgba(74,222,128,0.25)",
  emerald:"rgba(74,222,128,1)",
  ruby:"#C0392B",rubyL:"rgba(192,57,43,0.12)",
  blue:"#3B82F6",blueL:"rgba(59,130,246,0.12)",
};
const GG   = `linear-gradient(135deg,${C.gold} 0%,${C.goldM} 52%,${C.goldL} 100%)`;
const EASE = "cubic-bezier(0.25,0.46,0.45,0.94)";
const SPR  = "cubic-bezier(0.34,1.56,0.64,1)";
const A    = process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";

interface CartItem { menuItemId:string; name:string; price:number; quantity:number; notes:string; imageUrl?:string; isVeg?:boolean }

// ── Same WelcomeScreen as customer page ──
function WelcomeScreen({onDone}:{onDone:()=>void}){
  const [exiting,setExiting]=useState(false);
  useEffect(()=>{ const t=setTimeout(()=>{setExiting(true);setTimeout(onDone,400);},1500); return()=>clearTimeout(t); },[onDone]);
  return(
    <div style={{position:"fixed",inset:0,zIndex:999,background:"#030201",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:exiting?"ws-exit 0.4s ease forwards":"ws-fadeIn 0.5s ease"}}>
      <style>{`
        @keyframes ws-fadeIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes ws-exit{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(1.04)}}
        @keyframes ws-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes ws-shimmer{0%,100%{opacity:.05}50%{opacity:.2}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes scaleIn{from{transform:scale(0)}to{transform:scale(1)}}
        @keyframes pSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pPulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes pFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes pPop{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes pGlow{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.8;transform:scale(1.08)}}
      `}</style>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse 70% 50% at 50% 40%,rgba(200,146,42,0.1),transparent 65%)"}}/>
      <div style={{position:"relative",zIndex:10,textAlign:"center",padding:"0 32px"}}>
        <div style={{width:96,height:96,borderRadius:"50%",border:"2px solid rgba(200,146,42,0.35)",background:"radial-gradient(circle at 40% 35%,#3D1F08,#120802)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:46,margin:"0 auto 18px",boxShadow:"0 0 32px rgba(200,146,42,0.18)",animation:"ws-float 3s ease-in-out infinite"}}>☕</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:300,color:"#F5EDD8",margin:"0 0 4px",letterSpacing:"-0.01em",lineHeight:1}}>Golden <em style={{fontStyle:"italic",fontWeight:600,color:"#F5CC6A"}}>Beans</em></h1>
        <p style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(200,146,42,0.55)",letterSpacing:"0.22em",textTransform:"uppercase",margin:"0 0 20px"}}>Café &amp; Bistro · Parcel</p>
        <div style={{display:"flex",justifyContent:"center",gap:6}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"rgba(200,146,42,0.5)",animation:`ws-shimmer 1.2s ${i*0.2}s ease-in-out infinite`}}/>)}</div>
      </div>
    </div>
  );
}

// ── Same SecurityCheckScreen as customer page ──
type CS="pending"|"loading"|"ok"|"fail";
type SecRes={allowed:boolean;ipAllowed:boolean;gpsAllowed:boolean;gpsRequired:boolean;ipRequired:boolean;distance:number|null;cafeName:string;cafeAddress:string;cafePhone?:string;wifiName?:string;reason?:string};

function SecurityCheckScreen({onPassed,onFailed}:{onPassed:()=>void;onFailed:(r:SecRes)=>void}){
  const [gps,setGps]=useState<CS>("pending");
  const [net,setNet]=useState<CS>("pending");
  const [welcome,setWelcome]=useState(false);
  useEffect(()=>{
    let ok=true;
    async function run(){
      try{
        setGps("loading"); await new Promise(r=>setTimeout(r,420));
        const s=(await fetch(`${A}/security/settings`).then(r=>r.json())).data;
        if(s&&!s.ipWhitelistEnabled&&!s.geofenceEnabled){if(ok){setGps("ok");setNet("ok");setWelcome(true);}return;}
        if(!("geolocation"in navigator)){if(ok){setGps("fail");await new Promise(r=>setTimeout(r,500));onFailed({allowed:false,ipAllowed:false,gpsAllowed:false,gpsRequired:true,ipRequired:true,distance:null,cafeName:"Golden Beans",cafeAddress:"",wifiName:"GoldenBeans-WiFi",reason:"GPS not supported"});}return;}
        let pos:GeolocationPosition|null=null;
        if(s?.geofenceEnabled)pos=await new Promise<GeolocationPosition>((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:true,timeout:15000,maximumAge:0})).catch(e=>{throw new Error(e.code===1?"DENIED":"TIMEOUT");});
        if(ok)setGps("ok");
        await new Promise(r=>setTimeout(r,500));
        if(ok)setNet("loading");
        const res=await fetch(`${A}/security/check`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({latitude:pos?.coords.latitude,longitude:pos?.coords.longitude})});
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
        onFailed({allowed:false,ipAllowed:true,gpsAllowed:!gf,gpsRequired:true,ipRequired:true,distance:null,cafeName:"Golden Beans",cafeAddress:"Pramukh Darshan, Dabholi, Surat",wifiName:"GoldenBeans-WiFi",reason:gf?"Location access denied":m==="TIMEOUT"?"Location timed out":"Connect to cafe WiFi"});
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
    <div style={{position:"fixed",inset:0,zIndex:999,background:C.void,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:16,animation:"ws-float 3s ease-in-out infinite"}}>📦</div>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600,color:C.ink,margin:"0 0 6px"}}>Parcel Order</h2>
        <p style={{fontSize:13,color:C.inkSub,margin:"0 0 28px",fontFamily:"'DM Sans',sans-serif"}}>Verifying your location...</p>
        <Row state={gps} icon="📍" title="Location" sub={gps==="loading"?"Getting your location...":gps==="ok"?"You're at the cafe ✓":gps==="fail"?"Location not verified":"Waiting..."}/>
        <Row state={net} icon="📶" title="Network"  sub={net==="loading"?"Checking connection...":net==="ok"?"Connected to cafe WiFi ✓":net==="fail"?"Not on cafe WiFi":"Waiting..."}/>
      </div>
    </div>
  );
}

// ── Awareness Screen (same as customer) ──
function AwarenessScreen({result,onRetry}:{result:SecRes;onRetry:()=>void}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:999,background:C.void,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:16}}>🚫</div>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600,color:C.ink,margin:"0 0 8px"}}>Access Restricted</h2>
        <p style={{fontSize:13,color:C.inkSub,margin:"0 0 24px",fontFamily:"'DM Sans',sans-serif"}}>{result.reason||"Please visit us in-person to order"}</p>
        {!result.ipAllowed&&<div style={{background:C.gl1,border:`1px solid ${C.g15}`,borderRadius:14,padding:14,marginBottom:9,textAlign:"left"}}><p style={{color:C.gold,fontWeight:600,fontSize:13,margin:"0 0 2px",fontFamily:"'DM Sans',sans-serif"}}>📶 Connect to Cafe WiFi</p><p style={{color:C.inkSub,fontSize:12,margin:0,fontFamily:"'DM Sans',sans-serif"}}>{result.wifiName||"GoldenBeans-WiFi"}</p></div>}
        {!result.gpsAllowed&&<div style={{background:C.gl1,border:`1px solid ${C.g15}`,borderRadius:14,padding:14,marginBottom:9,textAlign:"left"}}><p style={{color:C.gold,fontWeight:600,fontSize:13,margin:"0 0 2px",fontFamily:"'DM Sans',sans-serif"}}>📍 Enable Location</p><p style={{color:C.inkSub,fontSize:12,margin:0,fontFamily:"'DM Sans',sans-serif"}}>{result.distance?`${result.distance}m from cafe`:"Allow in browser settings"}</p></div>}
        <button onClick={onRetry} style={{width:"100%",marginTop:16,padding:"14px",borderRadius:14,border:"none",background:GG,color:C.void,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Try Again</button>
      </div>
    </div>
  );
}

// ── CRM Phone-First Login (same as customer) ──
function CRMLogin({onDone}:{onDone:(name:string,phone:string,id?:string)=>void}){
  const [step,setStep]=useState<"phone"|"name"|"otp">("phone");
  const [phone,setPhone]=useState("");
  const [name,setName]=useState("");
  const [nameLocked,setNameLocked]=useState(false);
  const [otp,setOtp]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [resendTimer,setResendTimer]=useState(0);
  const [customerId,setCustomerId]=useState<string|undefined>();

  useEffect(()=>{ if(resendTimer<=0)return; const iv=setInterval(()=>setResendTimer(p=>p-1),1000); return()=>clearInterval(iv); },[resendTimer]);
  useEffect(()=>{ if(otp.length===6&&step==="otp") verifyOTP(); },[otp]);

  const sendOTP=async(p:string,n:string)=>{
    setLoading(true); setError("");
    try{
      const r=await fetch(`${A}/crm-capture/send-otp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:p,name:n})}).then(r=>r.json());
      if(r.success){ setStep("otp"); setResendTimer(60); }
      else setError("Failed to send OTP. Try again.");
    }catch{ setError("Connection failed."); }
    setLoading(false);
  };

  const handlePhoneNext=async()=>{
    const p=phone.replace(/\D/g,"");
    if(p.length!==10){ setError("Enter valid 10-digit number"); return; }
    setError(""); setLoading(true);
    try{
      const r=await fetch(`${A}/crm-capture/lookup?phone=${p}`).then(r=>r.json());
      if(r.success&&r.data){ setName(r.data.name); setNameLocked(true); setCustomerId(r.data._id); setLoading(false); await sendOTP(p,r.data.name); }
      else{ setNameLocked(false); setLoading(false); setStep("name"); }
    }catch{ setNameLocked(false); setLoading(false); setStep("name"); }
  };

  const handleNameNext=async()=>{
    if(!name.trim()){ setError("Please enter your name"); return; }
    const p=phone.replace(/\D/g,"");
    await sendOTP(p,name.trim());
  };

  const verifyOTP=async()=>{
    if(otp.length!==6)return;
    setLoading(true); setError("");
    try{
      const p=phone.replace(/\D/g,"");
      const r=await fetch(`${A}/crm-capture/verify-otp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:p,otp,name:name.trim(),tableId:"PARCEL"})}).then(r=>r.json());
      if(r.success){
        // Register/update CRM
        const reg=await fetch(`${A}/crm-capture/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name.trim(),phone:p,tableId:"PARCEL"})}).then(r=>r.json());
        const cid=reg.data?._id||customerId;
        setSessionCustomer({_id:cid||"",name:name.trim(),phone:p,totalPoints:reg.data?.totalPoints||0,tier:(reg.data?.tier||"bronze") as any,totalOrders:reg.data?.visitCount||0,totalSpent:0,visits:reg.data?.visitCount||0,lastVisit:new Date().toISOString()});
        onDone(name.trim(),p,cid);
      } else{ setError(r.message||"Incorrect OTP. Try again."); setOtp(""); }
    }catch{ setError("Verification failed."); }
    setLoading(false);
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(2,1,0,0.96)",backdropFilter:"blur(32px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{width:"100%",maxWidth:400,background:`linear-gradient(160deg,${C.raise},${C.surface},${C.dark})`,borderRadius:24,overflow:"hidden",border:`1px solid ${C.glBd}`,boxShadow:"0 40px 80px rgba(0,0,0,0.8)"}}>
        <div style={{height:3,background:GG}}/>
        <div style={{padding:"28px 24px 32px"}}>
          {/* Phone step */}
          {step==="phone"&&<>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:40,marginBottom:10}}>📦</div>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:C.ink,margin:"0 0 6px"}}>Parcel Order</h2>
              <p style={{fontSize:13,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",margin:0}}>Enter your WhatsApp number</p>
            </div>
            <div style={{position:"relative",marginBottom:16}}>
              <div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontSize:13,color:C.inkDim,fontWeight:700,pointerEvents:"none"}}>+91</div>
              <input type="tel" inputMode="numeric" placeholder="98765 43210" value={phone} maxLength={10}
                style={{width:"100%",padding:"13px 16px 13px 48px",borderRadius:14,border:`1.5px solid ${phone?C.g25:C.glBd}`,background:C.gl1,color:C.ink,fontSize:16,fontWeight:600,outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif"}}
                onChange={e=>{ setPhone(e.target.value.replace(/\D/g,"")); setError(""); }}
                onKeyDown={e=>{ if(e.key==="Enter"&&phone.replace(/\D/g,"").length===10) handlePhoneNext(); }}/>
            </div>
            {error&&<p style={{fontSize:12,color:"#f87171",textAlign:"center",margin:"0 0 12px",fontWeight:600}}>⚠ {error}</p>}
            <button onClick={handlePhoneNext} disabled={loading||phone.replace(/\D/g,"").length!==10}
              style={{width:"100%",padding:"15px",borderRadius:14,border:"none",background:phone.replace(/\D/g,"").length===10?GG:"rgba(255,255,255,0.05)",color:phone.replace(/\D/g,"").length===10?C.void:"rgba(122,100,72,0.5)",fontWeight:700,fontSize:15,cursor:phone.replace(/\D/g,"").length===10?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",transition:`all 0.25s ${EASE}`}}>
              {loading?"Checking...":"Continue →"}
            </button>
          </>}

          {/* Name step */}
          {step==="name"&&<>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:32,marginBottom:10}}>👋</div>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:C.ink,margin:"0 0 6px"}}>Welcome! What's your name?</h2>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:12,background:C.g08,border:`1px solid ${C.g15}`,marginBottom:14}}>
              <span style={{fontSize:14}}>📱</span>
              <span style={{fontSize:13,color:C.inkSub,fontFamily:"'DM Mono',monospace"}}>+91 {phone}</span>
              <button onClick={()=>{setStep("phone");setName("");setError("");}} style={{marginLeft:"auto",background:"none",border:"none",color:C.gold,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>Change</button>
            </div>
            <input type="text" placeholder="Your full name" value={name} autoFocus
              style={{width:"100%",padding:"13px 16px",borderRadius:14,border:`1.5px solid ${name?C.g25:C.glBd}`,background:C.gl1,color:C.ink,fontSize:16,fontWeight:600,outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif",marginBottom:16}}
              onChange={e=>{ setName(e.target.value); setError(""); }}
              onKeyDown={e=>{ if(e.key==="Enter"&&name.trim().length>=2) handleNameNext(); }}/>
            {error&&<p style={{fontSize:12,color:"#f87171",textAlign:"center",margin:"0 0 12px",fontWeight:600}}>⚠ {error}</p>}
            <button onClick={handleNameNext} disabled={loading||name.trim().length<2}
              style={{width:"100%",padding:"15px",borderRadius:14,border:"none",background:name.trim().length>=2?GG:"rgba(255,255,255,0.05)",color:name.trim().length>=2?C.void:"rgba(122,100,72,0.5)",fontWeight:700,fontSize:15,cursor:name.trim().length>=2?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif"}}>
              {loading?"Sending OTP...":"Send OTP →"}
            </button>
          </>}

          {/* OTP step */}
          {step==="otp"&&<>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:32,marginBottom:10}}>💬</div>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:C.ink,margin:"0 0 6px"}}>{nameLocked?`Welcome back, ${name.split(" ")[0]}!`:"Check WhatsApp"}</h2>
              <p style={{fontSize:13,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",margin:0}}>OTP sent to <strong style={{color:C.goldL}}>+91 {phone}</strong></p>
            </div>
            {nameLocked&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.25)",marginBottom:12}}><span style={{fontSize:13}}>✓</span><span style={{fontSize:13,color:"#4ADE80",fontWeight:600}}>{name}</span><span style={{marginLeft:"auto",fontSize:10,color:"rgba(74,222,128,0.6)",fontFamily:"'DM Mono',monospace"}}>RETURNING</span></div>}
            <input type="number" inputMode="numeric" placeholder="000000" value={otp} maxLength={6} autoFocus
              style={{width:"100%",padding:"16px",borderRadius:14,border:`2px solid rgba(200,146,42,0.3)`,background:"rgba(200,146,42,0.05)",color:C.goldL,fontSize:32,fontWeight:900,textAlign:"center",letterSpacing:14,outline:"none",boxSizing:"border-box",fontFamily:"'DM Mono',monospace",marginBottom:8}}
              onChange={e=>{ const v=e.target.value.replace(/\D/g,"").slice(0,6); setOtp(v); setError(""); }}/>
            {loading&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"8px 0"}}><div style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(200,146,42,0.3)",borderTopColor:C.gold,animation:"spin 0.7s linear infinite"}}/><span style={{fontSize:12,color:C.inkSub}}>Verifying...</span></div>}
            {error&&<p style={{fontSize:12,color:"#f87171",textAlign:"center",margin:"0 0 10px",fontWeight:600}}>⚠ {error}</p>}
            <p style={{textAlign:"center",fontSize:12,color:C.inkDim,fontFamily:"'DM Sans',sans-serif",margin:"8px 0 0"}}>OTP enters automatically — no button needed</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:14}}>
              <button onClick={async()=>{ if(resendTimer>0)return; setOtp("");setError("");const p=phone.replace(/\D/g,""); await sendOTP(p,name.trim()); }} disabled={resendTimer>0||loading} style={{background:"none",border:"none",fontSize:12,color:resendTimer>0?C.inkDim:C.gold,cursor:resendTimer>0?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{resendTimer>0?`Resend in ${resendTimer}s`:"Resend OTP"}</button>
              <span style={{color:C.inkDim}>·</span>
              <button onClick={()=>{setStep("phone");setOtp("");setError("");setName("");}} style={{background:"none",border:"none",fontSize:12,color:C.inkDim,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Change number</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

// ── Status steps for tracking ──
const STATUS_STEPS=[
  {key:"confirmed", label:"Order Confirmed", icon:"✅", desc:"Your parcel order is confirmed!"},
  {key:"preparing", label:"Being Prepared",  icon:"👨‍🍳",desc:"Chef is preparing your order"},
  {key:"ready",     label:"Ready for Pickup",icon:"🔔", desc:"Come pick up your order!"},
  {key:"delivered", label:"Picked Up",       icon:"🎉", desc:"Enjoy your food!"},
];

export default function ParcelPage(){
  const [screen,       setScreen      ]=useState<"security"|"awareness"|"crm"|"menu"|"cart"|"tracking">("security");
  const [secResult,    setSecResult   ]=useState<SecRes|null>(null);
  const [menu,         setMenu        ]=useState<MenuCategory[]>([]);
  const [cart,         setCart        ]=useState<CartItem[]>([]);
  const [activeCategory,setActiveCategory]=useState("");
  const [searchQuery,  setSearchQuery ]=useState("");
  const [parcelId,     setParcelId    ]=useState<string|null>(null);
  const [parcelToken,  setParcelToken ]=useState<string|null>(null);
  const [parcelData,   setParcelData  ]=useState<any|null>(null);
  const [placing,      setPlacing     ]=useState(false);
  const [error,        setError       ]=useState("");
  const [pmSetting,    setPmSetting   ]=useState("both");
  const [customerInfo, setCustomerInfo]=useState<{name:string;phone:string;id?:string}|null>(null);
  const pollRef=useRef<NodeJS.Timeout|null>(null);

  // Load menu + payment setting
  useEffect(()=>{
    menuApi.getMenu().then(r=>{ const d=r.data.data||[]; setMenu(d); if(d.length>0)setActiveCategory(d[0]._id); }).catch(()=>{});
    fetch(`${A}/settings/payment_mode`).then(r=>r.json()).then(d=>{ if(d.data)setPmSetting(d.data); }).catch(()=>{});
  },[]);

  // After security passes → initiate parcel
  const handleSecurityPassed=useCallback(()=>{ setScreen("crm"); },[]);
  const handleSecurityFailed=useCallback((r:SecRes)=>{ setSecResult(r); setScreen("awareness"); },[]);

  // After CRM → initiate parcel token
  const handleCRMDone=useCallback(async(name:string,phone:string,id?:string)=>{
    setCustomerInfo({name,phone,id});
    try{
      const res=await fetch(`${A}/parcel/initiate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerPhone:phone,customerName:name,customerId:id||null})}).then(r=>r.json());
      if(res.success){
        setParcelId(res.parcelId);
        setParcelToken(res.token);
        if(res.isExisting){
          const pd=await fetch(`${A}/parcel/${res.parcelId}`).then(r=>r.json());
          if(pd.success&&pd.data.status!=="pending"){
            setParcelData(pd.data);
            setScreen("tracking");
            return;
          }
        }
        setScreen("menu");
      }
    }catch{ setError("Connection failed. Please try again."); }
  },[]);

  // Poll tracking
  useEffect(()=>{
    if(screen!=="tracking"||!parcelId)return;
    const poll=async()=>{ try{ const r=await fetch(`${A}/parcel/${parcelId}`).then(r=>r.json()); if(r.success)setParcelData(r.data); }catch{} };
    poll();
    pollRef.current=setInterval(poll,8000);
    return()=>{ if(pollRef.current)clearInterval(pollRef.current); };
  },[screen,parcelId]);

  const addToCart=(item:MenuItem)=>{
    setCart(prev=>{ const ex=prev.find(c=>c.menuItemId===item._id); if(ex)return prev.map(c=>c.menuItemId===item._id?{...c,quantity:c.quantity+1}:c); return [...prev,{menuItemId:item._id,name:item.name,price:item.price,quantity:1,notes:"",imageUrl:item.imageUrl,isVeg:item.isVeg}]; });
  };
  const removeFromCart=(id:string)=>{
    setCart(prev=>{ const ex=prev.find(c=>c.menuItemId===id); if(!ex)return prev; if(ex.quantity===1)return prev.filter(c=>c.menuItemId!==id); return prev.map(c=>c.menuItemId===id?{...c,quantity:c.quantity-1}:c); });
  };

  const subtotal=cart.reduce((s,i)=>s+i.price*i.quantity,0);
  const tax=Math.round(subtotal*0.05);
  const packaging=10;
  const total=subtotal+tax+packaging;
  const cartCount=cart.reduce((s,i)=>s+i.quantity,0);

  // Online payment for parcel
  const handleOnlinePayment=async():Promise<string|null>=>{
    try{
      const orderRes=await fetch(`${A}/payment/create-order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:total,tableNumber:"PARCEL"})}).then(r=>r.json());
      if(!orderRes.success)return null;
      await new Promise<void>((res,rej)=>{ if((window as any).Razorpay){res();return;} const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.onload=()=>res();s.onerror=()=>rej();document.body.appendChild(s); });
      return await new Promise<string|null>((resolve)=>{
        new (window as any).Razorpay({
          key:orderRes.data?.keyId,
          amount:total*100,
          currency:"INR",
          name:"Golden Beans Café",
          description:"Parcel Order",
          order_id:orderRes.data?.orderId,
          prefill:{name:customerInfo?.name||"",contact:customerInfo?.phone?`+91${customerInfo.phone.slice(-10)}`:""},
          theme:{color:C.gold},
          handler:async(r:any)=>{
            try{
              const v=await fetch(`${A}/payment/verify`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)}).then(r=>r.json());
              if(v.success)resolve(r.razorpay_payment_id);
              else resolve(null);
            }catch{resolve(null);}
          },
          modal:{ondismiss:()=>resolve(null)},
        }).open();
      });
    }catch{return null;}
  };

  const placeOrder=async(razorpayPaymentId?:string)=>{
    if(!parcelId||cart.length===0)return;
    setPlacing(true); setError("");
    try{
      const res=await fetch(`${A}/parcel/${parcelId}/place-order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:cart,razorpayPaymentId:razorpayPaymentId||null})}).then(r=>r.json());
      if(res.success){
        // Send WhatsApp confirmation
        try{
          await fetch(`${A}/parcel/whatsapp/confirmation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:customerInfo?.phone,customerName:customerInfo?.name,token:parcelToken,items:cart.map(i=>`${i.name} x${i.quantity}`).join(", "),totalAmount:total})});
        }catch{}
        setParcelData(res.parcel);
        setScreen("tracking");
      } else{ setError(res.message||"Failed to place order. Try again."); }
    }catch{ setError("Connection failed. Try again."); }
    setPlacing(false);
  };

  const handlePlaceOrder=async()=>{
    if(pmSetting==="online"){
      const payId=await handleOnlinePayment();
      if(!payId){ setError("Payment cancelled or failed."); return; }
      await placeOrder(payId);
    } else if(pmSetting==="counter"){
      await placeOrder();
    } else {
      // Both — show choice — default online first
      const payId=await handleOnlinePayment();
      await placeOrder(payId||undefined);
    }
  };

  const allItems=menu.flatMap(c=>c.items as MenuItem[]);
  const displayItems=searchQuery?allItems.filter(i=>i.name.toLowerCase().includes(searchQuery.toLowerCase())&&i.isAvailable):(menu.find(c=>c._id===activeCategory)?.items as MenuItem[]||[]).filter(i=>i.isAvailable);
  const statusIdx=STATUS_STEPS.findIndex(s=>parcelData&&s.key===parcelData.status);

  return(
    <div style={{minHeight:"100dvh",background:C.void,color:C.ink,fontFamily:"'DM Sans',sans-serif",maxWidth:480,margin:"0 auto",position:"relative"}}>

      {/* ── SECURITY ── */}
      {screen==="security"&&<SecurityCheckScreen onPassed={handleSecurityPassed} onFailed={handleSecurityFailed}/>}
      {screen==="awareness"&&secResult&&<AwarenessScreen result={secResult} onRetry={()=>{setScreen("security");setSecResult(null);}}/>}

      {/* ── CRM LOGIN ── */}
      {screen==="crm"&&<CRMLogin onDone={handleCRMDone}/>}

      {/* ── MENU ── */}
      {(screen==="menu"||screen==="cart")&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100dvh"}}>
          {/* Header */}
          <div style={{background:C.surface,borderBottom:`1px solid ${C.glBd}`,padding:"env(safe-area-inset-top,16px) 18px 12px",position:"sticky",top:0,zIndex:10}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.goldL,margin:0}}>📦 Parcel Order</h2>
                <p style={{fontSize:11,color:C.inkDim,margin:0,fontFamily:"'DM Mono',monospace"}}>Token: <span style={{color:C.gold,fontWeight:700}}>{parcelToken||"..."}</span>{customerInfo&&<span style={{color:C.inkDim}> · {customerInfo.name}</span>}</p>
              </div>
              {cartCount>0&&(
                <button onClick={()=>setScreen("cart")} style={{background:GG,border:"none",borderRadius:12,padding:"8px 16px",color:C.void,fontWeight:800,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                  🛒 {cartCount} · ₹{total}
                </button>
              )}
            </div>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="🔍 Search menu..." style={{width:"100%",padding:"10px 14px",borderRadius:12,border:`1px solid ${C.glBd}`,background:C.gl1,color:C.ink,fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10,fontFamily:"'DM Sans',sans-serif"}}/>
            {!searchQuery&&(
              <div style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
                {menu.map(cat=>(
                  <button key={cat._id} onClick={()=>setActiveCategory(cat._id)} style={{flexShrink:0,padding:"5px 12px",borderRadius:99,fontSize:11,fontWeight:700,border:`1.5px solid ${activeCategory===cat._id?C.g25:C.glBd}`,background:activeCategory===cat._id?C.g08:"transparent",color:activeCategory===cat._id?C.goldL:C.inkDim,cursor:"pointer",whiteSpace:"nowrap"}}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Menu items */}
          <div style={{flex:1,overflowY:"auto",padding:"14px 14px 100px",scrollbarWidth:"none"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {displayItems.map((item,i)=>{
                const qty=cart.find(c=>c.menuItemId===item._id)?.quantity||0;
                return(
                  <div key={item._id} style={{background:C.surface,borderRadius:16,overflow:"hidden",border:`1.5px solid ${qty>0?C.g25:C.glBd}`,position:"relative",animation:`pSlideUp 0.3s ${i*0.03}s ease both`}}>
                    <div style={{height:110,background:C.raise,position:"relative"}}>
                      {item.imageUrl?<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>🍽️</div>}
                      <div style={{position:"absolute",top:6,left:6,width:14,height:14,borderRadius:2,border:`1.5px solid ${item.isVeg?"#22C55E":"#F87171"}`,background:C.void,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:item.isVeg?"#22C55E":"#F87171"}}/>
                      </div>
                      {qty>0&&<div style={{position:"absolute",top:6,right:6,width:20,height:20,borderRadius:"50%",background:GG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:C.void}}>{qty}</div>}
                    </div>
                    <div style={{padding:"10px 10px 12px"}}>
                      <p style={{fontSize:13,fontWeight:600,color:C.ink,margin:"0 0 4px",lineHeight:1.3}}>{item.name}</p>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:14,fontWeight:800,color:C.goldL}}>₹{item.price}</span>
                        {qty===0?<button onClick={()=>addToCart(item)} style={{background:GG,border:"none",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,color:C.void,cursor:"pointer"}}>+ ADD</button>
                          :<div style={{display:"flex",alignItems:"center",background:C.g08,borderRadius:8,overflow:"hidden"}}>
                            <button onClick={()=>removeFromCart(item._id)} style={{width:28,height:28,background:"none",border:"none",color:C.goldL,cursor:"pointer",fontSize:16,fontWeight:900}}>−</button>
                            <span style={{fontSize:12,fontWeight:900,minWidth:16,textAlign:"center",color:C.goldL}}>{qty}</span>
                            <button onClick={()=>addToCart(item)} style={{width:28,height:28,background:"none",border:"none",color:C.goldL,cursor:"pointer",fontSize:16,fontWeight:900}}>+</button>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {cartCount>0&&screen==="menu"&&(
            <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"12px 16px",background:C.surface,borderTop:`1px solid ${C.glBd}`,zIndex:20}}>
              <button onClick={()=>setScreen("cart")} style={{width:"100%",padding:"15px",borderRadius:14,border:"none",background:GG,color:C.void,fontWeight:800,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:`0 8px 24px ${C.g40}`}}>
                <span>🛒 View Cart ({cartCount} items)</span><span>₹{total} →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── CART ── */}
      {screen==="cart"&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100dvh"}}>
          <div style={{background:C.surface,borderBottom:`1px solid ${C.glBd}`,padding:"16px 18px",display:"flex",alignItems:"center",gap:14}}>
            <button onClick={()=>setScreen("menu")} style={{background:"none",border:"none",color:C.inkSub,fontSize:20,cursor:"pointer",padding:0}}>←</button>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.goldL,margin:0}}>Your Parcel Order</h2>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 16px 140px",scrollbarWidth:"none"}}>
            {/* Token */}
            <div style={{background:C.g08,border:`1px solid ${C.g15}`,borderRadius:14,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:28}}>📦</span>
              <div>
                <p style={{fontSize:12,color:C.inkDim,margin:"0 0 2px",fontFamily:"'DM Mono',monospace"}}>YOUR PARCEL TOKEN</p>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:900,color:C.goldL,margin:0,letterSpacing:2}}>{parcelToken}</p>
              </div>
            </div>
            {/* Items */}
            <p style={{fontSize:9,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".18em",textTransform:"uppercase",margin:"0 0 10px"}}>ORDER ITEMS</p>
            {cart.map(item=>(
              <div key={item.menuItemId} style={{background:C.surface,borderRadius:12,padding:"12px 14px",marginBottom:8,border:`1px solid ${C.glBd}`,display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <p style={{fontSize:13,fontWeight:600,color:C.ink,margin:"0 0 3px"}}>{item.name}</p>
                  <p style={{fontSize:11,color:C.inkDim,margin:0}}>₹{item.price} × {item.quantity}</p>
                </div>
                <div style={{display:"flex",alignItems:"center",background:C.g08,borderRadius:8,overflow:"hidden"}}>
                  <button onClick={()=>removeFromCart(item.menuItemId)} style={{width:28,height:28,background:"none",border:"none",color:C.goldL,cursor:"pointer",fontSize:16,fontWeight:900}}>−</button>
                  <span style={{fontSize:12,fontWeight:900,minWidth:16,textAlign:"center",color:C.goldL}}>{item.quantity}</span>
                  <button onClick={()=>addToCart({_id:item.menuItemId,name:item.name,price:item.price,imageUrl:item.imageUrl||"",isAvailable:true} as MenuItem)} style={{width:28,height:28,background:"none",border:"none",color:C.goldL,cursor:"pointer",fontSize:16,fontWeight:900}}>+</button>
                </div>
                <span style={{fontSize:14,fontWeight:700,color:C.goldL,minWidth:40,textAlign:"right"}}>₹{item.price*item.quantity}</span>
              </div>
            ))}
            {/* Bill */}
            <div style={{background:C.surface,borderRadius:14,padding:"14px 16px",marginTop:12,border:`1px solid ${C.glBd}`}}>
              {[{l:"Subtotal",v:`₹${subtotal}`},{l:"GST (5%)",v:`₹${tax}`},{l:"📦 Packaging",v:`₹${packaging}`}].map(({l,v})=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:12,color:C.inkSub}}>{l}</span>
                  <span style={{fontSize:12,color:C.ink,fontWeight:600}}>{v}</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:`1px dashed ${C.glBd}`,marginTop:4}}>
                <span style={{fontSize:16,fontWeight:800,color:C.ink,fontFamily:"'Cormorant Garamond',serif"}}>Total</span>
                <span style={{fontSize:20,fontWeight:900,color:C.goldL}}>₹{total}</span>
              </div>
            </div>
            {/* Payment hint */}
            {pmSetting==="online"&&<div style={{background:C.blueL,border:"1px solid rgba(59,130,246,0.25)",borderRadius:12,padding:"10px 14px",marginTop:12,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>💳</span><p style={{fontSize:12,color:C.blue,fontWeight:700,margin:0}}>Online payment required</p></div>}
            {pmSetting==="counter"&&<div style={{background:C.g08,border:`1px solid ${C.g15}`,borderRadius:12,padding:"10px 14px",marginTop:12,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>💵</span><p style={{fontSize:12,color:C.gold,fontWeight:700,margin:0}}>Pay at counter when collecting</p></div>}
            {error&&<p style={{fontSize:12,color:"#f87171",textAlign:"center",margin:"12px 0 0",fontWeight:700}}>⚠ {error}</p>}
          </div>
          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"12px 16px",background:C.surface,borderTop:`1px solid ${C.glBd}`,zIndex:20}}>
            <button onClick={handlePlaceOrder} disabled={placing||cart.length===0}
              style={{width:"100%",padding:"15px",borderRadius:14,border:"none",background:cart.length>0?GG:"rgba(255,255,255,0.05)",color:cart.length>0?C.void:C.inkDim,fontWeight:800,fontSize:15,cursor:cart.length>0?"pointer":"not-allowed",boxShadow:cart.length>0?`0 8px 24px ${C.g40}`:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"'DM Sans',sans-serif"}}>
              {placing?"Placing order...":`${pmSetting==="online"?"💳 Pay & Place Order":"✅ Place Parcel Order"} — ₹${total}`}
            </button>
          </div>
        </div>
      )}

      {/* ── TRACKING ── */}
      {screen==="tracking"&&parcelData&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100dvh",padding:"24px 18px"}}>
          {/* Token hero */}
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:48,marginBottom:12,animation:"pFloat 3s ease-in-out infinite"}}>📦</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,color:C.goldL,margin:"0 0 6px"}}>Your Parcel</h2>
            <div style={{background:C.g08,border:`1px solid ${C.g25}`,borderRadius:14,padding:"12px 24px",display:"inline-block",marginBottom:8}}>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:26,fontWeight:900,color:C.goldL,margin:0,letterSpacing:3}}>{parcelData.token}</p>
            </div>
            <p style={{fontSize:12,color:C.inkDim,margin:0,fontFamily:"'DM Mono',monospace"}}>Show this token when collecting</p>
          </div>

          {/* Status steps */}
          <div style={{marginBottom:24}}>
            {STATUS_STEPS.map((step,i)=>{
              const isDone=i<=statusIdx; const isCurrent=i===statusIdx;
              return(
                <div key={step.key} style={{display:"flex",gap:14,position:"relative"}}>
                  {i<STATUS_STEPS.length-1&&<div style={{position:"absolute",left:19,top:40,width:2,height:32,background:isDone&&i<statusIdx?"#4ADE80":"rgba(255,255,255,0.06)"}}/>}
                  <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,background:isCurrent?GG:isDone?C.greenL:C.gl1,border:`2px solid ${isCurrent?C.gold:isDone?C.greenBd:"rgba(255,255,255,0.06)"}`,boxShadow:isCurrent?`0 0 16px ${C.g40}`:"none",marginBottom:32,animation:isCurrent?"pGlow 2s ease-in-out infinite":"none"}}>
                    {isDone&&!isCurrent?"✓":step.icon}
                  </div>
                  <div style={{paddingTop:8}}>
                    <p style={{fontSize:14,fontWeight:isCurrent?700:600,color:isCurrent?C.goldL:isDone?"#4ADE80":C.inkDim,margin:"0 0 2px"}}>{step.label}</p>
                    {isCurrent&&<p style={{fontSize:12,color:C.inkSub,margin:0,animation:"pPulse 2s ease-in-out infinite"}}>{step.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order summary */}
          <div style={{background:C.surface,borderRadius:14,padding:"14px 16px",border:`1px solid ${C.glBd}`,marginBottom:16}}>
            <p style={{fontSize:9,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".18em",textTransform:"uppercase",margin:"0 0 10px"}}>ORDER SUMMARY</p>
            {parcelData.items.map((item:any,i:number)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,color:C.inkSub}}>{item.name} × {item.quantity}</span>
                <span style={{fontSize:12,color:C.ink,fontWeight:600}}>₹{item.price*item.quantity}</span>
              </div>
            ))}
            <div style={{borderTop:`1px dashed ${C.glBd}`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:13,fontWeight:700,color:C.ink}}>Total</span>
              <span style={{fontSize:15,fontWeight:900,color:C.goldL}}>₹{parcelData.totalAmount}</span>
            </div>
          </div>

          {/* Online paid */}
          {parcelData.paidOnline&&(
            <div style={{background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <span style={{fontSize:20}}>💳</span>
              <div>
                <p style={{fontSize:12,fontWeight:700,color:C.blue,margin:0}}>Paid Online ✓</p>
                <p style={{fontSize:10,color:"rgba(96,165,250,0.7)",margin:0}}>No cash required at pickup</p>
              </div>
            </div>
          )}

          {/* Ready callout */}
          {parcelData.status==="ready"&&(
            <div style={{background:"rgba(74,222,128,0.12)",border:`2px solid ${C.greenBd}`,borderRadius:16,padding:"16px",textAlign:"center",animation:`pPop 0.5s ${SPR}`}}>
              <div style={{fontSize:40,marginBottom:8,animation:"pFloat 2s ease-in-out infinite"}}>🔔</div>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:"#4ADE80",margin:"0 0 6px"}}>Your order is ready!</h3>
              <p style={{fontSize:13,color:C.inkSub,margin:0}}>Please come to the counter and show your token</p>
              <div style={{background:C.g08,borderRadius:10,padding:"8px 16px",display:"inline-block",marginTop:10}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:900,color:C.goldL,margin:0,letterSpacing:2}}>{parcelData.token}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
