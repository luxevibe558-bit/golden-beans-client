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
  "Customer changed mind",
  "Wrong item ordered",
  "Customer left",
  "Duplicate order",
  "Item unavailable",
  "Staff error",
  "Other",
];

const ITEM_EMOJIS: Record<string, string> = {
  Espresso: "☕", Cappuccino: "☕", Latte: "🥛", "Masala Chai": "🫖",
  "Hot Chocolate": "🍫", "Cold Brew": "🧊", "Iced Latte": "🥤",
  "Chocolate Frappe": "🧋", "Butter Toast": "🍞", "Cheese Sandwich": "🥪",
  "Garlic Bread": "🥖", "Chocolate Brownie": "🍫", "Cheesecake Slice": "🍰",
  "Classic Omelette": "🍳", "Pancake Stack": "🥞",
};

// ── Daily Revenue Goal Widget ──
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

  const pct = Math.min(100, Math.round((stats.revenue / goal) * 100));
  const color = pct >= 100 ? T.success : pct >= 60 ? T.gold : T.emerald;

  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "14px 18px", border: `1px solid ${T.border}`, marginBottom: "20px", boxShadow: "0 2px 8px rgba(15,61,46,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>
          <p style={{ fontSize: "11px", color: T.textMuted, fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Today's Revenue</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "2px" }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "26px", fontWeight: 900, color: T.emerald }}>₹{stats.revenue.toFixed(0)}</span>
            <span style={{ fontSize: "12px", color: T.textMuted, fontWeight: 600 }}>/ ₹{goal.toLocaleString()}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "22px", fontWeight: 900, color, margin: 0 }}>{pct}%</p>
          <p style={{ fontSize: "10px", color: T.textMuted, margin: 0, fontWeight: 700 }}>{stats.count} orders</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: T.creamDark, borderRadius: "99px", height: "8px", overflow: "hidden", marginBottom: "12px" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? `linear-gradient(90deg, ${T.success}, #22C55E)` : `linear-gradient(90deg, ${T.emerald}, ${T.gold})`, borderRadius: "99px", transition: "width 0.6s ease" }} />
      </div>

      {/* Top items */}
      {stats.topItems.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {stats.topItems.map((item, i) => (
            <div key={i} style={{ background: T.cream, borderRadius: "8px", padding: "4px 10px", border: `1px solid ${T.creamDark}`, display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ fontSize: "10px" }}>{i === 0 ? "🏆" : i === 1 ? "🥈" : "🥉"}</span>
              <span style={{ fontSize: "10px", fontWeight: 800, color: T.text }}>{item.name}</span>
              <span style={{ fontSize: "10px", color: T.textMuted, fontWeight: 600 }}>×{item.qty}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cancellation Modal ──
function CancelOrderModal({ order, isOpen, onClose, onCancelled }: { order: Order | null; isOpen: boolean; onClose: () => void; onCancelled: () => void; }) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handleCancel = async () => {
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'https://golden-beans-server.onrender.com/api';
      await fetch(`${API}/orders/${order._id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason === "Other" ? custom || "Other" : reason, cancelledBy: "staff" }),
      });
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

        <p style={{ fontSize: "12px", fontWeight: 800, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>Reason for Cancellation</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          {CANCEL_REASONS.map(r => (
            <label key={r} style={{ display: "flex", alignItems: "center", gap: "10px", background: reason === r ? `${T.emerald}10` : T.cream, borderRadius: "10px", padding: "10px 14px", border: `1.5px solid ${reason === r ? T.emerald : T.creamDark}`, cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${reason === r ? T.emerald : T.textDim}`, background: reason === r ? T.emerald : "white", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {reason === r && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "white" }} />}
              </div>
              <input type="radio" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ display: "none" }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: reason === r ? T.emerald : T.text }}>{r}</span>
            </label>
          ))}
        </div>

        {reason === "Other" && (
          <textarea
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Describe the reason..."
            rows={2}
            style={{ width: "100%", borderRadius: "10px", border: `1.5px solid ${T.creamDark}`, padding: "10px 14px", fontSize: "13px", fontWeight: 600, fontFamily: "'Nunito', sans-serif", outline: "none", resize: "none", marginBottom: "16px", boxSizing: "border-box", background: T.cream }}
          />
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: "12px", border: `1.5px solid ${T.border}`, background: "white", color: T.text, fontWeight: 800, cursor: "pointer", fontSize: "13px" }}>Keep Order</button>
          <button onClick={handleCancel} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: "12px", border: "none", background: T.danger, color: "white", fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", fontSize: "13px", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Cancelling..." : "🚫 Cancel Order"}
          </button>
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

function PendingApprovalBell({ orders, onAccept, onReject }: { orders: Order[]; onAccept: (id: string) => void; onReject: (id: string) => void; }) {
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
      orders.forEach(o => {
        const elapsed = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 1000);
        const remaining = Math.max(0, 60 - elapsed);
        newTimers[o._id] = remaining;
        if (remaining === 0) onAccept(o._id);
      });
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
            {order.items.length > 3 && <p style={{ fontSize: "10px", color: T.textMuted, margin: "3px 0 0", fontWeight: 700 }}>+{order.items.length - 3} more items</p>}
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

function TableCard({ table, order, onSelect, waiterRequests }: { table: Table; order: Order | null; onSelect: () => void; waiterRequests?: any[] }) {
  const isOccupied = table.status === "occupied";
  const hasPending = order?.status === "pending_approval";
  const hasOrder = !!order && !["settled", "cancelled"].includes(order.status);
  const [elapsed, setElapsed] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!order?.createdAt) return;
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [order?.createdAt]);

  useEffect(() => {
    if (hasPending) { setPulse(true); const t = setTimeout(() => setPulse(false), 600); return () => clearTimeout(t); }
  }, [hasPending]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const pendingRequests = waiterRequests?.filter(r => r.status === 'pending') || [];
  const isQROrder = order?.createdBy === 'qr';

  // 🟡 Yellow = running (has order but not kotSent yet / preparing)
  const isRunning = hasOrder && !hasPending && order?.status !== 'kotSent' && order?.status !== 'ready';
  const cardBorderColor = hasPending ? T.gold
    : pendingRequests.length > 0 ? '#EF4444'
    : isRunning ? '#D97706'
    : isOccupied ? T.emerald
    : T.border;

  const timerColor = elapsed > 3600 ? T.danger : elapsed > 1800 ? '#D97706' : T.emerald;
  const timerBg = elapsed > 3600 ? '#FEF2F2' : elapsed > 1800 ? '#FFFBEB' : `${T.emerald}10`;
  const timerBorder = elapsed > 3600 ? '#FECACA' : elapsed > 1800 ? '#FDE68A' : `${T.emerald}20`;

  const billAmount = order?.totalAmount ?? 0;

  const statusConfig: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    pending_approval: { label: 'Pending', bg: '#FFF7ED', color: '#EA580C', dot: '#F97316' },
    kotSent: { label: 'KOT Sent', bg: '#F0FDF4', color: T.success, dot: '#22C55E' },
    preparing: { label: 'Preparing', bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6' },
    ready: { label: 'Ready', bg: '#F0FDF4', color: T.success, dot: '#16A34A' },
    served: { label: 'Served', bg: `${T.emerald}12`, color: T.emerald, dot: T.emeraldMid },
    default: { label: 'Active', bg: T.creamDark, color: T.textMuted, dot: T.textDim },
  };
  const sc = statusConfig[order?.status ?? 'default'] ?? statusConfig.default;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isOccupied ? T.ivory : T.cream,
        borderRadius: "22px",
        border: `${(hasPending || pendingRequests.length > 0) ? '2.5px' : isOccupied ? '2px' : '1.5px'} solid ${cardBorderColor}`,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        boxShadow: hovered ? `0 20px 48px rgba(15,61,46,0.18)` : isOccupied ? `0 6px 20px rgba(15,61,46,0.10)` : `0 2px 8px rgba(0,0,0,0.04)`,
        transition: "all 0.28s cubic-bezier(0.16,1,0.3,1)",
        transform: hovered ? "translateY(-5px) scale(1.01)" : pulse ? "scale(1.02)" : "translateY(0) scale(1)",
        minHeight: "200px",
      }}
    >
      {isOccupied && (
        <>
          <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "110px", height: "110px", borderRadius: "50%", background: `radial-gradient(circle, ${T.emerald}10 0%, transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-20px", left: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: `radial-gradient(circle, ${T.gold}08 0%, transparent 70%)`, pointerEvents: "none" }} />
        </>
      )}

      {/* Top bar — green/yellow/gold based on status */}
      {isOccupied && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: isRunning ? `linear-gradient(90deg, #D97706, #F59E0B)` : hasPending ? `linear-gradient(90deg, ${T.gold}, ${T.goldLight})` : `linear-gradient(90deg, ${T.emerald}, ${T.emeraldLight}, ${T.gold})`, borderRadius: "22px 22px 0 0" }} />
      )}

      <div style={{ padding: "18px 18px 16px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "14px", flexShrink: 0, background: isOccupied ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.creamDark, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isOccupied ? `0 4px 12px rgba(15,61,46,0.25)` : "none", position: "relative" }}>
              <span style={{ fontSize: "21px" }}>{isOccupied ? "🪑" : "⬜"}</span>
              {hasOrder && (
                <div style={{ position: "absolute", bottom: "-4px", right: "-4px", width: "18px", height: "18px", borderRadius: "50%", background: isQROrder ? "#3B82F6" : T.gold, border: `2px solid ${isOccupied ? T.ivory : T.cream}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px" }}>
                  {isQROrder ? "📱" : "🏪"}
                </div>
              )}
            </div>
            <div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", fontWeight: 800, color: T.emerald, margin: 0, lineHeight: 1.1 }}>Table {table.tableNumber}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "4px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: isOccupied ? (isRunning ? '#D97706' : T.success) : T.textDim, boxShadow: isOccupied ? `0 0 0 2px ${isRunning ? '#D9780640' : T.success + '30'}` : "none" }} />
                <span style={{ fontSize: "10px", color: isOccupied ? (isRunning ? '#D97706' : T.success) : T.textMuted, fontWeight: 700, letterSpacing: "0.3px" }}>
                  {isOccupied ? (isRunning ? "RUNNING" : "OCCUPIED") : "AVAILABLE"}
                </span>
              </div>
            </div>
          </div>

          {hasOrder ? (
            <div style={{ background: timerBg, borderRadius: "10px", padding: "5px 10px", border: `1px solid ${timerBorder}`, textAlign: "center", minWidth: "58px" }}>
              <p style={{ fontSize: "15px", fontWeight: 900, color: timerColor, margin: 0, fontVariantNumeric: "tabular-nums", lineHeight: 1.2, fontFamily: "'DM Sans', sans-serif" }}>{formatElapsed(elapsed)}</p>
              <p style={{ fontSize: "8px", color: T.textDim, margin: 0, fontWeight: 700, letterSpacing: "0.5px" }}>ELAPSED</p>
            </div>
          ) : (
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: T.creamDark, display: "flex", alignItems: "center", justifyContent: "center", opacity: hovered ? 0.8 : 0.35, transition: "opacity 0.2s" }}>
              <span style={{ fontSize: "13px" }}>→</span>
            </div>
          )}
        </div>

        {hasPending && (
          <div style={{ background: `linear-gradient(135deg, ${T.gold}20, ${T.goldLight}15)`, borderRadius: "10px", padding: "8px 12px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px", border: `1.5px solid ${T.gold}50` }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>🔔</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "11px", fontWeight: 800, color: T.emerald, margin: 0 }}>New QR Order Pending!</p>
              <p style={{ fontSize: "10px", color: T.textMuted, margin: 0 }}>#{order?.orderNumber} · Tap to review</p>
            </div>
            <div style={{ background: T.gold, borderRadius: "6px", padding: "2px 7px", fontSize: "9px", fontWeight: 900, color: T.emerald, flexShrink: 0 }}>NEW</div>
          </div>
        )}

        {pendingRequests.length > 0 && (
          <div style={{ background: "#FEF2F2", borderRadius: "10px", padding: "8px 12px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px", border: "1.5px solid #FECACA" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>🙋</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "11px", fontWeight: 800, color: T.danger, margin: 0 }}>{pendingRequests.length} Waiter Request{pendingRequests.length > 1 ? 's' : ''}</p>
              <p style={{ fontSize: "10px", color: '#999', margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pendingRequests.map((r: any) => r.type.replace(/_/g, ' ')).join(' · ')}</p>
            </div>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: T.danger, flexShrink: 0 }} />
          </div>
        )}

        {hasOrder && order ? (
          <div style={{ background: `${T.emerald}07`, borderRadius: "14px", padding: "12px", border: `1px solid ${T.emerald}15` }}>
            {order.customerName && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", paddingBottom: "10px", borderBottom: `1px dashed ${T.border}` }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", flexShrink: 0, color: T.gold, fontWeight: 900 }}>
                  {order.customerName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "12px", fontWeight: 800, color: T.text, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.customerName}</p>
                  {order.customerPhone && <p style={{ fontSize: "10px", color: T.textMuted, margin: 0, fontWeight: 600 }}>📞 {order.customerPhone}</p>}
                </div>
                <div style={{ background: isQROrder ? "#EFF6FF" : `${T.gold}20`, borderRadius: "6px", padding: "2px 7px", fontSize: "9px", fontWeight: 800, color: isQROrder ? "#2563EB" : T.goldDark, flexShrink: 0, border: `1px solid ${isQROrder ? '#BFDBFE' : `${T.gold}40`}` }}>
                  {isQROrder ? "📱 QR" : "🏪 Walk-in"}
                </div>
              </div>
            )}
            <div style={{ marginBottom: "10px" }}>
              {order.items.slice(0, 2).map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", color: T.text, fontWeight: 600, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "8px" }}>
                    {item.name}<span style={{ color: T.textDim, fontWeight: 700, marginLeft: "4px" }}>×{item.quantity}</span>
                  </span>
                  <span style={{ fontSize: "11px", color: T.emerald, fontWeight: 800, flexShrink: 0 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
              {order.items.length > 2 && <p style={{ fontSize: "10px", color: T.textDim, margin: "4px 0 0", fontWeight: 600 }}>+{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}</p>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: `1px dashed ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", background: sc.bg, borderRadius: "7px", padding: "3px 9px", border: `1px solid ${sc.dot}25` }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: sc.dot }} />
                <span style={{ fontSize: "10px", fontWeight: 800, color: sc.color }}>{sc.label}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "9px", color: T.textDim, fontWeight: 700, margin: "0 0 1px", letterSpacing: "0.5px" }}>BILL</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "22px", fontWeight: 900, color: T.emerald, margin: 0, lineHeight: 1 }}>₹{billAmount.toFixed(0)}</p>
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
      {hovered && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, transparent 40%, ${T.gold}06 100%)`, borderRadius: "22px", pointerEvents: "none", zIndex: 0 }} />}
    </div>
  );
}

function MenuCard({ item, cartQty, onAdd, onRemove }: { item: MenuItem; cartQty: number; onAdd: () => void; onRemove: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: "18px", overflow: "hidden", position: "relative", border: `2px solid ${cartQty > 0 ? T.emerald : hovered ? T.gold : T.border}`, boxShadow: cartQty > 0 ? `0 8px 24px rgba(15,61,46,0.2)` : hovered ? `0 12px 32px rgba(0,0,0,0.15)` : `0 2px 8px rgba(0,0,0,0.06)`, transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)", transform: hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)", opacity: item.isAvailable ? 1 : 0.6, aspectRatio: "3/4", cursor: item.isAvailable ? "pointer" : "not-allowed", background: "#1a1a1a" }}>
      {item.imageUrl ? (<img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", transition: "transform 0.4s ease", transform: hovered ? "scale(1.06)" : "scale(1)" }} />) : (<div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "52px" }}>{ITEM_EMOJIS[item.name] || "🍽️"}</div>)}
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
            <div style={{ display: "flex", alignItems: "center", background: "rgba(15,61,46,0.9)", borderRadius: "8px", overflow: "hidden", backdropFilter: "blur(4px)" }}>
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

// ── KOT Reprint ──
function printKOT(order: Order) {
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return;
  const now = new Date().toLocaleString('en-IN');
  win.document.write(`
    <html><head><title>KOT Reprint</title>
    <style>
      body { font-family: monospace; padding: 16px; font-size: 13px; }
      h2 { text-align: center; font-size: 16px; margin: 0 0 4px; }
      .center { text-align: center; }
      .divider { border-top: 1px dashed #000; margin: 8px 0; }
      .row { display: flex; justify-content: space-between; padding: 2px 0; }
      .bold { font-weight: bold; font-size: 15px; }
    </style>
    </head><body>
    <h2>GOLDEN BEANS CAFÉ</h2>
    <p class="center">** KOT REPRINT **</p>
    <div class="divider"></div>
    <div class="row"><span>Table:</span><span class="bold">${order.tableNumber}</span></div>
    <div class="row"><span>Order #:</span><span>${order.orderNumber}</span></div>
    <div class="row"><span>Time:</span><span>${now}</span></div>
    <div class="divider"></div>
    ${order.items.map(i => `<div class="row"><span>${i.name}</span><span>x${i.quantity}</span></div>`).join('')}
    <div class="divider"></div>
    <p class="center">-- Kitchen Copy --</p>
    </body></html>
  `);
  win.document.close();
  win.print();
}

export default function POSPage() {
  const [view, setView] = useState<"tables" | "order">("tables");
  const [tables, setTables] = useState<Table[]>([]);
  const [tableOrders, setTableOrders] = useState<Record<string, Order>>({});
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [settleModalOrder, setSettleModalOrder] = useState<Order | null>(null);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [tableRequests, setTableRequests] = useState<Record<string, any[]>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cancelModal, setCancelModal] = useState<Order | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

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
    init(); loadPendingApprovals(); loadLowStock();

    // ── Socket.IO — instant updates ──
    try {
      const { getSocket, joinPOS } = require("@/lib/socket");
      const sock = getSocket();
      joinPOS();
      sock.on("order:new",      () => { loadTables(); loadPendingApprovals(); });
      sock.on("order:update",   () => { loadTables(); });
      sock.on("order:ready",    () => { loadTables(); loadPendingApprovals(); });
      sock.on("waiter:request", () => { loadTables(); });
      sock.on("table:update",   () => { loadTables(); });
    } catch {}

    // Fallback polling every 15s
    const iv = setInterval(() => { loadTables(); loadPendingApprovals(); loadLowStock(); }, 15000);
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
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === item._id);
      if (ex) return prev.map(c => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, notes: "", isVeg: true }];
    });
  };
  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === itemId);
      if (!ex) return prev;
      if (ex.quantity === 1) return prev.filter(c => c.menuItemId !== itemId);
      return prev.map(c => c.menuItemId === itemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
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
  const activeItems = searchQuery
    ? menu.flatMap(c => c.items).filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : (menu.find(c => c._id === activeCategory)?.items || []);

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
    * { box-sizing: border-box; }
    @keyframes slideInRight { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes ring { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-15deg); } 75% { transform: rotate(15deg); } }
    @keyframes fadeInUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
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
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(15,61,46,0.05)" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "24px", color: T.emerald, margin: 0 }}>Golden Beans POS</h1>
            <p style={{ fontSize: "11px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600 }}>
              {currentTime.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} • {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {[
              { label: "Available", count: tables.filter(t => t.status === "available").length, color: T.success },
              { label: "Occupied", count: tables.filter(t => t.status === "occupied").length, color: T.danger },
              { label: "Orders", count: Object.keys(tableOrders).length, color: T.gold },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ background: T.cream, borderRadius: "12px", padding: "8px 16px", textAlign: "center", border: `1px solid ${T.creamDark}` }}>
                <p style={{ fontWeight: 900, fontSize: "22px", color, margin: 0 }}>{count}</p>
                <p style={{ fontSize: "9px", color: T.textMuted, margin: 0, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
              </div>
            ))}
            {lowStockItems.length > 0 && (
              <div style={{ background: "#FEF2F2", borderRadius: "12px", padding: "8px 16px", textAlign: "center", border: "1px solid #FECACA" }}>
                <p style={{ fontWeight: 900, fontSize: "22px", color: T.danger, margin: 0 }}>{lowStockItems.length}</p>
                <p style={{ fontSize: "9px", color: T.danger, margin: 0, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Low Stock</p>
              </div>
            )}
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {/* Revenue Goal */}
          <RevenueGoalWidget goal={10000} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>Select Table</h2>
            <button onClick={() => handleSelectTable({ _id: "counter", tableNumber: "Counter", status: "available", currentOrderId: null, capacity: 1, qrCode: "" } as any)}
              style={{ padding: "10px 20px", borderRadius: "12px", border: `2px solid ${T.emerald}`, background: T.emerald, color: T.gold, fontWeight: 800, fontSize: "13px", cursor: "pointer" }}>
              🏪 Counter Order
            </button>
          </div>
          {loading ? (
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
          )}
        </main>
      </div>
      <SettleBillModal order={settleModalOrder} isOpen={!!settleModalOrder} onClose={() => setSettleModalOrder(null)}
        onSettled={() => { setSettleModalOrder(null); setCurrentOrder(null); setSelectedTable(null); loadTables(); loadPendingApprovals(); }} />
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
          <button onClick={() => { setView("tables"); setSelectedTable(null); setCurrentOrder(null); setCart([]); }}
            style={{ width: "36px", height: "36px", borderRadius: "10px", border: `1px solid ${T.border}`, background: T.cream, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>←</button>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "20px", color: T.emerald, margin: 0 }}>Table {selectedTable?.tableNumber}</h1>
            <p style={{ fontSize: "11px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600 }}>
              {currentOrder ? `Order #${currentOrder.orderNumber} • ${currentOrder.status}` : "New Order"}
              {currentOrder?.customerName && ` • ${currentOrder.customerName}`}
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
            {/* KOT Reprint */}
            {currentOrder && (
              <button onClick={() => printKOT(currentOrder)}
                style={{ padding: "7px 14px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: "white", color: T.emerald, fontWeight: 800, cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                🖨️ Reprint KOT
              </button>
            )}
            {/* Cancel Order */}
            {currentOrder && (
              <button onClick={() => setCancelModal(currentOrder)}
                style={{ padding: "7px 14px", borderRadius: "10px", border: `1.5px solid ${T.danger}`, background: "#FEF2F2", color: T.danger, fontWeight: 800, cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                🚫 Cancel
              </button>
            )}
            {currentOrder && (
              <div style={{ background: `${T.success}15`, border: `1px solid ${T.success}33`, borderRadius: "10px", padding: "6px 14px" }}>
                <p style={{ fontSize: "11px", fontWeight: 800, color: T.success, margin: 0 }}>₹{currentOrder.totalAmount.toFixed(0)} Due</p>
              </div>
            )}
          </div>
        </header>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", overflow: "hidden" }}>
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: `1px solid ${T.border}` }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, background: T.ivory }}>
              <input type="text" placeholder="🔍 Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "9px 14px", borderRadius: "10px", border: `1px solid ${T.creamDark}`, background: T.cream, fontSize: "13px", fontWeight: 600, outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
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
          <div style={{ display: "flex", flexDirection: "column", background: T.ivory, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 800, color: T.emerald, margin: 0 }}>{currentOrder ? "Active Order" : "New Order"}</p>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {currentOrder && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 8px" }}>Ordered Items</p>
                  {currentOrder.items.map((item, i) => (
                    <div key={i} style={{ background: T.cream, borderRadius: "10px", padding: "9px 12px", marginBottom: "6px", border: `1px solid ${T.creamDark}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: 800, color: T.text, margin: 0 }}>{item.name}</p>
                        <p style={{ fontSize: "10px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600, textTransform: "capitalize" }}>{item.status} • ×{item.quantity}</p>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 900, color: T.emerald }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
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
                {currentOrder && (
                  <button onClick={() => setSettleModalOrder(currentOrder)} style={{ width: "100%", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.emerald, border: "none", borderRadius: "12px", padding: "12px", fontWeight: 900, fontSize: "14px", cursor: "pointer", boxShadow: "0 6px 16px rgba(212,165,116,0.4)" }}>
                    💰 Settle Bill (₹{currentOrder.totalAmount.toFixed(0)})
                  </button>
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
