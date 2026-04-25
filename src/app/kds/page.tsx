"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { orderApi } from "@/lib/api";
import type { Order, OrderItemStatus } from "@/types";

const T = {
  emerald: "#0F3D2E",
  emeraldMid: "#1A5340",
  emeraldLight: "#2D7A5F",
  emeraldDeep: "#0A2C20",
  emeraldDarker: "#061B14",
  gold: "#D4A574",
  goldLight: "#E8C895",
  goldDark: "#B08550",
  cream: "#FAF6F0",
  ivory: "#FFFBF5",
  text: "#E8DFD0",
  textMuted: "#A8B5A8",
  textDim: "#7A9E8E",
  border: "#1F4A38",
  success: "#4A8B4A",
  warning: "#D4A574",
  danger: "#C0392B",
};

function getSLAConfig(seconds: number) {
  if (seconds < 300) return { label: "On Time", bg: "linear-gradient(145deg, #052e16, #166534)", border: "#4A8B4A", timerColor: "#86c686", pulse: false };
  if (seconds < 600) return { label: "Running Late", bg: "linear-gradient(145deg, #422006, #713f12)", border: "#D4A574", timerColor: "#fbbf24", pulse: false };
  return { label: "URGENT", bg: "linear-gradient(145deg, #450a0a, #7f1d1d)", border: "#C0392B", timerColor: "#f87171", pulse: true };
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
        background: order.cancelled ? "linear-gradient(145deg, #1a0a0a, #2d0f0f)" : sla.bg,
        border: `3px solid ${order.cancelled ? T.danger : sla.border}`,
        borderRadius: "20px", overflow: "hidden",
        boxShadow: sla.pulse && !order.cancelled
          ? "0 0 0 4px rgba(192,57,43,0.2), 0 8px 28px rgba(0,0,0,0.4)"
          : "0 8px 24px rgba(0,0,0,0.3)",
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
      {order.cancelled && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(0,0,0,0.78)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
          <div style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "44px", marginBottom: "6px" }}>❌</div>
            <p style={{ color: "#f87171", fontWeight: 900, fontSize: "26px", margin: "0 0 3px", letterSpacing: "1.5px" }}>CANCELLED</p>
            <p style={{ color: "rgba(248,113,113,0.7)", fontSize: "12px", margin: "0 0 14px", fontWeight: 700 }}>{order.tableNumber} • #{order.orderNumber}</p>
            {onDismissCancelled && (
              <button onClick={e => { e.stopPropagation(); onDismissCancelled(order._id); }} style={{ background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.4)", color: "#f87171", borderRadius: "10px", padding: "7px 18px", fontWeight: 800, cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <span style={{ fontWeight: 900, fontSize: "13px", color: T.emerald, lineHeight: 1 }}>{order.tableNumber}</span>
            </div>
            <div>
              <p style={{ fontWeight: 900, fontSize: "15px", color: T.gold, margin: 0, fontFamily: "'Playfair Display', serif" }}>#{order.orderNumber}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                <span style={{
                  fontSize: "9px", padding: "2px 7px", borderRadius: "99px", fontWeight: 800,
                  background: source === "qr" ? "rgba(96,165,250,0.15)" : "rgba(212,165,116,0.15)",
                  color: source === "qr" ? "#93c5fd" : T.gold,
                  border: `1px solid ${source === "qr" ? "rgba(96,165,250,0.3)" : "rgba(212,165,116,0.3)"}`,
                }}>
                  {source === "qr" ? "📱 QR" : "🖥️ Counter"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <p style={{ fontWeight: 900, fontSize: "26px", color: sla.timerColor, margin: 0, fontVariantNumeric: "tabular-nums", letterSpacing: "1px", animation: sla.pulse ? "pulse-text 1s infinite" : "none" }}>
              {formatTimer(elapsed)}
            </p>
            <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "99px", fontWeight: 800, background: `${sla.timerColor}20`, color: sla.timerColor, border: `1px solid ${sla.timerColor}40` }}>
              {sla.label}
            </span>
          </div>
        </div>

        {order.customerName && (
          <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "5px 9px" }}>
            <span style={{ fontSize: "11px" }}>👤</span>
            <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 700 }}>{order.customerName}</span>
          </div>
        )}

        {allReady && (
          <div style={{ marginTop: "7px", background: "rgba(74,139,74,0.25)", border: "2px solid rgba(74,139,74,0.5)", borderRadius: "10px", padding: "9px 12px", textAlign: "center" }}>
            <span style={{ fontSize: "13px", color: "#86c686", fontWeight: 900, letterSpacing: "0.3px" }}>✅ ALL READY — CALL WAITER</span>
          </div>
        )}

        {anyPending && !order.cancelled && (
          <div style={{ marginTop: "7px", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: "9px", padding: "5px 10px", textAlign: "center" }}>
            <span style={{ fontSize: "10px", color: "#93c5fd", fontWeight: 800 }}>👆 TAP CARD TO START COOKING</span>
          </div>
        )}
      </div>

      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: "7px" }}>
        {order.items.map(item => {
          const isServed = item.status === "served";
          const dotColor = item.status === "ready" ? "#86c686" : item.status === "preparing" ? "#fbbf24" : "#93c5fd";
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
                borderRadius: "12px", padding: "10px 12px",
                border: `2px solid ${dotColor}30`,
                opacity: isServed ? 0.5 : 1,
                transition: "all 0.2s ease",
                cursor: isServed ? "default" : "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "9px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
                    <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: `0 0 7px ${dotColor}` }} />
                    <span style={{ fontWeight: 900, fontSize: "14px", color: isServed ? T.textDim : T.text }}>{item.name}</span>
                    <span style={{ fontWeight: 900, fontSize: "13px", color: T.gold, flexShrink: 0 }}>×{item.quantity}</span>
                  </div>
                  {item.notes && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "7px", padding: "3px 7px", marginLeft: "16px", marginTop: "3px" }}>
                      <span style={{ fontSize: "10px" }}>📝</span>
                      <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 700 }}>{item.notes}</span>
                    </div>
                  )}
                </div>
                <span style={{
                  flexShrink: 0, padding: "5px 10px", borderRadius: "8px", fontWeight: 900, fontSize: "10px",
                  background: `${dotColor}15`, color: dotColor, border: `1px solid ${dotColor}40`,
                  letterSpacing: "0.4px",
                }}>{statusLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {!order.cancelled && (
        <div style={{ padding: "9px 14px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: "10px", color: T.textDim, margin: 0, textAlign: "center", fontWeight: 700, letterSpacing: "0.5px" }}>
            👆 TAP ITEM OR WHOLE CARD TO ADVANCE
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
    <div style={{ display: "flex", gap: "9px", padding: "10px 18px", background: T.emeraldDeep, borderBottom: `1px solid ${T.border}` }}>
      {[
        { label: "Pending", value: pending, color: "#93c5fd" },
        { label: "Cooking", value: preparing, color: "#fbbf24" },
        { label: "Ready", value: ready, color: "#86c686" },
        { label: "Cancelled", value: cancelledCount, color: "#f87171" },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ flex: 1, background: `${color}10`, borderRadius: "10px", padding: "9px 11px", textAlign: "center", border: `1px solid ${color}20` }}>
          <p style={{ fontWeight: 900, fontSize: "20px", color, margin: 0 }}>{value}</p>
          <p style={{ fontSize: "9px", color: T.textDim, margin: 0, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</p>
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

  const handleAdvanceItem = async (orderId: string, itemId: string, nextStatus: OrderItemStatus) => {
    try {
      await orderApi.updateItemStatus(orderId, { itemId, status: nextStatus });
      setOrders(prev => prev.map(o =>
        o._id === orderId ? { ...o, items: o.items.map(i => i._id === itemId ? { ...i, status: nextStatus } : i) } : o
      ));
      setTimeout(load, 500);
    } catch (e) { console.error(e); load(); }
  };

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
    <div style={{ minHeight: "100vh", background: T.emeraldDarker, display: "flex", flexDirection: "column", fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        @keyframes pulse-border { 0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,0.4),0 8px 28px rgba(0,0,0,0.4)} 50%{box-shadow:0 0 0 8px rgba(192,57,43,0),0 8px 28px rgba(0,0,0,0.4)} }
        @keyframes pulse-text { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes slideUp { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
        button { font-family: 'Nunito', sans-serif; }
      `}</style>

      <header style={{ background: T.emeraldDeep, borderBottom: `1px solid ${T.border}`, padding: "0 18px", flexShrink: 0 }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})` }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Link href="/pos" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "5px", color: T.textMuted, fontSize: "12px", fontWeight: 700, background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: "9px", padding: "6px 11px" }}>← POS</Link>
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", overflow: "hidden", background: T.emerald, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Image src="/logo-small.png" alt="GB" width={40} height={40} style={{ objectFit: "contain" }} />
              </div>
              <div>
                <h1 style={{ fontWeight: 900, fontSize: "20px", color: T.gold, margin: 0, fontFamily: "'Playfair Display', serif" }}>Kitchen Display</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: T.success, animation: "pulse-text 2s infinite" }} />
                  <span style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700 }}>Live • Tap cards to advance</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", borderRadius: "12px", overflow: "hidden", border: `1px solid ${T.border}` }}>
              {[{ id: "all", label: `All (${orders.length})` }, { id: "pending", label: "🔵 New" }, { id: "preparing", label: "🟡 Cooking" }, { id: "ready", label: "🟢 Ready" }].map(({ id, label }) => (
                <button key={id} onClick={() => setFilter(id as typeof filter)} style={{ padding: "7px 12px", fontSize: "11px", fontWeight: 800, border: "none", cursor: "pointer", background: filter === id ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : T.emerald, color: filter === id ? T.emerald : T.textMuted }}>{label}</button>
              ))}
            </div>
            <div style={{ background: T.emerald, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "7px 14px", textAlign: "center" }}>
              <p style={{ fontWeight: 900, fontSize: "18px", color: T.gold, margin: 0, fontVariantNumeric: "tabular-nums" }}>{currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</p>
              <p style={{ fontSize: "9px", color: T.textDim, margin: 0, fontWeight: 700 }}>{currentTime.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
            </div>
          </div>
        </div>
      </header>

      <StatsBar orders={orders} cancelledCount={cancelledOrders.length} />

      <div style={{ display: "flex", gap: "12px", padding: "9px 18px", background: T.emeraldDarker, borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontSize: "10px", color: T.textDim, fontWeight: 700 }}>SLA:</span>
        {[{ color: "#86c686", label: "0-5 min: On Time" }, { color: "#fbbf24", label: "5-10 min: Late" }, { color: "#f87171", label: "10+ min: URGENT" }].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color }} />
            <span style={{ fontSize: "10px", color: T.textMuted, fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      <main style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: "260px", borderRadius: "20px", background: T.emeraldDeep, border: `1px solid ${T.border}` }} />
            ))}
          </div>
        ) : allDisplayOrders.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
            <p style={{ fontWeight: 900, fontSize: "26px", color: T.textMuted, fontFamily: "'Playfair Display', serif", margin: "0 0 6px" }}>All Caught Up!</p>
            <p style={{ fontSize: "13px", color: T.textDim, fontWeight: 600 }}>No active orders in the kitchen</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px", alignItems: "start" }}>
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

      <div style={{ position: "fixed", bottom: "16px", right: "16px", display: "flex", alignItems: "center", gap: "7px", background: T.emeraldDeep, border: `1px solid ${T.border}`, padding: "7px 12px", borderRadius: "99px", boxShadow: "0 8px 20px rgba(0,0,0,0.4)" }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: T.success, animation: "pulse-text 1.5s infinite" }} />
        <span style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700 }}>
          Last sync: {lastUpdated.toLocaleTimeString("en-IN", { timeStyle: "short" })}
        </span>
      </div>
    </div>
  );
}
