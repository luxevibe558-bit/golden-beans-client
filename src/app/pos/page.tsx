"use client";

import SettleBillModal from "@/components/SettleBillModal";
import { useState, useEffect, useCallback, useRef } from "react";
import POSSidebar from "@/components/POSSidebar";
import { menuApi, orderApi, tableApi, inventoryApi } from "@/lib/api";
import { getThumbnailUrl } from "@/lib/cloudinary";
import type { MenuCategory, MenuItem, CartItem, Table, Order } from "@/types";

const T = {
  emerald: "#0F3D2E", emeraldMid: "#1A5340", emeraldLight: "#2D7A5F",
  emeraldDeep: "#0A2C20", gold: "#D4A574", goldLight: "#E8C895", goldDark: "#B08550",
  cream: "#FAF6F0", creamDark: "#F0E8DA", ivory: "#FFFBF5",
  text: "#2C2418", textMuted: "#7A6B54", textDim: "#A89B80",
  border: "#E5DCC9", success: "#4A8B4A", danger: "#C0392B", warning: "#D4A574",
};

const CANCEL_REASONS = [
  "Customer changed mind","Wrong item ordered","Customer left",
  "Duplicate order","Item unavailable","Staff error","Other",
];

const ITEM_EMOJIS: Record<string, string> = {
  Espresso:"☕",Cappuccino:"☕",Latte:"🥛","Masala Chai":"🫖",
  "Hot Chocolate":"🍫","Cold Brew":"🧊","Iced Latte":"🥤",
  "Chocolate Frappe":"🧋","Butter Toast":"🍞","Cheese Sandwich":"🥪",
  "Garlic Bread":"🥖","Chocolate Brownie":"🍫","Cheesecake Slice":"🍰",
  "Classic Omelette":"🍳","Pancake Stack":"🥞",
};

// ── Smart settle readiness check ──
function getSettleReadiness(order: Order): {
  canSettle: boolean;
  reason: string;
  deliveredCount: number;
  totalCount: number;
  pendingItems: string[];
  inKitchenItems: string[];
  readyItems: string[];
  paidOnline: boolean;
  onlinePaymentId: string | null;
} {
  const paidOnline      = !!(order as any)?.paidOnline || !!(order as any)?.razorpayPaymentId;
  const onlinePaymentId = (order as any)?.razorpayPaymentId || null;

  if (!order || !order.items || order.items.length === 0) {
    return { canSettle: false, reason: "No items in order", deliveredCount: 0, totalCount: 0, pendingItems: [], inKitchenItems: [], readyItems: [], paidOnline, onlinePaymentId };
  }

  const delivered   = order.items.filter(i => i.status === "served");
  const inKitchen   = order.items.filter(i => i.status === "preparing" || i.status === "pending");
  const ready       = order.items.filter(i => i.status === "ready");
  const total       = order.items.length;

  const orderDelivered = (order.status as string) === "delivered";
  const allServed      = delivered.length === total;
  const canSettle      = orderDelivered || allServed;

  let reason = "";
  if (!canSettle) {
    if (inKitchen.length > 0) reason = `${inKitchen.length} item${inKitchen.length>1?"s":""} still in kitchen`;
    else if (ready.length > 0) reason = `${ready.length} item${ready.length>1?"s":""} ready — waiter yet to deliver`;
    else if (order.status === "kotSent") reason = "Order sent to kitchen — waiting";
    else reason = "Order not yet delivered";
  }

  return {
    canSettle, reason,
    deliveredCount: delivered.length, totalCount: total,
    pendingItems: inKitchen.map(i => i.name),
    inKitchenItems: inKitchen.map(i => i.name),
    readyItems: ready.map(i => i.name),
    paidOnline, onlinePaymentId,
  };
}

// ── Compact Revenue Ring Widget ──
function RevenueGoalWidget({ goal = 10000 }: { goal?: number }) {
  const [stats, setStats] = useState<{ revenue: number; count: number; topItems: any[] } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'https://golden-beans-server.onrender.com/api';
        const res = await fetch(`${API}/orders/today-stats`).then(r => r.json());
        if (res.success) setStats(res.data);
      } catch { }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  if (!stats) return null;

  const pct    = Math.min(100, Math.round((stats.revenue / goal) * 100));
  const R      = 20; // circle radius
  const CIRC   = 2 * Math.PI * R; // ~125.7
  const filled = (pct / 100) * CIRC;
  const revColor  = pct >= 100 ? "#16A34A" : pct >= 60 ? "#D97706" : T.emerald;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:20 }}>

      {/* Revenue ring */}
      <div style={{ display:"flex", alignItems:"center", gap:12, background:T.ivory, border:`1px solid ${T.border}`, borderRadius:16, padding:"10px 16px 10px 12px", flexShrink:0 }}>
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r={R} fill="none" stroke={T.creamDark} strokeWidth="5"/>
          <circle cx="26" cy="26" r={R} fill="none" stroke={revColor} strokeWidth="5"
            strokeDasharray={`${filled} ${CIRC}`} strokeDashoffset={CIRC*0.25}
            strokeLinecap="round" style={{transition:"stroke-dasharray 0.6s ease"}}/>
          <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill={revColor}>{pct}%</text>
        </svg>
        <div>
          <p style={{ fontSize:11, color:T.textMuted, margin:"0 0 1px", fontWeight:700 }}>Today's Revenue</p>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:18, fontWeight:900, margin:0, color:T.emerald }}>₹{stats.revenue.toFixed(0)}</p>
          <p style={{ fontSize:10, color:T.textDim, margin:0 }}>of ₹{goal.toLocaleString()}</p>
        </div>
      </div>

      {/* Orders ring */}
      <div style={{ display:"flex", alignItems:"center", gap:12, background:T.ivory, border:`1px solid ${T.border}`, borderRadius:16, padding:"10px 16px 10px 12px", flexShrink:0 }}>
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r={R} fill="none" stroke={T.creamDark} strokeWidth="5"/>
          <circle cx="26" cy="26" r={R} fill="none" stroke="#185FA5" strokeWidth="5"
            strokeDasharray={`${Math.min(CIRC, (stats.count/50)*CIRC)} ${CIRC}`}
            strokeDashoffset={CIRC*0.25} strokeLinecap="round"/>
          <text x="26" y="30" textAnchor="middle" fontSize="13" fontWeight="700" fill="#185FA5">{stats.count}</text>
        </svg>
        <div>
          <p style={{ fontSize:11, color:T.textMuted, margin:"0 0 1px", fontWeight:700 }}>Orders</p>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:18, fontWeight:900, margin:0, color:T.text }}>{stats.count}</p>
          <p style={{ fontSize:10, color:T.textDim, margin:0 }}>today</p>
        </div>
      </div>

      {/* Top items compact bar */}
      {stats.topItems.length > 0 && (
        <div style={{ background:T.ivory, border:`1px solid ${T.border}`, borderRadius:16, padding:"10px 14px", flex:1, minWidth:180 }}>
          <p style={{ fontSize:11, color:T.textMuted, fontWeight:700, margin:"0 0 7px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Top Items</p>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {stats.topItems.slice(0,3).map((item,i)=>{
              const barColor = i===0?T.emerald:i===1?"#185FA5":"#D97706";
              const maxQty   = stats.topItems[0]?.qty||1;
              const barW     = Math.round((item.qty/maxQty)*100);
              return(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:10, color:T.textDim, fontWeight:700, width:12 }}>{i+1}.</span>
                  <div style={{ flex:1, height:4, background:T.creamDark, borderRadius:99, overflow:"hidden" }}>
                    <div style={{ width:`${barW}%`, height:"100%", background:barColor, borderRadius:99, transition:"width 0.5s ease" }}/>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:T.text, minWidth:70, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.name}</span>
                  <span style={{ fontSize:10, color:T.textMuted, fontWeight:600 }}>×{item.qty}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cancel Modal ──
function CancelOrderModal({ order, isOpen, onClose, onCancelled }: { order: Order | null; isOpen: boolean; onClose: () => void; onCancelled: () => void }) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  if (!isOpen || !order) return null;
  const handleCancel = async () => {
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'https://golden-beans-server.onrender.com/api';
      await fetch(`${API}/orders/${order._id}/cancel`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: reason === "Other" ? custom || "Other" : reason, cancelledBy: "staff" }) });
      onCancelled();
    } catch { }
    setLoading(false);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div style={{ background: T.ivory, borderRadius: "20px", padding: "28px", width: "420px", boxShadow: "0 24px 60px rgba(0,0,0,0.25)", border: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🚫</div>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: 0 }}>Cancel Order</p>
            <p style={{ fontSize: "11px", color: T.textMuted, margin: 0, fontWeight: 600 }}>#{order.orderNumber} • Table {order.tableNumber}</p>
          </div>
        </div>
        <p style={{ fontSize: "12px", fontWeight: 800, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>Reason</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          {CANCEL_REASONS.map(r => (
            <label key={r} style={{ display: "flex", alignItems: "center", gap: "10px", background: reason === r ? `${T.emerald}10` : T.cream, borderRadius: "10px", padding: "10px 14px", border: `1.5px solid ${reason === r ? T.emerald : T.creamDark}`, cursor: "pointer" }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${reason === r ? T.emerald : T.textDim}`, background: reason === r ? T.emerald : "white", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {reason === r && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "white" }} />}
              </div>
              <input type="radio" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ display: "none" }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: reason === r ? T.emerald : T.text }}>{r}</span>
            </label>
          ))}
        </div>
        {reason === "Other" && <textarea value={custom} onChange={e => setCustom(e.target.value)} placeholder="Describe..." rows={2} style={{ width: "100%", borderRadius: "10px", border: `1.5px solid ${T.creamDark}`, padding: "10px 14px", fontSize: "13px", fontFamily: "inherit", outline: "none", resize: "none", marginBottom: "16px", boxSizing: "border-box", background: T.cream }} />}
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: "12px", border: `1.5px solid ${T.border}`, background: "white", color: T.text, fontWeight: 800, cursor: "pointer", fontSize: "13px" }}>Keep Order</button>
          <button onClick={handleCancel} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: "12px", border: "none", background: T.danger, color: "white", fontWeight: 900, cursor: "pointer", fontSize: "13px", opacity: loading ? 0.7 : 1 }}>{loading ? "Cancelling..." : "🚫 Cancel Order"}</button>
        </div>
      </div>
    </div>
  );
}

function LowStockBanner({ items }: { items: any[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (items.length === 0 || dismissed) return null;
  return (
    <div style={{ background: '#FEF2F2', borderBottom: '2px solid #FECACA', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>⚠️</span>
        <div>
          <p style={{ fontWeight: 800, fontSize: '13px', color: T.danger, margin: 0 }}>Low Stock — {items.length} item{items.length > 1 ? 's' : ''} running low!</p>
          <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0', fontWeight: 600 }}>{items.slice(0, 3).map((i: any) => i.name).join(', ')}{items.length > 3 ? ` +${items.length - 3} more` : ''}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <a href="/pos/inventory" style={{ padding: '6px 14px', borderRadius: '8px', background: T.danger, color: 'white', fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>Restock →</a>
        <button onClick={() => setDismissed(true)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #FECACA', background: 'white', color: '#999', cursor: 'pointer', fontSize: '12px' }}>✕</button>
      </div>
    </div>
  );
}

function PendingApprovalBell({ orders, onAccept, onReject }: { orders: Order[]; onAccept: (id: string) => void; onReject: (id: string) => void }) {
  const [timers, setTimers] = useState<Record<string, number>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  useEffect(() => {
    if (orders.length === 0) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      [0, 0.4, 0.8].forEach(delay => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 1100;
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch { }
  }, [orders.length]);
  useEffect(() => {
    const iv = setInterval(() => {
      const newTimers: Record<string, number> = {};
      orders.forEach(o => { const remaining = Math.max(0, 60 - Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 1000)); newTimers[o._id] = remaining; if (remaining === 0) onAccept(o._id); });
      setTimers(newTimers);
    }, 1000);
    return () => clearInterval(iv);
  }, [orders, onAccept]);
  if (orders.length === 0) return null;
  return (
    <div style={{ position: "fixed", top: "18px", right: "18px", zIndex: 100, width: "340px", maxHeight: "calc(100vh - 36px)", overflowY: "auto" }}>
      {orders.map((order, idx) => (
        <div key={order._id} style={{ background: T.ivory, borderRadius: "16px", padding: "16px", marginBottom: "10px", border: `2px solid ${T.gold}`, boxShadow: "0 16px 40px rgba(15,61,46,0.3)", animation: `slideInRight 0.4s ${idx * 0.1}s ease both` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", animation: "ring 1.5s infinite" }}>🔔</div>
              <div>
                <p style={{ fontWeight: 900, fontSize: "13px", color: T.emerald, margin: 0, fontFamily: "'Playfair Display', serif" }}>New QR Order!</p>
                <p style={{ fontSize: "11px", color: T.textMuted, margin: "1px 0 0", fontWeight: 700 }}>{order.tableNumber} • #{order.orderNumber}</p>
              </div>
            </div>
            <div style={{ background: timers[order._id] <= 10 ? T.danger : T.emerald, color: "white", padding: "3px 8px", borderRadius: "8px", fontSize: "12px", fontWeight: 900 }}>{timers[order._id] || 60}s</div>
          </div>
          <div style={{ background: T.cream, borderRadius: "10px", padding: "9px 11px", marginBottom: "10px", border: `1px solid ${T.creamDark}` }}>
            {order.items.slice(0, 3).map(item => (
              <div key={item._id} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span style={{ fontSize: "11px", color: T.text, fontWeight: 700 }}>{item.name} <span style={{ color: T.textMuted }}>×{item.quantity}</span></span>
                <span style={{ fontSize: "11px", color: T.emerald, fontWeight: 800 }}>₹{item.price * item.quantity}</span>
              </div>
            ))}
            {order.items.length > 3 && <p style={{ fontSize: "10px", color: T.textMuted, margin: "3px 0 0", fontWeight: 700 }}>+{order.items.length - 3} more</p>}
            <div style={{ borderTop: `1px dashed ${T.creamDark}`, paddingTop: "5px", marginTop: "5px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: T.emerald }}>Total</span>
              <span style={{ fontSize: "13px", fontWeight: 900, color: T.emerald }}>₹{order.totalAmount.toFixed(0)}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => onReject(order._id)} style={{ flex: 1, padding: "9px", borderRadius: "9px", border: `1px solid ${T.danger}`, background: "white", color: T.danger, fontWeight: 800, cursor: "pointer", fontSize: "11px" }}>✕ Reject</button>
            <button onClick={() => onAccept(order._id)} style={{ flex: 2, padding: "9px", borderRadius: "9px", border: "none", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, fontWeight: 900, cursor: "pointer", fontSize: "11px" }}>✓ Accept & Send</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── TABLE CARD — Smart Status + HH:MM:SS Timer ──
function TableCard({ table, order, onSelect, waiterRequests }: { table: Table; order: Order | null; onSelect: () => void; waiterRequests?: any[] }) {
  const isOccupied  = table.status === "occupied";
  const hasPending  = order?.status === "pending_approval";
  const hasOrder    = !!order && !["settled", "cancelled"].includes(order.status);
  const [elapsed,   setElapsed  ] = useState(0);
  const [hovered,   setHovered  ] = useState(false);
  const [pulse,     setPulse    ] = useState(false);

  const settle    = order ? getSettleReadiness(order as Order) : { canSettle:false, reason:"", deliveredCount:0, totalCount:0, pendingItems:[], inKitchenItems:[], readyItems:[], paidOnline:false, onlinePaymentId:null };
  const canSettle = hasOrder && settle.canSettle;

  useEffect(() => {
    if (!order?.createdAt) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [order?.createdAt]);

  useEffect(() => {
    if (hasPending) { setPulse(true); const t = setTimeout(() => setPulse(false), 600); return () => clearTimeout(t); }
  }, [hasPending]);

  // ── HH:MM:SS format ──
  const formatElapsed = (s: number) => {
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const pendingRequests = waiterRequests?.filter(r => r.status === 'pending') || [];
  const isQROrder       = order?.createdBy === 'qr';
  const isRunning       = hasOrder && !hasPending && order?.status !== 'kotSent' && order?.status !== 'ready';

  // Border color logic
  const cardBorderColor = canSettle       ? '#22C55E'   // Green = ready to settle
    : hasPending                          ? T.gold
    : pendingRequests.length > 0          ? '#EF4444'
    : (order?.status as string) === 'ready' || (order?.status as string) === 'delivered' ? '#22C55E'
    : isRunning                           ? '#D97706'
    : isOccupied                          ? T.emerald
    : T.border;

  const timerColor = elapsed > 3600 ? T.danger : elapsed > 1800 ? '#D97706' : T.success;
  const timerBg    = elapsed > 3600 ? '#FEF2F2' : elapsed > 1800 ? '#FFFBEB' : '#F0FDF4';
  const timerBd    = elapsed > 3600 ? '#FECACA' : elapsed > 1800 ? '#FDE68A' : '#BBF7D0';

  // Smart status config
  const statusConfig: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    pending_approval: { label: 'Pending Approval', bg: '#FFF7ED', color: '#EA580C', dot: '#F97316' },
    open:             { label: 'Order Placed',      bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6' },
    kotSent:          { label: 'In Kitchen 👨‍🍳',     bg: '#F0FDF4', color: T.success, dot: '#22C55E' },
    partially_ready:  { label: 'Partially Ready',   bg: '#FFFBEB', color: '#D97706', dot: '#F59E0B' },
    ready:            { label: '🔔 Ready to Serve', bg: '#F0FDF4', color: T.success, dot: '#16A34A' },
    delivered:        { label: '✅ Delivered',       bg: '#F0FDF4', color: T.success, dot: '#16A34A' },
    default:          { label: 'Active',             bg: T.creamDark, color: T.textMuted, dot: T.textDim },
  };
  const sc = statusConfig[(order?.status as string) ?? 'default'] ?? statusConfig.default;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isOccupied ? T.ivory : T.cream,
        borderRadius: "22px",
        border: `${(hasPending || pendingRequests.length > 0 || canSettle) ? '2.5px' : isOccupied ? '2px' : '1.5px'} solid ${cardBorderColor}`,
        cursor: "pointer", position: "relative", overflow: "hidden",
        boxShadow: canSettle ? `0 8px 24px rgba(34,197,94,0.2)` : hovered ? `0 20px 48px rgba(15,61,46,0.18)` : isOccupied ? `0 6px 20px rgba(15,61,46,0.10)` : `0 2px 8px rgba(0,0,0,0.04)`,
        transition: "all 0.28s cubic-bezier(0.16,1,0.3,1)",
        transform: hovered ? "translateY(-5px) scale(1.01)" : pulse ? "scale(1.02)" : "translateY(0) scale(1)",
        minHeight: "200px",
      }}
    >
      {isOccupied && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: canSettle ? `linear-gradient(90deg, #22C55E, #4ADE80)` : isRunning ? `linear-gradient(90deg, #D97706, #F59E0B)` : hasPending ? `linear-gradient(90deg, ${T.gold}, ${T.goldLight})` : `linear-gradient(90deg, ${T.emerald}, ${T.emeraldLight}, ${T.gold})`, borderRadius: "22px 22px 0 0" }} />}

      <div style={{ padding: "18px 18px 16px", position: "relative", zIndex: 1 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "14px", flexShrink: 0, background: isOccupied ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.creamDark, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isOccupied ? `0 4px 12px rgba(15,61,46,0.25)` : "none", position: "relative" }}>
              <span style={{ fontSize: "21px" }}>{isOccupied ? "🪑" : "⬜"}</span>
              {hasOrder && <div style={{ position: "absolute", bottom: "-4px", right: "-4px", width: "18px", height: "18px", borderRadius: "50%", background: isQROrder ? "#3B82F6" : T.gold, border: `2px solid ${T.ivory}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px" }}>{isQROrder ? "📱" : "🏪"}</div>}
            </div>
            <div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", fontWeight: 800, color: T.emerald, margin: 0, lineHeight: 1.1 }}>Table {table.tableNumber}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "4px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: canSettle ? '#22C55E' : isOccupied ? (isRunning ? '#D97706' : T.success) : T.textDim, animation: (canSettle || hasPending) ? "pulseDot 1.5s infinite" : "none" }} />
                <span style={{ fontSize: "10px", color: canSettle ? '#16A34A' : isOccupied ? (isRunning ? '#D97706' : T.success) : T.textMuted, fontWeight: 700, letterSpacing: "0.3px" }}>
                  {canSettle ? "READY TO SETTLE" : isOccupied ? (isRunning ? "RUNNING" : "OCCUPIED") : "AVAILABLE"}
                </span>
              </div>
            </div>
          </div>

          {/* Timer — HH:MM:SS */}
          {hasOrder ? (
            <div style={{ background: timerBg, borderRadius: "10px", padding: "5px 10px", border: `1px solid ${timerBd}`, textAlign: "center", minWidth: "72px" }}>
              <p style={{ fontSize: elapsed >= 3600 ? "13px" : "15px", fontWeight: 900, color: timerColor, margin: 0, fontVariantNumeric: "tabular-nums", lineHeight: 1.2, fontFamily: "'DM Mono', monospace" }}>
                {formatElapsed(elapsed)}
              </p>
              <p style={{ fontSize: "8px", color: T.textDim, margin: 0, fontWeight: 700, letterSpacing: "0.5px" }}>ELAPSED</p>
            </div>
          ) : (
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: T.creamDark, display: "flex", alignItems: "center", justifyContent: "center", opacity: hovered ? 0.8 : 0.35 }}>
              <span style={{ fontSize: "13px" }}>→</span>
            </div>
          )}
        </div>

        {/* Pending approval banner */}
        {hasPending && (
          <div style={{ background: `linear-gradient(135deg, ${T.gold}20, ${T.goldLight}15)`, borderRadius: "10px", padding: "8px 12px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px", border: `1.5px solid ${T.gold}50` }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>🔔</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "11px", fontWeight: 800, color: T.emerald, margin: 0 }}>New QR Order Pending!</p>
              <p style={{ fontSize: "10px", color: T.textMuted, margin: 0 }}>#{order?.orderNumber} · Tap to review</p>
            </div>
            <div style={{ background: T.gold, borderRadius: "6px", padding: "2px 7px", fontSize: "9px", fontWeight: 900, color: T.emerald }}>NEW</div>
          </div>
        )}

        {/* Waiter requests banner */}
        {pendingRequests.length > 0 && (
          <div style={{ background: "#FEF2F2", borderRadius: "10px", padding: "8px 12px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px", border: "1.5px solid #FECACA" }}>
            <span style={{ fontSize: "16px" }}>🙋</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "11px", fontWeight: 800, color: T.danger, margin: 0 }}>{pendingRequests.length} Waiter Request{pendingRequests.length > 1 ? 's' : ''}</p>
              <p style={{ fontSize: "10px", color: '#999', margin: 0 }}>{pendingRequests.map((r: any) => r.label || r.type).join(' · ')}</p>
            </div>
          </div>
        )}

        {/* ── SMART SETTLE READINESS BANNER ── */}
        {hasOrder && !canSettle && (order?.status === 'ready' || (order?.status as string) === 'delivered') && (
          <div style={{ background: "#F0FDF4", borderRadius: "10px", padding: "8px 12px", marginBottom: "10px", border: "1.5px solid #BBF7D0", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>🚀</span>
            <p style={{ fontSize: "11px", fontWeight: 800, color: T.success, margin: 0 }}>Waiter delivering — settle soon!</p>
          </div>
        )}

        {hasOrder && !canSettle && settle.inKitchenItems.length > 0 && (
          <div style={{ background: "#FFFBEB", borderRadius: "10px", padding: "7px 11px", marginBottom: "10px", border: "1px solid #FDE68A", display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ fontSize: "14px" }}>👨‍🍳</span>
            <p style={{ fontSize: "10px", color: "#92400E", fontWeight: 700, margin: 0 }}>
              In kitchen: {settle.inKitchenItems.slice(0,2).join(', ')}{settle.inKitchenItems.length > 2 ? ` +${settle.inKitchenItems.length-2}` : ''}
            </p>
          </div>
        )}

        {/* ✅ Can settle banner */}
        {canSettle && (
          <div style={{ background: "rgba(34,197,94,0.1)", borderRadius: "10px", padding: "8px 12px", marginBottom: "10px", border: "1.5px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>✅</span>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 800, color: '#16A34A', margin: 0 }}>
                {settle.paidOnline ? "💳 Paid Online — Ready to close!" : "All items delivered!"}
              </p>
              <p style={{ fontSize: "10px", color: '#166534', margin: 0 }}>
                {settle.paidOnline ? "Payment received — just close the table" : "Ready to settle — tap to proceed"}
              </p>
            </div>
          </div>
        )}

        {/* 💳 Online payment indicator (even before settle ready) */}
        {!canSettle && settle.paidOnline && (
          <div style={{ background: "rgba(59,130,246,0.1)", borderRadius: "10px", padding: "7px 11px", marginBottom: "10px", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ fontSize: "14px" }}>💳</span>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 800, color: '#1D4ED8', margin: 0 }}>Online Payment Done</p>
              <p style={{ fontSize: "9px", color: '#3B82F6', margin: 0, fontFamily: "'DM Mono', monospace" }}>
                {settle.onlinePaymentId?.slice(-8).toUpperCase()}
              </p>
            </div>
            <div style={{ marginLeft: "auto", background: "#DBEAFE", borderRadius: "6px", padding: "2px 7px", fontSize: "9px", fontWeight: 800, color: '#1D4ED8' }}>PAID</div>
          </div>
        )}

        {/* Order details */}
        {hasOrder && order ? (
          <div style={{ background: `${T.emerald}07`, borderRadius: "14px", padding: "12px", border: `1px solid ${T.emerald}15` }}>
            {order.customerName && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", paddingBottom: "10px", borderBottom: `1px dashed ${T.border}` }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: T.gold, fontWeight: 900, flexShrink: 0 }}>{order.customerName.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "12px", fontWeight: 800, color: T.text, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.customerName}</p>
                  {order.customerPhone && <p style={{ fontSize: "10px", color: T.textMuted, margin: 0 }}>📞 {order.customerPhone}</p>}
                </div>
              </div>
            )}
            <div style={{ marginBottom: "10px" }}>
              {order.items.slice(0, 2).map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", color: T.text, fontWeight: 600, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "8px" }}>
                    {item.name}<span style={{ color: T.textDim, marginLeft: "4px" }}>×{item.quantity}</span>
                  </span>
                  <span style={{ fontSize: "11px", color: T.emerald, fontWeight: 800 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
              {order.items.length > 2 && <p style={{ fontSize: "10px", color: T.textDim, margin: "4px 0 0" }}>+{order.items.length - 2} more</p>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: `1px dashed ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", background: sc.bg, borderRadius: "7px", padding: "3px 9px", border: `1px solid ${sc.dot}25` }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: sc.dot }} />
                <span style={{ fontSize: "10px", fontWeight: 800, color: sc.color }}>{sc.label}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "9px", color: T.textDim, fontWeight: 700, margin: "0 0 1px", letterSpacing: "0.5px" }}>BILL</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "22px", fontWeight: 900, color: canSettle ? '#16A34A' : T.emerald, margin: 0, lineHeight: 1 }}>₹{(order.totalAmount).toFixed(0)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "18px 0 8px", borderTop: `1px dashed ${T.border}`, marginTop: "4px" }}>
            <div style={{ fontSize: "28px", marginBottom: "6px", opacity: 0.35 }}>+</div>
            <p style={{ fontSize: "12px", color: T.textDim, fontWeight: 600, margin: 0 }}>Tap to start order</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuCard({ item, cartQty, onAdd, onRemove }: { item: MenuItem; cartQty: number; onAdd: () => void; onRemove: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: "18px", overflow: "hidden", position: "relative", border: `2px solid ${cartQty > 0 ? T.emerald : hovered ? T.gold : T.border}`, boxShadow: cartQty > 0 ? `0 8px 24px rgba(15,61,46,0.2)` : hovered ? `0 12px 32px rgba(0,0,0,0.15)` : `0 2px 8px rgba(0,0,0,0.06)`, transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)", transform: hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)", opacity: item.isAvailable ? 1 : 0.6, aspectRatio: "3/4", cursor: item.isAvailable ? "pointer" : "not-allowed", background: "#1a1a1a" }}>
      {item.imageUrl ? (<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease", transform: hovered ? "scale(1.06)" : "scale(1)" }} />) : (<div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "52px" }}>{ITEM_EMOJIS[item.name] || "🍽️"}</div>)}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0) 70%)", zIndex: 1 }} />
      <div style={{ position: "absolute", top: "10px", left: "10px", right: "10px", display: "flex", justifyContent: "space-between", zIndex: 2 }}>
        {item.tags?.includes("bestseller") ? (<div style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, borderRadius: "6px", padding: "3px 8px", fontSize: "9px", fontWeight: 800, color: T.emerald }}>⭐ BEST</div>) : <div />}
        {cartQty > 0 && (<div style={{ background: T.emerald, borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 900, color: T.gold }}>{cartQty}</div>)}
      </div>
      {!item.isAvailable && (<div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}><span style={{ background: T.danger, color: "white", borderRadius: "8px", padding: "5px 14px", fontSize: "11px", fontWeight: 800 }}>OUT OF STOCK</span></div>)}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 12px 12px", zIndex: 2 }}>
        <p style={{ fontWeight: 800, fontSize: "13px", color: "white", margin: "0 0 6px", lineHeight: 1.2, textShadow: "0 1px 4px rgba(0,0,0,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", fontWeight: 900, color: T.goldLight, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>₹{item.price}</span>
          {item.isAvailable && (cartQty > 0 ? (
            <div style={{ display: "flex", alignItems: "center", background: "rgba(15,61,46,0.9)", borderRadius: "8px", overflow: "hidden" }}>
              <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ width: "28px", height: "28px", background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: "16px", fontWeight: 900 }}>−</button>
              <span style={{ color: T.gold, fontWeight: 900, fontSize: "13px", minWidth: "20px", textAlign: "center" }}>{cartQty}</span>
              <button onClick={e => { e.stopPropagation(); onAdd(); }} style={{ width: "28px", height: "28px", background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: "16px", fontWeight: 900 }}>+</button>
            </div>
          ) : (
            <button onClick={e => { e.stopPropagation(); onAdd(); }} style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, border: "none", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 800, color: T.emerald, cursor: "pointer" }}>+ ADD</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function printKOT(order: Order) {
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return;
  const now = new Date().toLocaleString('en-IN');
  win.document.write(`<html><head><title>KOT</title><style>body{font-family:monospace;padding:16px;font-size:13px;}h2{text-align:center;}. divider{border-top:1px dashed #000;margin:8px 0;}.row{display:flex;justify-content:space-between;padding:2px 0;}.bold{font-weight:bold;font-size:15px;}.center{text-align:center;}</style></head><body><h2>GOLDEN BEANS CAFÉ</h2><p class="center">** KOT REPRINT **</p><div class="divider"></div><div class="row"><span>Table:</span><span class="bold">${order.tableNumber}</span></div><div class="row"><span>Order #:</span><span>${order.orderNumber}</span></div><div class="row"><span>Time:</span><span>${now}</span></div><div class="divider"></div>${order.items.map(i => `<div class="row"><span>${i.name}</span><span>x${i.quantity}</span></div>`).join('')}<div class="divider"></div><p class="center">-- Kitchen Copy --</p></body></html>`);
  win.document.close();
  win.print();
}

// ── Parcel Status Config ──
const PARCEL_STATUS: Record<string,{label:string;color:string;bg:string;icon:string;nextLabel:string}> = {
  confirmed: { label:"Order Received",  color:"#D97706", bg:"#FFFBEB", icon:"📋", nextLabel:"👨‍🍳 Start Preparing" },
  preparing: { label:"In Kitchen 👨‍🍳",  color:"#2563EB", bg:"#EFF6FF", icon:"🔥", nextLabel:"🔔 Mark Ready"       },
  ready:     { label:"Ready! 🔔",       color:"#16A34A", bg:"#F0FDF4", icon:"✅", nextLabel:"💰 Collect & Close"   },
  delivered: { label:"Handed Over ✓",  color:"#6B7280", bg:"#F9FAFB", icon:"✓",  nextLabel:""                     },
};

// ── Parcel Card ──
function ParcelCard({ parcel, onSettle, onStatusChange }: { parcel:any; onSettle:(p:any)=>void; onStatusChange:(id:string,status:string)=>void }) {
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    const iv = setInterval(()=> setElapsed(Math.floor((Date.now()-new Date(parcel.createdAt).getTime())/1000)),1000);
    return()=>clearInterval(iv);
  },[parcel.createdAt]);

  const formatTime=(s:number)=>{ const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; return h>0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; };

  const sc          = PARCEL_STATUS[parcel.status] || PARCEL_STATUS.confirmed;
  const isReady     = parcel.status === "ready";
  const isDelivered = parcel.status === "delivered";
  const isPaidOnline= parcel.paidOnline;
  const timerColor  = elapsed>1800?T.danger:elapsed>900?"#D97706":T.success;
  const timerBg     = elapsed>1800?"#FEF2F2":elapsed>900?"#FFFBEB":"#F0FDF4";

  const handleAction = async()=>{
    if(parcel.status === "ready") { onSettle(parcel); return; }
    const next = ({confirmed:"preparing", preparing:"ready"} as Record<string,string>)[parcel.status];
    if(!next) return;
    setLoading(true);
    try{
      const API = process.env.NEXT_PUBLIC_API_URL||'https://golden-beans-server.onrender.com/api';
      await fetch(`${API}/parcel/${parcel._id}/status`,{ method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status:next }) });
      onStatusChange(parcel._id, next);
    }catch{}
    setLoading(false);
  };

  return(
    <div style={{ background:T.ivory, borderRadius:"20px", overflow:"hidden",
      border:`2px solid ${isReady?"#22C55E":isPaidOnline&&!isDelivered?"#3B82F6":T.border}`,
      boxShadow:isReady?`0 8px 28px rgba(34,197,94,0.25)`:isDelivered?"none":`0 4px 16px rgba(15,61,46,0.08)`,
      opacity:isDelivered?0.65:1, transition:"all 0.25s ease" }}>

      {/* Top status bar */}
      <div style={{ height:4, background:
        isReady?`linear-gradient(90deg,#16A34A,#22C55E)`:
        isPaidOnline?`linear-gradient(90deg,#1D4ED8,#3B82F6)`:
        parcel.status==="preparing"?`linear-gradient(90deg,#2563EB,#60A5FA)`:
        `linear-gradient(90deg,${T.gold},${T.goldLight})` }}/>

      <div style={{ padding:"14px 16px" }}>
        {/* Row 1: Token + Timer */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ background:isReady?"rgba(34,197,94,0.1)":isPaidOnline?"rgba(59,130,246,0.1)":T.cream, border:`1.5px solid ${isReady?"rgba(34,197,94,0.3)":isPaidOnline?"rgba(59,130,246,0.3)":T.creamDark}`, borderRadius:12, padding:"6px 12px" }}>
              <p style={{ fontFamily:"'DM Mono',monospace", fontWeight:900, fontSize:15, color:isReady?"#16A34A":isPaidOnline?"#1D4ED8":T.emerald, margin:0, letterSpacing:1 }}>{parcel.token}</p>
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:T.text, margin:0 }}>{parcel.customerName}</p>
              <p style={{ fontSize:10, color:T.textMuted, margin:0 }}>{parcel.customerPhone}</p>
            </div>
          </div>
          <div style={{ background:timerBg, borderRadius:10, padding:"5px 10px", textAlign:"center", border:`1px solid ${timerColor}20` }}>
            <p style={{ fontFamily:"'DM Mono',monospace", fontSize:14, fontWeight:900, color:timerColor, margin:0 }}>{formatTime(elapsed)}</p>
            <p style={{ fontSize:8, color:T.textDim, margin:0, fontWeight:700 }}>WAITING</p>
          </div>
        </div>

        {/* Row 2: Status badges */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <div style={{ background:sc.bg, borderRadius:8, padding:"4px 10px", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:11 }}>{sc.icon}</span>
            <span style={{ fontSize:11, fontWeight:800, color:sc.color }}>{sc.label}</span>
          </div>
          {isPaidOnline
            ?<div style={{ background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.25)", borderRadius:8, padding:"4px 10px" }}><span style={{ fontSize:10, fontWeight:800, color:"#1D4ED8" }}>💳 PAID ONLINE</span></div>
            :!isDelivered&&<div style={{ background:"rgba(212,165,116,0.1)", border:`1px solid rgba(212,165,116,0.2)`, borderRadius:8, padding:"4px 10px" }}><span style={{ fontSize:10, fontWeight:700, color:T.goldDark }}>💵 COLLECT CASH</span></div>
          }
        </div>

        {/* Row 3: Items */}
        <div style={{ background:T.cream, borderRadius:10, padding:"8px 12px", marginBottom:10, border:`1px solid ${T.creamDark}` }}>
          <p style={{ fontSize:9, color:T.textMuted, fontWeight:800, letterSpacing:"0.5px", textTransform:"uppercase", margin:"0 0 6px" }}>
            {isReady?"✓ VERIFY BEFORE HANDOVER":"ITEMS TO PREPARE"}
          </p>
          {parcel.items.map((item:any,i:number)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"3px 0", borderBottom:i<parcel.items.length-1?`1px solid ${T.creamDark}`:"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:20, height:20, borderRadius:5, background:isReady?"rgba(34,197,94,0.15)":T.emerald, color:isReady?"#16A34A":T.gold, fontSize:9, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center" }}>{item.quantity}</span>
                <span style={{ fontSize:12, color:T.text, fontWeight:600 }}>{item.name}</span>
              </div>
              <span style={{ fontSize:11, color:T.emerald, fontWeight:700 }}>₹{item.price*item.quantity}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, paddingTop:6, borderTop:`1px dashed ${T.creamDark}` }}>
            <span style={{ fontSize:10, color:T.textMuted }}>📦 Pkg ₹{parcel.packagingCharge||10} · {parcel.items.length} items</span>
            <span style={{ fontSize:14, fontWeight:900, color:isReady?"#16A34A":T.emerald }}>₹{parcel.totalAmount}</span>
          </div>
        </div>

        {/* Ready callout */}
        {isReady&&(
          <div style={{ background:"rgba(34,197,94,0.08)", border:"1.5px solid rgba(34,197,94,0.3)", borderRadius:10, padding:"8px 12px", marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:18 }}>🔔</span>
            <div>
              <p style={{ fontSize:12, fontWeight:800, color:"#16A34A", margin:0 }}>Call Customer to Counter!</p>
              <p style={{ fontSize:10, color:"rgba(22,163,74,0.7)", margin:0, fontFamily:"'DM Mono',monospace" }}>{parcel.customerName.split(" ")[0].toUpperCase()} · {parcel.token}</p>
            </div>
          </div>
        )}

        {/* Action button */}
        {!isDelivered&&(
          <button onClick={handleAction} disabled={loading}
            style={{ width:"100%", padding:"11px", borderRadius:11, border:"none",
              background:isReady?isPaidOnline?`linear-gradient(135deg,#1D4ED8,#3B82F6)`:`linear-gradient(135deg,#16A34A,#22C55E)`:parcel.status==="preparing"?`linear-gradient(135deg,#2563EB,#3B82F6)`:`linear-gradient(135deg,${T.emerald},${T.emeraldMid})`,
              color:"white", fontWeight:800, fontSize:13, cursor:"pointer",
              boxShadow:isReady?`0 4px 16px rgba(34,197,94,0.4)`:"none",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              fontFamily:"'DM Sans',sans-serif", opacity:loading?0.7:1 }}>
            {loading?"Updating...":sc.nextLabel}
          </button>
        )}
        {isDelivered&&<div style={{ textAlign:"center", padding:"6px 0" }}><span style={{ fontSize:11, color:T.textDim, fontWeight:700 }}>✓ Completed & Handed Over</span></div>}
      </div>
    </div>
  );
}


// ── Parcel Settle Modal ──
function ParcelSettleModal({ parcel, isOpen, onClose, onSettled }:{ parcel:any; isOpen:boolean; onClose:()=>void; onSettled:()=>void }) {
  const [method, setMethod] = useState<"cash"|"upi">("cash");
  const [settling, setSettling] = useState(false);

  useEffect(()=>{ if(isOpen&&parcel){ setMethod(parcel.paidOnline?"upi":"cash"); } },[isOpen,parcel]);

  if(!isOpen||!parcel) return null;

  const handleSettle = async()=>{
    setSettling(true);
    try{
      const API = process.env.NEXT_PUBLIC_API_URL||'https://golden-beans-server.onrender.com/api';
      await fetch(`${API}/parcel/${parcel._id}/status`,{
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ status:"delivered", paymentMethod:method, amountPaid:parcel.totalAmount }),
      });
      onSettled();
    }catch{}
    setSettling(false);
  };

  return(
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.ivory, borderRadius:20, width:"100%", maxWidth:400, overflow:"hidden", boxShadow:"0 24px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${T.goldDark},${T.gold},${T.goldLight})` }}/>
        <div style={{ padding:"20px 22px", background:`linear-gradient(135deg,${T.emerald},${T.emeraldMid})` }}>
          <p style={{ fontSize:10, color:"rgba(212,165,116,0.7)", fontWeight:800, letterSpacing:"0.08em", textTransform:"uppercase", margin:"0 0 3px" }}>Parcel Handover</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:800, color:T.gold, margin:0 }}>{parcel.token}</h2>
          <p style={{ fontSize:11, color:"rgba(212,165,116,0.7)", margin:"3px 0 0" }}>{parcel.customerName} · {parcel.items.length} items</p>
        </div>
        <div style={{ padding:"20px 22px" }}>
          {/* Online paid banner */}
          {parcel.paidOnline&&(
            <div style={{ background:"rgba(59,130,246,0.08)", border:"1.5px solid rgba(59,130,246,0.25)", borderRadius:12, padding:"12px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:22 }}>💳</span>
              <div>
                <p style={{ fontSize:13, fontWeight:800, color:"#1D4ED8", margin:0 }}>Already Paid Online!</p>
                <p style={{ fontSize:11, color:"#3B82F6", margin:0 }}>₹{parcel.totalAmount} received — no cash needed</p>
              </div>
            </div>
          )}

          {/* Items checklist */}
          <p style={{ fontSize:10, fontWeight:800, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 8px" }}>Verify items before handover</p>
          <div style={{ background:T.cream, borderRadius:10, padding:"10px 12px", marginBottom:16, border:`1px solid ${T.creamDark}` }}>
            {parcel.items.map((item:any,i:number)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:i<parcel.items.length-1?`1px solid ${T.creamDark}`:"none" }}>
                <span style={{ fontSize:12, color:T.text, fontWeight:600 }}>✓ {item.name} × {item.quantity}</span>
                <span style={{ fontSize:11, color:T.emerald, fontWeight:700 }}>₹{item.price*item.quantity}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, paddingTop:6, borderTop:`1px dashed ${T.creamDark}`, fontWeight:800 }}>
              <span style={{ fontSize:13, color:T.emerald }}>Total (incl. packaging)</span>
              <span style={{ fontSize:15, color:T.emerald }}>₹{parcel.totalAmount}</span>
            </div>
          </div>

          {/* Payment method — only if not paid online */}
          {!parcel.paidOnline&&(
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:10, fontWeight:800, color:T.textMuted, textTransform:"uppercase", margin:"0 0 8px" }}>Collect Payment</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {(["cash","upi"] as const).map(m=>(
                  <button key={m} onClick={()=>setMethod(m)} style={{ padding:"12px", borderRadius:12, border:`2px solid ${method===m?T.emerald:T.border}`, background:method===m?`${T.emerald}12`:T.cream, color:method===m?T.emerald:T.textMuted, fontWeight:800, fontSize:13, cursor:"pointer" }}>
                    {m==="cash"?"💵 Cash":"📱 UPI"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:12, border:`1px solid ${T.border}`, background:"white", color:T.text, fontWeight:700, cursor:"pointer" }}>Cancel</button>
            <button onClick={handleSettle} disabled={settling}
              style={{ flex:2, padding:"12px", borderRadius:12, border:"none",
                background:parcel.paidOnline?`linear-gradient(135deg,#1D4ED8,#3B82F6)`:`linear-gradient(135deg,${T.emerald},${T.emeraldMid})`,
                color:"white", fontWeight:800, fontSize:14, cursor:"pointer",
                boxShadow:parcel.paidOnline?"0 6px 16px rgba(59,130,246,0.4)":"0 6px 16px rgba(15,61,46,0.3)" }}>
              {settling?"Processing...":`${parcel.paidOnline?"🔒 Close Parcel":"✅ Confirm Handover"}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Compact Revenue Ring for Header ──
function RevenueRing({ goal = 10000 }: { goal?: number }) {
  const [stats, setStats] = useState<{ revenue: number; count: number } | null>(null);
  useEffect(() => {
    const load = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'https://golden-beans-server.onrender.com/api';
        const res = await fetch(`${API}/orders/today-stats`).then(r => r.json());
        if (res.success) setStats(res.data);
      } catch { }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  if (!stats) return null;

  const revPct   = Math.min(100, Math.round((stats.revenue / goal) * 100));
  const ordPct   = Math.min(100, Math.round((stats.count / 50) * 100));
  const R = 14; const CIRC = 2 * Math.PI * R;
  const revColor = revPct >= 100 ? "#16A34A" : revPct >= 60 ? "#D97706" : T.emerald;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      {/* Revenue ring */}
      <div style={{ display:"flex", alignItems:"center", gap:8, background:T.cream, border:`1px solid ${T.creamDark}`, borderRadius:12, padding:"7px 12px" }}>
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={R} fill="none" stroke={T.creamDark} strokeWidth="4"/>
          <circle cx="18" cy="18" r={R} fill="none" stroke={revColor} strokeWidth="4"
            strokeDasharray={`${(revPct/100)*CIRC} ${CIRC}`} strokeDashoffset={CIRC*0.25} strokeLinecap="round"/>
          <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill={revColor}>{revPct}%</text>
        </svg>
        <div>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:900, color:T.emerald, margin:0, lineHeight:1 }}>₹{stats.revenue.toFixed(0)}</p>
          <p style={{ fontSize:9, color:T.textMuted, margin:0, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px" }}>Revenue</p>
        </div>
      </div>
      {/* Orders ring */}
      <div style={{ display:"flex", alignItems:"center", gap:8, background:T.cream, border:`1px solid ${T.creamDark}`, borderRadius:12, padding:"7px 12px" }}>
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={R} fill="none" stroke={T.creamDark} strokeWidth="4"/>
          <circle cx="18" cy="18" r={R} fill="none" stroke={T.goldDark} strokeWidth="4"
            strokeDasharray={`${(ordPct/100)*CIRC} ${CIRC}`} strokeDashoffset={CIRC*0.25} strokeLinecap="round"/>
          <text x="18" y="22" textAnchor="middle" fontSize="10" fontWeight="700" fill={T.goldDark}>{stats.count}</text>
        </svg>
        <div>
          <p style={{ fontSize:14, fontWeight:900, color:T.text, margin:0, lineHeight:1 }}>{stats.count}</p>
          <p style={{ fontSize:9, color:T.textMuted, margin:0, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px" }}>Orders</p>
        </div>
      </div>
    </div>
  );
}

export default function POSPage() {
  const [view,           setView          ] = useState<"tables"|"order">("tables");
  const [tables,         setTables        ] = useState<Table[]>([]);
  const [tableOrders,    setTableOrders   ] = useState<Record<string, Order>>({});
  const [menu,           setMenu          ] = useState<MenuCategory[]>([]);
  const [selectedTable,  setSelectedTable ] = useState<Table | null>(null);
  const [currentOrder,   setCurrentOrder  ] = useState<Order | null>(null);
  const [pendingOrders,  setPendingOrders ] = useState<Order[]>([]);
  const [cart,           setCart          ] = useState<CartItem[]>([]);
  const [loading,        setLoading       ] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery,    setSearchQuery   ] = useState("");
  const [settleModalOrder,setSettleModalOrder] = useState<Order | null>(null);
  const [lowStockItems,  setLowStockItems ] = useState<any[]>([]);
  const [tableRequests,  setTableRequests ] = useState<Record<string, any[]>>({});
  const [currentTime,    setCurrentTime   ] = useState(new Date());
  const [cancelModal,    setCancelModal   ] = useState<Order | null>(null);
  const [parcels,        setParcels       ] = useState<any[]>([]);
  const [parcelModal,    setParcelModal   ] = useState<any|null>(null);
  const [posTab,         setPosTab        ] = useState<"tables"|"parcels">("tables");

  useEffect(() => { const iv = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(iv); }, []);

  const loadTables = useCallback(async () => {
    try {
      const res = await tableApi.getTables();
      const tbls: Table[] = res.data.data;
      setTables(tbls);
      const orderMap: Record<string, Order> = {};
      await Promise.all(tbls.filter(t => t.currentOrderId).map(async t => {
        try { const r = await orderApi.getOrderByTable(t._id); if (r.data.data) orderMap[t._id] = r.data.data; } catch { }
      }));
      setTableOrders(orderMap);
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'https://golden-beans-server.onrender.com/api';
        const wr = await fetch(`${API}/waiter/all-requests`).then(r => r.json());
        const requests: any[] = wr.requests || [];
        const reqMap: Record<string, any[]> = {};
        requests.forEach(r => { if (!reqMap[r.tableId]) reqMap[r.tableId] = []; reqMap[r.tableId].push(r); });
        setTableRequests(reqMap);
      } catch { }
    } catch { }
  }, []);

  const loadParcels = useCallback(async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'https://golden-beans-server.onrender.com/api';
      const res = await fetch(`${API}/parcel/active/all`).then(r => r.json());
      if (res.success) setParcels(res.data || []);
    } catch { }
  }, []);

  const loadPendingApprovals = useCallback(async () => {
    try { const res = await orderApi.getPendingApproval(); setPendingOrders(res.data.data || []); } catch { }
  }, []);

  const loadLowStock = useCallback(async () => {
    try { const res = await inventoryApi.getLowStock(); setLowStockItems(res.data.data || []); } catch { }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const [tablesRes, menuRes] = await Promise.all([tableApi.getTables(), menuApi.getMenu()]);
        const tbls: Table[] = tablesRes.data.data;
        setTables(tbls); setMenu(menuRes.data.data);
        if (menuRes.data.data.length > 0) setActiveCategory(menuRes.data.data[0]._id);
        const orderMap: Record<string, Order> = {};
        await Promise.all(tbls.filter(t => t.currentOrderId).map(async t => {
          try { const r = await orderApi.getOrderByTable(t._id); if (r.data.data) orderMap[t._id] = r.data.data; } catch { }
        }));
        setTableOrders(orderMap);
      } catch { } finally { setLoading(false); }
    }
    init(); loadPendingApprovals(); loadLowStock(); loadParcels();
    try {
      const { getSocket, joinPOS } = require("@/lib/socket");
      const sock = getSocket(); joinPOS();
      sock.on("order:new",      () => { loadTables(); loadPendingApprovals(); });
      sock.on("order:update",   () => { loadTables(); });
      sock.on("order:ready",    () => { loadTables(); loadPendingApprovals(); });
      sock.on("waiter:request", () => { loadTables(); });
      sock.on("table:update",   () => { loadTables(); });
      sock.on("parcel:new",     () => { loadParcels(); });
      sock.on("parcel:update",  () => { loadParcels(); });
    } catch { }
    const iv = setInterval(() => { loadTables(); loadPendingApprovals(); loadLowStock(); loadParcels(); }, 15000);
    return () => clearInterval(iv);
  }, [loadTables, loadPendingApprovals, loadLowStock]);

  const handleSelectTable = async (table: Table) => {
    setSelectedTable(table); setCart([]);
    if (table.currentOrderId) {
      try { const res = await orderApi.getOrderByTable(table._id); setCurrentOrder(res.data.data || null); } catch { setCurrentOrder(null); }
    } else { setCurrentOrder(null); }
    setView("order");
  };

  const handleAcceptApproval = async (orderId: string) => {
    try { await orderApi.approveOrder(orderId); setPendingOrders(prev => prev.filter(o => o._id !== orderId)); loadTables(); } catch { }
  };
  const handleRejectApproval = async (orderId: string) => {
    try { await orderApi.rejectOrder(orderId, "Rejected by staff"); setPendingOrders(prev => prev.filter(o => o._id !== orderId)); loadTables(); } catch { }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => { const ex = prev.find(c => c.menuItemId === item._id); if (ex) return prev.map(c => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c); return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, notes: "", isVeg: true }]; });
  };
  const removeFromCart = (itemId: string) => {
    setCart(prev => { const ex = prev.find(c => c.menuItemId === itemId); if (!ex) return prev; if (ex.quantity === 1) return prev.filter(c => c.menuItemId !== itemId); return prev.map(c => c.menuItemId === itemId ? { ...c, quantity: c.quantity - 1 } : c); });
  };

  const sendKOT = async () => {
    if (!selectedTable || cart.length === 0) return;
    try {
      const res = await orderApi.createOrder({ tableId: selectedTable._id, items: cart, createdBy: "pos" });
      setCurrentOrder(res.data.data); setCart([]); loadTables(); loadLowStock();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed to send KOT"); }
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const activeItems = searchQuery ? menu.flatMap(c => c.items).filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) : (menu.find(c => c._id === activeCategory)?.items || []);

  // ── Settle readiness for current order ──
  const settleStatus = currentOrder ? getSettleReadiness(currentOrder) : null;
  const canSettle    = !!settleStatus?.canSettle;

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&family=DM+Mono:wght@400;500;600&display=swap');
    * { box-sizing: border-box; }
    @keyframes slideInRight { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes ring { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-15deg); } 75% { transform: rotate(15deg); } }
    @keyframes fadeInUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }
    @keyframes settleGlow { 0%, 100% { box-shadow: 0 6px 24px rgba(34,197,94,0.3); } 50% { box-shadow: 0 6px 36px rgba(34,197,94,0.6); } }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #F0E8DA; border-radius: 6px; }
  `;

  if (view === "tables") return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.cream, fontFamily: "'Nunito', sans-serif" }}>
      <style>{STYLES}</style>
      <POSSidebar />
      <PendingApprovalBell orders={pendingOrders} onAccept={handleAcceptApproval} onReject={handleRejectApproval} />
      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <LowStockBanner items={lowStockItems} />
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(15,61,46,0.05)", gap:16 }}>
          {/* Left: Title + Time */}
          <div style={{ flexShrink:0 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "22px", color: T.emerald, margin: 0, lineHeight:1 }}>Golden Beans POS</h1>
            <p style={{ fontSize: "11px", color: T.textMuted, margin: "3px 0 0", fontWeight: 600 }}>
              {currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} • {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
            </p>
          </div>

          {/* Right: Revenue + Orders rings only */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>

            {/* Revenue ring — from RevenueGoalWidget data */}
            <RevenueRing goal={10000}/>

            {/* Settle now alert */}
            {Object.values(tableOrders).filter(o => getSettleReadiness(o).canSettle).length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(34,197,94,0.1)", border:"1.5px solid rgba(34,197,94,0.4)", borderRadius:12, padding:"7px 12px", animation:"settleGlow 2s ease-in-out infinite" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(34,197,94,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>✅</div>
                <div>
                  <p style={{ fontSize:14, fontWeight:900, color:"#16A34A", margin:0, lineHeight:1 }}>{Object.values(tableOrders).filter(o=>getSettleReadiness(o).canSettle).length}</p>
                  <p style={{ fontSize:9, color:"#16A34A", margin:0, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px" }}>Settle</p>
                </div>
              </div>
            )}

            {/* Parcel ready */}
            {parcels.filter(p=>p.status==="ready").length>0&&(
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(34,197,94,0.1)", border:"1.5px solid rgba(34,197,94,0.4)", borderRadius:12, padding:"7px 12px", cursor:"pointer" }} onClick={()=>setPosTab("parcels")}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(34,197,94,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📦</div>
                <div>
                  <p style={{ fontSize:14, fontWeight:900, color:"#16A34A", margin:0, lineHeight:1 }}>{parcels.filter(p=>p.status==="ready").length}</p>
                  <p style={{ fontSize:9, color:"#16A34A", margin:0, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px" }}>Parcel</p>
                </div>
              </div>
            )}

            {/* Low stock */}
            {lowStockItems.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, padding:"7px 12px" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(192,57,43,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⚠️</div>
                <div>
                  <p style={{ fontSize:14, fontWeight:900, color:T.danger, margin:0, lineHeight:1 }}>{lowStockItems.length}</p>
                  <p style={{ fontSize:9, color:T.danger, margin:0, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px" }}>Stock</p>
                </div>
              </div>
            )}
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <RevenueGoalWidget goal={10000} />

          {/* Tab switcher */}
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            {([
              { id:"tables", label:"🪑 Tables",  count:tables.filter(t=>t.status==="occupied").length },
              { id:"parcels",label:"📦 Parcels", count:parcels.filter(p=>p.status!=="delivered").length },
            ] as const).map(tab=>(
              <button key={tab.id} onClick={()=>setPosTab(tab.id)}
                style={{ padding:"10px 20px", borderRadius:12, border:`2px solid ${posTab===tab.id?T.emerald:T.border}`, background:posTab===tab.id?T.emerald:"white", color:posTab===tab.id?T.gold:T.textMuted, fontWeight:800, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                {tab.label}
                {tab.count>0&&<span style={{ background:posTab===tab.id?"rgba(212,165,116,0.3)":T.creamDark, borderRadius:99, padding:"1px 8px", fontSize:11, color:posTab===tab.id?T.gold:T.textMuted, fontWeight:900 }}>{tab.count}</span>}
              </button>
            ))}
            {posTab==="tables"&&(
              <button onClick={() => handleSelectTable({ _id: "counter", tableNumber: "Counter", status: "available", currentOrderId: null, capacity: 1, qrCode: "" } as any)}
                style={{ marginLeft:"auto", padding: "10px 20px", borderRadius: "12px", border: `2px solid ${T.emerald}`, background: T.emerald, color: T.gold, fontWeight: 800, fontSize: "13px", cursor: "pointer" }}>
                🏪 Counter Order
              </button>
            )}
          </div>

          {/* Tables tab */}
          {posTab==="tables"&&(
            loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {Array.from({ length: 6 }).map((_, i) => (<div key={i} style={{ height: "200px", background: T.ivory, borderRadius: "22px", border: `1px solid ${T.border}`, animation: "pulse 1.5s infinite" }} />))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {tables.map((table, idx) => (
                  <div key={table._id} style={{ animation: `fadeInUp 0.3s ${idx * 0.04}s ease both` }}>
                    <TableCard table={table} order={tableOrders[table._id] || null} onSelect={() => handleSelectTable(table)} waiterRequests={tableRequests[table._id] || []} />
                  </div>
                ))}
              </div>
            )
          )}

          {/* Parcels tab */}
          {posTab==="parcels"&&(
            <div>
              {parcels.length===0?(
                <div style={{ textAlign:"center", padding:"60px 20px", color:T.textMuted }}>
                  <div style={{ fontSize:48, marginBottom:12, opacity:0.3 }}>📦</div>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:T.emerald, margin:"0 0 6px" }}>No active parcels</p>
                  <p style={{ fontSize:13, fontWeight:600 }}>Parcel orders will appear here</p>
                </div>
              ):(
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
                  {parcels.map((parcel,idx)=>(
                    <div key={parcel._id} style={{ animation:`fadeInUp 0.3s ${idx*0.05}s ease both` }}>
                      <ParcelCard parcel={parcel}
                        onSettle={p=>setParcelModal(p)}
                        onStatusChange={(_id,status)=>{
                          setParcels(prev=>prev.map(p=>p._id===_id?{...p,status}:p));
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <SettleBillModal order={settleModalOrder} isOpen={!!settleModalOrder} onClose={() => setSettleModalOrder(null)}
        onSettled={() => { setSettleModalOrder(null); setCurrentOrder(null); setSelectedTable(null); loadTables(); loadPendingApprovals(); }} />
      <ParcelSettleModal parcel={parcelModal} isOpen={!!parcelModal} onClose={()=>setParcelModal(null)}
        onSettled={()=>{ setParcelModal(null); loadParcels(); }} />
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.cream, fontFamily: "'Nunito', sans-serif" }}>
      <style>{STYLES}</style>
      <POSSidebar />
      <PendingApprovalBell orders={pendingOrders} onAccept={handleAcceptApproval} onReject={handleRejectApproval} />
      <CancelOrderModal order={cancelModal} isOpen={!!cancelModal} onClose={() => setCancelModal(null)}
        onCancelled={() => { setCancelModal(null); setCurrentOrder(null); setSelectedTable(null); setCart([]); setView("tables"); loadTables(); }} />
      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <LowStockBanner items={lowStockItems} />
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "12px 20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 2px 8px rgba(15,61,46,0.05)" }}>
          <button onClick={() => { setView("tables"); setSelectedTable(null); setCurrentOrder(null); setCart([]); }} style={{ width: "36px", height: "36px", borderRadius: "10px", border: `1px solid ${T.border}`, background: T.cream, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>←</button>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "20px", color: T.emerald, margin: 0 }}>Table {selectedTable?.tableNumber}</h1>
            <p style={{ fontSize: "11px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600 }}>
              {currentOrder ? `Order #${currentOrder.orderNumber} • ${currentOrder.status}` : "New Order"}
              {currentOrder?.customerName && ` • ${currentOrder.customerName}`}
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
            {currentOrder && <button onClick={() => printKOT(currentOrder)} style={{ padding: "7px 14px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: "white", color: T.emerald, fontWeight: 800, cursor: "pointer", fontSize: "12px" }}>🖨️ Reprint KOT</button>}
            {currentOrder && <button onClick={() => setCancelModal(currentOrder)} style={{ padding: "7px 14px", borderRadius: "10px", border: `1.5px solid ${T.danger}`, background: "#FEF2F2", color: T.danger, fontWeight: 800, cursor: "pointer", fontSize: "12px" }}>🚫 Cancel</button>}
            {currentOrder && <div style={{ background: `${T.success}15`, border: `1px solid ${T.success}33`, borderRadius: "10px", padding: "6px 14px" }}><p style={{ fontSize: "11px", fontWeight: 800, color: T.success, margin: 0 }}>₹{currentOrder.totalAmount.toFixed(0)} Due</p></div>}
          </div>
        </header>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", overflow: "hidden" }}>
          {/* Menu side */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: `1px solid ${T.border}` }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, background: T.ivory }}>
              <input type="text" placeholder="🔍 Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "9px 14px", borderRadius: "10px", border: `1px solid ${T.creamDark}`, background: T.cream, fontSize: "13px", fontWeight: 600, outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
              {!searchQuery && (
                <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
                  {menu.map(cat => (
                    <button key={cat._id} onClick={() => setActiveCategory(cat._id)} style={{ flexShrink: 0, padding: "5px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: 800, border: `1.5px solid ${activeCategory === cat._id ? T.emerald : T.creamDark}`, background: activeCategory === cat._id ? T.emerald : "white", color: activeCategory === cat._id ? T.gold : T.emerald, cursor: "pointer", whiteSpace: "nowrap" }}>
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
                {(activeItems as MenuItem[]).map((item, idx) => {
                  const cartQty = cart.find(c => c.menuItemId === item._id)?.quantity || 0;
                  return (
                    <div key={item._id} style={{ animation: `fadeInUp 0.25s ${idx * 0.03}s ease both` }}>
                      <MenuCard item={item} cartQty={cartQty} onAdd={() => addToCart(item)} onRemove={() => removeFromCart(item._id)} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order panel */}
          <div style={{ display: "flex", flexDirection: "column", background: T.ivory, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 800, color: T.emerald, margin: 0 }}>{currentOrder ? "Active Order" : "New Order"}</p>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {currentOrder && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 8px" }}>Ordered Items</p>
                  {currentOrder.items.map((item, i) => {
                    const itemStatus = item.status;
                    const statusColor = itemStatus === "served" ? T.success : itemStatus === "ready" ? '#22C55E' : itemStatus === "preparing" ? '#D97706' : T.textMuted;
                    const statusBg    = itemStatus === "served" ? '#F0FDF4' : itemStatus === "ready" ? '#DCFCE7' : itemStatus === "preparing" ? '#FFFBEB' : T.cream;
                    return (
                      <div key={i} style={{ background: statusBg, borderRadius: "10px", padding: "9px 12px", marginBottom: "6px", border: `1px solid ${statusColor}25`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ fontSize: "12px", fontWeight: 800, color: T.text, margin: 0 }}>{item.name}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
                            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: statusColor }} />
                            <p style={{ fontSize: "10px", color: statusColor, margin: 0, fontWeight: 700, textTransform: "capitalize" }}>{itemStatus} • ×{item.quantity}</p>
                          </div>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 900, color: T.emerald }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {cart.length > 0 && (
                <div>
                  <p style={{ fontSize: "10px", color: T.gold, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 8px" }}>New Items</p>
                  {cart.map(item => (
                    <div key={item.menuItemId} style={{ background: `${T.gold}15`, borderRadius: "10px", padding: "9px 12px", marginBottom: "6px", border: `1px solid ${T.gold}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: 800, color: T.text, margin: 0 }}>{item.name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                          <button onClick={() => removeFromCart(item.menuItemId)} style={{ width: "20px", height: "20px", borderRadius: "5px", border: "none", background: T.emerald, color: T.gold, fontWeight: 900, cursor: "pointer", fontSize: "11px" }}>−</button>
                          <span style={{ fontSize: "12px", fontWeight: 900, minWidth: "16px", textAlign: "center" }}>{item.quantity}</span>
                          <button onClick={() => addToCart({ _id: item.menuItemId, name: item.name, price: item.price } as MenuItem)} style={{ width: "20px", height: "20px", borderRadius: "5px", border: "none", background: T.emerald, color: T.gold, fontWeight: 900, cursor: "pointer", fontSize: "11px" }}>+</button>
                        </div>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 900, color: T.emerald }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}

              {!currentOrder && cart.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <p style={{ fontSize: "40px", margin: "0 0 8px" }}>🍽️</p>
                  <p style={{ fontSize: "13px", color: T.textDim, fontWeight: 600 }}>Select items from menu</p>
                </div>
              )}
            </div>

            {/* ── SMART SETTLE PANEL ── */}
            {(cart.length > 0 || currentOrder) && (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: "14px" }}>
                {cart.length > 0 && (
                  <div style={{ background: T.cream, borderRadius: "12px", padding: "10px 12px", marginBottom: "10px", border: `1px solid ${T.creamDark}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: T.textMuted, marginBottom: "4px" }}><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: T.textMuted, marginBottom: "6px", paddingBottom: "6px", borderBottom: `1px dashed ${T.creamDark}` }}><span>GST (5%)</span><span>₹{tax.toFixed(0)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "15px", color: T.emerald }}><span>Total</span><span>₹{total.toFixed(0)}</span></div>
                  </div>
                )}

                {cart.length > 0 && (
                  <button onClick={sendKOT} style={{ width: "100%", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, border: "none", borderRadius: "12px", padding: "12px", fontWeight: 900, fontSize: "14px", cursor: "pointer", boxShadow: "0 6px 16px rgba(15,61,46,0.3)", marginBottom: currentOrder ? "8px" : 0 }}>
                    📤 Send KOT
                  </button>
                )}

                {/* Smart settle button — only when all delivered */}
                {currentOrder && canSettle && (
                  <>
                    {/* Online payment — special close button */}
                    {settleStatus?.paidOnline ? (
                      <div>
                        <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "12px", padding: "10px 14px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "20px" }}>💳</span>
                          <div>
                            <p style={{ fontSize: "12px", fontWeight: 800, color: '#1D4ED8', margin: 0 }}>Payment Already Received!</p>
                            <p style={{ fontSize: "10px", color: '#3B82F6', margin: 0, fontFamily: "'DM Mono', monospace" }}>
                              ID: {settleStatus.onlinePaymentId?.slice(-10).toUpperCase()} · ₹{currentOrder.totalAmount.toFixed(0)}
                            </p>
                          </div>
                          <div style={{ marginLeft: "auto", background: "#DBEAFE", borderRadius: "8px", padding: "3px 10px", fontSize: "10px", fontWeight: 800, color: '#1D4ED8' }}>PAID ✓</div>
                        </div>
                        <button onClick={() => setSettleModalOrder(currentOrder)}
                          style={{ width: "100%", background: `linear-gradient(135deg, #1D4ED8, #3B82F6)`, color: "white", border: "none", borderRadius: "12px", padding: "14px", fontWeight: 900, fontSize: "15px", cursor: "pointer", boxShadow: "0 6px 24px rgba(59,130,246,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                          🔒 Close Table — Already Paid
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setSettleModalOrder(currentOrder)}
                        style={{ width: "100%", background: `linear-gradient(135deg, #16A34A, #22C55E)`, color: "white", border: "none", borderRadius: "12px", padding: "14px", fontWeight: 900, fontSize: "15px", cursor: "pointer", boxShadow: "0 6px 24px rgba(34,197,94,0.4)", animation: "settleGlow 2s ease-in-out infinite", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        ✅ Settle Bill — ₹{currentOrder.totalAmount.toFixed(0)}
                      </button>
                    )}
                  </>
                )}

                {/* Settle blocked — show reason */}
                {currentOrder && !canSettle && settleStatus && (
                  <div style={{ width: "100%", background: T.creamDark, borderRadius: "12px", padding: "12px 14px", border: `1px solid ${T.border}`, textAlign: "center" }}>
                    <p style={{ fontSize: "12px", fontWeight: 800, color: T.textMuted, margin: "0 0 4px" }}>💰 Settle Bill</p>
                    <p style={{ fontSize: "11px", color: T.textMuted, margin: 0, fontWeight: 600 }}>
                      {settleStatus.reason}
                    </p>
                    {/* Progress */}
                    {settleStatus.totalCount > 0 && (
                      <div style={{ marginTop: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: T.textDim, marginBottom: "4px" }}>
                          <span>Delivery progress</span>
                          <span>{settleStatus.deliveredCount}/{settleStatus.totalCount} items</span>
                        </div>
                        <div style={{ background: T.border, borderRadius: "99px", height: "5px", overflow: "hidden" }}>
                          <div style={{ width: `${(settleStatus.deliveredCount/settleStatus.totalCount)*100}%`, height: "100%", background: `linear-gradient(90deg, ${T.emerald}, #22C55E)`, borderRadius: "99px", transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <SettleBillModal order={settleModalOrder} isOpen={!!settleModalOrder} onClose={() => setSettleModalOrder(null)}
        onSettled={() => { setSettleModalOrder(null); setCurrentOrder(null); setSelectedTable(null); setCart([]); setView("tables"); loadTables(); loadPendingApprovals(); loadLowStock(); }} />
    </div>
  );
}
