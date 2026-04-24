"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { orderApi } from "@/lib/api";
import type { Order } from "@/types";

const BRAND = {
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  goldDark: "#A07830",
  coffee: "#1A0E06",
  coffeeMid: "#2C1A0E",
  coffeeBorder: "#3D2410",
  surface: "#231508",
  text: "#E8D5B0",
  textMuted: "#9A7A5A",
};

function useCountdown(startSeconds: number) {
  const [seconds, setSeconds] = useState(startSeconds);
  useEffect(() => {
    if (seconds <= 0) return;
    const iv = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(iv);
  }, [seconds]);
  return seconds;
}

function OrderApprovalCard({ order, onApprove, onReject }: {
  order: Order;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
  const remaining = Math.max(0, 60 - elapsed);
  const [countdown, setCountdown] = useState(remaining);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const iv = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(iv);
  }, [countdown]);

  const isUrgent = countdown <= 15;
  const pct = (countdown / 60) * 100;

  return (
    <div style={{
      background: BRAND.surface,
      border: `2px solid ${isUrgent ? "#dc2626" : BRAND.gold}`,
      borderRadius: "20px", overflow: "hidden",
      boxShadow: isUrgent
        ? "0 0 0 4px rgba(220,38,38,0.15), 0 8px 24px rgba(0,0,0,0.4)"
        : `0 0 0 2px rgba(201,168,76,0.15), 0 8px 24px rgba(0,0,0,0.3)`,
      animation: isUrgent ? "pulse-border 1.5s infinite" : "slideIn 0.3s ease",
      marginBottom: "12px",
    }}>
      {/* Countdown progress bar */}
      <div style={{ height: "4px", background: "rgba(255,255,255,0.1)" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: isUrgent
            ? "linear-gradient(90deg,#dc2626,#ef4444)"
            : `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold})`,
          transition: "width 1s linear, background 0.5s ease",
        }} />
      </div>

      <div style={{ padding: "14px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Incoming badge */}
            <span style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "99px", fontWeight: 900, background: "rgba(96,165,250,0.15)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.3)", letterSpacing: "0.5px" }}>
              📱 NEW QR ORDER
            </span>
            <span style={{ fontWeight: 900, fontSize: "14px", color: BRAND.gold }}>
              {order.tableNumber}
            </span>
          </div>

          {/* Countdown */}
          <div style={{ textAlign: "right" }}>
            <p style={{
              fontWeight: 900, fontSize: "20px", margin: 0,
              color: isUrgent ? "#f87171" : BRAND.gold,
              animation: isUrgent ? "pulse-text 0.8s infinite" : "none",
              fontVariantNumeric: "tabular-nums",
            }}>
              {countdown}s
            </p>
            <p style={{ fontSize: "10px", color: BRAND.textMuted, margin: 0, fontWeight: 700 }}>
              {countdown === 0 ? "Auto-approved!" : "Auto-approve in"}
            </p>
          </div>
        </div>

        {/* Customer info */}
        {order.customerName && (
          <div style={{ display: "flex", gap: "12px", marginBottom: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "8px 12px" }}>
            <span style={{ fontSize: "14px" }}>👤</span>
            <div>
              <p style={{ fontWeight: 800, fontSize: "13px", color: BRAND.text, margin: 0 }}>{order.customerName}</p>
              {order.customerPhone && <p style={{ fontSize: "11px", color: BRAND.textMuted, margin: "2px 0 0", fontWeight: 600 }}>{order.customerPhone}</p>}
            </div>
          </div>
        )}

        {/* Items */}
        <div style={{ marginBottom: "12px" }}>
          {order.items.map(item => (
            <div key={item._id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0", borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
              <span style={{ color: BRAND.text, fontWeight: 700 }}>{item.name} <span style={{ color: BRAND.textMuted }}>×{item.quantity}</span></span>
              <span style={{ color: BRAND.gold, fontWeight: 800 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "15px", paddingTop: "8px" }}>
            <span style={{ color: BRAND.text }}>Total</span>
            <span style={{ color: BRAND.gold }}>₹{order.totalAmount.toFixed(0)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
          <button
            onClick={async () => {
              setRejecting(true);
              await onReject(order._id);
              setRejecting(false);
            }}
            disabled={rejecting || approving}
            style={{
              padding: "12px", borderRadius: "12px",
              border: "1px solid rgba(248,113,113,0.3)",
              background: "rgba(248,113,113,0.1)", color: "#f87171",
              fontWeight: 800, cursor: "pointer", fontSize: "13px",
              fontFamily: "inherit", transition: "all 0.2s",
            }}
          >
            {rejecting ? "..." : "✕ Reject"}
          </button>
          <button
            onClick={async () => {
              setApproving(true);
              await onApprove(order._id);
              setApproving(false);
            }}
            disabled={approving || rejecting}
            style={{
              padding: "12px", borderRadius: "12px", border: "none",
              background: approving ? BRAND.coffeeMid : `linear-gradient(135deg,#166534,#16a34a)`,
              color: "white", fontWeight: 900, cursor: "pointer",
              fontSize: "13px", fontFamily: "inherit",
              boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
              transition: "all 0.2s",
            }}
          >
            {approving ? "Approving..." : "✓ Accept & Send to Kitchen"}
          </button>
        </div>

        {/* Urgent warning */}
        {isUrgent && countdown > 0 && (
          <div style={{ marginTop: "10px", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "10px", padding: "8px 12px", textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "#f87171", margin: 0, fontWeight: 800 }}>
              ⚠️ Auto-approving in {countdown} seconds!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Notification Panel ───
export default function OrderApprovalPanel() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const audioRef = useRef<AudioContext | null>(null);
  const prevCountRef = useRef(0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const playBeep = () => {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      [0, 0.25, 0.5].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = delay === 0.5 ? 1100 : 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.25);
      });
    } catch { }
  };

  const load = useCallback(async () => {
    try {
      const res = await orderApi.getPendingApproval();
      const orders: Order[] = res.data.data;

      // Play alert for new incoming orders
      if (orders.length > prevCountRef.current) {
        playBeep();
        if (orders.length > 0) setIsOpen(true); // Auto-open panel
      }

      prevCountRef.current = orders.length;
      setPendingOrders(orders);
    } catch { }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [load]);

  const handleApprove = async (id: string) => {
    try {
      await orderApi.approveOrder(id);
      showToast("✓ Order approved — sent to kitchen!");
      load();
    } catch (e: unknown) {
      showToast(`✗ ${e instanceof Error ? e.message : "Failed"}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await orderApi.rejectOrder(id, "Rejected by staff");
      showToast("Order rejected");
      load();
    } catch (e: unknown) {
      showToast(`✗ ${e instanceof Error ? e.message : "Failed"}`);
    }
  };

  if (pendingOrders.length === 0 && !isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes pulse-border { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{box-shadow:0 0 0 6px rgba(220,38,38,0)} }
        @keyframes pulse-text { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes slideIn { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes bell-shake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-15deg)} 75%{transform:rotate(15deg)} }
      `}</style>

      {/* Bell button — always visible when orders pending */}
      {pendingOrders.length > 0 && (
        <button
          onClick={() => setIsOpen(o => !o)}
          style={{
            position: "fixed", top: "16px", right: "16px", zIndex: 60,
            width: "52px", height: "52px", borderRadius: "50%",
            background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`,
            border: "none", cursor: "pointer",
            boxShadow: "0 8px 24px rgba(201,168,76,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", animation: "bell-shake 0.5s ease infinite",
          }}
        >
          🔔
          <span style={{
            position: "absolute", top: "-4px", right: "-4px",
            background: "#dc2626", color: "white", fontSize: "11px",
            width: "20px", height: "20px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, border: "2px solid white",
          }}>{pendingOrders.length}</span>
        </button>
      )}

      {/* Slide-in Panel */}
      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 55, backdropFilter: "blur(4px)" }}
          />
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0,
            width: "380px", background: BRAND.coffeeMid,
            borderLeft: `1px solid ${BRAND.coffeeBorder}`,
            zIndex: 56, overflowY: "auto",
            boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
            animation: "slideIn 0.3s ease",
          }}>
            {/* Panel header */}
            <div style={{ padding: "20px", borderBottom: `1px solid ${BRAND.coffeeBorder}`, position: "sticky", top: 0, background: BRAND.coffeeMid, zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontWeight: 900, fontSize: "18px", color: BRAND.gold, margin: 0, fontFamily: "'Playfair Display', serif" }}>
                    📱 Incoming Orders
                  </h2>
                  <p style={{ fontSize: "12px", color: BRAND.textMuted, margin: "3px 0 0", fontWeight: 700 }}>
                    {pendingOrders.length} order{pendingOrders.length !== 1 ? "s" : ""} waiting • Auto-approve in 60s
                  </p>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", color: BRAND.textMuted, cursor: "pointer", fontSize: "16px" }}>✕</button>
              </div>
            </div>

            <div style={{ padding: "16px" }}>
              {pendingOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                  <p style={{ fontWeight: 700, color: BRAND.textMuted, fontSize: "15px" }}>No pending orders</p>
                </div>
              ) : (
                pendingOrders.map(order => (
                  <OrderApprovalCard
                    key={order._id}
                    order={order}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          background: toast.startsWith("✓") ? "rgba(22,163,74,0.95)" : "rgba(220,38,38,0.95)",
          color: "white", padding: "12px 24px", borderRadius: "16px",
          fontWeight: 800, fontSize: "14px", zIndex: 70,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {toast}
        </div>
      )}
    </>
  );
}
