"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/types";

const T = {
  emerald: "#0F3D2E",
  emeraldMid: "#1A5340",
  emeraldLight: "#2D7A5F",
  sage: "#7A9E7E",
  gold: "#D4A574",
  goldLight: "#E8C895",
  goldDark: "#B08550",
  cream: "#FAF6F0",
  creamDark: "#F0E8DA",
  ivory: "#FFFBF5",
  text: "#2C2418",
  textMuted: "#7A6B54",
  success: "#4A8B4A",
  danger: "#C0392B",
};

interface Props {
  order: Order;
  queuePosition?: number;
}

const STAGES = [
  { id: "pending_approval", label: "Confirming", icon: "⏳" },
  { id: "kotSent", label: "In Kitchen", icon: "👨‍🍳" },
  { id: "partially_ready", label: "Almost", icon: "🔔" },
  { id: "ready", label: "Ready!", icon: "✅" },
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
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
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
      <div style={{ margin: "10px", padding: "16px", borderRadius: "16px", background: "linear-gradient(135deg, #7f1d1d, #991b1b)", textAlign: "center", boxShadow: "0 8px 20px rgba(192,57,43,0.3)" }}>
        <div style={{ fontSize: "36px", marginBottom: "6px" }}>❌</div>
        <p style={{ fontWeight: 900, fontSize: "14px", color: "white", margin: "0 0 3px", fontFamily: "'Playfair Display', serif" }}>Order Cancelled</p>
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", margin: 0, fontWeight: 600 }}>Contact staff if needed</p>
      </div>
    );
  }

  return (
    <div style={{ margin: "10px", borderRadius: "18px", overflow: "hidden", background: `linear-gradient(145deg, ${T.emerald}, ${T.emeraldMid})`, boxShadow: `0 8px 24px rgba(15,61,46,0.35)`, border: `1px solid rgba(212,165,116,0.2)` }}>
      <style>{`
        @keyframes pulse-ready { 0%,100%{box-shadow:0 0 0 0 rgba(74,139,74,0.4)} 50%{box-shadow:0 0 0 12px rgba(74,139,74,0)} }
        @keyframes bounce-subtle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes pulse-stage { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.06);opacity:0.9} }
      `}</style>

      <div style={{ padding: "14px 14px 0", textAlign: "center" }}>
        <div style={{ display: "inline-block", animation: isReady ? "pulse-ready 1.5s infinite" : currentStage === 1 || currentStage === 2 ? "bounce-subtle 2s infinite" : "none", marginBottom: "6px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: isReady
              ? "linear-gradient(135deg, #2d6a2d, #4A8B4A)"
              : `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px",
            boxShadow: isReady ? "0 5px 14px rgba(74,139,74,0.5)" : `0 5px 14px rgba(212,165,116,0.4)`,
          }}>
            {STAGES[Math.min(currentStage, 3)].icon}
          </div>
        </div>

        <p style={{ fontWeight: 900, fontSize: "18px", color: isReady ? "#86c686" : T.gold, margin: "3px 0", fontFamily: "'Playfair Display', serif" }}>
          {STAGES[Math.min(currentStage, 3)].label}
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "99px", padding: "3px 9px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "9px" }}>🎫</span>
            <span style={{ fontSize: "10px", color: T.gold, fontWeight: 800 }}>#{order.orderNumber}</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "99px", padding: "3px 9px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "9px" }}>⏱️</span>
            <span style={{ fontSize: "10px", color: T.gold, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              {mins}m {secs}s
            </span>
          </div>
          {queuePosition !== undefined && queuePosition > 0 && (
            <div style={{ background: "rgba(96,165,250,0.2)", borderRadius: "99px", padding: "3px 9px", display: "flex", alignItems: "center", gap: "4px", border: "1px solid rgba(96,165,250,0.3)" }}>
              <span style={{ fontSize: "9px" }}>📋</span>
              <span style={{ fontSize: "10px", color: "#93c5fd", fontWeight: 800 }}>
                {queuePosition === 1 ? "Next!" : `${queuePosition} ahead`}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 14px 12px", position: "relative" }}>
        <div style={{ position: "absolute", top: "27px", left: "28px", right: "28px", height: "2px", background: "rgba(255,255,255,0.1)", borderRadius: "2px" }} />

        <div style={{
          position: "absolute", top: "27px", left: "28px",
          width: `calc((100% - 56px) * ${currentStage / (STAGES.length - 1)})`,
          height: "2px",
          background: isReady ? "linear-gradient(90deg, #2d6a2d, #4A8B4A)" : `linear-gradient(90deg, ${T.goldDark}, ${T.gold})`,
          borderRadius: "2px",
          transition: "width 0.5s ease",
          boxShadow: `0 0 8px ${isReady ? "#4A8B4A" : T.gold}`,
        }} />

        <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStage;
            const isCurrent = idx === currentStage;

            return (
              <div key={stage.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flex: 1 }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%",
                  background: isCompleted
                    ? "linear-gradient(135deg, #2d6a2d, #4A8B4A)"
                    : isCurrent
                      ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`
                      : "rgba(255,255,255,0.08)",
                  border: `2px solid ${isCompleted ? "#4A8B4A" : isCurrent ? T.gold : "rgba(255,255,255,0.15)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px",
                  animation: isCurrent ? "pulse-stage 2s infinite" : "none",
                }}>
                  {isCompleted ? "✓" : isCurrent ? stage.icon : <span style={{ color: "rgba(212,165,116,0.3)", fontSize: "11px" }}>{idx + 1}</span>}
                </div>
                <span style={{
                  fontSize: "8px", fontWeight: 800,
                  color: isCompleted ? "#86c686" : isCurrent ? T.gold : "rgba(212,165,116,0.4)",
                  textAlign: "center", lineHeight: 1.2, letterSpacing: "0.3px",
                  textTransform: "uppercase",
                }}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "0 12px 12px" }}>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "12px", padding: "10px 11px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "rgba(212,165,116,0.6)", letterSpacing: "0.8px", textTransform: "uppercase" }}>Your Items</span>
            <span style={{ fontSize: "10px", fontWeight: 800, color: T.gold }}>
              {order.items.filter(i => i.status === "ready" || i.status === "served").length}/{order.items.length} ready
            </span>
          </div>

          {order.items.slice(0, 4).map(item => {
            const dotColor = item.status === "ready" || item.status === "served" ? "#86c686" : item.status === "preparing" ? T.gold : "rgba(255,255,255,0.3)";
            return (
              <div key={item._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3px 0", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: `0 0 4px ${dotColor}` }} />
                  <span style={{ fontSize: "11px", color: "rgba(212,165,116,0.9)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name} <span style={{ color: "rgba(212,165,116,0.5)" }}>×{item.quantity}</span>
                  </span>
                </div>
                <span style={{ fontSize: "8px", fontWeight: 800, color: dotColor, textTransform: "uppercase", letterSpacing: "0.3px", flexShrink: 0 }}>
                  {item.status === "ready" || item.status === "served" ? "✓ Ready" : item.status === "preparing" ? "Cooking" : "Pending"}
                </span>
              </div>
            );
          })}

          {order.items.length > 4 && (
            <p style={{ fontSize: "10px", color: "rgba(212,165,116,0.5)", margin: "4px 0 0", textAlign: "center", fontWeight: 700 }}>
              +{order.items.length - 4} more
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: T.gold }}>Total</span>
            <span style={{ fontSize: "13px", fontWeight: 900, color: T.gold }}>₹{order.totalAmount.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 14px 12px" }}>
        <p style={{ fontSize: "9px", color: "rgba(212,165,116,0.5)", margin: 0, textAlign: "center", fontWeight: 600 }}>
          Placed at {formatTime(order.createdAt)}
        </p>
      </div>
    </div>
  );
}
