"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { orderApi } from "@/lib/api";
import type { Order, OrderItem, OrderItemStatus } from "@/types";

const BRAND = {
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  goldDark: "#A07830",
  coffee: "#1A0E06",
  coffeeMid: "#2C1A0E",
  coffeeLight: "#4A2C1A",
  coffeeBorder: "#3D2410",
  surface: "#180C04",
  surface2: "#231508",
  text: "#E8D5B0",
  textMuted: "#9A7A5A",
  textDim: "#6A4A2A",
};

// ─── SLA Config ───
function getSLAConfig(seconds: number) {
  if (seconds < 300) return {
    label: "On Time",
    bg: "linear-gradient(145deg, #052e16, #14532d)",
    border: "#16a34a",
    timerColor: "#4ade80",
    badgeBg: "rgba(74,222,128,0.15)",
    badgeColor: "#4ade80",
    pulse: false,
  };
  if (seconds < 600) return {
    label: "Running Late",
    bg: "linear-gradient(145deg, #422006, #713f12)",
    border: "#d97706",
    timerColor: "#fbbf24",
    badgeBg: "rgba(251,191,36,0.15)",
    badgeColor: "#fbbf24",
    pulse: false,
  };
  return {
    label: "URGENT",
    bg: "linear-gradient(145deg, #450a0a, #7f1d1d)",
    border: "#dc2626",
    timerColor: "#f87171",
    badgeBg: "rgba(248,113,113,0.15)",
    badgeColor: "#f87171",
    pulse: true,
  };
}

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getElapsedSeconds(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
}

// ─── Item Status Config ───
const ITEM_STATUS: Record<OrderItemStatus, {
  next: OrderItemStatus | null;
  btnLabel: string;
  btnBg: string;
  btnColor: string;
  dotColor: string;
  label: string;
}> = {
  pending: {
    next: "preparing", btnLabel: "Start Cooking", label: "Pending",
    btnBg: "linear-gradient(135deg, #1d4ed8, #2563eb)", btnColor: "white", dotColor: "#60a5fa",
  },
  preparing: {
    next: "ready", btnLabel: "Mark Ready ✓", label: "Cooking",
    btnBg: "linear-gradient(135deg, #166534, #16a34a)", btnColor: "white", dotColor: "#4ade80",
  },
  ready: {
    next: null, btnLabel: "Served", label: "Ready",
    btnBg: "rgba(255,255,255,0.1)", btnColor: "#9ca3af", dotColor: "#4ade80",
  },
  served: {
    next: null, btnLabel: "", label: "Served",
    btnBg: "", btnColor: "", dotColor: "#374151",
  },
};

// ─── Live Timer Hook ───
function useLiveTimer(startIso: string) {
  const [elapsed, setElapsed] = useState(getElapsedSeconds(startIso));

  useEffect(() => {
    const iv = setInterval(() => setElapsed(getElapsedSeconds(startIso)), 1000);
    return () => clearInterval(iv);
  }, [startIso]);

  return elapsed;
}

// ─── KDS Order Card ───
function KDSCard({ order, onUpdateItem, onDismissCancelled }: {
  order: Order & { cancelled?: boolean };
  onUpdateItem: (orderId: string, itemId: string, status: OrderItemStatus) => void;
  onDismissCancelled?: (orderId: string) => void;
}) {
  const elapsed = useLiveTimer(order.createdAt);
  const sla = getSLAConfig(elapsed);
  const activeItems = order.items.filter(i => i.status !== "served");
  const allReady = activeItems.length > 0 && activeItems.every(i => i.status === "ready");
  const source = order.createdBy === "customer" ? "qr" : "pos";

  return (
    <div style={{
      background: order.cancelled ? "linear-gradient(145deg, #1a0a0a, #2d0f0f)" : sla.bg,
      border: `2px solid ${order.cancelled ? "#dc2626" : sla.border}`,
      borderRadius: "24px", overflow: "hidden",
      boxShadow: sla.pulse && !order.cancelled
        ? `0 0 0 4px rgba(220,38,38,0.2), 0 8px 32px rgba(0,0,0,0.4)`
        : "0 8px 32px rgba(0,0,0,0.3)",
      animation: order.cancelled
        ? "none"
        : sla.pulse
        ? "pulse-border 2s ease-in-out infinite"
        : "slideUp 0.3s ease",
      position: "relative",
    }}>

      {/* CANCELLED Overlay */}
      {order.cancelled && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          background: "rgba(0,0,0,0.75)", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(2px)",
        }}>
          <div style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>❌</div>
            <p style={{ color: "#f87171", fontWeight: 900, fontSize: "28px", margin: "0 0 4px", letterSpacing: "2px" }}>CANCELLED</p>
            <p style={{ color: "rgba(248,113,113,0.7)", fontSize: "13px", margin: "0 0 16px", fontWeight: 700 }}>
              {order.tableNumber} • #{order.orderNumber}
            </p>
            {onDismissCancelled && (
              <button onClick={() => onDismissCancelled(order._id)} style={{
                background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.4)",
                color: "#f87171", borderRadius: "12px", padding: "8px 20px",
                fontWeight: 800, cursor: "pointer", fontSize: "13px", fontFamily: "inherit",
              }}>
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Card Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          {/* Table + Order */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column",
            }}>
              <span style={{ fontWeight: 900, fontSize: "13px", color: BRAND.coffee, lineHeight: 1 }}>{order.tableNumber}</span>
            </div>
            <div>
              <p style={{ fontWeight: 900, fontSize: "15px", color: BRAND.gold, margin: 0, fontFamily: "'Playfair Display', serif" }}>#{order.orderNumber}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                {/* Source icon */}
                <span style={{
                  fontSize: "10px", padding: "2px 8px", borderRadius: "99px", fontWeight: 800,
                  background: source === "qr" ? "rgba(96,165,250,0.15)" : "rgba(201,168,76,0.15)",
                  color: source === "qr" ? "#60a5fa" : BRAND.gold,
                  border: `1px solid ${source === "qr" ? "rgba(96,165,250,0.3)" : "rgba(201,168,76,0.3)"}`,
                }}>
                  {source === "qr" ? "📱 QR Order" : "🖥️ Counter"}
                </span>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div style={{ textAlign: "right" }}>
            <p style={{
              fontWeight: 900, fontSize: "24px", color: sla.timerColor, margin: 0,
              fontVariantNumeric: "tabular-nums", letterSpacing: "1px",
              animation: sla.pulse ? "pulse-text 1s ease-in-out infinite" : "none",
            }}>
              {formatTimer(elapsed)}
            </p>
            <span style={{
              fontSize: "10px", padding: "2px 8px", borderRadius: "99px", fontWeight: 800,
              background: sla.badgeBg, color: sla.badgeColor,
              border: `1px solid ${sla.badgeColor}40`,
            }}>{sla.label}</span>
          </div>
        </div>

        {/* Customer info */}
        {order.customerName && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "6px 10px" }}>
            <span style={{ fontSize: "12px" }}>👤</span>
            <span style={{ fontSize: "12px", color: BRAND.textMuted, fontWeight: 700 }}>{order.customerName}</span>
          </div>
        )}

        {/* All ready badge */}
        {allReady && (
          <div style={{ marginTop: "8px", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "10px", padding: "6px 12px", textAlign: "center" }}>
            <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: 900 }}>✅ ALL ITEMS READY — Call Waiter</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {order.items.map(item => {
          const cfg = ITEM_STATUS[item.status];
          const isServed = item.status === "served";
          return (
            <div key={item._id} style={{
              background: isServed ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)",
              borderRadius: "14px", padding: "12px 14px",
              border: `1px solid rgba(255,255,255,${isServed ? "0.04" : "0.08"})`,
              opacity: isServed ? 0.5 : 1,
              transition: "all 0.3s ease",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.dotColor, flexShrink: 0 }} />
                    <span style={{ fontWeight: 900, fontSize: "15px", color: isServed ? BRAND.textDim : BRAND.text }}>
                      {item.name}
                    </span>
                    <span style={{ fontWeight: 900, fontSize: "13px", color: BRAND.gold, flexShrink: 0 }}>×{item.quantity}</span>
                  </div>
                  {item.notes && (
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "8px", padding: "4px 8px", marginLeft: "16px" }}>
                      <span style={{ fontSize: "11px" }}>📝</span>
                      <span style={{ fontSize: "12px", color: "#fbbf24", fontWeight: 700 }}>{item.notes}</span>
                    </div>
                  )}
                  <span style={{
                    display: "inline-block", marginLeft: "16px", marginTop: "4px",
                    fontSize: "10px", padding: "2px 8px", borderRadius: "99px", fontWeight: 800,
                    background: cfg.dotColor === "#4ade80" ? "rgba(74,222,128,0.1)" : cfg.dotColor === "#60a5fa" ? "rgba(96,165,250,0.1)" : "rgba(255,255,255,0.05)",
                    color: cfg.dotColor,
                    border: `1px solid ${cfg.dotColor}30`,
                    textTransform: "uppercase", letterSpacing: "0.5px",
                  }}>{cfg.label}</span>
                </div>

                {cfg.next && !isServed && (
                  <button
                    onClick={() => onUpdateItem(order._id, item._id, cfg.next!)}
                    style={{
                      flexShrink: 0, padding: "8px 14px", borderRadius: "10px",
                      border: "none", background: cfg.btnBg, color: cfg.btnColor,
                      fontWeight: 800, fontSize: "12px", cursor: "pointer",
                      fontFamily: "inherit", whiteSpace: "nowrap",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    {cfg.btnLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stats Bar ───
function StatsBar({ orders, cancelledCount }: { orders: Order[]; cancelledCount: number }) {
  const pending = orders.reduce((s, o) => s + o.items.filter(i => i.status === "pending").length, 0);
  const preparing = orders.reduce((s, o) => s + o.items.filter(i => i.status === "preparing").length, 0);
  const ready = orders.reduce((s, o) => s + o.items.filter(i => i.status === "ready").length, 0);

  return (
    <div style={{ display: "flex", gap: "10px", padding: "12px 20px", background: BRAND.surface2, borderBottom: `1px solid ${BRAND.coffeeBorder}` }}>
      {[
        { label: "Pending", value: pending, color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
        { label: "Cooking", value: preparing, color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
        { label: "Ready", value: ready, color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
        { label: "Cancelled", value: cancelledCount, color: "#f87171", bg: "rgba(248,113,113,0.1)" },
      ].map(({ label, value, color, bg }) => (
        <div key={label} style={{ flex: 1, background: bg, borderRadius: "12px", padding: "8px 12px", textAlign: "center", border: `1px solid ${color}20` }}>
          <p style={{ fontWeight: 900, fontSize: "20px", color, margin: 0 }}>{value}</p>
          <p style={{ fontSize: "10px", color: BRAND.textMuted, margin: 0, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN KDS PAGE ───
export default function KDSPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<(Order & { cancelledAt: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "preparing" | "ready">("all");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const prevOrderIds = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ── Audio alert ──
  const playAlert = useCallback((type: "new" | "cancel") => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;

      if (type === "new") {
        // Two pleasant beeps
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
        // Urgent buzzer for cancellation
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.value = 220;
        gain.gain.value = 0.4;
        osc.start();
        setTimeout(() => { osc.stop(); }, 800);
      }
    } catch { }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await orderApi.getKdsOrders();
      const newOrders: Order[] = res.data.data;
      const newIds = new Set(newOrders.map(o => o._id));

      // Detect new orders
      newOrders.forEach(o => {
        if (!prevOrderIds.current.has(o._id)) playAlert("new");
      });

      // Detect cancelled (was in list, now gone with status cancelled)
      prevOrderIds.current.forEach(id => {
        if (!newIds.has(id)) {
          // Check if it was cancelled
          const allOrdersRes = orderApi.getOrders({ status: "cancelled" });
          allOrdersRes.then(r => {
            const cancelled = r.data.data.find((o: Order) => o._id === id);
            if (cancelled) {
              playAlert("cancel");
              setCancelledOrders(prev => {
                if (prev.find(c => c._id === id)) return prev;
                return [...prev, { ...cancelled, cancelledAt: Date.now() }];
              });
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

  // ── Clock ──
  useEffect(() => {
    const iv = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // ── Poll ──
  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [load]);

  // ── Auto-dismiss cancelled orders after 10 min ──
  useEffect(() => {
    const iv = setInterval(() => {
      const tenMin = 10 * 60 * 1000;
      setCancelledOrders(prev => prev.filter(o => Date.now() - o.cancelledAt < tenMin));
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  const handleUpdateItem = async (orderId: string, itemId: string, status: OrderItemStatus) => {
    try {
      await orderApi.updateItemStatus(orderId, { itemId, status });
      setOrders(prev => prev.map(o =>
        o._id === orderId
          ? { ...o, items: o.items.map(i => i._id === itemId ? { ...i, status } : i) }
          : o
      ));
      setTimeout(load, 500);
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
    <div style={{ minHeight: "100vh", background: BRAND.surface, display: "flex", flexDirection: "column", fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse-border {
          0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4), 0 8px 32px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(220,38,38,0), 0 8px 32px rgba(0,0,0,0.4); }
        }
        @keyframes pulse-text { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${BRAND.coffeeBorder}; border-radius: 4px; }
        button { font-family: 'Nunito', sans-serif; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ background: BRAND.surface2, borderBottom: `1px solid ${BRAND.coffeeBorder}`, padding: "0 20px", flexShrink: 0 }}>
        {/* Gold line */}
        <div style={{ height: "3px", background: `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold},${BRAND.goldLight},${BRAND.gold},${BRAND.goldDark})` }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/pos" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", color: BRAND.textMuted, fontSize: "13px", fontWeight: 700, background: "rgba(255,255,255,0.05)", border: `1px solid ${BRAND.coffeeBorder}`, borderRadius: "10px", padding: "6px 12px" }}>
              ← POS
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>👨‍🍳</div>
              <div>
                <h1 style={{ fontWeight: 900, fontSize: "20px", color: BRAND.gold, margin: 0, fontFamily: "'Playfair Display', serif" }}>Kitchen Display</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", animation: "pulse-text 2s infinite" }} />
                  <span style={{ fontSize: "11px", color: BRAND.textMuted, fontWeight: 700 }}>Live • Updates every 5s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter + Clock */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", borderRadius: "14px", overflow: "hidden", border: `1px solid ${BRAND.coffeeBorder}` }}>
              {[
                { id: "all", label: `All (${orders.length})` },
                { id: "pending", label: "🔴 New" },
                { id: "preparing", label: "🟡 Cooking" },
                { id: "ready", label: "🟢 Ready" },
              ].map(({ id, label }) => (
                <button key={id} onClick={() => setFilter(id as typeof filter)} style={{
                  padding: "8px 14px", fontSize: "12px", fontWeight: 800, border: "none",
                  cursor: "pointer", transition: "all 0.2s",
                  background: filter === id ? `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})` : BRAND.coffeeMid,
                  color: filter === id ? BRAND.coffee : BRAND.textMuted,
                  fontFamily: "inherit",
                }}>{label}</button>
              ))}
            </div>

            {/* Live clock */}
            <div style={{ background: BRAND.coffeeMid, border: `1px solid ${BRAND.coffeeBorder}`, borderRadius: "14px", padding: "8px 16px", textAlign: "center" }}>
              <p style={{ fontWeight: 900, fontSize: "20px", color: BRAND.gold, margin: 0, fontVariantNumeric: "tabular-nums" }}>
                {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
              </p>
              <p style={{ fontSize: "10px", color: BRAND.textMuted, margin: 0, fontWeight: 700 }}>
                {currentTime.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <StatsBar orders={orders} cancelledCount={cancelledOrders.length} />

      {/* SLA Legend */}
      <div style={{ display: "flex", gap: "12px", padding: "10px 20px", background: BRAND.surface, borderBottom: `1px solid ${BRAND.coffeeBorder}` }}>
        <span style={{ fontSize: "11px", color: BRAND.textDim, fontWeight: 700 }}>SLA:</span>
        {[
          { color: "#4ade80", label: "0-5 min: On Time" },
          { color: "#fbbf24", label: "5-10 min: Running Late" },
          { color: "#f87171", label: "10+ min: URGENT (Pulsing)" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
            <span style={{ fontSize: "11px", color: BRAND.textMuted, fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "16px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: "280px", borderRadius: "24px", background: BRAND.surface2, border: `1px solid ${BRAND.coffeeBorder}`, animation: "fadeIn 1s infinite alternate" }} />
            ))}
          </div>
        ) : allDisplayOrders.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" }}>
            <div style={{ fontSize: "72px", marginBottom: "20px" }}>✅</div>
            <p style={{ fontWeight: 900, fontSize: "24px", color: BRAND.textMuted, fontFamily: "'Playfair Display', serif", margin: "0 0 8px" }}>All Caught Up!</p>
            <p style={{ fontSize: "15px", color: BRAND.textDim, fontWeight: 600 }}>No active orders in the kitchen</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "16px", alignItems: "start" }}>
            {allDisplayOrders.map(order => (
              <KDSCard
                key={order._id}
                order={order}
                onUpdateItem={handleUpdateItem}
                onDismissCancelled={order.cancelled ? dismissCancelled : undefined}
              />
            ))}
          </div>
        )}
      </main>

      {/* Live indicator */}
      <div style={{ position: "fixed", bottom: "20px", right: "20px", display: "flex", alignItems: "center", gap: "8px", background: BRAND.surface2, border: `1px solid ${BRAND.coffeeBorder}`, padding: "8px 14px", borderRadius: "99px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", animation: "pulse-text 1.5s infinite" }} />
        <span style={{ fontSize: "11px", color: BRAND.textMuted, fontWeight: 700 }}>
          Last sync: {lastUpdated.toLocaleTimeString("en-IN", { timeStyle: "short" })}
        </span>
      </div>
    </div>
  );
}
