"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import CRMCaptureCard from "@/components/CRMCaptureCard";
import { menuApi } from "@/lib/api";
import { getThumbnailUrl } from "@/lib/cloudinary";
import { getSessionCustomer } from "@/lib/CustomerIdentitySystem";
import type { MenuCategory, MenuItem } from "@/types";

// ═══════════════════════════════════════════════════════════
// GOLDEN BEANS — PARCEL ORDER PAGE
// File: src/app/order/parcel/page.tsx
// Flow: CRM/OTP → Menu → Token → Tracking
// ═══════════════════════════════════════════════════════════

const C = {
  void:"#030201", dark:"#0A0806", surface:"#14110C", raise:"#1C1812",
  gold:"#C8922A", goldM:"#E8B84B", goldL:"#F5CC6A",
  ink:"#F5EDD8", inkS:"#C4AA80", inkD:"#7A6448",
  gl1:"rgba(255,255,255,0.03)", glBd:"rgba(255,255,255,0.08)",
  g08:"rgba(200,146,42,0.08)", g15:"rgba(200,146,42,0.15)",
  g25:"rgba(200,146,42,0.25)", g40:"rgba(200,146,42,0.40)",
  green:"#4ADE80", greenDim:"rgba(74,222,128,0.12)", greenBd:"rgba(74,222,128,0.25)",
  red:"#F87171", blue:"#60A5FA", blueDim:"rgba(96,165,250,0.12)",
};
const GG   = `linear-gradient(135deg,${C.gold} 0%,${C.goldM} 52%,${C.goldL} 100%)`;
const EASE = "cubic-bezier(0.25,0.46,0.45,0.94)";
const SPR  = "cubic-bezier(0.34,1.56,0.64,1)";
const API  = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

interface CartItem { menuItemId:string; name:string; price:number; quantity:number; notes:string; imageUrl?:string; isVeg?:boolean }
interface ParcelOrder { _id:string; token:string; status:string; items:any[]; totalAmount:number; packagingCharge:number; subtotal:number; tax:number; paidOnline:boolean; razorpayPaymentId?:string }

// Status config for tracking
const STATUS_STEPS = [
  { key:"confirmed",  label:"Order Received",   icon:"✅", desc:"Your order is confirmed!"           },
  { key:"preparing",  label:"Being Prepared",   icon:"👨‍🍳", desc:"Chef is preparing your order"      },
  { key:"ready",      label:"Ready for Pickup", icon:"🔔", desc:"Your order is ready! Come pick up" },
  { key:"delivered",  label:"Picked Up",        icon:"🎉", desc:"Enjoy your food!"                  },
];

function statusIndex(status: string) {
  return STATUS_STEPS.findIndex(s => s.key === status);
}

export default function ParcelPage() {
  const [phase,       setPhase      ] = useState<"crm"|"menu"|"cart"|"confirm"|"tracking">("crm");
  const [menu,        setMenu       ] = useState<MenuCategory[]>([]);
  const [cart,        setCart       ] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [parcelId,    setParcelId   ] = useState<string|null>(null);
  const [parcelToken, setParcelToken] = useState<string|null>(null);
  const [parcelData,  setParcelData ] = useState<ParcelOrder|null>(null);
  const [placing,     setPlacing    ] = useState(false);
  const [error,       setError      ] = useState("");
  const pollRef = useRef<NodeJS.Timeout|null>(null);

  const customer = getSessionCustomer();

  // Load menu
  useEffect(()=>{
    menuApi.getMenu().then(r=>{
      const data = r.data.data || [];
      setMenu(data);
      if(data.length>0) setActiveCategory(data[0]._id);
    }).catch(()=>{});
  },[]);

  // Initiate parcel after CRM login
  const handleCustomerReady = useCallback(async()=>{
    const c = getSessionCustomer();
    if(!c) return;
    try{
      const res = await fetch(`${API}/parcel/initiate`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ customerPhone:c.phone, customerName:c.name, customerId:c._id }),
      }).then(r=>r.json());
      if(res.success){
        setParcelId(res.parcelId);
        setParcelToken(res.token);
        if(res.isExisting){
          // Already has active parcel — go to tracking
          const pd = await fetch(`${API}/parcel/${res.parcelId}`).then(r=>r.json());
          if(pd.success&&pd.data.status!=="pending"){
            setParcelData(pd.data);
            setPhase("tracking");
            return;
          }
        }
        setPhase("menu");
      }
    }catch{ setError("Connection failed. Try again."); }
  },[]);

  // Poll parcel status during tracking
  useEffect(()=>{
    if(phase!=="tracking"||!parcelId) return;
    const poll = async()=>{
      try{
        const res = await fetch(`${API}/parcel/${parcelId}`).then(r=>r.json());
        if(res.success) setParcelData(res.data);
      }catch{}
    };
    poll();
    pollRef.current = setInterval(poll, 8000);
    return()=>{ if(pollRef.current) clearInterval(pollRef.current); };
  },[phase, parcelId]);

  const addToCart = (item: MenuItem)=>{
    setCart(prev=>{
      const ex = prev.find(c=>c.menuItemId===item._id);
      if(ex) return prev.map(c=>c.menuItemId===item._id?{...c,quantity:c.quantity+1}:c);
      return [...prev,{ menuItemId:item._id, name:item.name, price:item.price, quantity:1, notes:"", imageUrl:item.imageUrl, isVeg:item.isVeg }];
    });
  };

  const removeFromCart = (id: string)=>{
    setCart(prev=>{
      const ex = prev.find(c=>c.menuItemId===id);
      if(!ex) return prev;
      if(ex.quantity===1) return prev.filter(c=>c.menuItemId!==id);
      return prev.map(c=>c.menuItemId===id?{...c,quantity:c.quantity-1}:c);
    });
  };

  const subtotal = cart.reduce((s,i)=>s+i.price*i.quantity,0);
  const tax      = Math.round(subtotal*0.05);
  const packaging = 10;
  const total    = subtotal + tax + packaging;

  const placeOrder = async()=>{
    if(!parcelId||cart.length===0) return;
    setPlacing(true); setError("");
    try{
      const res = await fetch(`${API}/parcel/${parcelId}/place-order`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ items:cart }),
      }).then(r=>r.json());
      if(res.success){
        setParcelData(res.parcel);
        setPhase("tracking");
      } else {
        setError(res.message||"Failed to place order. Try again.");
      }
    }catch{ setError("Connection failed. Try again."); }
    setPlacing(false);
  };

  const allItems = menu.flatMap(c=>c.items as MenuItem[]);
  const displayItems = searchQuery
    ? allItems.filter(i=>i.name.toLowerCase().includes(searchQuery.toLowerCase())&&i.isAvailable)
    : (menu.find(c=>c._id===activeCategory)?.items as MenuItem[]||[]).filter(i=>i.isAvailable);

  const cartCount = cart.reduce((s,i)=>s+i.quantity,0);

  return(
    <div style={{ minHeight:"100dvh", background:C.void, color:C.ink, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:"0 auto", position:"relative" }}>

      {/* CRM Phase */}
      {phase==="crm"&&(
        <CRMCaptureCard
          tableId="PARCEL"
          onCustomerIdentified={()=>handleCustomerReady()}
        />
      )}

      {/* Menu Phase */}
      {(phase==="menu"||phase==="cart")&&(
        <div style={{ display:"flex", flexDirection:"column", minHeight:"100dvh" }}>
          {/* Header */}
          <div style={{ background:C.surface, borderBottom:`1px solid ${C.glBd}`, padding:"16px 18px 12px", position:"sticky", top:0, zIndex:10 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:C.goldL, margin:0 }}>📦 Parcel Order</h2>
                <p style={{ fontSize:11, color:C.inkD, margin:0, fontFamily:"'DM Mono',monospace" }}>
                  Token: <span style={{ color:C.gold, fontWeight:700 }}>{parcelToken||"..."}</span>
                  {customer&&<span style={{ color:C.inkD }}> · {customer.name}</span>}
                </p>
              </div>
              {cartCount>0&&(
                <button onClick={()=>setPhase("cart")} style={{ background:GG, border:"none", borderRadius:12, padding:"8px 16px", color:C.void, fontWeight:800, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                  🛒 {cartCount} · ₹{total}
                </button>
              )}
            </div>
            {/* Search */}
            <input
              value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              placeholder="🔍 Search menu..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:12, border:`1px solid ${C.glBd}`, background:C.gl1, color:C.ink, fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 }}
            />
            {/* Categories */}
            {!searchQuery&&(
              <div style={{ display:"flex", gap:8, overflowX:"auto", scrollbarWidth:"none", paddingBottom:2 }}>
                {menu.map(cat=>(
                  <button key={cat._id} onClick={()=>setActiveCategory(cat._id)} style={{ flexShrink:0, padding:"5px 12px", borderRadius:99, fontSize:11, fontWeight:700, border:`1.5px solid ${activeCategory===cat._id?C.g25:C.glBd}`, background:activeCategory===cat._id?C.g08:"transparent", color:activeCategory===cat._id?C.goldL:C.inkD, cursor:"pointer", whiteSpace:"nowrap" }}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div style={{ flex:1, overflowY:"auto", padding:"14px 14px 100px", scrollbarWidth:"none" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {displayItems.map((item,i)=>{
                const qty = cart.find(c=>c.menuItemId===item._id)?.quantity||0;
                return(
                  <div key={item._id} style={{ background:C.surface, borderRadius:16, overflow:"hidden", border:`1.5px solid ${qty>0?C.g25:C.glBd}`, position:"relative", animation:`pSlideIn 0.3s ${i*0.03}s ease both` }}>
                    {/* Image */}
                    <div style={{ height:110, background:C.raise, position:"relative" }}>
                      {item.imageUrl
                        ?<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                        :<div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, background:`linear-gradient(135deg,${C.raise},${C.surface})` }}>🍽️</div>
                      }
                      {/* Veg badge */}
                      <div style={{ position:"absolute", top:6, left:6, width:14, height:14, borderRadius:2, border:`1.5px solid ${item.isVeg?"#22C55E":"#F87171"}`, background:C.void, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:item.isVeg?"#22C55E":"#F87171" }}/>
                      </div>
                      {qty>0&&<div style={{ position:"absolute", top:6, right:6, width:20, height:20, borderRadius:"50%", background:GG, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:C.void }}>{qty}</div>}
                    </div>
                    {/* Info */}
                    <div style={{ padding:"10px 10px 12px" }}>
                      <p style={{ fontSize:13, fontWeight:600, color:C.ink, margin:"0 0 4px", lineHeight:1.3 }}>{item.name}</p>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span style={{ fontSize:14, fontWeight:800, color:C.goldL }}>₹{item.price}</span>
                        {qty===0
                          ?<button onClick={()=>addToCart(item)} style={{ background:GG, border:"none", borderRadius:8, padding:"5px 12px", fontSize:11, fontWeight:700, color:C.void, cursor:"pointer" }}>+ ADD</button>
                          :<div style={{ display:"flex", alignItems:"center", background:C.g08, borderRadius:8, overflow:"hidden" }}>
                            <button onClick={()=>removeFromCart(item._id)} style={{ width:28, height:28, background:"none", border:"none", color:C.goldL, cursor:"pointer", fontSize:16, fontWeight:900 }}>−</button>
                            <span style={{ fontSize:12, fontWeight:900, minWidth:16, textAlign:"center", color:C.goldL }}>{qty}</span>
                            <button onClick={()=>addToCart(item)} style={{ width:28, height:28, background:"none", border:"none", color:C.goldL, cursor:"pointer", fontSize:16, fontWeight:900 }}>+</button>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart CTA */}
          {cartCount>0&&phase==="menu"&&(
            <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, padding:"12px 16px", background:C.surface, borderTop:`1px solid ${C.glBd}`, zIndex:20 }}>
              <button onClick={()=>setPhase("cart")} style={{ width:"100%", padding:"15px", borderRadius:14, border:"none", background:GG, color:C.void, fontWeight:800, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:`0 8px 24px ${C.g40}` }}>
                <span>🛒 View Cart ({cartCount} items)</span>
                <span>₹{total} →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cart / Confirm Phase */}
      {phase==="cart"&&(
        <div style={{ display:"flex", flexDirection:"column", minHeight:"100dvh" }}>
          <div style={{ background:C.surface, borderBottom:`1px solid ${C.glBd}`, padding:"16px 18px", display:"flex", alignItems:"center", gap:14 }}>
            <button onClick={()=>setPhase("menu")} style={{ background:"none", border:"none", color:C.inkS, fontSize:20, cursor:"pointer", padding:0 }}>←</button>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:C.goldL, margin:0 }}>Your Parcel Order</h2>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 140px", scrollbarWidth:"none" }}>
            {/* Token card */}
            <div style={{ background:C.g08, border:`1px solid ${C.g15}`, borderRadius:14, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:28 }}>📦</span>
              <div>
                <p style={{ fontSize:12, color:C.inkD, margin:"0 0 2px", fontFamily:"'DM Mono',monospace" }}>YOUR PARCEL TOKEN</p>
                <p style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:900, color:C.goldL, margin:0, letterSpacing:2 }}>{parcelToken}</p>
              </div>
            </div>

            {/* Cart items */}
            <p style={{ fontSize:9, color:C.gold, fontFamily:"'DM Mono',monospace", letterSpacing:".18em", textTransform:"uppercase", margin:"0 0 10px" }}>ORDER ITEMS</p>
            {cart.map(item=>(
              <div key={item.menuItemId} style={{ background:C.surface, borderRadius:12, padding:"12px 14px", marginBottom:8, border:`1px solid ${C.glBd}`, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:C.ink, margin:"0 0 3px" }}>{item.name}</p>
                  <p style={{ fontSize:11, color:C.inkD, margin:0 }}>₹{item.price} × {item.quantity}</p>
                </div>
                <div style={{ display:"flex", alignItems:"center", background:C.g08, borderRadius:8, overflow:"hidden" }}>
                  <button onClick={()=>removeFromCart(item.menuItemId)} style={{ width:28, height:28, background:"none", border:"none", color:C.goldL, cursor:"pointer", fontSize:16, fontWeight:900 }}>−</button>
                  <span style={{ fontSize:12, fontWeight:900, minWidth:16, textAlign:"center", color:C.goldL }}>{item.quantity}</span>
                  <button onClick={()=>addToCart({_id:item.menuItemId,name:item.name,price:item.price,imageUrl:item.imageUrl||"",isAvailable:true} as MenuItem)} style={{ width:28, height:28, background:"none", border:"none", color:C.goldL, cursor:"pointer", fontSize:16, fontWeight:900 }}>+</button>
                </div>
                <span style={{ fontSize:14, fontWeight:700, color:C.goldL, minWidth:40, textAlign:"right" }}>₹{item.price*item.quantity}</span>
              </div>
            ))}

            {/* Bill summary */}
            <div style={{ background:C.surface, borderRadius:14, padding:"14px 16px", marginTop:12, border:`1px solid ${C.glBd}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, color:C.inkS }}>Subtotal</span>
                <span style={{ fontSize:12, color:C.ink, fontWeight:600 }}>₹{subtotal}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, color:C.inkS }}>GST (5%)</span>
                <span style={{ fontSize:12, color:C.ink, fontWeight:600 }}>₹{tax}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10, paddingBottom:10, borderBottom:`1px dashed ${C.glBd}` }}>
                <span style={{ fontSize:12, color:C.inkS }}>📦 Packaging</span>
                <span style={{ fontSize:12, color:C.ink, fontWeight:600 }}>₹{packaging}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:16, fontWeight:800, color:C.ink, fontFamily:"'Cormorant Garamond',serif" }}>Total</span>
                <span style={{ fontSize:20, fontWeight:900, color:C.goldL }}>₹{total}</span>
              </div>
            </div>

            {error&&<p style={{ fontSize:12, color:C.red, textAlign:"center", margin:"12px 0 0", fontWeight:700 }}>⚠ {error}</p>}
          </div>

          {/* Place Order CTA */}
          <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, padding:"12px 16px", background:C.surface, borderTop:`1px solid ${C.glBd}`, zIndex:20 }}>
            <button onClick={placeOrder} disabled={placing||cart.length===0}
              style={{ width:"100%", padding:"15px", borderRadius:14, border:"none", background:cart.length>0?GG:"rgba(255,255,255,0.05)", color:cart.length>0?C.void:C.inkD, fontWeight:800, fontSize:15, cursor:cart.length>0?"pointer":"not-allowed", boxShadow:cart.length>0?`0 8px 24px ${C.g40}`:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {placing?"Placing order...":"✅ Place Parcel Order — ₹"+total}
            </button>
          </div>
        </div>
      )}

      {/* Tracking Phase */}
      {phase==="tracking"&&parcelData&&(
        <div style={{ display:"flex", flexDirection:"column", minHeight:"100dvh", padding:"24px 18px" }}>
          {/* Token hero */}
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, color:C.goldL, margin:"0 0 6px" }}>
              Your Parcel
            </h2>
            <div style={{ background:C.g08, border:`1px solid ${C.g25}`, borderRadius:14, padding:"12px 24px", display:"inline-block", marginBottom:8 }}>
              <p style={{ fontFamily:"'DM Mono',monospace", fontSize:26, fontWeight:900, color:C.goldL, margin:0, letterSpacing:3 }}>
                {parcelData.token}
              </p>
            </div>
            <p style={{ fontSize:12, color:C.inkD, margin:0, fontFamily:"'DM Mono',monospace" }}>Show this token when collecting</p>
          </div>

          {/* Status steps */}
          <div style={{ marginBottom:24 }}>
            {STATUS_STEPS.map((step,i)=>{
              const currentIdx = statusIndex(parcelData.status);
              const isDone  = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return(
                <div key={step.key} style={{ display:"flex", gap:14, marginBottom:i<STATUS_STEPS.length-1?0:0, position:"relative" }}>
                  {/* Line */}
                  {i<STATUS_STEPS.length-1&&(
                    <div style={{ position:"absolute", left:19, top:40, width:2, height:32, background:isDone&&i<currentIdx?C.green:`rgba(255,255,255,0.06)`, transition:"background 0.5s ease" }}/>
                  )}
                  <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, background:isCurrent?GG:isDone?C.greenDim:C.gl1, border:`2px solid ${isCurrent?C.gold:isDone?C.greenBd:"rgba(255,255,255,0.06)"}`, boxShadow:isCurrent?`0 0 16px ${C.g40}`:"none", transition:"all 0.5s ease", marginBottom:32 }}>
                    {isDone&&!isCurrent?"✓":step.icon}
                  </div>
                  <div style={{ paddingTop:8 }}>
                    <p style={{ fontSize:14, fontWeight:isCurrent?700:600, color:isCurrent?C.goldL:isDone?C.green:C.inkD, margin:"0 0 2px", transition:"color 0.5s ease" }}>{step.label}</p>
                    {isCurrent&&<p style={{ fontSize:12, color:C.inkS, margin:0, animation:"pPulse 2s ease-in-out infinite" }}>{step.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order summary */}
          <div style={{ background:C.surface, borderRadius:14, padding:"14px 16px", border:`1px solid ${C.glBd}`, marginBottom:16 }}>
            <p style={{ fontSize:9, color:C.gold, fontFamily:"'DM Mono',monospace", letterSpacing:".18em", textTransform:"uppercase", margin:"0 0 10px" }}>ORDER SUMMARY</p>
            {parcelData.items.map((item:any,i:number)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, color:C.inkS }}>{item.name} × {item.quantity}</span>
                <span style={{ fontSize:12, color:C.ink, fontWeight:600 }}>₹{item.price*item.quantity}</span>
              </div>
            ))}
            <div style={{ borderTop:`1px dashed ${C.glBd}`, marginTop:8, paddingTop:8, display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.ink }}>Total</span>
              <span style={{ fontSize:15, fontWeight:900, color:C.goldL }}>₹{parcelData.totalAmount}</span>
            </div>
          </div>

          {/* Online paid badge */}
          {parcelData.paidOnline&&(
            <div style={{ background:C.blueDim, border:"1px solid rgba(96,165,250,0.3)", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>💳</span>
              <div>
                <p style={{ fontSize:12, fontWeight:700, color:C.blue, margin:0 }}>Paid Online ✓</p>
                <p style={{ fontSize:10, color:"rgba(96,165,250,0.7)", margin:0, fontFamily:"'DM Mono',monospace" }}>No cash required at pickup</p>
              </div>
            </div>
          )}

          {/* Ready state — special callout */}
          {parcelData.status==="ready"&&(
            <div style={{ background:C.greenDim, border:`2px solid ${C.greenBd}`, borderRadius:16, padding:"16px", textAlign:"center", marginTop:16, animation:`pPop 0.5s ${SPR}` }}>
              <div style={{ fontSize:40, marginBottom:8, animation:"pFloat 2s ease-in-out infinite" }}>🔔</div>
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:C.green, margin:"0 0 6px" }}>Your order is ready!</h3>
              <p style={{ fontSize:13, color:C.inkS, margin:0 }}>Please come to the counter and show your token</p>
              <div style={{ background:C.g08, borderRadius:10, padding:"8px 16px", display:"inline-block", marginTop:10 }}>
                <p style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:900, color:C.goldL, margin:0, letterSpacing:2 }}>{parcelData.token}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pPulse   { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes pFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pPop     { 0%{transform:scale(0.9);opacity:0} 60%{transform:scale(1.03)} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}
