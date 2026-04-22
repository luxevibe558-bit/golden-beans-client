"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { menuApi, orderApi, tableApi } from "@/lib/api";
import type { MenuCategory, MenuItem, CartItem, Table, Order } from "@/types";

function formatINR(amount: number) {
  return `₹${amount.toFixed(0)}`;
}

const ITEM_EMOJIS: Record<string, string> = {
  Espresso: "☕", Cappuccino: "☕", Latte: "🥛", "Masala Chai": "🫖",
  "Hot Chocolate": "🍫", "Cold Brew": "🧊", "Iced Latte": "🥤",
  "Chocolate Frappe": "🧋", "Butter Toast": "🍞", "Cheese Sandwich": "🥪",
  "Garlic Bread": "🥖", "Chocolate Brownie": "🍫", "Cheesecake Slice": "🍰",
  "Classic Omelette": "🍳", "Pancake Stack": "🥞",
};

const CATEGORY_BG: Record<string, string> = {
  "Hot Beverages": "linear-gradient(135deg,#7c2d12,#ea580c)",
  "Cold Beverages": "linear-gradient(135deg,#0c4a6e,#0284c7)",
  "Snacks": "linear-gradient(135deg,#713f12,#d97706)",
  "Desserts": "linear-gradient(135deg,#831843,#ec4899)",
  "Breakfast": "linear-gradient(135deg,#365314,#65a30d)",
};

// ─── Skeleton ───
function SkeletonCard() {
  return (
    <div style={{ display:"flex", gap:"12px", background:"white", borderRadius:"20px", padding:"12px", marginBottom:"12px", boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}>
      <div style={{ width:"110px", height:"110px", borderRadius:"16px", background:"linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite", flexShrink:0 }} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"8px", paddingTop:"4px" }}>
        <div style={{ height:"16px", width:"70%", borderRadius:"8px", background:"linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
        <div style={{ height:"12px", width:"90%", borderRadius:"8px", background:"linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
        <div style={{ height:"12px", width:"60%", borderRadius:"8px", background:"linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
        <div style={{ height:"32px", width:"80px", borderRadius:"10px", background:"linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite", marginTop:"auto" }} />
      </div>
    </div>
  );
}

// ─── Menu Item Card ───
function MenuItemCard({ item, cartQty, onAdd, onRemove }: {
  item: MenuItem; cartQty: number;
  onAdd: (item: MenuItem) => void;
  onRemove: (id: string) => void;
}) {
  const [pressed, setPressed] = useState(false);
  const catName = typeof item.category === "object" ? item.category.name : "";
  const bg = CATEGORY_BG[catName] || "linear-gradient(135deg,#7c2d12,#ea580c)";
  const emoji = ITEM_EMOJIS[item.name] || "🍽️";

  return (
    <div style={{
      display: "flex", gap: "0", background: "white", borderRadius: "20px",
      overflow: "hidden", marginBottom: "12px",
      boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
      opacity: item.isAvailable ? 1 : 0.5,
      transform: pressed ? "scale(0.98)" : "scale(1)",
      transition: "transform 0.15s ease, box-shadow 0.15s ease",
    }}>
      {/* Image */}
      <div style={{ width:"110px", minHeight:"110px", flexShrink:0, background:bg, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        <span style={{ fontSize:"44px", filter:"drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>{emoji}</span>
        <div style={{ position:"absolute", top:"8px", left:"8px", width:"18px", height:"18px", borderRadius:"4px", border:`2px solid ${item.isVeg ? "#16a34a" : "#dc2626"}`, background:"white", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:"9px", height:"9px", borderRadius:"50%", background:item.isVeg ? "#16a34a" : "#dc2626" }} />
        </div>
        {item.tags.includes("bestseller") && (
          <div style={{ position:"absolute", bottom:"0", left:"0", right:"0", background:"rgba(0,0,0,0.6)", padding:"3px 0", textAlign:"center" }}>
            <span style={{ fontSize:"9px", color:"#fbbf24", fontWeight:700, letterSpacing:"0.5px" }}>★ BESTSELLER</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:"12px 12px 12px 14px", display:"flex", flexDirection:"column", justifyContent:"space-between", minWidth:0 }}>
        <div>
          <p style={{ fontWeight:700, fontSize:"14px", color:"#111827", margin:"0 0 4px", lineHeight:1.3 }}>{item.name}</p>
          <p style={{ fontSize:"12px", color:"#6b7280", margin:0, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{item.description}</p>
          {item.preparationTime > 0 && (
            <p style={{ fontSize:"11px", color:"#9ca3af", margin:"4px 0 0", display:"flex", alignItems:"center", gap:"3px" }}>
              <span>⏱</span> {item.preparationTime} min
            </p>
          )}
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px" }}>
          <span style={{ fontWeight:800, fontSize:"16px", color:"#111827" }}>{formatINR(item.price)}</span>

          {item.isAvailable && (
            cartQty === 0 ? (
              <button
                onTouchStart={() => setPressed(true)}
                onTouchEnd={() => setPressed(false)}
                onClick={() => onAdd(item)}
                style={{
                  background:"white", color:"#e63946", border:"2px solid #e63946",
                  borderRadius:"10px", padding:"6px 18px", fontWeight:800,
                  fontSize:"13px", cursor:"pointer", letterSpacing:"0.5px",
                  transition:"all 0.2s ease",
                  boxShadow:"0 2px 8px rgba(230,57,70,0.2)",
                }}
              >
                ADD
              </button>
            ) : (
              <div style={{
                display:"flex", alignItems:"center", background:"#e63946",
                borderRadius:"10px", overflow:"hidden",
                boxShadow:"0 2px 8px rgba(230,57,70,0.3)",
              }}>
                <button onClick={() => onRemove(item._id)} style={{ width:"32px", height:"32px", background:"none", border:"none", color:"white", fontWeight:800, fontSize:"20px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                <span style={{ fontWeight:800, color:"white", fontSize:"14px", minWidth:"20px", textAlign:"center" }}>{cartQty}</span>
                <button onClick={() => onAdd(item)} style={{ width:"32px", height:"32px", background:"none", border:"none", color:"white", fontWeight:800, fontSize:"20px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cart Item Row ───
function CartItemRow({ item, onUpdateQty, onUpdateNote }: {
  item: CartItem;
  onUpdateQty: (id: string, delta: number) => void;
  onUpdateNote: (id: string, note: string) => void;
}) {
  const [showNote, setShowNote] = useState(false);
  return (
    <div style={{ background:"#fafafa", borderRadius:"16px", padding:"12px 14px", marginBottom:"10px", border:"1px solid #f0f0f0" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", minWidth:0 }}>
          <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:item.isVeg ? "#16a34a" : "#dc2626", flexShrink:0 }} />
          <span style={{ fontWeight:700, fontSize:"14px", color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</span>
        </div>
        <span style={{ fontWeight:800, fontSize:"14px", color:"#111827", flexShrink:0, marginLeft:"8px" }}>{formatINR(item.price * item.quantity)}</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", background:"#e63946", borderRadius:"10px", overflow:"hidden" }}>
          <button onClick={() => onUpdateQty(item.menuItemId, -1)} style={{ width:"32px", height:"32px", background:"none", border:"none", color:"white", fontWeight:800, fontSize:"20px", cursor:"pointer" }}>−</button>
          <span style={{ fontWeight:800, color:"white", fontSize:"14px", minWidth:"24px", textAlign:"center" }}>{item.quantity}</span>
          <button onClick={() => onUpdateQty(item.menuItemId, 1)} style={{ width:"32px", height:"32px", background:"none", border:"none", color:"white", fontWeight:800, fontSize:"20px", cursor:"pointer" }}>+</button>
        </div>
        <button onClick={() => setShowNote(!showNote)} style={{ background:"none", border:"1px solid #e5e7eb", borderRadius:"8px", padding:"4px 10px", fontSize:"11px", color:"#6b7280", cursor:"pointer" }}>
          {showNote ? "Hide note" : item.notes ? "✏️ " + item.notes.slice(0, 15) + "..." : "Add note"}
        </button>
      </div>
      {showNote && (
        <input type="text" placeholder="e.g. less sugar, extra hot..." value={item.notes}
          onChange={e => onUpdateNote(item.menuItemId, e.target.value)}
          style={{ width:"100%", marginTop:"8px", fontSize:"12px", padding:"8px 12px", borderRadius:"10px", border:"1px solid #e5e7eb", background:"white", outline:"none", boxSizing:"border-box" }}
        />
      )}
    </div>
  );
}

// ─── Cart Drawer ───
function CartDrawer({ cart, isOpen, onClose, onUpdateQty, onUpdateNote, onPlaceOrder, isPlacing, existingOrder }: {
  cart: CartItem[]; isOpen: boolean; onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onUpdateNote: (id: string, note: string) => void;
  onPlaceOrder: () => void; isPlacing: boolean; existingOrder: Order | null;
}) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:40, opacity:isOpen?1:0, pointerEvents:isOpen?"auto":"none", transition:"opacity 0.3s", backdropFilter:"blur(4px)" }} />
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, background:"white", zIndex:50,
        borderRadius:"28px 28px 0 0", maxHeight:"88vh", display:"flex", flexDirection:"column",
        transform:isOpen?"translateY(0)":"translateY(100%)",
        transition:"transform 0.4s cubic-bezier(0.32,0.72,0,1)",
        boxShadow:"0 -20px 60px rgba(0,0,0,0.2)",
      }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:"12px" }}>
          <div style={{ width:"36px", height:"4px", borderRadius:"99px", background:"#e5e7eb" }} />
        </div>

        {/* Header */}
        <div style={{ padding:"12px 20px 16px", borderBottom:"1px solid #f3f4f6" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <h2 style={{ fontWeight:800, fontSize:"20px", color:"#111827", margin:0 }}>
                Your Order
                <span style={{ marginLeft:"8px", background:"#e63946", color:"white", fontSize:"12px", padding:"2px 8px", borderRadius:"99px", fontWeight:700 }}>{totalItems}</span>
              </h2>
              {existingOrder && <p style={{ fontSize:"12px", color:"#e63946", margin:"3px 0 0", fontWeight:600 }}>Adding to #{existingOrder.orderNumber}</p>}
            </div>
            <button onClick={onClose} style={{ width:"34px", height:"34px", borderRadius:"50%", background:"#f3f4f6", border:"none", cursor:"pointer", fontSize:"18px", display:"flex", alignItems:"center", justifyContent:"center", color:"#374151" }}>✕</button>
          </div>
        </div>

        {/* Items */}
        <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 0", color:"#9ca3af" }}>
              <div style={{ fontSize:"56px", marginBottom:"12px" }}>🛒</div>
              <p style={{ fontWeight:600, fontSize:"16px", color:"#374151" }}>Your cart is empty</p>
              <p style={{ fontSize:"14px", marginTop:"4px" }}>Add delicious items to get started</p>
            </div>
          ) : cart.map(item => (
            <CartItemRow key={item.menuItemId} item={item} onUpdateQty={onUpdateQty} onUpdateNote={onUpdateNote} />
          ))}
        </div>

        {/* Bill Summary + CTA */}
        {cart.length > 0 && (
          <div style={{ padding:"0 16px 28px", borderTop:"1px solid #f3f4f6" }}>
            <div style={{ background:"#fafafa", borderRadius:"16px", padding:"14px 16px", margin:"14px 0 12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:"#6b7280", marginBottom:"6px" }}>
                <span>Item total</span><span>{formatINR(subtotal)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:"#6b7280", paddingBottom:"8px", borderBottom:"1px dashed #e5e7eb", marginBottom:"8px" }}>
                <span>GST (5%)</span><span>{formatINR(tax)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:"16px", color:"#111827" }}>
                <span>To pay</span><span>{formatINR(total)}</span>
              </div>
            </div>
            <button onClick={onPlaceOrder} disabled={isPlacing} style={{
              width:"100%", background:isPlacing?"#9ca3af":"linear-gradient(135deg,#e63946,#c1121f)",
              color:"white", border:"none", borderRadius:"16px", padding:"18px",
              fontWeight:800, fontSize:"16px", cursor:isPlacing?"not-allowed":"pointer",
              boxShadow:isPlacing?"none":"0 8px 24px rgba(230,57,70,0.4)",
              transition:"all 0.2s ease", letterSpacing:"0.3px",
            }}>
              {isPlacing ? "Placing your order..." : `🚀 Place Order • ${formatINR(total)}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Order Status Banner ───
function OrderStatusBanner({ order }: { order: Order }) {
  const cfgs: Record<string, { label: string; sub: string; bg: string; color: string; icon: string; pulse: boolean }> = {
    open: { label: "Order Received!", sub: "We got your order", bg:"#eff6ff", color:"#1d4ed8", icon:"📋", pulse:false },
    kotSent: { label: "Being Prepared", sub: "Chef is cooking your order", bg:"#fffbeb", color:"#b45309", icon:"👨‍🍳", pulse:true },
    partially_ready: { label: "Almost Ready!", sub: "Some items are ready", bg:"#fff7ed", color:"#c2410c", icon:"🔔", pulse:true },
    ready: { label: "Order Ready!", sub: "Waiter will serve you shortly", bg:"#f0fdf4", color:"#15803d", icon:"✅", pulse:false },
    settled: { label: "Thank You! 🙏", sub: "Hope you enjoyed your meal", bg:"#f9fafb", color:"#6b7280", icon:"⭐", pulse:false },
    cancelled: { label: "Order Cancelled", sub: "Please contact staff", bg:"#fef2f2", color:"#b91c1c", icon:"❌", pulse:false },
  };
  const cfg = cfgs[order.status] || cfgs.open;
  return (
    <div style={{ margin:"12px 16px 4px", padding:"14px 16px", borderRadius:"20px", background:cfg.bg, display:"flex", alignItems:"center", gap:"14px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize:"32px", animation:cfg.pulse?"pulse-scale 1.5s infinite":"none" }}>{cfg.icon}</div>
      <div style={{ flex:1 }}>
        <p style={{ fontWeight:800, fontSize:"15px", color:cfg.color, margin:0 }}>{cfg.label}</p>
        <p style={{ fontSize:"12px", color:cfg.color, opacity:0.7, margin:"2px 0 0" }}>{cfg.sub} • #{order.orderNumber}</p>
      </div>
      {cfg.pulse && (
        <div style={{ display:"flex", gap:"4px" }}>
          {[0,1,2].map(i => <div key={i} style={{ width:"6px", height:"6px", borderRadius:"50%", background:cfg.color, animation:`bounce-dot 1.2s ${i*0.2}s infinite` }} />)}
        </div>
      )}
    </div>
  );
}

// ─── Success Screen ───
function SuccessScreen({ order, onContinue }: { order: Order; onContinue: () => void }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"white", zIndex:100, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px", animation:"fadeIn 0.3s ease" }}>
      <div style={{ width:"100px", height:"100px", borderRadius:"50%", background:"linear-gradient(135deg,#16a34a,#4ade80)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"48px", marginBottom:"20px", boxShadow:"0 16px 48px rgba(22,163,74,0.3)", animation:"scale-in 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>🎉</div>
      <h1 style={{ fontWeight:800, fontSize:"26px", color:"#111827", marginBottom:"6px", textAlign:"center" }}>Order Confirmed!</h1>
      <p style={{ color:"#6b7280", textAlign:"center", marginBottom:"20px", fontSize:"15px" }}>Your order has been sent to the kitchen</p>
      <div style={{ background:"linear-gradient(135deg,#fff7ed,#fef3c7)", border:"2px solid #fed7aa", borderRadius:"20px", padding:"16px 32px", marginBottom:"20px", textAlign:"center", width:"100%", maxWidth:"320px" }}>
        <p style={{ fontWeight:900, fontSize:"24px", color:"#92400e", margin:0, letterSpacing:"1px" }}>{order.orderNumber}</p>
        <p style={{ fontSize:"12px", color:"#b45309", margin:"4px 0 0", fontWeight:600 }}>YOUR ORDER NUMBER</p>
      </div>
      <div style={{ width:"100%", maxWidth:"320px", marginBottom:"24px" }}>
        {order.items.map(item => (
          <div key={item._id} style={{ display:"flex", justifyContent:"space-between", fontSize:"14px", color:"#374151", padding:"8px 0", borderBottom:"1px solid #f3f4f6" }}>
            <span>{item.name} <span style={{ color:"#9ca3af" }}>×{item.quantity}</span></span>
            <span style={{ fontWeight:700 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:"16px", color:"#111827", padding:"12px 0 0" }}>
          <span>Total Paid</span><span style={{ color:"#e63946" }}>₹{order.totalAmount.toFixed(0)}</span>
        </div>
      </div>
      <button onClick={onContinue} style={{ width:"100%", maxWidth:"320px", background:"linear-gradient(135deg,#e63946,#c1121f)", color:"white", border:"none", borderRadius:"16px", padding:"18px", fontWeight:800, fontSize:"16px", cursor:"pointer", boxShadow:"0 8px 24px rgba(230,57,70,0.35)" }}>
        ← Back to Menu
      </button>
    </div>
  );
}

// ─── MAIN PAGE ───
export default function CustomerOrderPage() {
  const params = useParams();
  const tableId = params.tableId as string;

  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [table, setTable] = useState<Table | null>(null);
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<"menu"|"order"|"info">("menu");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [menuRes, tableRes] = await Promise.all([menuApi.getMenu(), tableApi.getTable(tableId)]);
        setMenu(menuRes.data.data);
        setTable(tableRes.data.data);
        if (menuRes.data.data.length > 0) setActiveCategory(menuRes.data.data[0]._id);
        const orderRes = await orderApi.getOrderByTable(tableId);
        if (orderRes.data.data) setExistingOrder(orderRes.data.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally { setLoading(false); }
    }
    load();
  }, [tableId]);

  useEffect(() => {
    if (!existingOrder || existingOrder.status === "settled") return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await orderApi.getOrderByTable(tableId);
        if (res.data.data) setExistingOrder(res.data.data);
      } catch {}
    }, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [existingOrder, tableId]);

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === item._id);
      if (ex) return prev.map(c => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, notes: "", isVeg: item.isVeg }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === itemId);
      if (!ex) return prev;
      if (ex.quantity === 1) return prev.filter(c => c.menuItemId !== itemId);
      return prev.map(c => c.menuItemId === itemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }, []);

  const updateQty = useCallback((itemId: string, delta: number) => {
    if (delta > 0) { const item = menu.flatMap(c => c.items).find(i => i._id === itemId); if (item) addToCart(item); }
    else removeFromCart(itemId);
  }, [menu, addToCart, removeFromCart]);

  const updateNote = useCallback((itemId: string, note: string) => {
    setCart(prev => prev.map(c => c.menuItemId === itemId ? { ...c, notes: note } : c));
  }, []);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setIsPlacing(true);
    try {
      const res = await orderApi.createOrder({ tableId, items: cart, createdBy: "customer" });
      setSuccessOrder(res.data.data);
      setCart([]);
      setIsCartOpen(false);
      setExistingOrder(res.data.data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to place order");
    } finally { setIsPlacing(false); }
  };

  const totalCartItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalCartValue = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const filteredMenu = searchQuery
    ? menu.map(cat => ({ ...cat, items: cat.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase())) })).filter(cat => cat.items.length > 0)
    : menu;

  if (error) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", background:"#f9fafb" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"56px", marginBottom:"16px" }}>⚠️</div>
          <h2 style={{ fontWeight:800, color:"#111827", margin:"0 0 8px" }}>Oops!</h2>
          <p style={{ color:"#6b7280", marginBottom:"20px" }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ background:"linear-gradient(135deg,#e63946,#c1121f)", color:"white", border:"none", borderRadius:"14px", padding:"14px 28px", fontWeight:700, cursor:"pointer", fontSize:"15px" }}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#f8f9fa", display:"flex", flexDirection:"column", maxWidth:"480px", margin:"0 auto", position:"relative", fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; font-family: 'Nunito', -apple-system, sans-serif; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scale-in { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes slide-up { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse-scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        @keyframes bounce-dot { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        ::-webkit-scrollbar { display: none; }
        input:focus { outline: none; }
        button:active { transform: scale(0.96); }
      `}</style>

      {successOrder && <SuccessScreen order={successOrder} onContinue={() => setSuccessOrder(null)} />}

      {/* ── HEADER ── */}
      <header style={{ background:"white", position:"sticky", top:0, zIndex:30, boxShadow:"0 2px 16px rgba(0,0,0,0.08)" }}>
        {/* Top bar */}
        <div style={{ padding:"14px 16px 10px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"10px", background:"linear-gradient(135deg,#e63946,#c1121f)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>☕</div>
              <div>
                <h1 style={{ fontWeight:900, fontSize:"18px", color:"#111827", margin:0, letterSpacing:"-0.3px" }}>Golden Beans</h1>
                <p style={{ fontSize:"11px", color:"#9ca3af", margin:0, fontWeight:600 }}>{table ? `Table ${table.tableNumber}` : "Loading..."}</p>
              </div>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"5px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:"99px", padding:"4px 10px" }}>
              <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#16a34a" }} />
              <span style={{ fontSize:"11px", color:"#15803d", fontWeight:700 }}>Open Now</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding:"0 16px 12px" }}>
          <div style={{
            display:"flex", alignItems:"center", gap:"10px",
            background:searchFocused ? "white" : "#f3f4f6",
            border:`1.5px solid ${searchFocused ? "#e63946" : "transparent"}`,
            borderRadius:"14px", padding:"10px 14px",
            transition:"all 0.2s ease",
            boxShadow:searchFocused ? "0 0 0 3px rgba(230,57,70,0.1)" : "none",
          }}>
            <span style={{ fontSize:"18px", flexShrink:0 }}>🔍</span>
            <input type="text" placeholder="Search for dishes..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ flex:1, background:"none", border:"none", fontSize:"14px", color:"#111827", fontWeight:500 }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ background:"#e5e7eb", border:"none", borderRadius:"50%", width:"20px", height:"20px", cursor:"pointer", fontSize:"11px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
            )}
          </div>
        </div>

        {/* Category pills */}
        {!searchQuery && menu.length > 0 && (
          <div style={{ display:"flex", gap:"8px", overflowX:"auto", padding:"0 16px 14px", scrollbarWidth:"none" }}>
            {menu.map((cat, idx) => (
              <button key={cat._id} onClick={() => {
                setActiveCategory(cat._id);
                categoryRefs.current[cat._id]?.scrollIntoView({ behavior:"smooth", block:"start" });
              }} style={{
                flexShrink:0, display:"flex", alignItems:"center", gap:"6px",
                padding:"8px 16px", borderRadius:"99px", fontSize:"13px", fontWeight:700,
                border:"none", cursor:"pointer", transition:"all 0.25s ease",
                background:activeCategory === cat._id ? "linear-gradient(135deg,#e63946,#c1121f)" : "white",
                color:activeCategory === cat._id ? "white" : "#374151",
                boxShadow:activeCategory === cat._id ? "0 4px 12px rgba(230,57,70,0.35)" : "0 1px 4px rgba(0,0,0,0.08)",
                transform:activeCategory === cat._id ? "scale(1.02)" : "scale(1)",
                animation:`slide-up 0.3s ${idx * 0.05}s ease both`,
              }}>
                <span style={{ fontSize:"16px" }}>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex:1, overflowY:"auto", paddingBottom:"90px" }}>
        {existingOrder && !["settled","cancelled"].includes(existingOrder.status) && (
          <OrderStatusBanner order={existingOrder} />
        )}

        {/* MENU TAB */}
        {activeTab === "menu" && (
          <div style={{ padding:"12px 0" }}>
            {loading ? (
              <div style={{ padding:"16px" }}>
                {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : filteredMenu.length === 0 ? (
              <div style={{ textAlign:"center", padding:"64px 24px", color:"#9ca3af" }}>
                <div style={{ fontSize:"56px", marginBottom:"12px" }}>🔍</div>
                <p style={{ fontWeight:700, color:"#374151", fontSize:"16px" }}>No items found</p>
                <p style={{ fontSize:"14px" }}>Try searching something else</p>
              </div>
            ) : filteredMenu.map((cat, catIdx) => (
              <div key={cat._id} ref={el => { categoryRefs.current[cat._id] = el; }} style={{ marginBottom:"8px", animation:`slide-up 0.4s ${catIdx * 0.08}s ease both` }}>
                {/* Category Header */}
                <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"16px 16px 10px" }}>
                  <div style={{ width:"36px", height:"36px", borderRadius:"12px", background:CATEGORY_BG[cat.name] || "linear-gradient(135deg,#7c2d12,#ea580c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", boxShadow:"0 4px 12px rgba(0,0,0,0.2)" }}>
                    {cat.icon}
                  </div>
                  <div>
                    <h2 style={{ fontWeight:800, fontSize:"16px", color:"#111827", margin:0 }}>{cat.name}</h2>
                    <p style={{ fontSize:"11px", color:"#9ca3af", margin:0, fontWeight:600 }}>{cat.items.length} items</p>
                  </div>
                </div>

                <div style={{ padding:"0 16px" }}>
                  {cat.items.map(item => (
                    <MenuItemCard key={item._id} item={item}
                      cartQty={cart.find(c => c.menuItemId === item._id)?.quantity || 0}
                      onAdd={addToCart} onRemove={removeFromCart}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDER TAB */}
        {activeTab === "order" && (
          <div style={{ padding:"16px" }}>
            {!existingOrder ? (
              <div style={{ textAlign:"center", padding:"64px 24px" }}>
                <div style={{ fontSize:"64px", marginBottom:"16px" }}>📋</div>
                <p style={{ fontWeight:800, fontSize:"18px", color:"#111827" }}>No active order</p>
                <p style={{ fontSize:"14px", color:"#9ca3af", marginBottom:"20px" }}>Browse the menu and add items to start</p>
                <button onClick={() => setActiveTab("menu")} style={{ background:"linear-gradient(135deg,#e63946,#c1121f)", color:"white", border:"none", borderRadius:"14px", padding:"14px 28px", fontWeight:700, cursor:"pointer", fontSize:"15px", boxShadow:"0 8px 24px rgba(230,57,70,0.3)" }}>Browse Menu</button>
              </div>
            ) : (
              <div style={{ background:"white", borderRadius:"20px", overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>
                <div style={{ background:"linear-gradient(135deg,#e63946,#c1121f)", padding:"16px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <p style={{ color:"rgba(255,255,255,0.8)", fontSize:"12px", margin:0, fontWeight:600 }}>ORDER NUMBER</p>
                      <p style={{ color:"white", fontWeight:900, fontSize:"20px", margin:"2px 0 0", letterSpacing:"0.5px" }}>#{existingOrder.orderNumber}</p>
                    </div>
                    <span style={{ background:"rgba(255,255,255,0.2)", color:"white", fontSize:"12px", padding:"6px 14px", borderRadius:"99px", fontWeight:700 }}>
                      {existingOrder.status.replace("_"," ").toUpperCase()}
                    </span>
                  </div>
                </div>
                <div style={{ padding:"16px" }}>
                  {existingOrder.items.map(item => (
                    <div key={item._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f3f4f6" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <div style={{ width:"8px", height:"8px", borderRadius:"50%", flexShrink:0, background:item.status==="ready"?"#16a34a":item.status==="preparing"?"#d97706":"#d1d5db" }} />
                        <div>
                          <p style={{ fontSize:"14px", fontWeight:700, color:"#111827", margin:0 }}>{item.name}</p>
                          <p style={{ fontSize:"11px", color:"#9ca3af", margin:"2px 0 0", fontWeight:600, textTransform:"capitalize" }}>{item.status} • ×{item.quantity}</p>
                        </div>
                      </div>
                      <span style={{ fontWeight:800, color:"#111827" }}>₹{(item.price*item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:"16px", color:"#111827", paddingTop:"12px" }}>
                    <span>Total</span>
                    <span style={{ color:"#e63946" }}>₹{existingOrder.totalAmount.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INFO TAB */}
        {activeTab === "info" && (
          <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={{ background:"linear-gradient(135deg,#e63946,#c1121f)", borderRadius:"24px", padding:"28px 24px", textAlign:"center", color:"white" }}>
              <div style={{ fontSize:"56px", marginBottom:"12px" }}>☕</div>
              <h2 style={{ fontWeight:900, fontSize:"24px", margin:"0 0 6px", letterSpacing:"-0.3px" }}>Golden Beans Cafe</h2>
              <p style={{ opacity:0.85, fontSize:"14px", margin:0, fontWeight:500 }}>Premium specialty coffee & artisan food</p>
            </div>
            {[
              { icon:"📍", label:"Address", value:"123, MG Road, Surat, Gujarat" },
              { icon:"📞", label:"Phone", value:"+91 98765 43210" },
              { icon:"🕐", label:"Hours", value:"7:00 AM – 11:00 PM" },
              { icon:"📶", label:"Wi-Fi", value:"GoldenBeans_Guest" },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ background:"white", borderRadius:"16px", padding:"14px 18px", display:"flex", alignItems:"center", gap:"14px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
                <span style={{ fontSize:"24px" }}>{icon}</span>
                <div>
                  <p style={{ fontSize:"11px", color:"#9ca3af", margin:0, fontWeight:700, letterSpacing:"0.5px", textTransform:"uppercase" }}>{label}</p>
                  <p style={{ fontSize:"14px", color:"#111827", margin:"2px 0 0", fontWeight:700 }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:"480px", background:"white", borderTop:"1px solid #f3f4f6", zIndex:30, display:"flex", paddingBottom:"env(safe-area-inset-bottom)", boxShadow:"0 -4px 24px rgba(0,0,0,0.1)" }}>
        {[
          { id:"menu", label:"Menu", icon:"🍽️" },
          { id:"order", label:"My Order", icon:"📋" },
          { id:"info", label:"Info", icon:"ℹ️" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center",
            padding:"10px 0 8px", background:"none", border:"none", cursor:"pointer",
            color:activeTab===tab.id ? "#e63946" : "#9ca3af", position:"relative",
            transition:"color 0.2s ease",
          }}>
            {activeTab===tab.id && (
              <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"28px", height:"3px", background:"#e63946", borderRadius:"99px" }} />
            )}
            <span style={{ fontSize:"24px", transition:"transform 0.2s ease", transform:activeTab===tab.id?"scale(1.1)":"scale(1)" }}>{tab.icon}</span>
            <span style={{ fontSize:"11px", fontWeight:700, marginTop:"2px" }}>{tab.label}</span>
            {tab.id==="order" && existingOrder && !["settled","cancelled"].includes(existingOrder.status) && (
              <div style={{ position:"absolute", top:"6px", right:"calc(50% - 18px)", width:"8px", height:"8px", borderRadius:"50%", background:"#e63946", border:"2px solid white" }} />
            )}
          </button>
        ))}

        {/* Cart Button */}
        <button onClick={() => cart.length > 0 && setIsCartOpen(true)} style={{
          flex:1, display:"flex", flexDirection:"column", alignItems:"center",
          padding:"10px 0 8px", background:"none", border:"none",
          cursor:cart.length>0?"pointer":"default",
          color:cart.length>0?"#e63946":"#d1d5db",
          transition:"color 0.2s ease", position:"relative",
        }}>
          <div style={{ position:"relative" }}>
            <span style={{ fontSize:"24px" }}>🛒</span>
            {totalCartItems > 0 && (
              <span style={{
                position:"absolute", top:"-6px", right:"-10px",
                background:"#e63946", color:"white", fontSize:"10px",
                width:"18px", height:"18px", borderRadius:"50%",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontWeight:800, border:"2px solid white",
                animation:"scale-in 0.2s cubic-bezier(0.34,1.56,0.64,1)",
              }}>{totalCartItems}</span>
            )}
          </div>
          <span style={{ fontSize:"11px", fontWeight:700, marginTop:"2px" }}>
            {totalCartItems > 0 ? formatINR(totalCartValue) : "Cart"}
          </span>
        </button>
      </nav>

      <CartDrawer
        cart={cart} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}
        onUpdateQty={updateQty} onUpdateNote={updateNote}
        onPlaceOrder={placeOrder} isPlacing={isPlacing} existingOrder={existingOrder}
      />
    </div>
  );
}
