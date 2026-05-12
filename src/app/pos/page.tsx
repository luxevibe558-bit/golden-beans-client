"use client";

// ═══════════════════════════════════════════════════════════════
// GOLDEN BEANS — PREMIUM CINEMATIC POS SYSTEM
// File: src/app/pos/page.tsx
// Design: Apple + Starbucks Reserve + Stripe + Netflix
// ═══════════════════════════════════════════════════════════════

import SettleBillModal from "@/components/SettleBillModal";
import { useState, useEffect, useCallback, useRef } from "react";
import POSSidebar from "@/components/POSSidebar";
import { menuApi, orderApi, tableApi, inventoryApi } from "@/lib/api";
import { getThumbnailUrl } from "@/lib/cloudinary";
import type { MenuCategory, MenuItem, CartItem, Table, Order } from "@/types";

// ── Design System ──────────────────────────────────────────────
const C = {
  // Backgrounds
  bg0:   "#050505",
  bg1:   "#0B0B0B",
  bg2:   "#111111",
  bg3:   "#171717",
  bg4:   "#1E1E1E",
  // Gold
  gold:  "#D4A44F",
  goldM: "#F5D27A",
  goldD: "#A56A1F",
  goldG: "rgba(212,164,79,0.15)",
  goldB: "rgba(212,164,79,0.25)",
  // Text
  ink:   "#FFFFFF",
  inkS:  "#B7B7B7",
  inkD:  "#666666",
  inkG:  "#333333",
  // UI
  gl1:   "rgba(255,255,255,0.04)",
  gl2:   "rgba(255,255,255,0.07)",
  gl3:   "rgba(255,255,255,0.10)",
  glBd:  "rgba(255,255,255,0.08)",
  // Status
  green: "#22C55E",
  red:   "#EF4444",
  amber: "#F59E0B",
  blue:  "#3B82F6",
};
const GG   = `linear-gradient(135deg,${C.gold} 0%,${C.goldM} 100%)`;
const GG2  = `linear-gradient(135deg,${C.goldD} 0%,${C.gold} 100%)`;
const EA   = "cubic-bezier(0.25,0.46,0.45,0.94)";
const ESPR = "cubic-bezier(0.34,1.56,0.64,1)";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
  .hs{scrollbar-width:none;} .hs::-webkit-scrollbar{display:none;}
  .pos-item:hover .pos-item-overlay{opacity:1!important;}
  .pos-item:hover{transform:translateY(-2px)!important;box-shadow:0 12px 32px rgba(0,0,0,0.5),0 0 0 1px rgba(212,164,79,0.2)!important;}
  .cat-pill:hover{background:rgba(255,255,255,0.07)!important;color:#fff!important;}
  .tbl-card:hover{border-color:rgba(212,164,79,0.4)!important;transform:translateY(-2px)!important;}
  .cart-item:hover{background:rgba(255,255,255,0.06)!important;}
  .action-btn:hover{filter:brightness(1.15);transform:translateY(-1px);}
  .action-btn:active{transform:scale(0.96)!important;}
  .sidebar-link:hover{background:rgba(212,164,79,0.08)!important;color:#F5D27A!important;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(212,164,79,0.2)}50%{box-shadow:0 0 40px rgba(212,164,79,0.4)}}
  @keyframes ring{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}
  .skeleton{background:linear-gradient(90deg,${C.bg3} 25%,${C.bg4} 50%,${C.bg3} 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;}
`;

const ITEM_EMOJIS: Record<string,string> = {
  Espresso:"☕",Cappuccino:"☕",Latte:"🥛","Masala Chai":"🫖",
  "Hot Chocolate":"🍫","Cold Brew":"🧊","Iced Latte":"🥤","Chocolate Frappe":"🧋",
  "Butter Toast":"🍞","Cheese Sandwich":"🥪","Garlic Bread":"🥖",
  "Chocolate Brownie":"🍫","Cheesecake Slice":"🍰","Classic Omelette":"🍳","Pancake Stack":"🥞",
};

// ── Skeleton Loader ──────────────────────────────────────────
function SkeletonCard() {
  return(
    <div className="skeleton" style={{borderRadius:16,height:200,
      background:`linear-gradient(90deg,${C.bg3} 25%,${C.bg4} 50%,${C.bg3} 75%)`,
      backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}}/>
  );
}

// ── Today Stats Bar ─────────────────────────────────────────
function TodayStats() {
  const [stats,setStats]=useState<{revenue:number;count:number;topItems:any[]}|null>(null);

  useEffect(()=>{
    const load=async()=>{
      try{
        const API=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
        const r=await fetch(`${API}/orders/today-stats`).then(r=>r.json());
        if(r.success) setStats(r.data);
      }catch{}
    };
    load();
    const iv=setInterval(load,30000);
    return()=>clearInterval(iv);
  },[]);

  if(!stats) return(
    <div className="skeleton" style={{height:80,borderRadius:14}}/>
  );

  return(
    <div style={{background:C.bg2,borderRadius:14,padding:"14px 16px",
      border:`1px solid ${C.glBd}`,marginBottom:16}}>
      <p style={{fontSize:10,color:C.inkD,fontFamily:"'DM Mono',monospace",
        letterSpacing:".12em",textTransform:"uppercase",margin:"0 0 6px"}}>
        Today's Overview
      </p>
      <div style={{display:"flex",gap:20}}>
        <div>
          <p style={{fontFamily:"'Playfair Display',serif",fontSize:22,
            fontWeight:700,color:C.gold,margin:0,lineHeight:1}}>
            ₹{stats.revenue>=1000?`${(stats.revenue/1000).toFixed(1)}K`:stats.revenue}
          </p>
          <p style={{fontSize:10,color:C.inkD,margin:"2px 0 0",
            fontFamily:"Inter,sans-serif"}}>Total Sales</p>
        </div>
        <div style={{width:1,background:C.glBd}}/>
        <div>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:22,
            fontWeight:500,color:C.ink,margin:0,lineHeight:1}}>
            {stats.count}
          </p>
          <p style={{fontSize:10,color:C.inkD,margin:"2px 0 0",
            fontFamily:"Inter,sans-serif"}}>Orders</p>
        </div>
        <div style={{width:1,background:C.glBd}}/>
        <div>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:22,
            fontWeight:500,color:C.ink,margin:0,lineHeight:1}}>
            ₹{stats.count>0?Math.round(stats.revenue/stats.count):0}
          </p>
          <p style={{fontSize:10,color:C.inkD,margin:"2px 0 0",
            fontFamily:"Inter,sans-serif"}}>Avg Order</p>
        </div>
      </div>
    </div>
  );
}

// ── Table Grid ──────────────────────────────────────────────
function TableGrid({tables,tableOrders,tableRequests,onSelect,pendingCount}:{
  tables:Table[];tableOrders:Record<string,Order>;
  tableRequests:Record<string,any[]>;
  onSelect:(t:Table)=>void;
  pendingCount:number;
}) {
  const getStatus = (t:Table)=>{
    const o=tableOrders[t._id];
    if(!o) return "available";
    if(o.status==="ready") return "ready";
    if(o.status==="kotSent") return "cooking";
    if(["open","pending_approval"].includes(o.status)) return "active";
    return "available";
  };

  const STATUS_CONFIG:{[k:string]:{color:string;bg:string;label:string;dot:string}}={
    available: {color:C.inkD,    bg:C.bg3,                     label:"Available", dot:"#3F3F3F"},
    active:    {color:C.goldM,   bg:"rgba(212,164,79,0.06)",   label:"Active",    dot:C.gold},
    cooking:   {color:"#F59E0B", bg:"rgba(245,158,11,0.06)",   label:"Cooking",   dot:"#F59E0B"},
    ready:     {color:C.green,   bg:"rgba(34,197,94,0.06)",    label:"Ready",     dot:C.green},
  };

  return(
    <div style={{flex:1,overflowY:"auto",padding:"0 22px 24px"}} className="hs">
      {/* Stats */}
      <TodayStats/>

      {/* Pending approvals banner */}
      {pendingCount>0&&(
        <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.25)",
          borderRadius:12,padding:"11px 16px",marginBottom:16,
          display:"flex",alignItems:"center",gap:10,
          animation:`glow 2s ease-in-out infinite`}}>
          <span style={{fontSize:18,animation:"ring 2s infinite"}}>🔔</span>
          <div style={{flex:1}}>
            <p style={{fontSize:13,fontWeight:600,color:"#F59E0B",
              fontFamily:"Inter,sans-serif",margin:0}}>
              {pendingCount} order{pendingCount>1?"s":""} waiting approval
            </p>
            <p style={{fontSize:11,color:C.inkD,margin:0,fontFamily:"Inter,sans-serif"}}>
              Review and approve customer orders
            </p>
          </div>
          <div style={{width:8,height:8,borderRadius:"50%",
            background:"#F59E0B",animation:"pulse 1s infinite"}}/>
        </div>
      )}

      {/* Table grid */}
      <div style={{display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",
        gap:12}}>
        {tables.map((t,i)=>{
          const status=getStatus(t);
          const sc=STATUS_CONFIG[status];
          const order=tableOrders[t._id];
          const reqs=tableRequests[t._id]||[];
          const itemCount=order?.items?.reduce((s:number,i:any)=>s+i.quantity,0)||0;

          return(
            <div key={t._id} className="tbl-card"
              onClick={()=>onSelect(t)}
              style={{background:sc.bg,borderRadius:16,padding:"16px 14px",
                border:`1px solid ${status==="available"?C.glBd:`${sc.dot}35`}`,
                cursor:"pointer",transition:`all 0.2s ${EA}`,
                position:"relative",overflow:"hidden",
                animation:`fadeUp 0.4s ${i*0.03}s ease both`}}>
              {/* Status dot */}
              <div style={{position:"absolute",top:10,right:10,
                width:8,height:8,borderRadius:"50%",
                background:sc.dot,
                boxShadow:status!=="available"?`0 0 8px ${sc.dot}`:undefined,
                animation:["cooking","ready"].includes(status)?"pulse 1.5s infinite":"none"}}/>

              {/* Help request badge */}
              {reqs.length>0&&(
                <div style={{position:"absolute",top:6,left:6,
                  width:18,height:18,borderRadius:"50%",
                  background:"#EF4444",display:"flex",
                  alignItems:"center",justifyContent:"center",
                  fontSize:9,color:"white",fontWeight:700,
                  animation:"pulse 1s infinite"}}>
                  {reqs.length}
                </div>
              )}

              <p style={{fontFamily:"'Playfair Display',serif",fontSize:28,
                fontWeight:700,color:status==="available"?C.inkG:sc.color,
                margin:"0 0 2px",lineHeight:1}}>
                {t.tableNumber}
              </p>
              <p style={{fontSize:10,color:sc.color,fontWeight:600,
                margin:"0 0 8px",fontFamily:"Inter,sans-serif",
                letterSpacing:".05em"}}>
                {sc.label}
              </p>

              {order&&(
                <div>
                  <p style={{fontSize:11,color:C.inkS,fontFamily:"'DM Mono',monospace",
                    margin:"0 0 2px"}}>
                    #{order.orderNumber}
                  </p>
                  <p style={{fontSize:11,color:C.inkD,fontFamily:"Inter,sans-serif",margin:0}}>
                    {itemCount} items · ₹{order.totalAmount}
                  </p>
                </div>
              )}

              {/* Bottom glow for active tables */}
              {status!=="available"&&(
                <div style={{position:"absolute",bottom:0,left:0,right:0,
                  height:2,background:`linear-gradient(90deg,transparent,${sc.dot},transparent)`}}/>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Menu Item Card ────────────────────────────────────────────
function ItemCard({item,qty,onAdd,onRemove}:{
  item:MenuItem;qty:number;
  onAdd:()=>void;onRemove:()=>void;
}) {
  const imgUrl = item.imageUrl ? getThumbnailUrl(item.imageUrl) : null;
  const emoji  = ITEM_EMOJIS[item.name]||"☕";

  return(
    <div className="pos-item"
      style={{borderRadius:16,overflow:"hidden",cursor:"pointer",
        background:C.bg2,border:`1px solid ${qty>0?"rgba(212,164,79,0.3)":C.glBd}`,
        transition:`all 0.2s ${EA}`,position:"relative",
        boxShadow:qty>0?`0 8px 24px rgba(212,164,79,0.1)`:"none"}}
      onClick={onAdd}>

      {/* Image / Emoji */}
      <div style={{height:130,overflow:"hidden",position:"relative",
        background:`linear-gradient(135deg,#1A1008,${C.bg3})`}}>
        {imgUrl
          ?<img src={imgUrl} alt={item.name} loading="lazy"
              style={{width:"100%",height:"100%",objectFit:"cover",
                transition:`transform 0.3s ${EA}`}}/>
          :<div style={{width:"100%",height:"100%",display:"flex",
              alignItems:"center",justifyContent:"center",
              fontSize:48,opacity:.6}}>{emoji}</div>
        }
        {/* Gradient overlay */}
        <div style={{position:"absolute",inset:0,
          background:"linear-gradient(to top,rgba(5,5,5,0.8) 0%,transparent 60%)"}}/>

        {/* Hover overlay */}
        <div className="pos-item-overlay"
          style={{position:"absolute",inset:0,opacity:0,
            background:"rgba(212,164,79,0.08)",
            transition:`opacity 0.2s ${EA}`}}/>

        {/* Badges */}
        {(item as any).badge&&(
          <div style={{position:"absolute",top:8,left:8,
            padding:"3px 8px",borderRadius:99,fontSize:9,fontWeight:700,
            background:(item as any).badge==="Popular"?"rgba(212,164,79,0.9)":
                       (item as any).badge==="New"?"rgba(59,130,246,0.9)":"rgba(34,197,94,0.9)",
            color:"#050505",letterSpacing:".05em",
            fontFamily:"Inter,sans-serif"}}>
            {(item as any).badge}
          </div>
        )}

        {/* Qty badge */}
        {qty>0&&(
          <div style={{position:"absolute",top:8,right:8,
            width:26,height:26,borderRadius:"50%",
            background:GG,display:"flex",
            alignItems:"center",justifyContent:"center",
            fontSize:12,fontWeight:700,color:"#050505",
            fontFamily:"'DM Mono',monospace",
            boxShadow:`0 4px 12px rgba(212,164,79,0.4)`,
            animation:`scaleIn 0.2s ${ESPR}`}}>
            {qty}
          </div>
        )}

        {/* Price */}
        <p style={{position:"absolute",bottom:8,left:10,
          fontFamily:"'DM Mono',monospace",fontSize:14,
          fontWeight:500,color:C.gold,margin:0}}>
          ₹{item.price}
        </p>
      </div>

      {/* Info */}
      <div style={{padding:"10px 11px 11px"}}>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:14,
          fontWeight:700,color:C.ink,margin:"0 0 3px",
          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {item.name}
        </p>
        {/* Qty controls */}
        {qty>0?(
          <div style={{display:"flex",alignItems:"center",
            gap:0,background:C.gl2,borderRadius:8,overflow:"hidden"}}
            onClick={e=>e.stopPropagation()}>
            <button onClick={e=>{e.stopPropagation();onRemove();}}
              style={{flex:1,height:28,background:"none",border:"none",
                color:C.inkS,fontSize:16,cursor:"pointer",
                fontFamily:"Inter,sans-serif"}}>−</button>
            <span style={{width:28,textAlign:"center",
              fontFamily:"'DM Mono',monospace",fontSize:13,
              fontWeight:600,color:C.gold}}>{qty}</span>
            <button onClick={e=>{e.stopPropagation();onAdd();}}
              style={{flex:1,height:28,background:"none",border:"none",
                color:C.gold,fontSize:16,cursor:"pointer",
                fontFamily:"Inter,sans-serif"}}>+</button>
          </div>
        ):(
          <div style={{height:28,borderRadius:8,background:C.gl1,
            display:"flex",alignItems:"center",justifyContent:"center",
            gap:4}}>
            <span style={{fontSize:12,color:C.inkD,
              fontFamily:"Inter,sans-serif"}}>+ Add</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cart Item ────────────────────────────────────────────────
function CartItemRow({item,onAdd,onRemove}:{
  item:CartItem;
  onAdd:()=>void;onRemove:()=>void;
}) {
  return(
    <div className="cart-item"
      style={{display:"flex",alignItems:"center",gap:10,
        padding:"10px 12px",borderRadius:12,
        transition:`background 0.15s ${EA}`,cursor:"default"}}>
      <div style={{width:36,height:36,borderRadius:10,
        background:C.gl2,display:"flex",alignItems:"center",
        justifyContent:"center",fontSize:18,flexShrink:0}}>
        {ITEM_EMOJIS[item.name]||"🍽️"}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:13,fontWeight:600,color:C.ink,
          fontFamily:"Inter,sans-serif",margin:"0 0 1px",
          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {item.name}
        </p>
        <p style={{fontSize:11,color:C.inkD,margin:0,
          fontFamily:"'DM Mono',monospace"}}>
          ₹{item.price} each
        </p>
      </div>
      {/* Qty controls */}
      <div style={{display:"flex",alignItems:"center",gap:0,
        background:C.gl2,borderRadius:8,overflow:"hidden",flexShrink:0}}>
        <button onClick={onRemove}
          style={{width:28,height:28,background:"none",border:"none",
            color:C.inkS,fontSize:16,cursor:"pointer"}}>−</button>
        <span style={{width:24,textAlign:"center",
          fontFamily:"'DM Mono',monospace",fontSize:13,
          fontWeight:600,color:C.gold}}>{item.quantity}</span>
        <button onClick={onAdd}
          style={{width:28,height:28,background:"none",border:"none",
            color:C.gold,fontSize:16,cursor:"pointer"}}>+</button>
      </div>
      <p style={{fontSize:13,fontWeight:700,color:C.ink,
        fontFamily:"'DM Mono',monospace",flexShrink:0,
        width:52,textAlign:"right"}}>
        ₹{item.price*item.quantity}
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN POS PAGE
// ══════════════════════════════════════════════════════════════
export default function POSPage() {
  const [view,            setView           ] = useState<"tables"|"order">("tables");
  const [tables,          setTables         ] = useState<Table[]>([]);
  const [tableOrders,     setTableOrders    ] = useState<Record<string,Order>>({});
  const [menu,            setMenu           ] = useState<MenuCategory[]>([]);
  const [selectedTable,   setSelectedTable  ] = useState<Table|null>(null);
  const [currentOrder,    setCurrentOrder   ] = useState<Order|null>(null);
  const [pendingOrders,   setPendingOrders  ] = useState<Order[]>([]);
  const [cart,            setCart           ] = useState<CartItem[]>([]);
  const [loading,         setLoading        ] = useState(true);
  const [activeCategory,  setActiveCategory ] = useState("");
  const [searchQuery,     setSearchQuery    ] = useState("");
  const [settleModalOrder,setSettleModalOrder] = useState<Order|null>(null);
  const [lowStockItems,   setLowStockItems  ] = useState<any[]>([]);
  const [tableRequests,   setTableRequests  ] = useState<Record<string,any[]>>({});
  const [currentTime,     setCurrentTime    ] = useState(new Date());
  const [cancelModal,     setCancelModal    ] = useState<Order|null>(null);
  const [cancelReason,    setCancelReason   ] = useState("");
  const [showPending,     setShowPending    ] = useState(false);
  const [orderNote,       setOrderNote      ] = useState("");
  const [placing,         setPlacing        ] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Clock
  useEffect(()=>{
    const iv=setInterval(()=>setCurrentTime(new Date()),1000);
    return()=>clearInterval(iv);
  },[]);

  // Cmd+K shortcut for search
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&e.key==="k"){
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);

  // ── Data Loading ──
  const loadTables = useCallback(async()=>{
    try{
      const res=await tableApi.getTables();
      const tbls:Table[]=res.data.data;
      setTables(tbls);
      const orderMap:Record<string,Order>={};
      await Promise.all(tbls.filter(t=>t.currentOrderId).map(async t=>{
        try{ const r=await orderApi.getOrderByTable(t._id); if(r.data.data) orderMap[t._id]=r.data.data; }catch{}
      }));
      setTableOrders(orderMap);
      try{
        const API=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
        const wr=await fetch(`${API}/waiter/all-requests`).then(r=>r.json());
        const requests:any[]=wr.requests||[];
        const reqMap:Record<string,any[]>={};
        requests.forEach(r=>{ if(!reqMap[r.tableId]) reqMap[r.tableId]=[]; reqMap[r.tableId].push(r); });
        setTableRequests(reqMap);
      }catch{}
    }catch{}
  },[]);

  const loadPendingApprovals=useCallback(async()=>{
    try{ const res=await orderApi.getPendingApproval(); setPendingOrders(res.data.data||[]); }catch{}
  },[]);

  const loadLowStock=useCallback(async()=>{
    try{ const res=await inventoryApi.getLowStock(); setLowStockItems(res.data.data||[]); }catch{}
  },[]);

  useEffect(()=>{
    async function init(){
      try{
        const [tablesRes,menuRes]=await Promise.all([tableApi.getTables(),menuApi.getMenu()]);
        const tbls:Table[]=tablesRes.data.data;
        setTables(tbls); setMenu(menuRes.data.data);
        if(menuRes.data.data.length>0) setActiveCategory(menuRes.data.data[0]._id);
        const orderMap:Record<string,Order>={};
        await Promise.all(tbls.filter(t=>t.currentOrderId).map(async t=>{
          try{ const r=await orderApi.getOrderByTable(t._id); if(r.data.data) orderMap[t._id]=r.data.data; }catch{}
        }));
        setTableOrders(orderMap);
        try{
          const API=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
          const wr=await fetch(`${API}/waiter/all-requests`).then(r=>r.json());
          const requests:any[]=wr.requests||[];
          const reqMap:Record<string,any[]>={};
          requests.forEach(r=>{ if(!reqMap[r.tableId]) reqMap[r.tableId]=[]; reqMap[r.tableId].push(r); });
          setTableRequests(reqMap);
        }catch{}
      }catch{}finally{ setLoading(false); }
    }
    init(); loadPendingApprovals(); loadLowStock();
    const iv=setInterval(()=>{ loadTables(); loadPendingApprovals(); loadLowStock(); },5000);
    return()=>clearInterval(iv);
  },[loadTables,loadPendingApprovals,loadLowStock]);

  // ── Table Selection ──
  const handleSelectTable=async(table:Table)=>{
    setSelectedTable(table); setCart([]); setSearchQuery("");
    if(table.currentOrderId){
      try{ const res=await orderApi.getOrderByTable(table._id); setCurrentOrder(res.data.data||null); }catch{ setCurrentOrder(null); }
    }else{ setCurrentOrder(null); }
    setView("order");
  };

  // ── Approvals ──
  const handleAccept=async(id:string)=>{
    try{ await orderApi.approveOrder(id); setPendingOrders(p=>p.filter(o=>o._id!==id)); loadTables(); }catch{}
  };
  const handleReject=async(id:string)=>{
    try{ await orderApi.rejectOrder(id,"Rejected by staff"); setPendingOrders(p=>p.filter(o=>o._id!==id)); loadTables(); }catch{}
  };

  // ── Cart ──
  const addToCart=(item:MenuItem)=>{
    setCart(prev=>{
      const ex=prev.find(c=>c.menuItemId===item._id);
      if(ex) return prev.map(c=>c.menuItemId===item._id?{...c,quantity:c.quantity+1}:c);
      return [...prev,{menuItemId:item._id,name:item.name,price:item.price,quantity:1,notes:"",isVeg:true}];
    });
  };
  const removeFromCart=(itemId:string)=>{
    setCart(prev=>{
      const ex=prev.find(c=>c.menuItemId===itemId);
      if(!ex) return prev;
      if(ex.quantity===1) return prev.filter(c=>c.menuItemId!==itemId);
      return prev.map(c=>c.menuItemId===itemId?{...c,quantity:c.quantity-1}:c);
    });
  };

  // ── KOT ──
  const sendKOT=async()=>{
    if(!selectedTable||cart.length===0) return;
    setPlacing(true);
    try{
      const res=await orderApi.createOrder({tableId:selectedTable._id,items:cart,createdBy:"pos",notes:orderNote});
      setCurrentOrder(res.data.data); setCart([]); setOrderNote(""); loadTables(); loadLowStock();
    }catch(e:unknown){ alert(e instanceof Error?e.message:"Failed to send KOT"); }
    setPlacing(false);
  };

  // ── Cancel ──
  const handleCancelOrder=async()=>{
    if(!cancelModal) return;
    try{
      const API=process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";
      await fetch(`${API}/orders/${cancelModal._id}/cancel`,{
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({reason:cancelReason||"Cancelled by staff",cancelledBy:"cashier"}),
      });
      setCancelModal(null); setCancelReason("");
      setCurrentOrder(null); setSelectedTable(null); setCart([]);
      setView("tables"); loadTables();
    }catch{}
  };

  // ── Computed ──
  const subtotal = cart.reduce((s,i)=>s+i.price*i.quantity,0);
  const tax      = Math.round(subtotal*0.05*100)/100;
  const total    = subtotal+tax;
  const cartQty  = (itemId:string)=>cart.find(c=>c.menuItemId===itemId)?.quantity||0;
  const totalCartItems = cart.reduce((s,i)=>s+i.quantity,0);

  const activeItems = searchQuery
    ? menu.flatMap(c=>c.items).filter(i=>i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : (menu.find(c=>c._id===activeCategory)?.items||[]);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return(
    <div style={{display:"flex",height:"100vh",background:C.bg0,overflow:"hidden",
      fontFamily:"Inter,sans-serif",color:C.ink}}>
      <style>{STYLES}</style>

      {/* ── SIDEBAR ── */}
      <POSSidebar/>

      {/* ── MAIN CONTENT ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* ── TOP HEADER ── */}
        <div style={{height:60,flexShrink:0,
          borderBottom:`1px solid ${C.glBd}`,
          background:C.bg1,
          display:"flex",alignItems:"center",
          padding:"0 20px",gap:16}}>

          {/* Back button (order view) */}
          {view==="order"&&(
            <button onClick={()=>{setView("tables");setSelectedTable(null);setCurrentOrder(null);setCart([]);}}
              style={{width:36,height:36,borderRadius:10,
                background:C.gl2,border:`1px solid ${C.glBd}`,
                color:C.inkS,cursor:"pointer",fontSize:14,
                display:"flex",alignItems:"center",justifyContent:"center",
                flexShrink:0}}>
              ←
            </button>
          )}

          {/* Title */}
          <div style={{flexShrink:0}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:18,
              fontWeight:700,color:C.ink,margin:0,lineHeight:1}}>
              {view==="tables"?"POS System":
                `Table ${selectedTable?.tableNumber||""}`}
            </h2>
            <p style={{fontSize:11,color:C.inkD,margin:"1px 0 0",
              fontFamily:"Inter,sans-serif"}}>
              {view==="tables"?"Create orders, manage tables & process payments":
                `Order ${currentOrder?"#"+currentOrder.orderNumber:"• New"}`}
            </p>
          </div>

          {/* Search (order view) */}
          {view==="order"&&(
            <div style={{flex:1,maxWidth:400,position:"relative"}}>
              <span style={{position:"absolute",left:12,top:"50%",
                transform:"translateY(-50%)",fontSize:14,color:C.inkD,
                pointerEvents:"none"}}>🔍</span>
              <input ref={searchRef}
                value={searchQuery}
                onChange={e=>setSearchQuery(e.target.value)}
                placeholder="Search items..."
                style={{width:"100%",padding:"9px 12px 9px 36px",
                  borderRadius:10,border:`1px solid ${C.glBd}`,
                  background:C.gl1,color:C.ink,fontSize:13,outline:"none",
                  fontFamily:"Inter,sans-serif"}}/>
              <div style={{position:"absolute",right:10,top:"50%",
                transform:"translateY(-50%)",fontSize:10,
                color:C.inkD,fontFamily:"'DM Mono',monospace",
                background:C.gl2,padding:"2px 6px",borderRadius:5,
                border:`1px solid ${C.glBd}`}}>
                ⌘K
              </div>
            </div>
          )}

          <div style={{flex:1}}/>

          {/* Order type (order view) */}
          {view==="order"&&(
            <div style={{display:"flex",borderRadius:10,overflow:"hidden",
              border:`1px solid ${C.glBd}`,flexShrink:0}}>
              {["Dine In","Takeaway","Delivery"].map(t=>(
                <button key={t}
                  style={{padding:"7px 14px",fontSize:12,fontWeight:600,
                    border:"none",cursor:"pointer",
                    background:t==="Dine In"?GG:C.gl1,
                    color:t==="Dine In"?"#050505":C.inkS,
                    fontFamily:"Inter,sans-serif",
                    transition:`all 0.15s ${EA}`}}>
                  {t==="Dine In"?"🍽️":t==="Takeaway"?"🛍️":"🚗"} {t}
                </button>
              ))}
            </div>
          )}

          {/* Notifications */}
          <button onClick={()=>setShowPending(!showPending)}
            style={{width:36,height:36,borderRadius:10,
              background:pendingOrders.length>0?"rgba(245,158,11,0.1)":C.gl1,
              border:`1px solid ${pendingOrders.length>0?"rgba(245,158,11,0.3)":C.glBd}`,
              color:pendingOrders.length>0?"#F59E0B":C.inkS,
              cursor:"pointer",fontSize:16,position:"relative",
              display:"flex",alignItems:"center",justifyContent:"center",
              flexShrink:0}}>
            🔔
            {pendingOrders.length>0&&(
              <div style={{position:"absolute",top:-4,right:-4,
                width:18,height:18,borderRadius:"50%",
                background:"#EF4444",fontSize:9,fontWeight:700,
                color:"white",display:"flex",alignItems:"center",
                justifyContent:"center",animation:"pulse 1s infinite"}}>
                {pendingOrders.length}
              </div>
            )}
          </button>

          {/* Low stock alert */}
          {lowStockItems.length>0&&(
            <div style={{padding:"6px 10px",borderRadius:8,
              background:"rgba(239,68,68,0.08)",
              border:"1px solid rgba(239,68,68,0.2)",
              fontSize:11,color:"#EF4444",fontFamily:"Inter,sans-serif",
              fontWeight:600,flexShrink:0}}>
              ⚠ {lowStockItems.length} low stock
            </div>
          )}

          {/* Time */}
          <div style={{textAlign:"right",flexShrink:0}}>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:16,
              fontWeight:500,color:C.gold,margin:0,lineHeight:1}}>
              {currentTime.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true})}
            </p>
            <p style={{fontSize:10,color:C.inkD,margin:"1px 0 0",
              fontFamily:"Inter,sans-serif"}}>
              {currentTime.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
            </p>
          </div>

          {/* Profile */}
          <div style={{width:36,height:36,borderRadius:10,
            background:GG2,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:14,fontWeight:700,
            color:"#050505",flexShrink:0,cursor:"pointer"}}>
            NP
          </div>
        </div>

        {/* ── PENDING APPROVALS PANEL ── */}
        {showPending&&pendingOrders.length>0&&(
          <div style={{position:"absolute",top:60,right:20,
            width:360,background:C.bg2,borderRadius:16,
            border:`1px solid rgba(245,158,11,0.3)`,
            boxShadow:`0 20px 60px rgba(0,0,0,0.6)`,
            zIndex:100,animation:`scaleIn 0.2s ${ESPR}`,
            maxHeight:480,overflowY:"auto"}} className="hs">
            <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.glBd}`,
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <p style={{fontSize:14,fontWeight:600,color:"#F59E0B",
                fontFamily:"Inter,sans-serif",margin:0}}>
                🔔 Pending Approvals ({pendingOrders.length})
              </p>
              <button onClick={()=>setShowPending(false)}
                style={{background:"none",border:"none",color:C.inkD,
                  cursor:"pointer",fontSize:16}}>✕</button>
            </div>
            {pendingOrders.map(o=>(
              <div key={o._id} style={{padding:"12px 16px",
                borderBottom:`1px solid ${C.glBd}`}}>
                <div style={{display:"flex",justifyContent:"space-between",
                  alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <p style={{fontSize:13,fontWeight:600,color:C.ink,
                      fontFamily:"Inter,sans-serif",margin:0}}>
                      Table {o.tableNumber} · #{o.orderNumber}
                    </p>
                    <p style={{fontSize:11,color:C.inkD,
                      fontFamily:"Inter,sans-serif",margin:"2px 0 0"}}>
                      {o.customerName||"Guest"} · {o.items?.length} items · ₹{o.totalAmount}
                    </p>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>handleAccept(o._id)}
                    style={{flex:1,padding:"8px",borderRadius:9,
                      border:"none",background:"rgba(34,197,94,0.15)",
                      color:C.green,fontWeight:700,fontSize:12,
                      cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                    ✓ Accept
                  </button>
                  <button onClick={()=>handleReject(o._id)}
                    style={{flex:1,padding:"8px",borderRadius:9,
                      border:"none",background:"rgba(239,68,68,0.1)",
                      color:"#EF4444",fontWeight:700,fontSize:12,
                      cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── VIEWS ── */}
        {view==="tables"?(
          /* TABLE VIEW */
          <div style={{flex:1,overflowY:"auto",padding:"20px 22px 0"}} className="hs">
            {loading?(
              <div style={{display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12}}>
                {Array.from({length:12}).map((_,i)=>(
                  <div key={i} className="skeleton" style={{height:120,borderRadius:16}}/>
                ))}
              </div>
            ):(
              <TableGrid tables={tables} tableOrders={tableOrders}
                tableRequests={tableRequests}
                onSelect={handleSelectTable}
                pendingCount={pendingOrders.length}/>
            )}
          </div>
        ):(
          /* ORDER VIEW — 2 column layout */
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>

            {/* LEFT — Menu */}
            <div style={{flex:1,display:"flex",flexDirection:"column",
              overflow:"hidden",borderRight:`1px solid ${C.glBd}`}}>

              {/* Category pills */}
              {!searchQuery&&(
                <div className="hs" style={{display:"flex",gap:8,
                  padding:"12px 16px",borderBottom:`1px solid ${C.glBd}`,
                  overflowX:"auto",flexShrink:0}}>
                  <button className="cat-pill"
                    onClick={()=>{/* Favorites */}}
                    style={{display:"flex",alignItems:"center",gap:5,
                      padding:"7px 14px",borderRadius:99,fontSize:12,
                      fontWeight:600,border:`1px solid ${C.glBd}`,
                      background:C.gl1,color:C.inkD,
                      cursor:"pointer",whiteSpace:"nowrap",
                      transition:`all 0.15s ${EA}`,fontFamily:"Inter,sans-serif"}}>
                    ☆ Favorites
                  </button>
                  {menu.map(cat=>(
                    <button key={cat._id} className="cat-pill"
                      onClick={()=>setActiveCategory(cat._id)}
                      style={{display:"flex",alignItems:"center",gap:5,
                        padding:"7px 16px",borderRadius:99,fontSize:12,
                        fontWeight:600,whiteSpace:"nowrap",
                        border:`1px solid ${activeCategory===cat._id?"rgba(212,164,79,0.5)":C.glBd}`,
                        background:activeCategory===cat._id?GG:C.gl1,
                        color:activeCategory===cat._id?"#050505":C.inkS,
                        cursor:"pointer",
                        boxShadow:activeCategory===cat._id?`0 4px 12px rgba(212,164,79,0.25)`:undefined,
                        transition:`all 0.15s ${EA}`,fontFamily:"Inter,sans-serif"}}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Product grid */}
              <div className="hs" style={{flex:1,overflowY:"auto",
                padding:"14px 16px",
                display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",
                gap:12,alignContent:"start"}}>
                {activeItems.filter(i=>i.isAvailable).map((item,idx)=>(
                  <div key={item._id} style={{animation:`fadeUp 0.3s ${idx*0.02}s ease both`}}>
                    <ItemCard item={item}
                      qty={cartQty(item._id)}
                      onAdd={()=>addToCart(item)}
                      onRemove={()=>removeFromCart(item._id)}/>
                  </div>
                ))}
                {activeItems.filter(i=>i.isAvailable).length===0&&(
                  <div style={{gridColumn:"1/-1",textAlign:"center",
                    padding:"60px 20px",color:C.inkD}}>
                    <p style={{fontSize:32,marginBottom:8}}>🔍</p>
                    <p style={{fontFamily:"Inter,sans-serif",fontSize:14}}>
                      No items found
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom quick actions */}
              <div style={{display:"flex",gap:8,padding:"10px 16px",
                borderTop:`1px solid ${C.glBd}`,flexShrink:0,
                overflowX:"auto"}} className="hs">
                {[
                  {icon:"🏷️",label:"Apply Discount"},
                  {icon:"🎟️",label:"Apply Coupon"},
                  {icon:"🧾",label:"Tax Exempt"},
                  {icon:"👥",label:"Split Bill"},
                  {icon:"⏸️",label:"Hold Order"},
                  {icon:"🕐",label:"Recent Orders"},
                ].map(a=>(
                  <button key={a.label} className="action-btn"
                    style={{display:"flex",flexDirection:"column",
                      alignItems:"center",gap:4,padding:"8px 14px",
                      borderRadius:10,border:`1px solid ${C.glBd}`,
                      background:C.gl1,cursor:"pointer",flexShrink:0,
                      transition:`all 0.15s ${EA}`}}>
                    <span style={{fontSize:16}}>{a.icon}</span>
                    <span style={{fontSize:9.5,color:C.inkS,
                      fontFamily:"Inter,sans-serif",fontWeight:600,
                      whiteSpace:"nowrap"}}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT — Order Panel */}
            <div style={{width:320,display:"flex",flexDirection:"column",
              background:C.bg1,overflow:"hidden"}}>

              {/* Order panel header */}
              <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.glBd}`,flexShrink:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:16,
                    fontWeight:700,color:C.ink,margin:0}}>
                    Current Order
                  </h3>
                  {(cart.length>0||currentOrder)&&(
                    <button onClick={()=>{setCart([]);}}
                      style={{fontSize:11,color:"#EF4444",fontFamily:"Inter,sans-serif",
                        background:"none",border:"none",cursor:"pointer",
                        fontWeight:600,padding:"4px 8px",borderRadius:6,
                        background:"rgba(239,68,68,0.08)"}}>
                      🗑 Clear
                    </button>
                  )}
                </div>

                {/* Table + guests info */}
                {selectedTable&&(
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    <div style={{flex:1,padding:"6px 10px",borderRadius:8,
                      background:C.gl2,display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:12,color:C.inkD}}>🪑</span>
                      <span style={{fontSize:12,fontWeight:600,color:C.gold,
                        fontFamily:"'DM Mono',monospace"}}>
                        Table {selectedTable.tableNumber}
                      </span>
                    </div>
                    {currentOrder&&(
                      <div style={{padding:"6px 10px",borderRadius:8,
                        background:C.gl2,display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:11,color:C.inkD,
                          fontFamily:"'DM Mono',monospace"}}>
                          #{currentOrder.orderNumber}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Current order items */}
              {currentOrder&&currentOrder.items.length>0&&(
                <div style={{padding:"8px 8px 0",flexShrink:0}}>
                  <p style={{fontSize:10,color:C.inkD,fontFamily:"'DM Mono',monospace",
                    letterSpacing:".1em",textTransform:"uppercase",
                    padding:"0 8px",margin:"0 0 6px"}}>
                    Existing Order
                  </p>
                  <div style={{background:"rgba(212,164,79,0.04)",
                    border:"1px solid rgba(212,164,79,0.12)",
                    borderRadius:12,overflow:"hidden"}}>
                    {currentOrder.items.slice(0,3).map(item=>(
                      <div key={(item as any)._id}
                        style={{display:"flex",justifyContent:"space-between",
                          padding:"8px 12px",borderBottom:`1px solid ${C.glBd}`}}>
                        <span style={{fontSize:12,color:C.inkS,
                          fontFamily:"Inter,sans-serif"}}>
                          {item.name} ×{item.quantity}
                        </span>
                        <span style={{fontSize:12,color:C.gold,
                          fontFamily:"'DM Mono',monospace",fontWeight:500}}>
                          ₹{item.price*item.quantity}
                        </span>
                      </div>
                    ))}
                    {currentOrder.items.length>3&&(
                      <p style={{fontSize:11,color:C.inkD,textAlign:"center",
                        padding:"6px",margin:0,fontFamily:"Inter,sans-serif"}}>
                        +{currentOrder.items.length-3} more items
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Cart items */}
              <div className="hs" style={{flex:1,overflowY:"auto",padding:"8px"}}>
                {cart.length===0&&!currentOrder?(
                  <div style={{display:"flex",flexDirection:"column",
                    alignItems:"center",justifyContent:"center",
                    height:"100%",padding:"40px 20px",textAlign:"center"}}>
                    <div style={{fontSize:40,marginBottom:12,opacity:.3}}>🛒</div>
                    <p style={{fontSize:13,color:C.inkD,fontFamily:"Inter,sans-serif",
                      lineHeight:1.6}}>
                      Select items from the menu to add to order
                    </p>
                  </div>
                ):(
                  <>
                    {cart.length>0&&(
                      <>
                        <p style={{fontSize:10,color:C.inkD,fontFamily:"'DM Mono',monospace",
                          letterSpacing:".1em",textTransform:"uppercase",
                          padding:"0 4px",margin:"4px 0 4px"}}>
                          New Items ({totalCartItems})
                        </p>
                        {cart.map(item=>(
                          <CartItemRow key={item.menuItemId} item={item}
                            onAdd={()=>addToCart({_id:item.menuItemId,name:item.name,price:item.price} as MenuItem)}
                            onRemove={()=>removeFromCart(item.menuItemId)}/>
                        ))}

                        {/* Order note */}
                        <div style={{padding:"0 4px",marginTop:6}}>
                          <input value={orderNote}
                            onChange={e=>setOrderNote(e.target.value)}
                            placeholder="+ Add order note..."
                            style={{width:"100%",padding:"8px 11px",borderRadius:9,
                              border:`1px solid ${C.glBd}`,background:C.gl1,
                              color:C.ink,fontSize:12,outline:"none",
                              fontFamily:"Inter,sans-serif",
                              color:C.inkS}}/>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Order summary + CTAs */}
              {(cart.length>0||currentOrder)&&(
                <div style={{padding:"12px 14px",borderTop:`1px solid ${C.glBd}`,flexShrink:0}}>
                  {cart.length>0&&(
                    <div style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",
                        padding:"3px 0"}}>
                        <span style={{fontSize:12,color:C.inkD,fontFamily:"Inter,sans-serif"}}>
                          Subtotal
                        </span>
                        <span style={{fontSize:12,color:C.inkS,
                          fontFamily:"'DM Mono',monospace"}}>₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",
                        padding:"3px 0"}}>
                        <span style={{fontSize:12,color:C.inkD,fontFamily:"Inter,sans-serif"}}>
                          Tax (5%)
                        </span>
                        <span style={{fontSize:12,color:C.inkS,
                          fontFamily:"'DM Mono',monospace"}}>₹{tax.toFixed(2)}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",
                        padding:"6px 0 0",borderTop:`1px solid ${C.glBd}`,marginTop:4}}>
                        <span style={{fontSize:14,fontWeight:700,color:C.ink,
                          fontFamily:"Inter,sans-serif"}}>Total</span>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,
                          fontWeight:700,color:C.gold}}>₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Primary CTA */}
                  {cart.length>0&&(
                    <button onClick={sendKOT} disabled={placing}
                      className="action-btn"
                      style={{width:"100%",padding:"13px",borderRadius:12,
                        border:"none",background:placing?C.gl1:GG,
                        color:placing?C.inkD:"#050505",fontWeight:700,
                        fontSize:14,cursor:placing?"not-allowed":"pointer",
                        fontFamily:"Inter,sans-serif",marginBottom:8,
                        boxShadow:placing?"none":`0 8px 24px rgba(212,164,79,0.3)`,
                        display:"flex",alignItems:"center",
                        justifyContent:"center",gap:8}}>
                      {placing
                        ?<><div style={{width:16,height:16,borderRadius:"50%",
                            border:`2px solid rgba(0,0,0,.2)`,
                            borderTopColor:"rgba(0,0,0,.6)",
                            animation:"spin .75s linear infinite"}}/>
                          Sending KOT...</>
                        :<>🖨️ Send KOT ({totalCartItems} items)</>}
                    </button>
                  )}

                  {/* Secondary CTAs */}
                  <div style={{display:"flex",gap:8}}>
                    {currentOrder&&(
                      <button onClick={()=>setSettleModalOrder(currentOrder)}
                        className="action-btn"
                        style={{flex:1,padding:"10px",borderRadius:10,
                          border:`1px solid rgba(34,197,94,0.3)`,
                          background:"rgba(34,197,94,0.08)",
                          color:C.green,fontWeight:700,fontSize:12,
                          cursor:"pointer",fontFamily:"Inter,sans-serif",
                          display:"flex",alignItems:"center",
                          justifyContent:"center",gap:5}}>
                        💳 Settle Bill
                      </button>
                    )}
                    {currentOrder&&(
                      <button onClick={()=>setCancelModal(currentOrder)}
                        className="action-btn"
                        style={{width:40,height:38,borderRadius:10,
                          border:"1px solid rgba(239,68,68,0.2)",
                          background:"rgba(239,68,68,0.06)",
                          color:"#EF4444",cursor:"pointer",fontSize:16,
                          display:"flex",alignItems:"center",justifyContent:"center"}}>
                        🗑
                      </button>
                    )}
                  </div>

                  {/* Save as draft */}
                  <button className="action-btn"
                    style={{width:"100%",marginTop:7,padding:"9px",
                      borderRadius:10,border:`1px solid ${C.glBd}`,
                      background:C.gl1,color:C.inkS,fontSize:12,
                      cursor:"pointer",fontFamily:"Inter,sans-serif",
                      fontWeight:600}}>
                    📄 Save as Draft
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <SettleBillModal
        order={settleModalOrder}
        isOpen={!!settleModalOrder}
        onClose={()=>setSettleModalOrder(null)}
        onSettled={()=>{
          setSettleModalOrder(null);setCurrentOrder(null);
          setSelectedTable(null);setCart([]);
          setView("tables");loadTables();loadPendingApprovals();loadLowStock();
        }}/>

      {/* Cancel modal */}
      {cancelModal&&(
        <div style={{position:"fixed",inset:0,zIndex:200,
          background:"rgba(0,0,0,0.85)",backdropFilter:"blur(20px)",
          display:"flex",alignItems:"center",justifyContent:"center",
          padding:20}}
          onClick={()=>setCancelModal(null)}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:C.bg2,borderRadius:20,padding:24,
              width:"100%",maxWidth:400,
              border:`1px solid rgba(239,68,68,0.2)`,
              boxShadow:"0 40px 80px rgba(0,0,0,0.6)",
              animation:`scaleIn 0.25s ${ESPR}`}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,
              fontWeight:700,color:"#EF4444",margin:"0 0 6px"}}>
              Cancel Order?
            </h3>
            <p style={{fontSize:13,color:C.inkS,margin:"0 0 16px",
              fontFamily:"Inter,sans-serif"}}>
              Table {cancelModal.tableNumber} · #{cancelModal.orderNumber}
            </p>
            <select value={cancelReason}
              onChange={e=>setCancelReason(e.target.value)}
              style={{width:"100%",padding:"10px 12px",borderRadius:10,
                border:`1px solid ${C.glBd}`,background:C.bg3,
                color:C.ink,fontSize:13,marginBottom:16,
                fontFamily:"Inter,sans-serif",outline:"none"}}>
              <option value="">Select reason...</option>
              {["Customer changed mind","Wrong item","Customer left",
                "Item unavailable","Staff error","Other"].map(r=>(
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setCancelModal(null)}
                style={{flex:1,padding:"11px",borderRadius:10,
                  border:`1px solid ${C.glBd}`,background:C.gl1,
                  color:C.inkS,cursor:"pointer",fontWeight:600,
                  fontFamily:"Inter,sans-serif",fontSize:13}}>
                Keep Order
              </button>
              <button onClick={handleCancelOrder}
                style={{flex:1,padding:"11px",borderRadius:10,
                  border:"none",background:"rgba(239,68,68,0.15)",
                  color:"#EF4444",cursor:"pointer",fontWeight:700,
                  fontFamily:"Inter,sans-serif",fontSize:13}}>
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
