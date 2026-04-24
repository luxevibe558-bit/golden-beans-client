"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { orderApi } from "@/lib/api";
import type { Order, OrderItemStatus } from "@/types";

const BRAND = {
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  goldDark: "#A07830",
  coffee: "#1A0E06",
  coffeeMid: "#2C1A0E",
  coffeeBorder: "#3D2410",
  surface: "#180C04",
  surface2: "#231508",
  text: "#E8D5B0",
  textMuted: "#9A7A5A",
  textDim: "#6A4A2A",
};

function getSLAConfig(seconds: number) {
  if (seconds < 300) return { label: "On Time", bg: "linear-gradient(145deg,#052e16,#14532d)", border: "#16a34a", timerColor: "#4ade80", pulse: false };
  if (seconds < 600) return { label: "Running Late", bg: "linear-gradient(145deg,#422006,#713f12)", border: "#d97706", timerColor: "#fbbf24", pulse: false };
  return { label: "URGENT", bg: "linear-gradient(145deg,#450a0a,#7f1d1d)", border: "#dc2626", timerColor: "#f87171", pulse: true };
}

function formatTimer(s: number) { return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
function elapsedSec(iso: string) { return Math.floor((Date.now() - new Date(iso).getTime()) / 1000); }

function useLiveTimer(startIso: string) {
  const [elapsed, setElapsed] = useState(elapsedSec(startIso));
  useEffect(() => {
    const iv = setInterval(() => setElapsed(elapsedSec(startIso)), 1000);
    return () => clearInterval(iv);
  }, [startIso]);
  return elapsed;
}

// ─── Order Card — Tap anywhere to advance status ───
function KDSCard({ order, onAdvanceAll, onAdvanceItem, onDismissCancelled }: {
  order: Order & { cancelled?: boolean };
  onAdvanceAll: (orderId: string) => void;
  onAdvanceItem: (orderId: string, itemId: string, nextStatus: OrderItemStatus) => void;
  onDismissCancelled?: (orderId: string) => void;
}) {
  const elapsed = useLiveTimer(order.createdAt);
  const sla = getSLAConfig(elapsed);
  const activeItems = order.items.filter(i => i.status !== "served");
  const allReady = activeItems.length > 0 && activeItems.every(i => i.status === "ready");
  const anyPending = activeItems.some(i => i.status === "pending");
  const source = order.createdBy === "customer" ? "qr" : "pos";

  return (
    <div
      onClick={() => !order.cancelled && !allReady && onAdvanceAll(order._id)}
      style={{
        background: order.cancelled ? "linear-gradient(145deg,#1a0a0a,#2d0f0f)" : sla.bg,
        border: `3px solid ${order.cancelled ? "#dc2626" : sla.border}`,
        borderRadius: "24px", overflow: "hidden",
        boxShadow: sla.pulse && !order.cancelled
          ? "0 0 0 4px rgba(220,38,38,0.2), 0 8px 32px rgba(0,0,0,0.4)"
          : "0 8px 32px rgba(0,0,0,0.3)",
        animation: order.cancelled ? "none" : sla.pulse ? "pulse-border 2s infinite" : "slideUp 0.3s ease",
        position: "relative",
        cursor: order.cancelled ? "default" : "pointer",
        transition: "transform 0.1s ease",
      }}
      onTouchStart={e => { if (!order.cancelled) e.currentTarget.style.transform = "scale(0.98)"; }}
      onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; }}
      onMouseDown={e => { if (!order.cancelled) e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {/* CANCELLED Overlay */}
      {order.cancelled && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(0,0,0,0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
          <div style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>❌</div>
            <p style={{ color: "#f87171", fontWeight: 900, fontSize: "28px", margin: "0 0 4px", letterSpacing: "2px" }}>CANCELLED</p>
            <p style={{ color: "rgba(248,113,113,0.7)", fontSize: "13px", margin: "0 0 16px", fontWeight: 700 }}>{order.tableNumber} • #{order.orderNumber}</p>
            {onDismissCancelled && (
              <button onClick={e => { e.stopPropagation(); onDismissCancelled(order._id); }} style={{ background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.4)", color: "#f87171", borderRadius: "12px", padding: "8px 20px", fontWeight: 800, cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Card Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "54px", height: "54px", borderRadius: "14px", background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <span style={{ fontWeight: 900, fontSize: "14px", color: BRAND.coffee, lineHeight: 1 }}>{order.tableNumber}</span>
            </div>
            <div>
              <p style={{ fontWeight: 900, fontSize: "16px", color: BRAND.gold, margin: 0, fontFamily: "'Playfair Display', serif" }}>#{order.orderNumber}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                <span style={{
                  fontSize: "10px", padding: "2px 8px", borderRadius: "99px", fontWeight: 800,
                  background: source === "qr" ? "rgba(96,165,250,0.15)" : "rgba(201,168,76,0.15)",
                  color: source === "qr" ? "#60a5fa" : BRAND.gold,
                  border: `1px solid ${source === "qr" ? "rgba(96,165,250,0.3)" : "rgba(201,168,76,0.3)"}`,
                }}>
                  {source === "qr" ? "📱 QR" : "🖥️ Counter"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <p style={{ fontWeight: 900, fontSize: "28px", color: sla.timerColor, margin: 0, fontVariantNumeric: "tabular-nums", letterSpacing: "1px", animation: sla.pulse ? "pulse-text 1s infinite" : "none" }}>
              {formatTimer(elapsed)}
            </p>
            <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", fontWeight: 800, background: `${sla.timerColor}20`, color: sla.timerColor, border: `1px solid ${sla.timerColor}40` }}>
              {sla.label}
            </span>
          </div>
        </div>

        {order.customerName && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "6px 10px" }}>
            <span style={{ fontSize: "12px" }}>👤</span>
            <span style={{ fontSize: "12px", color: BRAND.textMuted, fontWeight: 700 }}>{order.customerName}</span>
          </div>
        )}

        {allReady && (
          <div style={{ marginTop: "8px", background: "rgba(74,222,128,0.2)", border: "2px solid rgba(74,222,128,0.4)", borderRadius: "12px", padding: "10px 14px", textAlign: "center" }}>
            <span style={{ fontSize: "14px", color: "#4ade80", fontWeight: 900, letterSpacing: "0.3px" }}>✅ ALL READY — CALL WAITER</span>
          </div>
        )}

        {anyPending && !order.cancelled && (
          <div style={{ marginTop: "8px", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: "10px", padding: "6px 12px", textAlign: "center" }}>
            <span style={{ fontSize: "11px", color: "#60a5fa", fontWeight: 800 }}>👆 TAP CARD TO START COOKING</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {order.items.map(item => {
          const isServed = item.status === "served";
          const dotColor = item.status === "ready" ? "#4ade80" : item.status === "preparing" ? "#fbbf24" : "#60a5fa";
          const statusLabel = item.status === "ready" ? "✓ READY" : item.status === "preparing" ? "🔥 COOKING" : item.status === "served" ? "SERVED" : "⏳ PENDING";

          return (
            <div
              key={item._id}
              onClick={e => {
                e.stopPropagation();
                if (isServed) return;
                const next: OrderItemStatus = item.status === "pending" ? "preparing" : item.status === "preparing" ? "ready" : "served";
                onAdvanceItem(order._id, item._id, next);
              }}
              style={{
                background: isServed ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
                borderRadius: "14px", padding: "12px 14px",
                border: `2px solid ${dotColor}30`,
                opacity: isServed ? 0.5 : 1,
                transition: "all 0.2s ease",
                cursor: isServed ? "default" : "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: `0 0 8px ${dotColor}` }} />
                    <span style={{ fontWeight: 900, fontSize: "16px", color: isServed ? BRAND.textDim : BRAND.text }}>{item.name}</span>
                    <span style={{ fontWeight: 900, fontSize: "14px", color: BRAND.gold, flexShrink: 0 }}>×{item.quantity}</span>
                  </div>
                  {item.notes && (
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "8px", padding: "4px 8px", marginLeft: "18px", marginTop: "4px" }}>
                      <span style={{ fontSize: "11px" }}>📝</span>
                      <span style={{ fontSize: "12px", color: "#fbbf24", fontWeight: 700 }}>{item.notes}</span>
                    </div>
                  )}
                </div>
                <span style={{
                  flexShrink: 0, padding: "6px 12px", borderRadius: "10px", fontWeight: 900, fontSize: "12px",
                  background: `${dotColor}15`, color: dotColor, border: `1px solid ${dotColor}40`,
                  letterSpacing: "0.5px",
                }}>{statusLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {!order.cancelled && (
        <div style={{ padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: "11px", color: BRAND.textDim, margin: 0, textAlign: "center", fontWeight: 700, letterSpacing: "0.5px" }}>
            👆 TAP EACH ITEM OR WHOLE CARD TO ADVANCE STATUS
          </p>
        </div>
      )}
    </div>
  );
}

function StatsBar({ orders, cancelledCount }: { orders: Order[]; cancelledCount: number }) {
  const pending = orders.reduce((s, o) => s + o.items.filter(i => i.status === "pending").length, 0);
  const preparing = orders.reduce((s, o) => s + o.items.filter(i => i.status === "preparing").length, 0);
  const ready = orders.reduce((s, o) => s + o.items.filter(i => i.status === "ready").length, 0);

  return (
    <div style={{ display: "flex", gap: "10px", padding: "12px 20px", background: BRAND.surface2, borderBottom: `1px solid ${BRAND.coffeeBorder}` }}>
      {[
        { label: "Pending", value: pending, color: "#60a5fa" },
        { label: "Cooking", value: preparing, color: "#fbbf24" },
        { label: "Ready", value: ready, color: "#4ade80" },
        { label: "Cancelled", value: cancelledCount, color: "#f87171" },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ flex: 1, background: `${color}10`, borderRadius: "12px", padding: "10px 12px", textAlign: "center", border: `1px solid ${color}20` }}>
          <p style={{ fontWeight: 900, fontSize: "22px", color, margin: 0 }}>{value}</p>
          <p style={{ fontSize: "10px", color: BRAND.textMuted, margin: 0, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function KDSPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<(Order & { cancelledAt: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "preparing" | "ready">("all");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const prevOrderIds = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playAlert = useCallback((type: "new" | "cancel") => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      if (type === "new") {
        [0, 0.3].forEach(delay => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.3);
        });
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.value = 220;
        gain.gain.value = 0.4;
        osc.start();
        setTimeout(() => osc.stop(), 800);
      }
    } catch { }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await orderApi.getKdsOrders();
      const newOrders: Order[] = res.data.data;
      const newIds = new Set(newOrders.map(o => o._id));
      newOrders.forEach(o => { if (!prevOrderIds.current.has(o._id)) playAlert("new"); });
      prevOrderIds.current.forEach(id => {
        if (!newIds.has(id)) {
          orderApi.getOrders({ status: "cancelled" }).then(r => {
            const cancelled = r.data.data.find((o: Order) => o._id === id);
            if (cancelled) {
              playAlert("cancel");
              setCancelledOrders(prev => prev.find(c => c._id === id) ? prev : [...prev, { ...cancelled, cancelledAt: Date.now() }]);
            }
          }).catch(() => { });
        }
      });
      prevOrderIds.current = newIds;
      setOrders(newOrders);
      setLastUpdated(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [playAlert]);

  useEffect(() => {
    const iv = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    const iv = setInterval(() => {
      const tenMin = 10 * 60 * 1000;
      setCancelledOrders(prev => prev.filter(o => Date.now() - o.cancelledAt < tenMin));
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  // ── Advance ONE item's status ──
  const handleAdvanceItem = async (orderId: string, itemId: string, nextStatus: OrderItemStatus) => {
    try {
      await orderApi.updateItemStatus(orderId, { itemId, status: nextStatus });
      setOrders(prev => prev.map(o =>
        o._id === orderId ? { ...o, items: o.items.map(i => i._id === itemId ? { ...i, status: nextStatus } : i) } : o
      ));
      setTimeout(load, 500);
    } catch (e) { console.error(e); load(); }
  };

  // ── Advance ALL items at once (tap whole card) ──
  const handleAdvanceAll = async (orderId: string) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;
    try {
      for (const item of order.items) {
        if (item.status === "served") continue;
        const nextStatus: OrderItemStatus = item.status === "pending" ? "preparing" : item.status === "preparing" ? "ready" : item.status;
        if (nextStatus !== item.status) {
          await orderApi.updateItemStatus(orderId, { itemId: item._id, status: nextStatus });
        }
      }
      load();
    } catch (e) { console.error(e); load(); }
  };

  const dismissCancelled = (orderId: string) => {
    setCancelledOrders(prev => prev.filter(o => o._id !== orderId));
  };

  const filteredOrders = orders.filter(o => {
    if (filter === "all") return true;
    if (filter === "pending") return o.items.some(i => i.status === "pending");
    if (filter === "preparing") return o.items.some(i => i.status === "preparing");
    if (filter === "ready") return o.items.every(i => i.status === "ready" || i.status === "served");
    return true;
  });

  const allDisplayOrders = [
    ...cancelledOrders.map(o => ({ ...o, cancelled: true })),
    ...filteredOrders.map(o => ({ ...o, cancelled: false })),
  ];

  return (
    <div style={{ minHeight: "100vh", background: BRAND.surface, display: "flex", flexDirection: "column", fontFamily: "'Nunito',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        @keyframes pulse-border { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4),0 8px 32px rgba(0,0,0,0.4)} 50%{box-shadow:0 0 0 8px rgba(220,38,38,0),0 8px 32px rgba(0,0,0,0.4)} }
        @keyframes pulse-text { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${BRAND.coffeeBorder}; border-radius:4px; }
        button { font-family:'Nunito',sans-serif; }
      `}</style>

      <header style={{ background: BRAND.surface2, borderBottom: `1px solid ${BRAND.coffeeBorder}`, padding: "0 20px", flexShrink: 0 }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold},${BRAND.goldLight},${BRAND.gold},${BRAND.goldDark})` }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/pos" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", color: BRAND.textMuted, fontSize: "13px", fontWeight: 700, background: "rgba(255,255,255,0.05)", border: `1px solid ${BRAND.coffeeBorder}`, borderRadius: "10px", padding: "6px 12px" }}>← POS</Link>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>👨‍🍳</div>
              <div>
                <h1 style={{ fontWeight: 900, fontSize: "22px", color: BRAND.gold, margin: 0, fontFamily: "'Playfair Display',serif" }}>Kitchen Display</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", animation: "pulse-text 2s infinite" }} />
                  <span style={{ fontSize: "11px", color: BRAND.textMuted, fontWeight: 700 }}>Live • Tap cards to advance</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", borderRadius: "14px", overflow: "hidden", border: `1px solid ${BRAND.coffeeBorder}` }}>
              {[{ id: "all", label: `All (${orders.length})` }, { id: "pending", label: "🔴 New" }, { id: "preparing", label: "🟡 Cooking" }, { id: "ready", label: "🟢 Ready" }].map(({ id, label }) => (
                <button key={id} onClick={() => setFilter(id as typeof filter)} style={{ padding: "8px 14px", fontSize: "12px", fontWeight: 800, border: "none", cursor: "pointer", background: filter === id ? `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})` : BRAND.coffeeMid, color: filter === id ? BRAND.coffee : BRAND.textMuted }}>{label}</button>
              ))}
            </div>
            <div style={{ background: BRAND.coffeeMid, border: `1px solid ${BRAND.coffeeBorder}`, borderRadius: "14px", padding: "8px 16px", textAlign: "center" }}>
              <p style={{ fontWeight: 900, fontSize: "20px", color: BRAND.gold, margin: 0, fontVariantNumeric: "tabular-nums" }}>{currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</p>
              <p style={{ fontSize: "10px", color: BRAND.textMuted, margin: 0, fontWeight: 700 }}>{currentTime.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
            </div>
          </div>
        </div>
      </header>

      <StatsBar orders={orders} cancelledCount={cancelledOrders.length} />

      <div style={{ display: "flex", gap: "12px", padding: "10px 20px", background: BRAND.surface, borderBottom: `1px solid ${BRAND.coffeeBorder}` }}>
        <span style={{ fontSize: "11px", color: BRAND.textDim, fontWeight: 700 }}>SLA:</span>
        {[{ color: "#4ade80", label: "0-5 min: On Time" }, { color: "#fbbf24", label: "5-10 min: Running Late" }, { color: "#f87171", label: "10+ min: URGENT (Pulsing)" }].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
            <span style={{ fontSize: "11px", color: BRAND.textMuted, fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      <main style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "16px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: "280px", borderRadius: "24px", background: BRAND.surface2, border: `1px solid ${BRAND.coffeeBorder}` }} />
            ))}
          </div>
        ) : allDisplayOrders.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" }}>
            <div style={{ fontSize: "72px", marginBottom: "20px" }}>✅</div>
            <p style={{ fontWeight: 900, fontSize: "28px", color: BRAND.textMuted, fontFamily: "'Playfair Display',serif", margin: "0 0 8px" }}>All Caught Up!</p>
            <p style={{ fontSize: "15px", color: BRAND.textDim, fontWeight: 600 }}>No active orders in the kitchen</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "16px", alignItems: "start" }}>
            {allDisplayOrders.map(order => (
              <KDSCard
                key={order._id}
                order={order}
                onAdvanceAll={handleAdvanceAll}
                onAdvanceItem={handleAdvanceItem}
                onDismissCancelled={order.cancelled ? dismissCancelled : undefined}
              />
            ))}
          </div>
        )}
      </main>

      <div style={{ position: "fixed", bottom: "20px", right: "20px", display: "flex", alignItems: "center", gap: "8px", background: BRAND.surface2, border: `1px solid ${BRAND.coffeeBorder}`, padding: "8px 14px", borderRadius: "99px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", animation: "pulse-text 1.5s infinite" }} />
        <span style={{ fontSize: "11px", color: BRAND.textMuted, fontWeight: 700 }}>
          Last sync: {lastUpdated.toLocaleTimeString("en-IN", { timeStyle: "short" })}
        </span>
      </div>
    </div>
  );
}
