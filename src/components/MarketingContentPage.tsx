"use client";

import { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════
const A = {
  bg0:"#0A0804",bg1:"#0F0D09",bg2:"#16130E",bg3:"#1E1A13",bg4:"#26221A",
  gold:"#C8922A",goldM:"#E8B84B",goldL:"#F5CC6A",
  ink:"#F0E8D8",inkS:"#A89878",inkD:"#5C5040",inkG:"#2E2820",
  gl1:"rgba(255,255,255,0.025)",gl2:"rgba(255,255,255,0.05)",
  gl3:"rgba(255,255,255,0.08)",glBd:"rgba(255,255,255,0.07)",
  g08:"rgba(200,146,42,0.08)",g15:"rgba(200,146,42,0.15)",
  g25:"rgba(200,146,42,0.25)",g40:"rgba(200,146,42,0.40)",
  green:"#2E7D52",greenL:"rgba(46,125,82,0.15)",
  red:"#C0392B",redL:"rgba(192,57,43,0.12)",
};
const GG=`linear-gradient(135deg,${A.gold} 0%,${A.goldM} 52%,${A.goldL} 100%)`;
const EA="cubic-bezier(0.25,0.46,0.45,0.94)";

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════
interface Banner {
  id:number; title:string; subtitle:string; btn:string;
  status:"active"|"inactive"; views:string; clicks:string;
  schedule:string; bg:string; tag:string; emoji:string; opacity:number;
  action:string; startDate:string; endDate:string;
}
interface OfferCard {
  id:number; title:string; discount:string; status:"active"|"inactive"; views:string; clicks:string; color:string;
}
interface Popup {
  id:number; title:string; type:string; status:"active"|"inactive"; trigger:string; views:string; clicks:string; delay:number;
}
interface Theme {
  id:number; name:string; icon:string; colors:string[]; active:boolean;
}

// ═══════════════════════════════════════════════════
// INITIAL DATA
// ═══════════════════════════════════════════════════
const INIT_BANNERS:Banner[] = [
  {id:1,title:"Perfect Coffee Perfect Moments",subtitle:"20% OFF on All Coffees",btn:"Order Now",status:"active",views:"1.2K",clicks:"230",schedule:"15 May - 31 May, 2025",bg:"linear-gradient(135deg,#3D1A06,#1A0A02)",tag:"20% OFF",emoji:"☕",opacity:60,action:"Go to Menu",startDate:"2025-05-15",endDate:"2025-05-31"},
  {id:2,title:"Summer Coolers",subtitle:"Beat the heat with us",btn:"View Menu",status:"active",views:"980",clicks:"180",schedule:"10 May - 20 May, 2025",bg:"linear-gradient(135deg,#0A2A3D,#021018)",tag:"BUY 1 GET 1",emoji:"🥤",opacity:55,action:"Go to Category",startDate:"2025-05-10",endDate:"2025-05-20"},
  {id:3,title:"Happy Hours",subtitle:"Flat 15% OFF on ₹180+",btn:"Order Now",status:"active",views:"2.5K",clicks:"512",schedule:"Everyday | 4 PM - 7 PM",bg:"linear-gradient(135deg,#2A1A06,#120A02)",tag:"FLAT 15% OFF",emoji:"⏰",opacity:65,action:"Show Popup",startDate:"2025-05-01",endDate:"2025-12-31"},
  {id:4,title:"New Dessert Menu",subtitle:"Freshly crafted desserts",btn:"Explore",status:"inactive",views:"756",clicks:"98",schedule:"01 May - 10 May, 2025",bg:"linear-gradient(135deg,#1A0A1A,#0A0208)",tag:"NEW",emoji:"🍰",opacity:50,action:"Go to Category",startDate:"2025-05-01",endDate:"2025-05-10"},
  {id:5,title:"Special Weekend Offer",subtitle:"Every Saturday & Sunday",btn:"Order Now",status:"inactive",views:"1.1K",clicks:"210",schedule:"Every Sat & Sun",bg:"linear-gradient(135deg,#0A1A0A,#020802)",tag:"25% OFF",emoji:"🎉",opacity:60,action:"Go to Menu",startDate:"2025-05-01",endDate:"2025-12-31"},
];
const INIT_OFFERS:OfferCard[] = [
  {id:1,title:"Happy Hours Deal",discount:"15%",status:"active",views:"3.2K",clicks:"680",color:"rgba(200,146,42,0.2)"},
  {id:2,title:"Weekend Special",discount:"25%",status:"active",views:"2.1K",clicks:"420",color:"rgba(46,125,82,0.2)"},
  {id:3,title:"Loyalty Bonus",discount:"₹50",status:"inactive",views:"890",clicks:"145",color:"rgba(37,99,235,0.2)"},
  {id:4,title:"First Order",discount:"₹20",status:"active",views:"1.5K",clicks:"340",color:"rgba(192,57,43,0.2)"},
];
const INIT_POPUPS:Popup[] = [
  {id:1,title:"Join Golden Beans Family",type:"CRM Capture",status:"active",trigger:"15s delay",views:"4.8K",clicks:"1.2K",delay:15},
  {id:2,title:"Welcome Back!",type:"Welcome Popup",status:"active",trigger:"On load",views:"3.1K",clicks:"890",delay:0},
  {id:3,title:"Flash Sale - 2 Hours",type:"Announcement",status:"inactive",trigger:"Manual",views:"1.5K",clicks:"340",delay:5},
];
const INIT_THEMES:Theme[] = [
  {id:1,name:"Diwali Special",icon:"🪔",colors:["#FF8C00","#FFD700","#8B0000"],active:false},
  {id:2,name:"Christmas Magic",icon:"🎄",colors:["#1B5E20","#C62828","#F57F17"],active:false},
  {id:3,name:"Valentine's Day",icon:"❤️",colors:["#E91E63","#9C27B0","#F48FB1"],active:false},
  {id:4,name:"Monsoon Vibes",icon:"🌧️",colors:["#1565C0","#00838F","#4CAF50"],active:false},
  {id:5,name:"IPL Season",icon:"🏏",colors:["#1A237E","#F57F17","#FF6F00"],active:false},
  {id:6,name:"Default Theme",icon:"☕",colors:["#C8922A","#1A1712","#F5CC6A"],active:true},
];
const MEDIA=[
  {name:"banner-coffee.jpg",type:"JPG",size:"2.4MB",dim:"1920×1080",emoji:"☕"},
  {name:"summer-promo.jpg",type:"JPG",size:"1.8MB",dim:"1920×1080",emoji:"🥤"},
  {name:"happy-hours.gif",type:"GIF",size:"3.2MB",dim:"800×600",emoji:"⏰"},
  {name:"dessert-new.jpg",type:"JPG",size:"1.6MB",dim:"1920×1080",emoji:"🍰"},
  {name:"logo-anim.json",type:"JSON",size:"48KB",dim:"400×400",emoji:"✨"},
  {name:"promo-video.mp4",type:"MP4",size:"18MB",dim:"1920×1080",emoji:"🎬"},
];

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
.mc-hover:hover{background:rgba(255,255,255,0.04)!important;}
.mc-input{transition:all 0.2s ease;}
.mc-input:focus{border-color:rgba(200,146,42,0.65)!important;box-shadow:0 0 0 3px rgba(200,146,42,0.1)!important;outline:none;}
.mc-btn{transition:all 0.18s ease;cursor:pointer;}
.mc-btn:hover{filter:brightness(1.08);transform:translateY(-1px);}
.mc-btn:active{transform:scale(0.97)!important;}
.hs{scrollbar-width:none;-ms-overflow-style:none;}
.hs::-webkit-scrollbar{display:none;}
@keyframes mc-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
`;

// ═══════════════════════════════════════════════════
// REUSABLE INPUT FIELD
// ═══════════════════════════════════════════════════
function Field({label,value,onChange,type="text",placeholder=""}:{label:string;value:string;onChange:(v:string)=>void;type?:string;placeholder?:string}) {
  return(
    <div style={{marginBottom:14}}>
      <label style={{fontSize:10,fontWeight:700,color:A.inkD,letterSpacing:".1em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>{label}</label>
      <input className="mc-input" type={type} value={value} placeholder={placeholder}
        onChange={e=>onChange(e.target.value)}
        style={{width:"100%",padding:"10px 13px",borderRadius:10,border:`1px solid ${A.glBd}`,background:A.gl1,color:A.ink,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// BANNER ROW
// ═══════════════════════════════════════════════════
function BannerRow({b,selected,onSelect,onToggle,onDuplicate,onDelete,idx}:{
  b:Banner;selected:boolean;onSelect:()=>void;
  onToggle:()=>void;onDuplicate:()=>void;onDelete:()=>void;idx:number;
}) {
  const [menu,setMenu]=useState(false);
  // Close menu when clicking outside
  useEffect(()=>{
    if(!menu)return;
    const fn=()=>setMenu(false);
    document.addEventListener("click",fn);
    return()=>document.removeEventListener("click",fn);
  },[menu]);

  return(
    <div onClick={onSelect}
      style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",
        borderRadius:12,cursor:"pointer",marginBottom:5,
        background:selected?A.g08:"transparent",
        border:`1px solid ${selected?"rgba(200,146,42,0.3)":"transparent"}`,
        transition:`all 0.2s ${EA}`,animation:`mc-in 0.3s ${idx*.05}s ease both`}}
      className="mc-hover">
      {/* Drag */}
      <span style={{color:A.inkG,fontSize:13,flexShrink:0,cursor:"grab"}}>⠿</span>
      {/* Thumb */}
      <div style={{width:76,height:52,borderRadius:9,overflow:"hidden",flexShrink:0,
        background:b.bg,position:"relative",border:`1px solid rgba(200,146,42,0.18)`,
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:16,opacity:.5}}>{b.emoji}</span>
        <div style={{position:"absolute",bottom:3,left:4,background:"rgba(200,146,42,0.92)",
          borderRadius:3,padding:"1px 5px",fontSize:7.5,fontWeight:800,color:"#0A0804",
          fontFamily:"'DM Sans',sans-serif"}}>{b.tag}</div>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.5),transparent)"}}/>
      </div>
      {/* Info */}
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:A.ink,
          margin:"0 0 3px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.title}</p>
        <span style={{fontSize:9.5,fontWeight:700,padding:"1.5px 7px",borderRadius:99,
          background:b.status==="active"?A.greenL:A.redL,
          color:b.status==="active"?"#4ADE80":"#F87171",
          fontFamily:"'DM Mono',monospace"}}>{b.status==="active"?"Active":"Inactive"}</span>
        <p style={{fontSize:10,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:"3px 0 0"}}>{b.schedule}</p>
      </div>
      {/* Stats */}
      <div style={{display:"flex",gap:14,flexShrink:0}}>
        <div style={{textAlign:"center"}}>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:A.ink,margin:0,lineHeight:1}}>{b.views}</p>
          <p style={{fontSize:9,color:A.inkD,margin:"2px 0 0",fontFamily:"'DM Sans',sans-serif"}}>Views</p>
        </div>
        <div style={{textAlign:"center"}}>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:A.ink,margin:0,lineHeight:1}}>{b.clicks}</p>
          <p style={{fontSize:9,color:A.inkD,margin:"2px 0 0",fontFamily:"'DM Sans',sans-serif"}}>Clicks</p>
        </div>
      </div>
      {/* 3-dot menu */}
      <div style={{position:"relative",flexShrink:0}} onClick={e=>e.stopPropagation()}>
        <button onClick={()=>setMenu(m=>!m)}
          style={{width:28,height:28,borderRadius:7,background:"none",border:`1px solid ${A.glBd}`,
            color:A.inkS,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⋮</button>
        {menu&&(
          <div style={{position:"absolute",right:0,top:33,zIndex:50,
            background:A.bg3,border:`1px solid ${A.glBd}`,borderRadius:11,
            overflow:"hidden",minWidth:155,boxShadow:`0 8px 24px rgba(0,0,0,0.7)`}}>
            {[
              {icon:"✏️",label:"Edit",         action:()=>{onSelect();setMenu(false);}},
              {icon:"📋",label:"Duplicate",    action:()=>{onDuplicate();setMenu(false);}},
              {icon:b.status==="active"?"⏸️":"▶️",
               label:b.status==="active"?"Deactivate":"Activate",
               action:()=>{onToggle();setMenu(false);}},
              {icon:"🗑️",label:"Delete",       action:()=>{onDelete();setMenu(false);},red:true},
            ].map((item,i)=>(
              <button key={i} onClick={item.action}
                style={{width:"100%",padding:"9px 13px",background:"none",border:"none",
                  cursor:"pointer",display:"flex",alignItems:"center",gap:8,
                  fontSize:12.5,color:(item as any).red?"#F87171":A.inkS,
                  fontFamily:"'DM Sans',sans-serif",textAlign:"left"}}
                className="mc-hover">
                <span style={{fontSize:13}}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MOBILE PREVIEW — live updates
// ═══════════════════════════════════════════════════
function MobilePreview({banner}:{banner:Banner|null}) {
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"12px 16px 10px",borderBottom:`1px solid ${A.gl2}`,flexShrink:0,
        display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <h3 style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,color:A.ink,margin:0}}>Live Preview</h3>
        <div style={{display:"flex",gap:6}}>
          {["📱","💻"].map((ic,i)=>(
            <button key={i} style={{width:28,height:28,borderRadius:6,
              background:i===0?A.g15:A.gl1,border:`1px solid ${i===0?"rgba(200,146,42,0.4)":A.glBd}`,
              color:i===0?A.goldM:A.inkS,cursor:"pointer",fontSize:13,
              display:"flex",alignItems:"center",justifyContent:"center"}}>{ic}</button>
          ))}
        </div>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"14px 8px"}}>
        <div style={{width:210,background:"#0A0804",borderRadius:22,overflow:"hidden",
          border:`2px solid rgba(200,146,42,0.28)`,
          boxShadow:`0 20px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(200,146,42,0.06)`,flexShrink:0}}>
          {/* Status bar */}
          <div style={{background:"#050402",padding:"7px 13px 4px",display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:8.5,color:A.inkS,fontFamily:"'DM Mono',monospace"}}>9:41</span>
            <div style={{display:"flex",gap:3,alignItems:"center",fontSize:9}}>📶🔋</div>
          </div>
          {/* App header */}
          <div style={{background:A.bg1,padding:"7px 9px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:20,height:20,borderRadius:6,background:GG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9}}>☕</div>
              <div>
                <p style={{fontSize:6.5,color:A.ink,fontFamily:"'DM Sans',sans-serif",fontWeight:700,margin:0,lineHeight:1}}>Good Morning, Nirav 👋</p>
                <p style={{fontSize:5.5,color:A.inkD,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Brewed with passion...</p>
              </div>
            </div>
            <div style={{display:"flex",gap:4,fontSize:10}}>🔍🔔</div>
          </div>
          {/* HERO BANNER — live update */}
          <div style={{height:95,background:banner?.bg||"linear-gradient(135deg,#3D1A06,#1A0A02)",
            position:"relative",overflow:"hidden",transition:`background 0.4s ${EA}`}}>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.7),transparent)"}}/>
            <div style={{position:"absolute",bottom:7,left:9,right:9}}>
              <p style={{fontSize:10.5,fontWeight:700,color:"#F5EDD8",fontFamily:"'Cormorant Garamond',serif",
                margin:"0 0 1px",lineHeight:1.15,transition:"all 0.3s ease"}}>
                {banner?.title||"Perfect Coffee Perfect Moments"}
              </p>
              <p style={{fontSize:6.5,color:"rgba(245,237,216,0.72)",fontFamily:"'DM Sans',sans-serif",
                margin:"0 0 5px",transition:"all 0.3s ease"}}>
                {banner?.subtitle||"20% OFF on All Coffees"}
              </p>
              <div style={{background:"rgba(200,146,42,0.92)",borderRadius:4,
                padding:"2.5px 7px",width:"fit-content",transition:"all 0.3s ease"}}>
                <span style={{fontSize:6.5,color:"#0A0804",fontWeight:800,fontFamily:"'DM Sans',sans-serif"}}>
                  {banner?.btn||"Order Now"} →
                </span>
              </div>
            </div>
            <div style={{position:"absolute",bottom:5,right:7,display:"flex",gap:3}}>
              {[0,1,2].map(i=><div key={i} style={{width:i===0?9:4,height:3.5,borderRadius:2,
                background:i===0?"rgba(200,146,42,0.9)":"rgba(255,255,255,0.3)"}}/>)}
            </div>
          </div>
          {/* Categories */}
          <div style={{padding:"7px 9px 4px",background:A.bg1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:7.5,fontWeight:700,color:A.ink,fontFamily:"'DM Sans',sans-serif"}}>Categories</span>
              <span style={{fontSize:6.5,color:A.gold,fontFamily:"'DM Mono',monospace"}}>View All</span>
            </div>
            <div style={{display:"flex",gap:4}}>
              {[{i:"☕",l:"Hot"},{i:"🥤",l:"Cold"},{i:"🍕",l:"Snacks"},{i:"🍰",l:"Desserts"}].map((c,i)=>(
                <div key={i} style={{flex:1,textAlign:"center"}}>
                  <div style={{width:26,height:26,borderRadius:8,background:A.bg3,margin:"0 auto 2px",
                    border:`1px solid ${A.glBd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>{c.i}</div>
                  <p style={{fontSize:5.5,color:A.inkS,fontFamily:"'DM Sans',sans-serif",margin:0}}>{c.l}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Recommended */}
          <div style={{padding:"6px 9px",background:A.bg1,borderTop:`1px solid rgba(255,255,255,0.04)`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:7.5,fontWeight:700,color:A.ink,fontFamily:"'DM Sans',sans-serif"}}>Recommended</span>
              <span style={{fontSize:6.5,color:A.gold,fontFamily:"'DM Mono',monospace"}}>View All</span>
            </div>
            <div style={{display:"flex",gap:5}}>
              {[{n:"Cappuccino",p:"₹180"},{n:"Brownie",p:"₹160"}].map((item,i)=>(
                <div key={i} style={{flex:1,background:A.bg3,borderRadius:8,padding:"5px",border:`1px solid ${A.glBd}`}}>
                  <div style={{height:32,borderRadius:5,background:"linear-gradient(135deg,#3D1A06,#1A0A02)",marginBottom:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>☕</div>
                  <p style={{fontSize:7,fontWeight:600,color:A.ink,margin:"0 0 1px",fontFamily:"'DM Sans',sans-serif"}}>{item.n}</p>
                  <span style={{fontSize:6.5,color:A.gold,fontFamily:"'DM Mono',monospace"}}>{item.p}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Bottom nav */}
          <div style={{background:"rgba(6,5,3,0.97)",borderTop:`1px solid rgba(255,255,255,0.05)`,
            padding:"5px 0 7px",display:"flex",justifyContent:"space-around"}}>
            {[{i:"🏠",l:"Home",a:true},{i:"📋",l:"Menu"},{i:"📦",l:"Orders"},{i:"🎁",l:"Rewards"},{i:"👤",l:"Profile"}].map((t,i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                <span style={{fontSize:12,filter:t.a?`drop-shadow(0 0 4px ${A.gold})`:undefined}}>{t.i}</span>
                <span style={{fontSize:5.5,color:t.a?A.gold:A.inkD,fontFamily:"'DM Sans',sans-serif"}}>{t.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// BANNER EDITOR — fully functional
// ═══════════════════════════════════════════════════
function BannerEditor({banner,onChange,onSave,onDelete}:{
  banner:Banner|null;
  onChange:(b:Banner)=>void;
  onSave:()=>void;
  onDelete:()=>void;
}) {
  const [tab,setTab]=useState<"content"|"style">("content");

  // Reset tab when banner changes
  useEffect(()=>{ setTab("content"); },[banner?.id]);

  if(!banner) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:24,textAlign:"center"}}>
      <div style={{fontSize:42,marginBottom:12,opacity:.35}}>🖼️</div>
      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:A.inkS,margin:"0 0 5px"}}>
        Select a banner to edit
      </p>
      <p style={{fontSize:11.5,color:A.inkD,fontFamily:"'DM Sans',sans-serif"}}>
        Click any banner from the list
      </p>
    </div>
  );

  const upd = (key:keyof Banner,val:any) => onChange({...banner,[key]:val});

  const BG_PRESETS=[
    {bg:"linear-gradient(135deg,#3D1A06,#1A0A02)",l:"Coffee Dark"},
    {bg:"linear-gradient(135deg,#0A2A3D,#021018)",l:"Ocean Blue"},
    {bg:"linear-gradient(135deg,#1A0A1A,#0A0208)",l:"Royal Purple"},
    {bg:"linear-gradient(135deg,#0A1A0A,#020802)",l:"Forest Green"},
    {bg:"linear-gradient(135deg,#2A1A06,#120A02)",l:"Amber Warm"},
    {bg:"linear-gradient(135deg,#1A0A00,#0D0600)",l:"Espresso"},
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {/* Tabs */}
      <div style={{display:"flex",gap:4,padding:"12px 14px 10px",borderBottom:`1px solid ${A.gl2}`,flexShrink:0}}>
        {(["content","style"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className="mc-btn"
            style={{flex:1,padding:"7px 0",borderRadius:8,border:`1px solid ${tab===t?"rgba(200,146,42,0.3)":A.glBd}`,
              background:tab===t?A.g15:"transparent",
              color:tab===t?A.goldL:A.inkS,fontWeight:tab===t?700:500,
              fontSize:12.5,fontFamily:"'DM Sans',sans-serif"}}>
            {t==="content"?"Content":"Style"}
          </button>
        ))}
      </div>

      {/* Form body */}
      <div className="hs" style={{flex:1,overflowY:"auto",padding:"14px 14px 0"}}>
        {tab==="content" ? (
          <>
            <Field label="Banner Title"   value={banner.title}    onChange={v=>upd("title",v)}    placeholder="e.g. Summer Coolers"/>
            <Field label="Subtitle"       value={banner.subtitle} onChange={v=>upd("subtitle",v)} placeholder="e.g. 20% OFF on all items"/>
            <Field label="Button Text"    value={banner.btn}      onChange={v=>upd("btn",v)}      placeholder="e.g. Order Now"/>

            {/* Button Action */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,fontWeight:700,color:A.inkD,letterSpacing:".1em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>Button Action</label>
              <select value={banner.action} onChange={e=>upd("action",e.target.value)}
                style={{width:"100%",padding:"10px 13px",borderRadius:10,border:`1px solid ${A.glBd}`,background:A.bg3,color:A.ink,fontSize:13,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
                {["Go to Menu","Go to Category","External URL","Show Popup","Open Offer"].map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Overlay Opacity slider */}
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                <label style={{fontSize:10,fontWeight:700,color:A.inkD,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Overlay Opacity</label>
                <span style={{fontSize:12,color:A.goldM,fontFamily:"'DM Mono',monospace"}}>{banner.opacity}%</span>
              </div>
              <div style={{position:"relative",height:4,borderRadius:2,background:A.bg4}}>
                <div style={{position:"absolute",left:0,top:0,height:"100%",borderRadius:2,background:GG,width:`${banner.opacity}%`,pointerEvents:"none"}}/>
                <div style={{position:"absolute",top:"50%",transform:"translate(-50%,-50%)",width:14,height:14,borderRadius:"50%",background:GG,boxShadow:`0 0 8px rgba(200,146,42,0.5)`,left:`${banner.opacity}%`,pointerEvents:"none"}}/>
                <input type="range" min={0} max={100} value={banner.opacity}
                  onChange={e=>upd("opacity",Number(e.target.value))}
                  style={{position:"absolute",inset:"-8px 0",opacity:0,cursor:"pointer",width:"100%"}}/>
              </div>
            </div>

            {/* Status */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,fontWeight:700,color:A.inkD,letterSpacing:".1em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>Status</label>
              <div style={{display:"flex",gap:8}}>
                {(["active","inactive"] as const).map(s=>(
                  <button key={s} onClick={()=>upd("status",s)} className="mc-btn"
                    style={{flex:1,padding:"9px 0",borderRadius:9,
                      border:`1px solid ${banner.status===s?(s==="active"?"rgba(46,125,82,0.5)":"rgba(192,57,43,0.5)"):A.glBd}`,
                      background:banner.status===s?(s==="active"?A.greenL:A.redL):"transparent",
                      color:banner.status===s?(s==="active"?"#4ADE80":"#F87171"):A.inkS,
                      fontWeight:banner.status===s?700:500,fontSize:12.5,fontFamily:"'DM Sans',sans-serif"}}>
                    {s==="active"?"✓ Active":"✗ Inactive"}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,fontWeight:700,color:A.inkD,letterSpacing:".1em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>Schedule</label>
              <div style={{display:"flex",gap:7,alignItems:"center"}}>
                <input type="date" value={banner.startDate} onChange={e=>upd("startDate",e.target.value)} className="mc-input"
                  style={{flex:1,padding:"9px 10px",borderRadius:9,border:`1px solid ${A.glBd}`,background:A.gl1,color:A.ink,fontSize:11.5,fontFamily:"'DM Mono',monospace"}}/>
                <span style={{fontSize:11,color:A.inkD,flexShrink:0}}>to</span>
                <input type="date" value={banner.endDate} onChange={e=>upd("endDate",e.target.value)} className="mc-input"
                  style={{flex:1,padding:"9px 10px",borderRadius:9,border:`1px solid ${A.glBd}`,background:A.gl1,color:A.ink,fontSize:11.5,fontFamily:"'DM Mono',monospace"}}/>
              </div>
            </div>
          </>
        ) : (
          /* Style tab */
          <>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,fontWeight:700,color:A.inkD,letterSpacing:".1em",textTransform:"uppercase",display:"block",marginBottom:8,fontFamily:"'DM Mono',monospace"}}>Background Gradient</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                {BG_PRESETS.map((p,i)=>(
                  <button key={i} onClick={()=>upd("bg",p.bg)} className="mc-btn"
                    style={{height:38,borderRadius:9,background:p.bg,
                      border:`2px solid ${banner.bg===p.bg?"rgba(200,146,42,0.7)":"transparent"}`,
                      cursor:"pointer",fontSize:10.5,color:"rgba(245,237,216,0.75)",
                      fontFamily:"'DM Sans',sans-serif",fontWeight:600,
                      boxShadow:banner.bg===p.bg?`0 0 12px rgba(200,146,42,0.3)`:"none"}}>
                    {p.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag label */}
            <Field label="Tag Label" value={banner.tag} onChange={v=>upd("tag",v)} placeholder="e.g. 20% OFF"/>

            {/* Emoji */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,fontWeight:700,color:A.inkD,letterSpacing:".1em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>Banner Icon</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {["☕","🥤","🍰","🎉","⏰","🌮","🍕","🫖","🧁","🍫"].map(em=>(
                  <button key={em} onClick={()=>upd("emoji",em)} className="mc-btn"
                    style={{width:36,height:36,borderRadius:9,border:`2px solid ${banner.emoji===em?"rgba(200,146,42,0.7)":A.glBd}`,
                      background:banner.emoji===em?A.g15:A.gl1,fontSize:18,cursor:"pointer"}}>
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{padding:"12px 14px 14px",borderTop:`1px solid ${A.gl2}`,display:"flex",gap:8,flexShrink:0}}>
        <button onClick={onDelete} className="mc-btn"
          style={{padding:"9px 13px",borderRadius:9,border:`1px solid rgba(192,57,43,0.4)`,
            background:"rgba(192,57,43,0.08)",color:"#F87171",cursor:"pointer",
            fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:600,
            display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          🗑️ Delete
        </button>
        <button onClick={onSave} className="mc-btn"
          style={{flex:1,padding:"9px 0",borderRadius:9,border:"none",
            background:GG,color:"#0A0804",cursor:"pointer",fontWeight:700,
            fontSize:13,fontFamily:"'DM Sans',sans-serif",
            boxShadow:`0 4px 16px rgba(200,146,42,0.35)`,
            display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <span>💾</span> Save Changes
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// OFFER CARDS TAB
// ═══════════════════════════════════════════════════
function OfferCardsTab() {
  const [cards,setCards]=useState<OfferCard[]>(INIT_OFFERS);
  const [sel,setSel]=useState<number|null>(null);
  const selCard=cards.find(c=>c.id===sel)||null;

  const toggle=(id:number)=>setCards(cs=>cs.map(c=>c.id===id?{...c,status:c.status==="active"?"inactive":"active"}:c));
  const del=(id:number)=>{setCards(cs=>cs.filter(c=>c.id!==id));if(sel===id)setSel(null);};

  return(
    <div style={{flex:1,display:"flex",gap:12,overflow:"hidden",padding:"14px"}}>
      {/* List */}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:A.ink,margin:"0 0 2px"}}>Offer Cards</h3>
            <p style={{fontSize:11,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:0}}>{cards.filter(c=>c.status==="active").length} active cards</p>
          </div>
          <button className="mc-btn" onClick={()=>{
            const n:OfferCard={id:Date.now(),title:"New Offer",discount:"10%",status:"inactive",views:"0",clicks:"0",color:"rgba(200,146,42,0.2)"};
            setCards(cs=>[...cs,n]);setSel(n.id);
          }} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,border:"none",background:GG,color:"#0A0804",fontWeight:700,fontSize:12,fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 12px rgba(200,146,42,0.35)`}}>
            <span>+</span> Add Card
          </button>
        </div>
        <div className="hs" style={{flex:1,overflowY:"auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,alignContent:"start"}}>
          {cards.map((c,i)=>(
            <div key={c.id} onClick={()=>setSel(c.id)}
              style={{background:sel===c.id?A.g08:A.bg2,borderRadius:13,overflow:"hidden",
                border:`1px solid ${sel===c.id?"rgba(200,146,42,0.35)":A.glBd}`,cursor:"pointer",
                transition:`all 0.2s ${EA}`,animation:`mc-in 0.3s ${i*.06}s ease both`}}
              className="mc-hover">
              <div style={{height:72,background:c.color,display:"flex",alignItems:"center",
                justifyContent:"center",position:"relative",borderBottom:`1px solid ${A.glBd}`}}>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,color:A.goldL}}>{c.discount}</span>
                <span style={{position:"absolute",top:7,right:7,fontSize:9,padding:"2px 7px",borderRadius:99,
                  background:c.status==="active"?A.greenL:A.redL,color:c.status==="active"?"#4ADE80":"#F87171",
                  fontFamily:"'DM Mono',monospace"}}>{c.status}</span>
              </div>
              <div style={{padding:"9px 11px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12.5,fontWeight:600,color:A.ink,margin:"0 0 4px"}}>{c.title}</p>
                  <div style={{display:"flex",gap:10}}>
                    <span style={{fontSize:10,color:A.inkD,fontFamily:"'DM Mono',monospace"}}>{c.views} views</span>
                    <span style={{fontSize:10,color:A.inkD,fontFamily:"'DM Mono',monospace"}}>{c.clicks} clicks</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:5}}>
                  <button onClick={e=>{e.stopPropagation();toggle(c.id);}} className="mc-btn"
                    style={{width:26,height:26,borderRadius:6,border:`1px solid ${A.glBd}`,background:A.gl1,color:A.inkS,cursor:"pointer",fontSize:12}}>
                    {c.status==="active"?"⏸":"▶"}
                  </button>
                  <button onClick={e=>{e.stopPropagation();del(c.id);}} className="mc-btn"
                    style={{width:26,height:26,borderRadius:6,border:"1px solid rgba(192,57,43,0.3)",background:"rgba(192,57,43,0.08)",color:"#F87171",cursor:"pointer",fontSize:11}}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Editor */}
      {selCard&&(
        <div style={{width:240,background:A.bg2,borderRadius:13,border:`1px solid ${A.glBd}`,padding:14,flexShrink:0,overflow:"auto"}}>
          <h4 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:A.ink,margin:"0 0 12px"}}>Edit Card</h4>
          <Field label="Title"    value={selCard.title}    onChange={v=>setCards(cs=>cs.map(c=>c.id===selCard.id?{...c,title:v}:c))}/>
          <Field label="Discount" value={selCard.discount} onChange={v=>setCards(cs=>cs.map(c=>c.id===selCard.id?{...c,discount:v}:c))} placeholder="e.g. 20% or ₹50"/>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:10,fontWeight:700,color:A.inkD,letterSpacing:".1em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>Card Color</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {[
                {c:"rgba(200,146,42,0.2)",l:"Gold"},
                {c:"rgba(46,125,82,0.2)",l:"Green"},
                {c:"rgba(37,99,235,0.2)",l:"Blue"},
                {c:"rgba(192,57,43,0.2)",l:"Red"},
              ].map(p=>(
                <button key={p.c} onClick={()=>setCards(cs=>cs.map(c=>c.id===selCard.id?{...c,color:p.c}:c))} className="mc-btn"
                  style={{height:30,borderRadius:7,background:p.c,border:`2px solid ${selCard.color===p.c?"rgba(200,146,42,0.7)":"transparent"}`,cursor:"pointer",fontSize:10.5,color:"rgba(245,237,216,0.8)",fontFamily:"'DM Sans',sans-serif"}}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
          <button onClick={()=>setSel(null)} className="mc-btn"
            style={{width:"100%",padding:"9px",borderRadius:9,border:"none",background:GG,color:"#0A0804",fontWeight:700,fontSize:12.5,fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 12px rgba(200,146,42,0.35)`}}>
            ✓ Save Card
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// POPUPS TAB
// ═══════════════════════════════════════════════════
function PopupsTab() {
  const [popups,setPopups]=useState<Popup[]>(INIT_POPUPS);
  const [sel,setSel]=useState<number|null>(null);
  const selP=popups.find(p=>p.id===sel)||null;

  const toggle=(id:number)=>setPopups(ps=>ps.map(p=>p.id===id?{...p,status:p.status==="active"?"inactive":"active"}:p));
  const del=(id:number)=>{setPopups(ps=>ps.filter(p=>p.id!==id));if(sel===id)setSel(null);};

  return(
    <div style={{flex:1,display:"flex",gap:12,overflow:"hidden",padding:"14px"}}>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:A.ink,margin:"0 0 2px"}}>Popup Campaigns</h3>
            <p style={{fontSize:11,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:0}}>{popups.filter(p=>p.status==="active").length} active popups</p>
          </div>
          <button className="mc-btn" onClick={()=>{
            const n:Popup={id:Date.now(),title:"New Popup",type:"Announcement",status:"inactive",trigger:"Manual",views:"0",clicks:"0",delay:5};
            setPopups(ps=>[...ps,n]);setSel(n.id);
          }} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,border:"none",background:GG,color:"#0A0804",fontWeight:700,fontSize:12,fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 12px rgba(200,146,42,0.35)`}}>
            <span>+</span> New Campaign
          </button>
        </div>
        <div className="hs" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
          {popups.map((p,i)=>(
            <div key={p.id} onClick={()=>setSel(p.id)}
              style={{background:sel===p.id?A.g08:A.bg2,borderRadius:12,padding:"12px 14px",
                border:`1px solid ${sel===p.id?"rgba(200,146,42,0.32)":A.glBd}`,cursor:"pointer",
                display:"flex",alignItems:"center",gap:12,
                transition:`all 0.2s ${EA}`,animation:`mc-in 0.3s ${i*.06}s ease both`}}
              className="mc-hover">
              <div style={{width:42,height:42,borderRadius:11,background:A.g08,border:`1px solid ${A.g25}`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                {p.type==="CRM Capture"?"🎁":p.type==="Welcome Popup"?"👋":"📢"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:A.ink,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</p>
                  <span style={{fontSize:9,padding:"1.5px 7px",borderRadius:99,flexShrink:0,
                    background:p.status==="active"?A.greenL:A.redL,
                    color:p.status==="active"?"#4ADE80":"#F87171",fontFamily:"'DM Mono',monospace"}}>
                    {p.status}
                  </span>
                </div>
                <div style={{display:"flex",gap:9}}>
                  <span style={{fontSize:10.5,color:A.inkD,fontFamily:"'DM Sans',sans-serif"}}>{p.type}</span>
                  <span style={{fontSize:10.5,color:A.inkD,fontFamily:"'DM Mono',monospace"}}>⏱ {p.trigger}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:12,flexShrink:0}}>
                <div style={{textAlign:"center"}}><p style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:A.ink,margin:0}}>{p.views}</p><p style={{fontSize:8.5,color:A.inkD,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Views</p></div>
                <div style={{textAlign:"center"}}><p style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:A.ink,margin:0}}>{p.clicks}</p><p style={{fontSize:8.5,color:A.inkD,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Clicks</p></div>
              </div>
              <div style={{display:"flex",gap:5,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>toggle(p.id)} className="mc-btn"
                  style={{width:28,height:28,borderRadius:7,border:`1px solid ${A.glBd}`,background:A.gl1,color:A.inkS,cursor:"pointer",fontSize:13}}>
                  {p.status==="active"?"⏸":"▶"}
                </button>
                <button onClick={()=>del(p.id)} className="mc-btn"
                  style={{width:28,height:28,borderRadius:7,border:"1px solid rgba(192,57,43,0.3)",background:"rgba(192,57,43,0.08)",color:"#F87171",cursor:"pointer",fontSize:11}}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Editor */}
      {selP&&(
        <div style={{width:240,background:A.bg2,borderRadius:13,border:`1px solid ${A.glBd}`,padding:14,flexShrink:0,overflow:"auto"}}>
          <h4 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:A.ink,margin:"0 0 12px"}}>Edit Popup</h4>
          <Field label="Title" value={selP.title} onChange={v=>setPopups(ps=>ps.map(p=>p.id===selP.id?{...p,title:v}:p))}/>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:10,fontWeight:700,color:A.inkD,letterSpacing:".1em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>Popup Type</label>
            <select value={selP.type} onChange={e=>setPopups(ps=>ps.map(p=>p.id===selP.id?{...p,type:e.target.value}:p))}
              style={{width:"100%",padding:"9px 11px",borderRadius:9,border:`1px solid ${A.glBd}`,background:A.bg3,color:A.ink,fontSize:12.5,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
              {["CRM Capture","Welcome Popup","Announcement","Reward Popup"].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:10,fontWeight:700,color:A.inkD,letterSpacing:".1em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>Trigger Delay (seconds)</label>
            <input type="number" min={0} max={60} value={selP.delay}
              onChange={e=>setPopups(ps=>ps.map(p=>p.id===selP.id?{...p,delay:Number(e.target.value),trigger:Number(e.target.value)===0?"On load":`${e.target.value}s delay`}:p))}
              className="mc-input"
              style={{width:"100%",padding:"9px 11px",borderRadius:9,border:`1px solid ${A.glBd}`,background:A.gl1,color:A.ink,fontSize:13,fontFamily:"'DM Mono',monospace"}}/>
          </div>
          <div style={{display:"flex",gap:7,marginBottom:12}}>
            {(["active","inactive"] as const).map(s=>(
              <button key={s} onClick={()=>setPopups(ps=>ps.map(p=>p.id===selP.id?{...p,status:s}:p))} className="mc-btn"
                style={{flex:1,padding:"8px 0",borderRadius:8,border:`1px solid ${selP.status===s?(s==="active"?"rgba(46,125,82,0.5)":"rgba(192,57,43,0.5)"):A.glBd}`,
                  background:selP.status===s?(s==="active"?A.greenL:A.redL):"transparent",
                  color:selP.status===s?(s==="active"?"#4ADE80":"#F87171"):A.inkS,
                  fontWeight:600,fontSize:11.5,fontFamily:"'DM Sans',sans-serif"}}>
                {s==="active"?"✓ Active":"✗ Off"}
              </button>
            ))}
          </div>
          <button onClick={()=>setSel(null)} className="mc-btn"
            style={{width:"100%",padding:"9px",borderRadius:9,border:"none",background:GG,color:"#0A0804",fontWeight:700,fontSize:12.5,fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 12px rgba(200,146,42,0.35)`}}>
            ✓ Save Popup
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// FESTIVAL THEMES TAB
// ═══════════════════════════════════════════════════
function FestivalThemesTab() {
  const [themes,setThemes]=useState<Theme[]>(INIT_THEMES);
  const activate=(id:number)=>setThemes(ts=>ts.map(t=>({...t,active:t.id===id})));
  return(
    <div style={{flex:1,overflowY:"auto",padding:"14px"}} className="hs">
      <div style={{marginBottom:14}}>
        <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:A.ink,margin:"0 0 2px"}}>Festival Themes</h3>
        <p style={{fontSize:11,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:0}}>One-click seasonal theme activation for the customer UI</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {themes.map((t,i)=>(
          <div key={t.id}
            style={{background:t.active?A.g08:A.bg2,borderRadius:14,padding:"16px 12px",
              border:`1px solid ${t.active?"rgba(200,146,42,0.42)":A.glBd}`,cursor:"pointer",
              textAlign:"center",boxShadow:t.active?`0 0 24px rgba(200,146,42,0.12)`:"none",
              transition:`all 0.25s ${EA}`,animation:`mc-in 0.35s ${i*.06}s ease both`,position:"relative"}}
            className="mc-hover" onClick={()=>activate(t.id)}>
            {t.active&&<div style={{position:"absolute",top:8,right:8,width:8,height:8,borderRadius:"50%",background:A.gold,boxShadow:`0 0 6px ${A.gold}`}}/>}
            <div style={{fontSize:32,marginBottom:8}}>{t.icon}</div>
            <p style={{fontSize:13,fontWeight:700,color:t.active?A.goldL:A.ink,fontFamily:"'DM Sans',sans-serif",margin:"0 0 8px"}}>{t.name}</p>
            <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:10}}>
              {t.colors.map((c,ci)=><div key={ci} style={{width:13,height:13,borderRadius:"50%",background:c,border:"1px solid rgba(255,255,255,0.1)"}}/>)}
            </div>
            <button className="mc-btn"
              style={{width:"100%",padding:"7px 0",borderRadius:8,
                border:`1px solid ${t.active?"rgba(200,146,42,0.5)":A.glBd}`,
                background:t.active?GG:"transparent",
                color:t.active?"#0A0804":A.inkS,
                fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              {t.active?"✓ Active — Click to deactivate":"Activate Theme"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MEDIA LIBRARY TAB
// ═══════════════════════════════════════════════════
function MediaLibraryTab() {
  const [media,setMedia]=useState(MEDIA);
  const [filter,setFilter]=useState("All");
  const TYPES=["All","JPG","PNG","GIF","MP4","JSON"];
  const filtered=filter==="All"?media:media.filter(m=>m.type===filter);
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",padding:"14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexShrink:0}}>
        <div>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:A.ink,margin:"0 0 2px"}}>Media Library</h3>
          <p style={{fontSize:11,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:0}}>{media.length} files · Upload images, GIFs, videos</p>
        </div>
        <button className="mc-btn"
          style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,border:"none",background:GG,color:"#0A0804",fontWeight:700,fontSize:12,fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 12px rgba(200,146,42,0.35)`}}>
          ☁️ Upload Media
        </button>
      </div>
      {/* Filter pills */}
      <div style={{display:"flex",gap:7,marginBottom:12,flexShrink:0}}>
        {TYPES.map(t=>(
          <button key={t} onClick={()=>setFilter(t)} className="mc-btn"
            style={{padding:"5px 13px",borderRadius:99,fontSize:11,fontWeight:filter===t?700:500,
              border:`1px solid ${filter===t?"rgba(200,146,42,0.45)":A.glBd}`,
              background:filter===t?A.g15:A.gl1,
              color:filter===t?A.goldL:A.inkS,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>
            {t}
          </button>
        ))}
      </div>
      <div className="hs" style={{flex:1,overflowY:"auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,alignContent:"start"}}>
        {filtered.map((m,i)=>(
          <div key={i} style={{background:A.bg2,borderRadius:11,overflow:"hidden",
            border:`1px solid ${A.glBd}`,cursor:"pointer",
            transition:`all 0.2s ${EA}`,animation:`mc-in 0.3s ${i*.04}s ease both`}}
            className="mc-hover">
            <div style={{height:62,background:"linear-gradient(135deg,#1A1208,#0A0804)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,
              borderBottom:`1px solid ${A.glBd}`,position:"relative"}}>
              {m.emoji}
              <span style={{position:"absolute",top:5,right:5,fontSize:7.5,padding:"1px 5px",
                borderRadius:3,background:"rgba(200,146,42,0.2)",color:A.goldM,
                fontFamily:"'DM Mono',monospace",fontWeight:600}}>{m.type}</span>
            </div>
            <div style={{padding:"7px 9px"}}>
              <p style={{fontSize:10,fontWeight:600,color:A.ink,margin:"0 0 1px",fontFamily:"'DM Sans',sans-serif",
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.name}</p>
              <p style={{fontSize:9,color:A.inkD,fontFamily:"'DM Mono',monospace",margin:0}}>{m.size} · {m.dim}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ANALYTICS BAR
// ═══════════════════════════════════════════════════
function AnalyticsBar({banners}:{banners:Banner[]}) {
  const active=banners.filter(b=>b.status==="active").length;
  const stats=[
    {label:"Total Banners",value:String(banners.length),sub:`Active ${active}`,icon:"🖼️",trend:null},
    {label:"Total Views",  value:"8.6K",sub:"+12.5% vs last month",icon:"👁️",trend:"up"},
    {label:"Total Clicks", value:"1.2K",sub:"+18.3% vs last month",icon:"📊",trend:"up"},
    {label:"CTR",          value:"14.2%",sub:"+2.6% vs last month", icon:"🎯",trend:"up"},
    {label:"Active Campaigns",value:String(active),sub:"Running now",icon:"🚀",trend:null},
  ];
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:9,paddingTop:12,flexShrink:0}}>
      {stats.map((s,i)=>(
        <div key={i} style={{background:A.bg2,borderRadius:11,padding:"11px 13px",
          border:`1px solid ${A.glBd}`,animation:`mc-in 0.4s ${i*.06}s ease both`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <span style={{fontSize:15}}>{s.icon}</span>
            {s.trend&&<span style={{fontSize:9.5,color:"#4ADE80",fontFamily:"'DM Mono',monospace",
              background:"rgba(74,222,128,0.1)",padding:"1px 5px",borderRadius:99}}>↑</span>}
          </div>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:19,fontWeight:500,color:A.ink,margin:"0 0 1px",lineHeight:1}}>{s.value}</p>
          <p style={{fontSize:10.5,fontWeight:600,color:A.inkS,margin:"0 0 1px",fontFamily:"'DM Sans',sans-serif"}}>{s.label}</p>
          <p style={{fontSize:9.5,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:0}}>{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════
type TabId="banners"|"offers"|"popups"|"themes"|"media";

export default function MarketingContentPage() {
  const [activeTab,  setActiveTab  ] = useState<TabId>("banners");
  const [banners,    setBanners    ] = useState<Banner[]>(INIT_BANNERS);
  const [selectedId, setSelectedId ] = useState<number|null>(1);
  const [saved,      setSaved      ] = useState(false);

  // Live-edit state — synced with selected banner
  const [editBanner, setEditBanner ] = useState<Banner|null>(
    INIT_BANNERS.find(b=>b.id===1)||null
  );

  // When selectedId changes, update editBanner from banners list
  useEffect(()=>{
    const found=banners.find(b=>b.id===selectedId)||null;
    setEditBanner(found);
  },[selectedId, banners]);

  const handleSave = useCallback(()=>{
    if(!editBanner)return;
    setBanners(bs=>bs.map(b=>b.id===editBanner.id?editBanner:b));
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  },[editBanner]);

  const handleDelete = useCallback(()=>{
    if(!editBanner)return;
    if(!window.confirm(`Delete "${editBanner.title}"?`))return;
    setBanners(bs=>bs.filter(b=>b.id!==editBanner.id));
    setSelectedId(null);
    setEditBanner(null);
  },[editBanner]);

  const handleToggle=(id:number)=>setBanners(bs=>bs.map(b=>b.id===id?{...b,status:b.status==="active"?"inactive":"active"}:b));

  const handleDuplicate=(id:number)=>{
    const src=banners.find(b=>b.id===id);
    if(!src)return;
    const n={...src,id:Date.now(),title:src.title+" (Copy)",status:"inactive" as const};
    setBanners(bs=>[...bs,n]);
  };

  const handleAddBanner=()=>{
    const n:Banner={
      id:Date.now(),title:"New Banner",subtitle:"Add your subtitle here",btn:"Order Now",
      status:"inactive",views:"0",clicks:"0",schedule:"Not scheduled",
      bg:"linear-gradient(135deg,#3D1A06,#1A0A02)",tag:"NEW",emoji:"☕",
      opacity:60,action:"Go to Menu",startDate:"",endDate:"",
    };
    setBanners(bs=>[...bs,n]);
    setSelectedId(n.id);
  };

  const TABS:[{id:TabId;icon:string;label:string}] = [
    {id:"banners",icon:"🖼️",label:"Banners"},
    {id:"offers", icon:"🏷️",label:"Offer Cards"},
    {id:"popups", icon:"📣",label:"Popups"},
    {id:"themes", icon:"🎨",label:"Themes"},
    {id:"media",  icon:"📁",label:"Media Library"},
  ] as any;

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:A.bg0,color:A.ink,overflow:"hidden"}}>
      <style>{CSS}</style>

      {/* PAGE HEADER */}
      <div style={{padding:"18px 22px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,color:A.ink,margin:"0 0 3px"}}>Marketing Content</h1>
            <p style={{fontSize:12.5,color:A.inkS,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Manage all promotional content and campaigns</p>
          </div>
          <button className="mc-btn" onClick={handleAddBanner}
            style={{display:"flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:10,
              border:"none",background:GG,color:"#0A0804",fontWeight:700,fontSize:13,
              fontFamily:"'DM Sans',sans-serif",boxShadow:`0 6px 20px rgba(200,146,42,0.4)`}}>
            <span style={{fontSize:15}}>+</span> Create New Content
          </button>
        </div>
        {/* Tabs */}
        <div style={{display:"flex",gap:3,borderBottom:`1px solid ${A.gl2}`}}>
          {TABS.map((tab:any)=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className="mc-btn"
              style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",
                borderRadius:"9px 9px 0 0",
                border:`1px solid ${activeTab===tab.id?"rgba(200,146,42,0.28)":A.glBd}`,
                borderBottom:activeTab===tab.id?`1px solid ${A.bg0}`:`1px solid ${A.gl2}`,
                background:activeTab===tab.id?A.g08:"transparent",
                color:activeTab===tab.id?A.goldL:A.inkS,
                fontWeight:activeTab===tab.id?700:500,
                fontSize:12.5,fontFamily:"'DM Sans',sans-serif",
                marginBottom:-1,position:"relative",cursor:"pointer"}}>
              <span>{tab.icon}</span>{tab.label}
              {activeTab===tab.id&&(
                <div style={{position:"absolute",bottom:0,left:"15%",right:"15%",height:2,
                  background:GG,borderRadius:"2px 2px 0 0",boxShadow:`0 0 8px rgba(200,146,42,0.5)`}}/>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",padding:"0 22px 18px"}}>

        {/* BANNERS */}
        {activeTab==="banners"&&(
          <>
            <div style={{flex:1,display:"flex",gap:12,overflow:"hidden",paddingTop:14,minHeight:0}}>
              {/* Left list */}
              <div style={{width:420,display:"flex",flexDirection:"column",background:A.bg1,borderRadius:14,border:`1px solid ${A.glBd}`,overflow:"hidden",flexShrink:0}}>
                <div style={{padding:"12px 14px 10px",borderBottom:`1px solid ${A.gl2}`,flexShrink:0}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
                    <div>
                      <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:A.ink,margin:"0 0 1px"}}>Homepage Banners</h3>
                      <p style={{fontSize:10.5,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:0}}>Drag to reorder · {banners.filter(b=>b.status==="active").length} active</p>
                    </div>
                    <button className="mc-btn" onClick={handleAddBanner}
                      style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:"none",background:GG,color:"#0A0804",fontWeight:700,fontSize:11.5,fontFamily:"'DM Sans',sans-serif",flexShrink:0,boxShadow:`0 3px 10px rgba(200,146,42,0.3)`}}>
                      <span>+</span> Add Banner
                    </button>
                  </div>
                </div>
                <div className="hs" style={{flex:1,overflowY:"auto",padding:"8px 8px 8px"}}>
                  {banners.map((b,idx)=>(
                    <BannerRow key={b.id} b={b} idx={idx}
                      selected={selectedId===b.id}
                      onSelect={()=>setSelectedId(b.id)}
                      onToggle={()=>handleToggle(b.id)}
                      onDuplicate={()=>handleDuplicate(b.id)}
                      onDelete={()=>{setBanners(bs=>bs.filter(x=>x.id!==b.id));if(selectedId===b.id){setSelectedId(null);setEditBanner(null);}}}/>
                  ))}
                  <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 6px",marginTop:2}}>
                    <span style={{fontSize:13,color:A.inkG}}>⠿</span>
                    <span style={{fontSize:10.5,color:A.inkG,fontFamily:"'DM Sans',sans-serif"}}>Drag and drop to reorder banners</span>
                  </div>
                </div>
              </div>

              {/* Center preview */}
              <div style={{width:262,background:A.bg1,borderRadius:14,border:`1px solid ${A.glBd}`,overflow:"hidden",display:"flex",flexDirection:"column",flexShrink:0}}>
                <MobilePreview banner={editBanner}/>
              </div>

              {/* Right editor */}
              <div style={{flex:1,background:A.bg1,borderRadius:14,border:`1px solid ${A.glBd}`,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                <BannerEditor
                  banner={editBanner}
                  onChange={setEditBanner}
                  onSave={handleSave}
                  onDelete={handleDelete}/>
              </div>
            </div>
            {/* Save success toast */}
            {saved&&(
              <div style={{position:"fixed",bottom:24,right:24,zIndex:100,
                background:`linear-gradient(135deg,rgba(46,125,82,0.95),rgba(30,90,55,0.95))`,
                backdropFilter:"blur(12px)",border:"1px solid rgba(74,222,128,0.4)",
                borderRadius:12,padding:"11px 18px",
                display:"flex",alignItems:"center",gap:9,
                boxShadow:"0 8px 24px rgba(0,0,0,0.5)",animation:`mc-in 0.3s ease`}}>
                <span style={{fontSize:16}}>✓</span>
                <span style={{fontSize:13,fontWeight:600,color:"#7EF4A8",fontFamily:"'DM Sans',sans-serif"}}>Banner saved successfully!</span>
              </div>
            )}
            <AnalyticsBar banners={banners}/>
          </>
        )}

        {activeTab==="offers"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",background:A.bg1,borderRadius:14,border:`1px solid ${A.glBd}`,overflow:"hidden",marginTop:14}}>
            <OfferCardsTab/>
          </div>
        )}
        {activeTab==="popups"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",background:A.bg1,borderRadius:14,border:`1px solid ${A.glBd}`,overflow:"hidden",marginTop:14}}>
            <PopupsTab/>
          </div>
        )}
        {activeTab==="themes"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",background:A.bg1,borderRadius:14,border:`1px solid ${A.glBd}`,overflow:"hidden",marginTop:14}}>
            <FestivalThemesTab/>
          </div>
        )}
        {activeTab==="media"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",background:A.bg1,borderRadius:14,border:`1px solid ${A.glBd}`,overflow:"hidden",marginTop:14}}>
            <MediaLibraryTab/>
          </div>
        )}
      </div>
    </div>
  );
}
