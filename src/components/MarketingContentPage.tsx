"use client";

import { useState, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════
// GOLDEN BEANS — MARKETING CONTENT MODULE
// Photo-exact admin dashboard
// ═══════════════════════════════════════════════════

// ── Design tokens ──
const A = {
  bg0:  "#0A0804",
  bg1:  "#0F0D09",
  bg2:  "#16130E",
  bg3:  "#1E1A13",
  bg4:  "#26221A",
  gold: "#C8922A",
  goldM:"#E8B84B",
  goldL:"#F5CC6A",
  ink:  "#F0E8D8",
  inkS: "#A89878",
  inkD: "#5C5040",
  inkG: "#2E2820",
  gl1:  "rgba(255,255,255,0.025)",
  gl2:  "rgba(255,255,255,0.05)",
  gl3:  "rgba(255,255,255,0.08)",
  glBd: "rgba(255,255,255,0.07)",
  g08:  "rgba(200,146,42,0.08)",
  g15:  "rgba(200,146,42,0.15)",
  g25:  "rgba(200,146,42,0.25)",
  g40:  "rgba(200,146,42,0.40)",
  green:"#2E7D52",
  greenL:"rgba(46,125,82,0.15)",
  red:  "#C0392B",
  redL: "rgba(192,57,43,0.12)",
  blue: "#2563EB",
};

const GG   = `linear-gradient(135deg, ${A.gold} 0%, ${A.goldM} 52%, ${A.goldL} 100%)`;
const EASE = "cubic-bezier(0.25,0.46,0.45,0.94)";
const SPR  = "cubic-bezier(0.34,1.56,0.64,1)";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
* { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
.mc-btn:hover { filter:brightness(1.1); transform:translateY(-1px); }
.mc-btn:active { transform:scale(0.97); }
.mc-row:hover { background:rgba(255,255,255,0.035)!important; }
.mc-tab:hover { background:rgba(255,255,255,0.04); }
.mc-input:focus { border-color:rgba(200,146,42,0.65)!important; box-shadow:0 0 0 3px rgba(200,146,42,0.1)!important; outline:none; }
.mc-side:hover { background:rgba(255,255,255,0.04)!important; color:rgba(245,237,216,0.9)!important; }
.mc-card:hover { border-color:rgba(200,146,42,0.3)!important; background:rgba(255,255,255,0.03)!important; }
.mc-drag:hover { opacity:0.8; cursor:grab; }
@keyframes mc-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes mc-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
`;

// ── Sample data ──
const BANNERS = [
  { id:1, title:"Perfect Coffee Perfect Moments", subtitle:"20% OFF on All Coffees",  btn:"Order Now",  status:"active",   views:"1.2K", clicks:"230", schedule:"15 May, 2025 - 31 May, 2025", bg:"linear-gradient(135deg,#3D1A06,#1A0A02)",  tag:"20% OFF", emoji:"☕" },
  { id:2, title:"Summer Coolers",                 subtitle:"Beat the heat with us",    btn:"View Menu",  status:"active",   views:"980",  clicks:"180", schedule:"10 May, 2025 - 20 May, 2025", bg:"linear-gradient(135deg,#0A2A3D,#021018)",  tag:"BUY 1 GET 1", emoji:"🥤" },
  { id:3, title:"Happy Hours",                    subtitle:"Flat 15% OFF on ₹180+",   btn:"Order Now",  status:"active",   views:"2.5K", clicks:"512", schedule:"Everyday | 4 PM - 7 PM",      bg:"linear-gradient(135deg,#2A1A06,#120A02)",  tag:"FLAT 15% OFF", emoji:"⏰" },
  { id:4, title:"New Dessert Menu",               subtitle:"Freshly crafted desserts", btn:"Explore",    status:"inactive", views:"756",  clicks:"98",  schedule:"01 May, 2025 - 10 May, 2025", bg:"linear-gradient(135deg,#1A0A1A,#0A0208)",  tag:"NEW", emoji:"🍰" },
  { id:5, title:"Special Weekend Offer",          subtitle:"Every Saturday & Sunday",  btn:"Order Now",  status:"inactive", views:"1.1K", clicks:"210", schedule:"Every Saturday & Sunday",      bg:"linear-gradient(135deg,#0A1A0A,#020802)",  tag:"25% OFF", emoji:"🎉" },
];

const OFFER_CARDS = [
  { id:1, title:"Happy Hours Deal", discount:"15%", status:"active",   views:"3.2K", clicks:"680" },
  { id:2, title:"Weekend Special",  discount:"25%", status:"active",   views:"2.1K", clicks:"420" },
  { id:3, title:"Loyalty Bonus",    discount:"₹50", status:"inactive", views:"890",  clicks:"145" },
];

const POPUP_CAMPAIGNS = [
  { id:1, title:"Join Golden Beans Family", type:"CRM Capture",    status:"active",   trigger:"15s delay",   views:"4.8K", clicks:"1.2K" },
  { id:2, title:"Welcome Back!",            type:"Welcome Popup",  status:"active",   trigger:"On load",     views:"3.1K", clicks:"890"  },
  { id:3, title:"Flash Sale - 2 Hours",     type:"Announcement",   status:"inactive", trigger:"Manual",      views:"1.5K", clicks:"340"  },
];

const FESTIVAL_THEMES = [
  { id:1, name:"Diwali Special",   icon:"🪔", colors:["#FF8C00","#FFD700","#8B0000"], active:false },
  { id:2, name:"Christmas Magic",  icon:"🎄", colors:["#1B5E20","#C62828","#F57F17"], active:false },
  { id:3, name:"Valentine's Day",  icon:"❤️", colors:["#E91E63","#9C27B0","#F48FB1"], active:false },
  { id:4, name:"Monsoon Vibes",    icon:"🌧️", colors:["#1565C0","#00838F","#4CAF50"], active:false },
  { id:5, name:"IPL Season",       icon:"🏏", colors:["#1A237E","#F57F17","#FF6F00"], active:false },
  { id:6, name:"Default Theme",    icon:"☕", colors:["#C8922A","#1A1712","#F5CC6A"], active:true  },
];

const ANALYTICS = [
  { label:"Total Banners",     value:"12",    sub:"Active 7",       icon:"🖼️",  trend:null    },
  { label:"Total Views",       value:"8.6K",  sub:"+12.5% vs last month", icon:"👁️",  trend:"up"    },
  { label:"Total Clicks",      value:"1.2K",  sub:"+18.3% vs last month", icon:"📊",  trend:"up"    },
  { label:"CTR",               value:"14.2%", sub:"+2.6% vs last month",  icon:"🎯",  trend:"up"    },
  { label:"Active Campaigns",  value:"5",     sub:"Running now",    icon:"🚀",  trend:null    },
];
// ═══════════════════════════════════════════════════
// BANNER LIST ITEM
// ═══════════════════════════════════════════════════
function BannerRow({ b, selected, onSelect, onToggle, idx }: {
  b:typeof BANNERS[0]; selected:boolean; onSelect:()=>void;
  onToggle:(id:number)=>void; idx:number;
}) {
  const [menu, setMenu] = useState(false);
  return(
    <div className="mc-row" onClick={onSelect}
      style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",
        borderRadius:13,cursor:"pointer",marginBottom:6,
        background:selected?`rgba(200,146,42,0.08)`:"transparent",
        border:`1px solid ${selected?"rgba(200,146,42,0.28)":"transparent"}`,
        transition:`all 0.2s ${EASE}`,
        animation:`mc-fade 0.35s ${idx*0.06}s ease both`,
        position:"relative",
      }}>
      {/* Drag handle */}
      <div className="mc-drag" style={{color:A.inkG,fontSize:14,flexShrink:0,padding:"0 2px"}}>⠿</div>

      {/* Thumbnail */}
      <div style={{width:80,height:56,borderRadius:10,overflow:"hidden",flexShrink:0,
        background:b.bg,position:"relative",
        border:`1px solid rgba(200,146,42,0.2)`,
        display:"flex",alignItems:"center",justifyContent:"center",
      }}>
        <span style={{fontSize:18,opacity:.6}}>{b.emoji}</span>
        <div style={{position:"absolute",bottom:4,left:4,background:"rgba(200,146,42,0.9)",
          borderRadius:4,padding:"1px 6px",fontSize:8,fontWeight:700,
          color:"#0A0804",fontFamily:"'DM Sans',sans-serif",letterSpacing:".03em"}}>
          {b.tag}
        </div>
        <div style={{position:"absolute",inset:0,
          background:"linear-gradient(to top,rgba(0,0,0,0.5),transparent)"}}/>
        <p style={{position:"absolute",bottom:14,left:5,right:5,fontSize:8,
          color:"rgba(245,237,216,0.8)",fontFamily:"'DM Sans',sans-serif",fontWeight:700,
          lineHeight:1.2,margin:0}}>
          {b.title.length>18?b.title.slice(0,18)+"…":b.title}
        </p>
      </div>

      {/* Info */}
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13.5,fontWeight:600,
          color:A.ink,margin:"0 0 3px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {b.title}
        </p>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
          <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,
            background:b.status==="active"?A.greenL:A.redL,
            color:b.status==="active"?"#4ADE80":"#F87171",
            fontFamily:"'DM Mono',monospace",letterSpacing:".04em"}}>
            {b.status==="active"?"Active":"Inactive"}
          </span>
        </div>
        <p style={{fontSize:10.5,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:0}}>
          {b.schedule}
        </p>
      </div>

      {/* Stats */}
      <div style={{display:"flex",gap:16,flexShrink:0}}>
        <div style={{textAlign:"center"}}>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:500,
            color:A.ink,margin:0,lineHeight:1}}>{b.views}</p>
          <p style={{fontSize:9.5,color:A.inkD,margin:"2px 0 0",
            fontFamily:"'DM Sans',sans-serif"}}>Views</p>
        </div>
        <div style={{textAlign:"center"}}>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:500,
            color:A.ink,margin:0,lineHeight:1}}>{b.clicks}</p>
          <p style={{fontSize:9.5,color:A.inkD,margin:"2px 0 0",
            fontFamily:"'DM Sans',sans-serif"}}>Clicks</p>
        </div>
      </div>

      {/* Menu */}
      <div style={{position:"relative",flexShrink:0}} onClick={e=>e.stopPropagation()}>
        <button onClick={()=>setMenu(m=>!m)}
          style={{width:30,height:30,borderRadius:8,background:"none",
            border:`1px solid ${A.glBd}`,color:A.inkS,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⋮</button>
        {menu&&(
          <div style={{position:"absolute",right:0,top:35,zIndex:20,
            background:A.bg3,border:`1px solid ${A.glBd}`,
            borderRadius:11,overflow:"hidden",minWidth:150,
            boxShadow:`0 8px 24px rgba(0,0,0,0.6)`}}>
            {[
              {icon:"✏️",label:"Edit"},
              {icon:"📋",label:"Duplicate"},
              {icon:b.status==="active"?"⏸️":"▶️",label:b.status==="active"?"Deactivate":"Activate",
                action:()=>onToggle(b.id)},
              {icon:"🗑️",label:"Delete",red:true},
            ].map((item,i)=>(
              <button key={i} onClick={()=>{if(item.action)item.action();setMenu(false);}}
                style={{width:"100%",padding:"9px 14px",background:"none",border:"none",
                  cursor:"pointer",display:"flex",alignItems:"center",gap:9,
                  fontSize:12.5,color:item.red?"#F87171":A.inkS,
                  fontFamily:"'DM Sans',sans-serif",textAlign:"left",
                  transition:`background 0.15s ${EASE}`}}>
                <span style={{fontSize:14}}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MOBILE PREVIEW SIMULATOR
// ═══════════════════════════════════════════════════
function MobilePreview({ selected }: { selected:typeof BANNERS[0]|null }) {
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
      {/* Preview header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"14px 18px 10px",borderBottom:`1px solid ${A.gl2}`,flexShrink:0}}>
        <h3 style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:700,
          color:A.ink,margin:0}}>Live Preview</h3>
        <div style={{display:"flex",gap:8}}>
          {["📱","💻"].map((ic,i)=>(
            <button key={i} style={{width:30,height:30,borderRadius:7,
              background:i===0?A.g15:A.gl1,
              border:`1px solid ${i===0?"rgba(200,146,42,0.4)":A.glBd}`,
              color:i===0?A.goldM:A.inkS,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
              {ic}
            </button>
          ))}
        </div>
      </div>

      {/* Phone frame */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
        padding:"16px 10px",overflowY:"auto"}}>
        <div style={{width:220,background:"#0A0804",borderRadius:24,overflow:"hidden",
          border:`2px solid rgba(200,146,42,0.3)`,
          boxShadow:`0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(200,146,42,0.08)`,
          position:"relative",flexShrink:0}}>

          {/* Status bar */}
          <div style={{background:"#050402",padding:"8px 14px 4px",
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:9,color:A.inkS,fontFamily:"'DM Mono',monospace"}}>9:41</span>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <span style={{fontSize:9}}>📶</span>
              <span style={{fontSize:9}}>🔋</span>
            </div>
          </div>

          {/* App header */}
          <div style={{background:A.bg1,padding:"8px 10px",
            display:"flex",alignItems:"center",justifyContent:"space-between",
            borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:22,height:22,borderRadius:6,background:`linear-gradient(135deg,${A.gold},${A.goldM})`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>☕</div>
              <div>
                <p style={{fontSize:7,color:A.ink,fontFamily:"'DM Sans',sans-serif",fontWeight:700,margin:0,lineHeight:1}}>Good Morning, Nirav 👋</p>
                <p style={{fontSize:6,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:0}}>Brewed with passion...</p>
              </div>
            </div>
            <div style={{display:"flex",gap:5}}>
              <span style={{fontSize:11}}>🔍</span>
              <span style={{fontSize:11,position:"relative"}}>🔔
                <span style={{position:"absolute",top:-2,right:-2,width:5,height:5,
                  borderRadius:"50%",background:A.gold}}/>
              </span>
            </div>
          </div>

          {/* Hero banner */}
          <div style={{height:100,background:selected?.bg||"linear-gradient(135deg,#3D1A06,#1A0A02)",
            position:"relative",overflow:"hidden",
            transition:`background 0.5s ${EASE}`}}>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
              justifyContent:"flex-end",padding:"8px 10px"}}>
              <p style={{fontSize:13,fontWeight:700,color:"#F5EDD8",
                fontFamily:"'Cormorant Garamond',serif",margin:"0 0 1px",lineHeight:1.1}}>
                {selected?.title||"Perfect Coffee"}
              </p>
              <p style={{fontSize:7,color:"rgba(245,237,216,0.7)",
                fontFamily:"'DM Sans',sans-serif",margin:"0 0 5px"}}>
                {selected?.subtitle||"20% OFF on All Coffees"}
              </p>
              <div style={{background:`rgba(200,146,42,0.9)`,borderRadius:5,
                padding:"3px 8px",width:"fit-content"}}>
                <span style={{fontSize:7,color:"#0A0804",fontWeight:700,
                  fontFamily:"'DM Sans',sans-serif"}}>
                  {selected?.btn||"Order Now"} →
                </span>
              </div>
            </div>
            <div style={{position:"absolute",inset:0,
              background:"linear-gradient(to top,rgba(0,0,0,0.65),transparent)"}}/>
            {/* Dot indicators */}
            <div style={{position:"absolute",bottom:6,right:8,display:"flex",gap:3}}>
              {[0,1,2].map(i=><div key={i} style={{width:i===0?10:4,height:4,borderRadius:2,
                background:i===0?"rgba(200,146,42,0.9)":"rgba(255,255,255,0.3)"}}/>)}
            </div>
          </div>

          {/* Categories */}
          <div style={{padding:"8px 10px 4px",background:A.bg1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:8,fontWeight:700,color:A.ink,fontFamily:"'DM Sans',sans-serif"}}>Categories</span>
              <span style={{fontSize:7,color:A.gold,fontFamily:"'DM Mono',monospace"}}>View All</span>
            </div>
            <div style={{display:"flex",gap:5}}>
              {[{icon:"☕",l:"Hot Beverages"},{icon:"🥤",l:"Cold Beverages"},{icon:"🍕",l:"Snacks"},{icon:"🍰",l:"Desserts"}].map((c,i)=>(
                <div key={i} style={{flex:1,textAlign:"center"}}>
                  <div style={{width:28,height:28,borderRadius:9,background:A.bg3,margin:"0 auto 3px",
                    border:`1px solid ${A.glBd}`,display:"flex",alignItems:"center",
                    justifyContent:"center",fontSize:12}}>{c.icon}</div>
                  <p style={{fontSize:6,color:A.inkS,fontFamily:"'DM Sans',sans-serif",margin:0,lineHeight:1.2}}>{c.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended */}
          <div style={{padding:"8px 10px",background:A.bg1,borderTop:`1px solid rgba(255,255,255,0.04)`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:8,fontWeight:700,color:A.ink,fontFamily:"'DM Sans',sans-serif"}}>Recommended for you</span>
              <span style={{fontSize:7,color:A.gold,fontFamily:"'DM Mono',monospace"}}>View All</span>
            </div>
            <div style={{display:"flex",gap:6}}>
              {[{n:"Cappuccino",p:"₹180",r:"4.8"},{n:"Chocolate Brownie",p:"₹160",r:"4.7"}].map((item,i)=>(
                <div key={i} style={{flex:1,background:A.bg3,borderRadius:9,padding:"6px",
                  border:`1px solid ${A.glBd}`}}>
                  <div style={{height:36,borderRadius:6,background:`linear-gradient(135deg,#3D1A06,#1A0A02)`,
                    marginBottom:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>☕</div>
                  <p style={{fontSize:7.5,fontWeight:600,color:A.ink,margin:"0 0 1px",
                    fontFamily:"'DM Sans',sans-serif"}}>{item.n}</p>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:7,color:A.gold,fontFamily:"'DM Mono',monospace"}}>{item.p}</span>
                    <div style={{width:14,height:14,borderRadius:4,background:`rgba(200,146,42,0.2)`,
                      border:`1px solid rgba(200,146,42,0.4)`,display:"flex",
                      alignItems:"center",justifyContent:"center",fontSize:9,color:A.gold}}>+</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart bar */}
          <div style={{padding:"6px 10px",background:A.bg1,borderTop:`1px solid rgba(255,255,255,0.04)`}}>
            <div style={{background:A.bg3,border:`1px solid rgba(200,146,42,0.3)`,
              borderRadius:10,padding:"6px 10px",
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <p style={{fontSize:7,color:A.inkS,fontFamily:"'DM Sans',sans-serif",margin:0}}>2 Items in Cart</p>
                <p style={{fontSize:11,fontWeight:600,color:A.ink,fontFamily:"'DM Mono',monospace",margin:0}}>₹340</p>
              </div>
              <div style={{background:GG,borderRadius:7,padding:"4px 10px"}}>
                <span style={{fontSize:7.5,fontWeight:700,color:"#0A0804",fontFamily:"'DM Sans',sans-serif"}}>View Cart →</span>
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div style={{background:"rgba(6,5,3,0.97)",borderTop:`1px solid rgba(255,255,255,0.05)`,
            padding:"6px 0 8px",display:"flex",justifyContent:"space-around"}}>
            {[{icon:"🏠",l:"Home",a:true},{icon:"📋",l:"Menu"},{icon:"📦",l:"Orders"},{icon:"🎁",l:"Rewards"},{icon:"👤",l:"Profile"}].map((t,i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                <span style={{fontSize:13,filter:t.a?`drop-shadow(0 0 4px ${A.gold})`:undefined}}>{t.icon}</span>
                <span style={{fontSize:6,color:t.a?A.gold:A.inkD,fontFamily:"'DM Sans',sans-serif",fontWeight:t.a?700:400}}>{t.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════
// BANNER EDITOR PANEL (right side)
// ═══════════════════════════════════════════════════
function BannerEditor({ banner, onSave, onDelete }: {
  banner:typeof BANNERS[0]|null;
  onSave:(b:typeof BANNERS[0])=>void;
  onDelete:(id:number)=>void;
}) {
  const [tab,    setTab   ] = useState<"content"|"style">("content");
  const [title,  setTitle ] = useState(banner?.title||"");
  const [sub,    setSub   ] = useState(banner?.subtitle||"");
  const [btn,    setBtn   ] = useState(banner?.btn||"");
  const [action, setAction] = useState("Go to Menu");
  const [opacity,setOpacity]=useState(60);
  const [status, setStatus]=useState(banner?.status||"active");

  if(!banner) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:24,textAlign:"center"}}>
      <div style={{fontSize:44,marginBottom:14,opacity:.4}}>🖼️</div>
      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:A.inkS,margin:"0 0 6px"}}>
        Select a banner to edit
      </p>
      <p style={{fontSize:12,color:A.inkD,fontFamily:"'DM Sans',sans-serif"}}>
        Click any banner from the list to start editing
      </p>
    </div>
  );

  const Field = ({ label, value, onChange, type="text" }: { label:string;value:string;onChange:(v:string)=>void;type?:string }) => (
    <div style={{marginBottom:16}}>
      <label style={{fontSize:10.5,fontWeight:700,color:A.inkD,letterSpacing:".1em",
        textTransform:"uppercase",display:"block",marginBottom:7,
        fontFamily:"'DM Mono',monospace"}}>{label}</label>
      <input className="mc-input" type={type} value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",padding:"10px 13px",borderRadius:10,
          border:`1px solid ${A.glBd}`,background:A.gl1,
          color:A.ink,fontSize:13,fontFamily:"'DM Sans',sans-serif",
          transition:`all 0.2s ${EASE}`}}/>
    </div>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {/* Tab bar */}
      <div style={{display:"flex",gap:4,padding:"14px 16px 10px",
        borderBottom:`1px solid ${A.gl2}`,flexShrink:0}}>
        {(["content","style"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className="mc-tab"
            style={{flex:1,padding:"7px 0",borderRadius:9,border:"none",
              background:tab===t?`linear-gradient(135deg,${A.g15},${A.g08})`:"transparent",
              color:tab===t?A.goldL:A.inkS,fontWeight:tab===t?700:500,fontSize:12.5,
              cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
              borderWidth:tab===t?1:0,borderStyle:"solid",borderColor:"rgba(200,146,42,0.3)",
              transition:`all 0.2s ${EASE}`}}>
            {t==="content"?"Content":"Style"}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="hs" style={{flex:1,overflowY:"auto",padding:"16px",scrollbarWidth:"none"}}>
        {tab==="content" ? (
          <>
            <Field label="Banner Title"  value={title}  onChange={setTitle}/>
            <Field label="Subtitle"      value={sub}    onChange={setSub}/>
            <Field label="Button Text"   value={btn}    onChange={setBtn}/>

            {/* Button Action */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10.5,fontWeight:700,color:A.inkD,letterSpacing:".1em",
                textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'DM Mono',monospace"}}>
                Button Action
              </label>
              <select value={action} onChange={e=>setAction(e.target.value)}
                style={{width:"100%",padding:"10px 13px",borderRadius:10,
                  border:`1px solid ${A.glBd}`,background:A.bg3,color:A.ink,
                  fontSize:13,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
                {["Go to Menu","Go to Category","External URL","Show Popup"].map(o=>(
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Background Media */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10.5,fontWeight:700,color:A.inkD,letterSpacing:".1em",
                textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'DM Mono',monospace"}}>
                Background Media
              </label>
              <div style={{border:`1px solid ${A.glBd}`,borderRadius:11,
                padding:"10px 12px",background:A.gl1,
                display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:52,height:40,borderRadius:7,overflow:"hidden",
                  background:banner.bg,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:11.5,color:A.ink,fontFamily:"'DM Sans',sans-serif",
                    margin:"0 0 1px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    banner-1.jpg
                  </p>
                  <p style={{fontSize:10,color:A.inkD,fontFamily:"'DM Mono',monospace",margin:0}}>
                    1920 x 1080px
                  </p>
                </div>
                <button style={{fontSize:11,padding:"5px 11px",borderRadius:8,
                  border:`1px solid ${A.glBd}`,background:A.gl2,
                  color:A.inkS,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                  display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                  <span>☁️</span> Upload New
                </button>
              </div>
            </div>

            {/* Overlay Opacity */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <label style={{fontSize:10.5,fontWeight:700,color:A.inkD,letterSpacing:".1em",
                  textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Overlay Opacity</label>
                <span style={{fontSize:12,color:A.goldM,fontFamily:"'DM Mono',monospace",fontWeight:500}}>
                  {opacity}%
                </span>
              </div>
              <div style={{position:"relative",height:4,borderRadius:2,background:A.bg4}}>
                <div style={{position:"absolute",left:0,top:0,height:"100%",borderRadius:2,
                  background:GG,width:`${opacity}%`,transition:`width 0.1s ${EASE}`}}/>
                <input type="range" min={0} max={100} value={opacity}
                  onChange={e=>setOpacity(Number(e.target.value))}
                  style={{position:"absolute",inset:"-8px 0",opacity:0,cursor:"pointer",width:"100%"}}/>
                <div style={{position:"absolute",top:"50%",transform:"translate(-50%,-50%)",
                  width:14,height:14,borderRadius:"50%",background:GG,
                  boxShadow:`0 0 8px rgba(200,146,42,0.5)`,
                  left:`${opacity}%`,pointerEvents:"none"}}/>
              </div>
            </div>

            {/* Status */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10.5,fontWeight:700,color:A.inkD,letterSpacing:".1em",
                textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'DM Mono',monospace"}}>
                Status
              </label>
              <select value={status} onChange={e=>setStatus(e.target.value)}
                style={{width:"100%",padding:"10px 13px",borderRadius:10,
                  border:`1px solid ${status==="active"?"rgba(46,125,82,0.5)":A.glBd}`,
                  background:status==="active"?"rgba(46,125,82,0.1)":A.gl1,
                  color:status==="active"?"#4ADE80":A.ink,
                  fontSize:13,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Schedule */}
            <div style={{marginBottom:6}}>
              <label style={{fontSize:10.5,fontWeight:700,color:A.inkD,letterSpacing:".1em",
                textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'DM Mono',monospace"}}>
                Schedule
              </label>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="date" defaultValue="2025-05-15"
                  className="mc-input"
                  style={{flex:1,padding:"9px 11px",borderRadius:9,
                    border:`1px solid ${A.glBd}`,background:A.gl1,
                    color:A.ink,fontSize:12,fontFamily:"'DM Mono',monospace"}}/>
                <span style={{fontSize:11,color:A.inkD,flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>to</span>
                <input type="date" defaultValue="2025-05-31"
                  className="mc-input"
                  style={{flex:1,padding:"9px 11px",borderRadius:9,
                    border:`1px solid ${A.glBd}`,background:A.gl1,
                    color:A.ink,fontSize:12,fontFamily:"'DM Mono',monospace"}}/>
              </div>
            </div>
          </>
        ) : (
          /* Style tab */
          <div>
            <p style={{fontSize:11,color:A.inkD,fontFamily:"'DM Sans',sans-serif",marginBottom:16}}>
              Style options — gradient presets, text shadow, glow intensity
            </p>
            {/* Color presets */}
            <label style={{fontSize:10.5,fontWeight:700,color:A.inkD,letterSpacing:".1em",textTransform:"uppercase",display:"block",marginBottom:10,fontFamily:"'DM Mono',monospace"}}>
              Gradient Presets
            </label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[
                {bg:"linear-gradient(135deg,#3D1A06,#1A0A02)",l:"Coffee Dark"},
                {bg:"linear-gradient(135deg,#0A2A3D,#021018)",l:"Ocean Blue"},
                {bg:"linear-gradient(135deg,#1A0A1A,#0A0208)",l:"Royal Purple"},
                {bg:"linear-gradient(135deg,#0A1A0A,#020802)",l:"Forest Green"},
              ].map((p,i)=>(
                <button key={i} style={{height:40,borderRadius:9,background:p.bg,
                  border:`1px solid ${A.glBd}`,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:10,color:"rgba(245,237,216,0.7)",fontFamily:"'DM Sans',sans-serif"}}>
                  {p.l}
                </button>
              ))}
            </div>
            <Field label="Glow Intensity" value="Medium" onChange={()=>{}}/>
            <Field label="Text Alignment" value="Left" onChange={()=>{}}/>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{padding:"12px 16px",borderTop:`1px solid ${A.gl2}`,
        display:"flex",gap:9,flexShrink:0}}>
        <button onClick={()=>onDelete(banner.id)} className="mc-btn"
          style={{padding:"9px 14px",borderRadius:9,border:`1px solid rgba(192,57,43,0.4)`,
            background:"rgba(192,57,43,0.08)",color:"#F87171",cursor:"pointer",
            fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:600,
            display:"flex",alignItems:"center",gap:5,flexShrink:0,
            transition:`all 0.2s ${EASE}`}}>
          🗑️ Delete
        </button>
        <button onClick={()=>onSave({...banner,title,subtitle:sub,btn,status:status as "active"|"inactive"})}
          className="mc-btn"
          style={{flex:1,padding:"9px 0",borderRadius:9,border:"none",
            background:GG,color:"#0A0804",cursor:"pointer",fontWeight:700,
            fontSize:13,fontFamily:"'DM Sans',sans-serif",
            boxShadow:`0 4px 16px rgba(200,146,42,0.35)`,
            transition:`all 0.2s ${EASE}`}}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════
// OFFER CARDS TAB
// ═══════════════════════════════════════════════════
function OfferCardsTab() {
  const [cards, setCards] = useState(OFFER_CARDS);
  return(
    <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:600,color:A.ink,margin:"0 0 2px"}}>Offer Cards</h3>
          <p style={{fontSize:11,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:0}}>Manage promotional offer cards</p>
        </div>
        <button className="mc-btn" style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:10,border:"none",background:GG,color:"#0A0804",fontWeight:700,fontSize:12.5,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",boxShadow:`0 4px 14px rgba(200,146,42,0.35)`,transition:`all 0.2s ${EASE}`}}>
          <span style={{fontSize:14}}>+</span> Add Offer Card
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {cards.map((c,i)=>(
          <div key={c.id} className="mc-card" style={{background:A.bg2,borderRadius:14,overflow:"hidden",border:`1px solid ${A.glBd}`,cursor:"pointer",transition:`all 0.2s ${EASE}`,animation:`mc-fade 0.35s ${i*.07}s ease both`}}>
            <div style={{height:80,background:`linear-gradient(135deg, rgba(200,146,42,0.2), rgba(200,146,42,0.05))`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",borderBottom:`1px solid ${A.glBd}`}}>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,color:A.goldL}}>{c.discount}</span>
              <span style={{position:"absolute",top:8,right:8,fontSize:9,padding:"2px 8px",borderRadius:99,background:c.status==="active"?A.greenL:A.redL,color:c.status==="active"?"#4ADE80":"#F87171",fontFamily:"'DM Mono',monospace"}}>{c.status}</span>
            </div>
            <div style={{padding:"10px 12px"}}>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:A.ink,margin:"0 0 6px"}}>{c.title}</p>
              <div style={{display:"flex",gap:12}}>
                <div><p style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:A.ink,margin:0}}>{c.views}</p><p style={{fontSize:9,color:A.inkD,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Views</p></div>
                <div><p style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:A.ink,margin:0}}>{c.clicks}</p><p style={{fontSize:9,color:A.inkD,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Clicks</p></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// FESTIVAL THEMES TAB
// ═══════════════════════════════════════════════════
function FestivalThemesTab() {
  const [themes, setThemes] = useState(FESTIVAL_THEMES);
  const activate = (id:number) => setThemes(ts=>ts.map(t=>({...t,active:t.id===id})));
  return(
    <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
      <div style={{marginBottom:16}}>
        <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:600,color:A.ink,margin:"0 0 2px"}}>Festival Themes</h3>
        <p style={{fontSize:11,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:0}}>One-click seasonal theme activation</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {themes.map((t,i)=>(
          <div key={t.id} className="mc-card" onClick={()=>activate(t.id)}
            style={{background:t.active?`linear-gradient(135deg,${A.g15},${A.g08})`:A.bg2,borderRadius:15,padding:"16px 14px",border:`1px solid ${t.active?"rgba(200,146,42,0.45)":A.glBd}`,cursor:"pointer",textAlign:"center",boxShadow:t.active?`0 0 24px rgba(200,146,42,0.15)`:"none",transition:`all 0.25s ${EASE}`,animation:`mc-fade 0.35s ${i*.07}s ease both`,position:"relative"}}>
            {t.active&&<div style={{position:"absolute",top:8,right:8,width:8,height:8,borderRadius:"50%",background:A.gold,boxShadow:`0 0 6px ${A.gold}`}}/>}
            <div style={{fontSize:30,marginBottom:8}}>{t.icon}</div>
            <p style={{fontSize:13,fontWeight:700,color:t.active?A.goldL:A.ink,fontFamily:"'DM Sans',sans-serif",margin:"0 0 8px"}}>{t.name}</p>
            <div style={{display:"flex",justifyContent:"center",gap:5,marginBottom:10}}>
              {t.colors.map((c,ci)=><div key={ci} style={{width:14,height:14,borderRadius:"50%",background:c,border:`1px solid rgba(255,255,255,0.1)`}}/>)}
            </div>
            <button style={{width:"100%",padding:"7px 0",borderRadius:9,border:`1px solid ${t.active?"rgba(200,146,42,0.5)":A.glBd}`,background:t.active?GG:"transparent",color:t.active?"#0A0804":A.inkS,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:`all 0.2s ${EASE}`}}>
              {t.active?"✓ Active":"Activate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// POPUPS TAB
// ═══════════════════════════════════════════════════
function PopupsTab() {
  return(
    <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:600,color:A.ink,margin:"0 0 2px"}}>Popup Campaigns</h3>
          <p style={{fontSize:11,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:0}}>Manage all customer popup experiences</p>
        </div>
        <button className="mc-btn" style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:10,border:"none",background:GG,color:"#0A0804",fontWeight:700,fontSize:12.5,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",boxShadow:`0 4px 14px rgba(200,146,42,0.35)`,transition:`all 0.2s ${EASE}`}}>
          <span>+</span> New Campaign
        </button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {POPUP_CAMPAIGNS.map((p,i)=>(
          <div key={p.id} className="mc-card" style={{background:A.bg2,borderRadius:14,padding:"14px 16px",border:`1px solid ${A.glBd}`,cursor:"pointer",transition:`all 0.2s ${EASE}`,animation:`mc-fade 0.35s ${i*.07}s ease both`,display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:46,height:46,borderRadius:12,background:`linear-gradient(135deg,rgba(200,146,42,0.15),rgba(200,146,42,0.05))`,border:`1px solid rgba(200,146,42,0.25)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
              {p.type==="CRM Capture"?"🎁":p.type==="Welcome Popup"?"👋":"📢"}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13.5,fontWeight:600,color:A.ink,margin:0}}>{p.title}</p>
                <span style={{fontSize:9,padding:"2px 8px",borderRadius:99,background:p.status==="active"?A.greenL:A.redL,color:p.status==="active"?"#4ADE80":"#F87171",fontFamily:"'DM Mono',monospace",flexShrink:0}}>{p.status}</span>
              </div>
              <div style={{display:"flex",gap:10}}>
                <span style={{fontSize:10.5,color:A.inkD,fontFamily:"'DM Sans',sans-serif"}}>{p.type}</span>
                <span style={{fontSize:10.5,color:A.inkD,fontFamily:"'DM Mono',monospace"}}>⏱ {p.trigger}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:14,flexShrink:0}}>
              <div style={{textAlign:"center"}}><p style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:A.ink,margin:0}}>{p.views}</p><p style={{fontSize:9,color:A.inkD,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Views</p></div>
              <div style={{textAlign:"center"}}><p style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:A.ink,margin:0}}>{p.clicks}</p><p style={{fontSize:9,color:A.inkD,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Clicks</p></div>
            </div>
            <button style={{width:30,height:30,borderRadius:8,background:A.gl1,border:`1px solid ${A.glBd}`,color:A.inkS,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>✏️</button>
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
  const MEDIA=[
    {name:"banner-coffee.jpg",type:"JPG",size:"2.4MB",dim:"1920×1080",emoji:"☕"},
    {name:"summer-promo.jpg", type:"JPG",size:"1.8MB",dim:"1920×1080",emoji:"🥤"},
    {name:"happy-hours.gif",  type:"GIF",size:"3.2MB",dim:"800×600",  emoji:"⏰"},
    {name:"dessert-new.jpg",  type:"JPG",size:"1.6MB",dim:"1920×1080",emoji:"🍰"},
    {name:"logo-anim.lottie", type:"JSON",size:"48KB", dim:"400×400",  emoji:"✨"},
    {name:"promo-video.mp4",  type:"MP4",size:"18MB", dim:"1920×1080",emoji:"🎬"},
  ];
  return(
    <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:600,color:A.ink,margin:"0 0 2px"}}>Media Library</h3>
          <p style={{fontSize:11,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:0}}>Upload and manage all marketing media</p>
        </div>
        <button className="mc-btn" style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:10,border:"none",background:GG,color:"#0A0804",fontWeight:700,fontSize:12.5,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",boxShadow:`0 4px 14px rgba(200,146,42,0.35)`,transition:`all 0.2s ${EASE}`}}>
          ☁️ Upload Media
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {MEDIA.map((m,i)=>(
          <div key={i} className="mc-card" style={{background:A.bg2,borderRadius:12,overflow:"hidden",border:`1px solid ${A.glBd}`,cursor:"pointer",transition:`all 0.2s ${EASE}`,animation:`mc-fade 0.35s ${i*.07}s ease both`}}>
            <div style={{height:72,background:`linear-gradient(135deg,#1A1208,#0A0804)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,borderBottom:`1px solid ${A.glBd}`,position:"relative"}}>
              {m.emoji}
              <span style={{position:"absolute",top:6,right:6,fontSize:8,padding:"1px 6px",borderRadius:4,background:"rgba(200,146,42,0.2)",color:A.goldM,fontFamily:"'DM Mono',monospace",fontWeight:600}}>{m.type}</span>
            </div>
            <div style={{padding:"8px 10px"}}>
              <p style={{fontSize:10.5,fontWeight:600,color:A.ink,margin:"0 0 2px",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.name}</p>
              <p style={{fontSize:9.5,color:A.inkD,fontFamily:"'DM Mono',monospace",margin:0}}>{m.size} · {m.dim}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ANALYTICS ROW
// ═══════════════════════════════════════════════════
function AnalyticsBar() {
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,
      padding:"14px 0 0",borderTop:`1px solid ${A.gl2}`,flexShrink:0}}>
      {ANALYTICS.map((s,i)=>(
        <div key={i} style={{background:A.bg2,borderRadius:12,padding:"12px 14px",
          border:`1px solid ${A.glBd}`,
          animation:`mc-fade 0.4s ${i*.07}s ease both`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:16}}>{s.icon}</span>
            {s.trend&&<span style={{fontSize:10,color:"#4ADE80",fontFamily:"'DM Mono',monospace",
              background:"rgba(74,222,128,0.12)",padding:"1px 6px",borderRadius:99}}>
              ↑
            </span>}
          </div>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:500,
            color:A.ink,margin:"0 0 1px",lineHeight:1}}>{s.value}</p>
          <p style={{fontSize:11,fontWeight:600,color:A.inkS,margin:"0 0 2px",
            fontFamily:"'DM Sans',sans-serif"}}>{s.label}</p>
          <p style={{fontSize:10,color:A.inkD,fontFamily:"'DM Sans',sans-serif",margin:0}}>
            {s.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
// ═══════════════════════════════════════════════════
// MAIN MARKETING CONTENT PAGE
// ═══════════════════════════════════════════════════
export default function MarketingContentPage() {
  type TabId = "banners"|"offers"|"popups"|"themes"|"media";
  const [activeTab,   setActiveTab  ] = useState<TabId>("banners");
  const [banners,     setBanners    ] = useState(BANNERS);
  const [selectedId,  setSelectedId ] = useState<number|null>(1);
  const [showCreate,  setShowCreate ] = useState(false);

  const selected = banners.find(b=>b.id===selectedId)||null;

  const handleToggle = (id:number) =>
    setBanners(bs=>bs.map(b=>b.id===id?{...b,status:b.status==="active"?"inactive":"active"}:b));

  const handleSave = (updated:typeof BANNERS[0]) =>
    setBanners(bs=>bs.map(b=>b.id===updated.id?updated:b));

  const handleDelete = (id:number) => {
    setBanners(bs=>bs.filter(b=>b.id!==id));
    setSelectedId(null);
  };

  const TABS: { id:TabId; icon:string; label:string }[] = [
    { id:"banners", icon:"🖼️", label:"Banners"       },
    { id:"offers",  icon:"🏷️", label:"Offer Cards"   },
    { id:"popups",  icon:"📣", label:"Popups"        },
    { id:"themes",  icon:"🎨", label:"Themes"        },
    { id:"media",   icon:"📁", label:"Media Library" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%",
      background:A.bg0, color:A.ink, fontFamily:"'DM Sans',sans-serif",
      overflow:"hidden" }}>
      <style>{CSS}</style>

      {/* ── PAGE HEADER ── */}
      <div style={{ padding:"20px 24px 0", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"flex-start",
          justifyContent:"space-between", marginBottom:18 }}>
          <div>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28,
              fontWeight:600, color:A.ink, margin:"0 0 4px", letterSpacing:"-.01em" }}>
              Marketing Content
            </h1>
            <p style={{ fontSize:13, color:A.inkS, margin:0, fontFamily:"'DM Sans',sans-serif" }}>
              Manage all promotional content and campaigns
            </p>
          </div>

          {/* Create button */}
          <div style={{ display:"flex", gap:9, alignItems:"center" }}>
            <button className="mc-btn"
              onClick={() => setShowCreate(true)}
              style={{ display:"flex", alignItems:"center", gap:8,
                padding:"10px 20px", borderRadius:11, border:"none",
                background:GG, color:"#0A0804", fontWeight:700, fontSize:13.5,
                fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
                boxShadow:`0 6px 20px rgba(200,146,42,0.4)`,
                transition:`all 0.2s ${EASE}` }}>
              <span style={{ fontSize:16, fontWeight:300 }}>+</span>
              Create New Content
              <svg width={12} height={12} viewBox="0 0 12 12">
                <path d="M2 6h8M6 2l4 4-4 4" stroke="#0A0804" strokeWidth={1.8} strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── TAB BAR ── */}
        <div style={{ display:"flex", gap:4, borderBottom:`1px solid ${A.gl2}`,
          paddingBottom:0 }}>
          {TABS.map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="mc-tab"
              style={{ display:"flex", alignItems:"center", gap:7,
                padding:"10px 18px", borderRadius:"10px 10px 0 0",
                border:`1px solid ${activeTab===tab.id?"rgba(200,146,42,0.3)":A.glBd}`,
                borderBottom:activeTab===tab.id?`1px solid ${A.bg0}`:`1px solid ${A.gl2}`,
                background: activeTab===tab.id
                  ? `linear-gradient(180deg,${A.g08} 0%,transparent 100%)`
                  : "transparent",
                color: activeTab===tab.id ? A.goldL : A.inkS,
                fontWeight: activeTab===tab.id ? 700 : 500,
                fontSize:13, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",
                marginBottom:-1, position:"relative",
                transition:`all 0.2s ${EASE}` }}>
              <span>{tab.icon}</span>
              {tab.label}
              {/* Active indicator */}
              {activeTab===tab.id && (
                <div style={{ position:"absolute", bottom:0, left:"15%", right:"15%",
                  height:2, background:GG, borderRadius:"2px 2px 0 0",
                  boxShadow:`0 0 8px rgba(200,146,42,0.6)` }}/>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column",
        overflow:"hidden", padding:"0 24px 20px" }}>

        {/* ── BANNERS TAB ── */}
        {activeTab==="banners" && (
          <div style={{ flex:1, display:"flex", gap:14, overflow:"hidden", paddingTop:16 }}>

            {/* LEFT — Banner List */}
            <div style={{ width:440, display:"flex", flexDirection:"column",
              background:A.bg1, borderRadius:16, border:`1px solid ${A.glBd}`,
              overflow:"hidden", flexShrink:0 }}>

              {/* List header */}
              <div style={{ padding:"14px 16px 10px",
                borderBottom:`1px solid ${A.gl2}`, flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", marginBottom:4 }}>
                  <div>
                    <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17,
                      fontWeight:600, color:A.ink, margin:"0 0 2px" }}>
                      Homepage Banners
                    </h3>
                    <p style={{ fontSize:11, color:A.inkD,
                      fontFamily:"'DM Sans',sans-serif", margin:0 }}>
                      Manage hero banners displayed on the homepage
                    </p>
                  </div>
                  <button className="mc-btn"
                    style={{ display:"flex", alignItems:"center", gap:6,
                      padding:"8px 14px", borderRadius:9, border:"none",
                      background:GG, color:"#0A0804", fontWeight:700, fontSize:12,
                      fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
                      boxShadow:`0 4px 12px rgba(200,146,42,0.35)`,
                      transition:`all 0.2s ${EASE}`, flexShrink:0 }}>
                    <span>+</span> Add New Banner
                  </button>
                </div>
              </div>

              {/* Banner list */}
              <div className="hs" style={{ flex:1, overflowY:"auto",
                padding:"10px 10px 10px", scrollbarWidth:"none" }}>
                {banners.map((b,idx) => (
                  <BannerRow key={b.id} b={b} idx={idx}
                    selected={selectedId===b.id}
                    onSelect={() => setSelectedId(b.id)}
                    onToggle={handleToggle}/>
                ))}
                {/* Drag hint */}
                <div style={{ display:"flex", alignItems:"center", gap:8,
                  padding:"10px 6px", marginTop:4 }}>
                  <span style={{ fontSize:14, color:A.inkG }}>⠿</span>
                  <span style={{ fontSize:11, color:A.inkG,
                    fontFamily:"'DM Sans',sans-serif" }}>
                    Drag and drop to reorder banners
                  </span>
                </div>
              </div>
            </div>

            {/* CENTER — Mobile Preview */}
            <div style={{ width:280, background:A.bg1, borderRadius:16,
              border:`1px solid ${A.glBd}`, overflow:"hidden",
              display:"flex", flexDirection:"column", flexShrink:0 }}>
              <MobilePreview selected={selected}/>
            </div>

            {/* RIGHT — Editor */}
            <div style={{ flex:1, background:A.bg1, borderRadius:16,
              border:`1px solid ${A.glBd}`, overflow:"hidden",
              display:"flex", flexDirection:"column" }}>
              <BannerEditor banner={selected} onSave={handleSave} onDelete={handleDelete}/>
            </div>
          </div>
        )}

        {/* ── OFFER CARDS TAB ── */}
        {activeTab==="offers" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            background:A.bg1, borderRadius:16, border:`1px solid ${A.glBd}`,
            overflow:"hidden", marginTop:16 }}>
            <OfferCardsTab/>
          </div>
        )}

        {/* ── POPUPS TAB ── */}
        {activeTab==="popups" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            background:A.bg1, borderRadius:16, border:`1px solid ${A.glBd}`,
            overflow:"hidden", marginTop:16 }}>
            <PopupsTab/>
          </div>
        )}

        {/* ── FESTIVAL THEMES TAB ── */}
        {activeTab==="themes" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            background:A.bg1, borderRadius:16, border:`1px solid ${A.glBd}`,
            overflow:"hidden", marginTop:16 }}>
            <FestivalThemesTab/>
          </div>
        )}

        {/* ── MEDIA LIBRARY TAB ── */}
        {activeTab==="media" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            background:A.bg1, borderRadius:16, border:`1px solid ${A.glBd}`,
            overflow:"hidden", marginTop:16 }}>
            <MediaLibraryTab/>
          </div>
        )}

        {/* ── ANALYTICS BAR — only on banners tab ── */}
        {activeTab==="banners" && <AnalyticsBar/>}
      </div>
    </div>
  );
}
