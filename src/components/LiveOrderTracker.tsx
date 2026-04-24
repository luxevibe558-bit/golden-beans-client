"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/types";

const BRAND = {
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  goldDark: "#A07830",
  coffee: "#1A0E06",
  coffeeMid: "#2C1A0E",
  cream: "#FDF6E9",
  creamDark: "#F0E0C0",
  espresso: "#0D0700",
  textMuted: "#9A7A5A",
};

interface Props {
  order: Order;
  queuePosition?: number;
}

const STAGES = [
  { id: "pending_approval", label: "Confirming", icon: "⏳", description: "Staff reviewing" },
  { id: "kotSent", label: "In Kitchen", icon: "👨‍🍳", description: "Chef preparing" },
  { id: "partially_ready", label: "Almost Ready", icon: "🔔", description: "Some items done" },
  { id: "ready", label: "Ready!", icon: "✅", description: "Coming to you" },
];

function getStageIndex(status: string) {
  switch (status) {
    case "pending_approval": return 0;
    case "open":
    case "kotSent": return 1;
    case "partially_ready": return 2;
    case "ready": return 3;
    case "settled": return 4;
    default: return 0;
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function useLiveTimer(startIso: string) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - new Date(startIso).getTime()) / 1000)
  );
  useEffect(() => {
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startIso).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [startIso]);
  return elapsed;
}

export default function LiveOrderTracker({ order, queuePosition }: Props) {
  const currentStage = getStageIndex(order.status);
  const elapsed = useLiveTimer(order.createdAt);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  const isReady = order.status === "ready";
  const isCancelled = order.status === "cancelled";

  if (isCancelled) {
    return (
      <div style={{ margin: "16px", padding: "20px", borderRadius: "24px", background: "linear-gradient(135deg,#7f1d1d,#991b1b)", border: "1px solid rgba(248,113,113,0.3)", textAlign: "center", boxShadow: "0 12px 32px rgba(220,38,38,0.3)" }}>
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>❌</div>
        <p style={{ fontWeight: 900, fontSize: "18px", color: "white", margin: "0 0 4px", fontFamily: "'Playfair Display', serif" }}>Order Cancelled</p>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: 0, fontWeight: 600 }}>Please contact our staff if needed</p>
      </div>
    );
  }

  return (
    <div style={{ margin: "16px", borderRadius: "24px", overflow: "hidden", background: `linear-gradient(145deg,${BRAND.coffee},${BRAND.coffeeMid})`, boxShadow: `0 12px 40px rgba(26,14,6,0.4)`, border: `1px solid rgba(201,168,76,0.2)` }}>
      <style>{`
        @keyframes pulse-ready { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.4)} 50%{box-shadow:0 0 0 16px rgba(74,222,128,0)} }
        @keyframes bounce-subtle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes pulse-stage { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.9} }
      `}</style>

      {/* Top section — big status */}
      <div style={{ padding: "20px 20px 0", textAlign: "center" }}>
        <div style={{ display: "inline-block", animation: isReady ? "pulse-ready 1.5s infinite" : currentStage === 1 || currentStage === 2 ? "bounce-subtle 2s infinite" : "none", marginBottom: "8px" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: isReady
              ? "linear-gradient(135deg,#166534,#16a34a)"
              : `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "36px", boxShadow: isReady
              ? "0 8px 24px rgba(22,163,74,0.5)"
              : `0 8px 24px rgba(201,168,76,0.4)`,
          }}>
            {STAGES[Math.min(currentStage, 3)].icon}
          </div>
        </div>

        <p style={{ fontWeight: 900, fontSize: "22px", color: isReady ? "#4ade80" : BRAND.gold, margin: "4px 0", fontFamily: "'Playfair Display', serif" }}>
          {STAGES[Math.min(currentStage, 3)].label}
        </p>
        <p style={{ fontSize: "13px", color: "rgba(201,168,76,0.7)", margin: "0 0 4px", fontWeight: 600 }}>
          {STAGES[Math.min(currentStage, 3)].description}
        </p>

        {/* Info row */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "99px", padding: "4px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px" }}>🎫</span>
            <span style={{ fontSize: "11px", color: BRAND.gold, fontWeight: 800 }}>#{order.orderNumber}</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "99px", padding: "4px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px" }}>⏱️</span>
            <span style={{ fontSize: "11px", color: BRAND.gold, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              {mins}m {secs}s
            </span>
          </div>
          {queuePosition !== undefined && queuePosition > 0 && (
            <div style={{ background: "rgba(96,165,250,0.15)", borderRadius: "99px", padding: "4px 12px", display: "flex", alignItems: "center", gap: "6px", border: "1px solid rgba(96,165,250,0.3)" }}>
              <span style={{ fontSize: "11px" }}>📋</span>
              <span style={{ fontSize: "11px", color: "#60a5fa", fontWeight: 800 }}>
                {queuePosition === 1 ? "Next up!" : `${queuePosition} ahead of you`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress stepper */}
      <div style={{ padding: "24px 20px 16px", position: "relative" }}>
        {/* Background line */}
        <div style={{ position: "absolute", top: "32px", left: "36px", right: "36px", height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "3px" }} />

        {/* Active progress line */}
        <div style={{
          position: "absolute",
          top: "32px",
          left: "36px",
          width: `calc(${(currentStage / (STAGES.length - 1)) * 100}% - ${36 / STAGES.length}px)`,
          height: "3px",
          background: isReady ? "linear-gradient(90deg,#166534,#16a34a)" : `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold})`,
          borderRadius: "3px",
          transition: "width 0.5s ease",
          boxShadow: `0 0 12px ${isReady ? "#16a34a" : BRAND.gold}`,
        }} />

        {/* Stages */}
        <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStage;
            const isCurrent = idx === currentStage;
            const isPending = idx > currentStage;

            return (
              <div key={stage.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1 }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: isCompleted
                    ? "linear-gradient(135deg,#166534,#16a34a)"
                    : isCurrent
                    ? `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`
                    : "rgba(255,255,255,0.08)",
                  border: `2px solid ${isCompleted ? "#16a34a" : isCurrent ? BRAND.gold : "rgba(255,255,255,0.15)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "16px",
                  boxShadow: isCurrent ? `0 4px 12px rgba(201,168,76,0.4)` : "none",
                  animation: isCurrent ? "pulse-stage 2s infinite" : "none",
                  transition: "all 0.3s ease",
                }}>
                  {isCompleted ? "✓" : isCurrent ? stage.icon : <span style={{ color: "rgba(201,168,76,0.3)", fontSize: "14px" }}>{idx + 1}</span>}
                </div>
                <span style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: isCompleted ? "#4ade80" : isCurrent ? BRAND.gold : "rgba(201,168,76,0.4)",
                  textAlign: "center",
                  lineHeight: 1.3,
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                  maxWidth: "70px",
                }}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items preview */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "rgba(201,168,76,0.6)", letterSpacing: "1px", textTransform: "uppercase" }}>Your Items</span>
            <span style={{ fontSize: "11px", fontWeight: 800, color: BRAND.gold }}>
              {order.items.filter(i => i.status === "ready" || i.status === "served").length} of {order.items.length} ready
            </span>
          </div>

          {order.items.slice(0, 4).map(item => {
            const dotColor = item.status === "ready" || item.status === "served" ? "#4ade80" : item.status === "preparing" ? BRAND.gold : "rgba(255,255,255,0.3)";
            return (
              <div key={item._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: `0 0 6px ${dotColor}` }} />
                  <span style={{ fontSize: "12px", color: "rgba(201,168,76,0.9)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name} <span style={{ color: "rgba(201,168,76,0.5)" }}>×{item.quantity}</span>
                  </span>
                </div>
                <span style={{ fontSize: "10px", fontWeight: 800, color: dotColor, textTransform: "uppercase", letterSpacing: "0.3px", flexShrink: 0, marginLeft: "8px" }}>
                  {item.status === "ready" || item.status === "served" ? "✓ Ready" : item.status === "preparing" ? "Cooking" : "Pending"}
                </span>
              </div>
            );
          })}

          {order.items.length > 4 && (
            <p style={{ fontSize: "11px", color: "rgba(201,168,76,0.5)", margin: "6px 0 0", textAlign: "center", fontWeight: 700 }}>
              +{order.items.length - 4} more items
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: BRAND.gold }}>Total</span>
            <span style={{ fontSize: "14px", fontWeight: 900, color: BRAND.gold }}>₹{order.totalAmount.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Placed time */}
      <div style={{ padding: "0 20px 16px" }}>
        <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.5)", margin: 0, textAlign: "center", fontWeight: 600 }}>
          Placed at {formatTime(order.createdAt)}
        </p>
      </div>
    </div>
  );
}
