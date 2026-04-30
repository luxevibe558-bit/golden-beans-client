"use client";

// ════════════════════════════════════════════════════════════
// PREMIUM SETTLE BILL MODAL
// Place at: client-new/src/components/SettleBillModal.tsx
// ════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { orderApi } from "@/lib/api";
import { Icons, Button, Pill } from "@/components/PremiumUI";
import type { Order } from "@/types";

const T = {
  emerald: "#0F3D2E",
  emeraldMid: "#1A5340",
  emeraldLight: "#2D7A5F",
  gold: "#D4A574",
  goldLight: "#E8C895",
  goldDark: "#B08550",
  cream: "#FAF6F0",
  creamDark: "#F0E8DA",
  ivory: "#FFFBF5",
  border: "#E5DCC9",
  text: "#1A1208",
  textMuted: "#7A6B54",
  textDim: "#A89B80",
  success: "#4A8B4A",
  danger: "#C0392B",
  info: "#4A7B9B",
  warning: "#D4A574",
};

type PaymentMethod = "cash" | "card" | "upi" | "due";

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; color: string }[] = [
  { id: "cash", label: "Cash", icon: "💵", color: T.success },
  { id: "card", label: "Card", icon: "💳", color: T.info },
  { id: "upi", label: "UPI", icon: "📱", color: T.gold },
  { id: "due", label: "Due", icon: "📒", color: T.danger },
];

interface SettleBillModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSettled: () => void;
}

export default function SettleBillModal({ order, isOpen, onClose, onSettled }: SettleBillModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashTendered, setCashTendered] = useState("");
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [dueCustomerName, setDueCustomerName] = useState("");
  const [dueCustomerPhone, setDueCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [settling, setSettling] = useState(false);
  const cashInputRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen && order) {
      setPaymentMethod("cash");
      setCashTendered("");
      setDiscount(order.discount > 0 ? String(order.discount) : "");
      setDiscountType("flat");
      setDueCustomerName(order.customerName || "");
      setDueCustomerPhone(order.customerPhone || "");
      setNotes("");
      setTimeout(() => cashInputRef.current?.focus(), 300);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  // ─── Bill Calculations ───
  const subtotal = order.subtotal || order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const promoDiscount = order.discount || 0;
  const manualDiscountRaw = parseFloat(discount) || 0;
  const manualDiscount = discountType === "percent"
    ? Math.round((subtotal - promoDiscount) * manualDiscountRaw / 100)
    : manualDiscountRaw;
  const totalDiscount = promoDiscount + manualDiscount;
  const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
  const gstAmount = Math.round(discountedSubtotal * 0.05);
  const grandTotal = discountedSubtotal + gstAmount;
  const cashTenderedNum = parseFloat(cashTendered) || 0;
  const changeAmount = paymentMethod === "cash" ? Math.max(0, cashTenderedNum - grandTotal) : 0;
  const cashShort = paymentMethod === "cash" && cashTenderedNum > 0 && cashTenderedNum < grandTotal;

  // ─── Quick Cash Buttons ───
  const quickAmounts = [
    grandTotal,
    Math.ceil(grandTotal / 50) * 50,
    Math.ceil(grandTotal / 100) * 100,
    Math.ceil(grandTotal / 500) * 500,
  ].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4);

  const handleSettle = async () => {
    if (paymentMethod === "due" && !dueCustomerName.trim()) {
      alert("Please enter customer name for due payment");
      return;
    }
    if (paymentMethod === "cash" && cashTenderedNum < grandTotal) {
      if (!confirm(`Cash tendered (₹${cashTenderedNum}) is less than total (₹${grandTotal}). Continue?`)) return;
    }

    setSettling(true);
    try {
      await orderApi.settleOrder(order._id, {
        amountPaid: grandTotal,
        paymentMethod: paymentMethod === "due"
          ? `due:${dueCustomerName}:${dueCustomerPhone}`
          : paymentMethod,
        discount: totalDiscount,
        resolvedBy: "pos",
      });

      // Save due to localStorage for Due Ledger
      if (paymentMethod === "due") {
        const existingDues = JSON.parse(localStorage.getItem("gb_dues") || "[]");
        existingDues.push({
          id: Date.now(),
          orderId: order._id,
          orderNumber: order.orderNumber,
          tableNumber: order.tableNumber,
          customerName: dueCustomerName,
          customerPhone: dueCustomerPhone,
          amount: grandTotal,
          items: order.items,
          notes,
          date: new Date().toISOString(),
          settled: false,
        });
        localStorage.setItem("gb_dues", JSON.stringify(existingDues));
      }

      onSettled();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Settlement failed");
    } finally {
      setSettling(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,61,46,0.75)",
        zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.ivory,
          borderRadius: "24px",
          width: "100%", maxWidth: "520px",
          maxHeight: "92vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 32px 64px rgba(15,61,46,0.25)",
          animation: "gb-scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Gold gradient top bar */}
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})` }} />

        {/* Header */}
        <div style={{
          padding: "16px 20px",
          background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: "10px", color: "rgba(212,165,116,0.7)", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>
              Settle Bill
            </p>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "22px", fontWeight: 800,
              color: T.gold, margin: 0, letterSpacing: "-0.02em",
            }}>
              Order #{order.orderNumber}
            </h2>
            <p style={{ fontSize: "11px", color: "rgba(212,165,116,0.7)", margin: "3px 0 0", fontWeight: 600 }}>
              Table {order.tableNumber}
              {order.customerName && ` · ${order.customerName}`}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(212,165,116,0.2)",
            color: T.gold, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icons.Close size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* ─── Order Items Summary ─── */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Items Ordered
            </p>
            <div style={{ background: T.cream, borderRadius: "12px", overflow: "hidden", border: `1px solid ${T.border}` }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{
                  padding: "10px 12px",
                  borderBottom: idx < order.items.length - 1 ? `1px solid ${T.creamDark}` : "none",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: T.text }}>
                      {item.name}
                    </span>
                    {item.notes && (
                      <p style={{ fontSize: "10px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600 }}>
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    <span style={{ fontSize: "12px", color: T.textMuted, fontWeight: 600 }}>
                      ×{item.quantity}
                    </span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 800, color: T.emerald, minWidth: "52px", textAlign: "right" }}>
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Manual Discount ─── */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Additional Discount
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ display: "flex", background: T.cream, borderRadius: "10px", border: `1px solid ${T.border}`, overflow: "hidden", flexShrink: 0 }}>
                <button
                  onClick={() => setDiscountType("flat")}
                  style={{
                    padding: "10px 14px", border: "none", cursor: "pointer",
                    background: discountType === "flat" ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "transparent",
                    color: discountType === "flat" ? T.gold : T.textMuted,
                    fontWeight: 800, fontSize: "12px", fontFamily: "'DM Sans', sans-serif",
                  }}
                >₹</button>
                <button
                  onClick={() => setDiscountType("percent")}
                  style={{
                    padding: "10px 14px", border: "none", cursor: "pointer",
                    background: discountType === "percent" ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "transparent",
                    color: discountType === "percent" ? T.gold : T.textMuted,
                    fontWeight: 800, fontSize: "12px", fontFamily: "'DM Sans', sans-serif",
                  }}
                >%</button>
              </div>
              <input
                type="number"
                placeholder={discountType === "flat" ? "₹ Amount" : "% Value"}
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                min="0"
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: "10px",
                  border: `1.5px solid ${discount ? T.gold : T.border}`,
                  background: T.ivory, color: T.text, fontSize: "16px",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                  outline: "none", boxSizing: "border-box",
                }}
              />
              {discount && (
                <button
                  onClick={() => setDiscount("")}
                  style={{
                    width: "40px", height: "40px", borderRadius: "10px",
                    background: T.cream, border: `1px solid ${T.border}`,
                    color: T.textMuted, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icons.Close size={14} />
                </button>
              )}
            </div>
            {manualDiscount > 0 && (
              <p style={{ fontSize: "11px", color: T.success, margin: "5px 0 0", fontWeight: 700 }}>
                ✓ Discount: -₹{manualDiscount}
              </p>
            )}
          </div>

          {/* ─── Payment Method ─── */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Payment Method
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
              {PAYMENT_METHODS.map(method => {
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      padding: "12px 6px",
                      borderRadius: "12px",
                      background: isSelected ? `linear-gradient(135deg, ${method.color}, ${method.color}dd)` : T.cream,
                      color: isSelected ? "white" : T.textMuted,
                      border: `2px solid ${isSelected ? method.color : T.border}`,
                      cursor: "pointer",
                      transition: "all 150ms ease",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
                      boxShadow: isSelected ? `0 4px 12px ${method.color}40` : "none",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{method.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: "11px", fontFamily: "'Inter', sans-serif" }}>{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Cash Tendered (Cash only) ─── */}
          {paymentMethod === "cash" && (
            <div style={{ marginBottom: "16px", animation: "gb-fadeInUp 0.2s ease both" }}>
              <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                Cash Tendered
              </p>

              {/* Quick amounts */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setCashTendered(String(amount))}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      background: cashTenderedNum === amount ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.cream,
                      color: cashTenderedNum === amount ? T.gold : T.textMuted,
                      border: `1.5px solid ${cashTenderedNum === amount ? T.emerald : T.border}`,
                      fontWeight: 800, fontSize: "12px", cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {amount === grandTotal ? "Exact" : `₹${amount}`}
                  </button>
                ))}
              </div>

              <input
                ref={cashInputRef}
                type="number"
                placeholder={`₹${grandTotal} or more`}
                value={cashTendered}
                onChange={e => setCashTendered(e.target.value)}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: "10px",
                  border: `2px solid ${cashShort ? T.danger : cashTenderedNum >= grandTotal ? T.success : T.border}`,
                  background: T.ivory, color: T.text, fontSize: "20px",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 800,
                  outline: "none", boxSizing: "border-box",
                }}
              />

              {/* Change display */}
              {cashTenderedNum >= grandTotal && (
                <div style={{
                  marginTop: "10px",
                  background: `linear-gradient(135deg, ${T.success}, #2d6a2d)`,
                  borderRadius: "12px", padding: "12px 16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  boxShadow: "0 4px 12px rgba(74,139,74,0.25)",
                  animation: "gb-fadeInUp 0.2s ease both",
                }}>
                  <div>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", margin: 0, fontWeight: 700 }}>Change to Return</p>
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: "2px 0 0", fontWeight: 600 }}>
                      ₹{cashTenderedNum} - ₹{grandTotal}
                    </p>
                  </div>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "28px", fontWeight: 900,
                    color: "white", margin: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}>₹{changeAmount}</p>
                </div>
              )}

              {cashShort && (
                <p style={{ fontSize: "11px", color: T.danger, margin: "6px 0 0", fontWeight: 700 }}>
                  ⚠ Short by ₹{(grandTotal - cashTenderedNum).toFixed(0)}
                </p>
              )}
            </div>
          )}

          {/* ─── Due Customer Info ─── */}
          {paymentMethod === "due" && (
            <div style={{ marginBottom: "16px", animation: "gb-fadeInUp 0.2s ease both" }}>
              <div style={{
                background: "rgba(192,57,43,0.08)",
                border: `1.5px solid rgba(192,57,43,0.25)`,
                borderRadius: "12px", padding: "12px 14px", marginBottom: "12px",
              }}>
                <p style={{ fontSize: "12px", color: T.danger, fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
                  📒 This amount will be added to the Due Ledger. Collect when possible.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "5px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Full name required"
                    value={dueCustomerName}
                    onChange={e => setDueCustomerName(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", borderRadius: "10px",
                      border: `2px solid ${dueCustomerName ? T.gold : T.border}`,
                      background: T.ivory, color: T.text, fontSize: "16px",
                      fontFamily: "'Inter', sans-serif", fontWeight: 600,
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "5px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit phone"
                    value={dueCustomerPhone}
                    onChange={e => setDueCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    style={{
                      width: "100%", padding: "11px 14px", borderRadius: "10px",
                      border: `2px solid ${dueCustomerPhone.length === 10 ? T.gold : T.border}`,
                      background: T.ivory, color: T.text, fontSize: "16px",
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "5px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Regular customer, pays monthly"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", borderRadius: "10px",
                      border: `1.5px solid ${T.border}`,
                      background: T.ivory, color: T.text, fontSize: "14px",
                      fontFamily: "'Inter', sans-serif", fontWeight: 600,
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── CRM Info (if customer data exists) ─── */}
          {order.customerName && (
            <div style={{
              background: T.cream, borderRadius: "12px", padding: "12px 14px",
              marginBottom: "16px", border: `1px solid ${T.border}`,
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: T.gold, fontWeight: 800, fontSize: "14px",
                fontFamily: "'Playfair Display', serif", flexShrink: 0,
              }}>
                {order.customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: "13px", color: T.emerald, margin: 0 }}>{order.customerName}</p>
                {order.customerPhone && (
                  <p style={{ fontSize: "11px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                    📞 {order.customerPhone}
                  </p>
                )}
              </div>
              <Pill variant="gold" size="sm" style={{ marginLeft: "auto" }}>QR Customer</Pill>
            </div>
          )}
        </div>

        {/* ─── Bill Summary + Settle Button ─── */}
        <div style={{
          padding: "14px 20px 20px",
          borderTop: `1px solid ${T.border}`,
          background: T.cream,
        }}>
          {/* Bill Summary */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.textMuted, marginBottom: "4px" }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: T.text }}>₹{subtotal.toFixed(0)}</span>
            </div>

            {promoDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.success, marginBottom: "4px", fontWeight: 700 }}>
                <span>🎉 Promo Discount</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif" }}>-₹{promoDiscount.toFixed(0)}</span>
              </div>
            )}

            {manualDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.success, marginBottom: "4px", fontWeight: 700 }}>
                <span>✂️ Manual Discount{discountType === "percent" ? ` (${discount}%)` : ""}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif" }}>-₹{manualDiscount.toFixed(0)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.textMuted, marginBottom: "4px" }}>
              <span>GST (5%)</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: T.text }}>₹{gstAmount.toFixed(0)}</span>
            </div>

            <div style={{
              display: "flex", justifyContent: "space-between",
              fontWeight: 800, fontSize: "20px", color: T.emerald,
              padding: "8px 0", borderTop: `1px dashed ${T.border}`, marginTop: "6px",
            }}>
              <span style={{ fontFamily: "'Playfair Display', serif" }}>Grand Total</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontVariantNumeric: "tabular-nums" }}>
                ₹{grandTotal.toFixed(0)}
              </span>
            </div>

            {totalDiscount > 0 && (
              <p style={{ fontSize: "10px", color: T.success, textAlign: "right", margin: "3px 0 0", fontWeight: 800 }}>
                Total saved: ₹{totalDiscount}
              </p>
            )}
          </div>

          {/* Settle Button */}
          <button
            onClick={handleSettle}
            disabled={settling || (paymentMethod === "due" && !dueCustomerName.trim())}
            style={{
              width: "100%",
              padding: "16px",
              background: settling ? T.textDim
                : paymentMethod === "due"
                  ? `linear-gradient(135deg, ${T.danger}, #a93226)`
                  : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
              color: paymentMethod === "due" ? "white" : T.gold,
              border: "none", borderRadius: "14px",
              fontWeight: 800, fontSize: "16px", cursor: settling ? "wait" : "pointer",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.02em",
              boxShadow: settling ? "none" : "0 8px 24px rgba(15,61,46,0.3)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "all 150ms ease",
            }}
          >
            <span>
              {settling ? "Processing..." : paymentMethod === "due" ? "📒 Add to Due Ledger" : "✓ Settle & Close"}
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "18px", fontVariantNumeric: "tabular-nums" }}>
              ₹{grandTotal.toFixed(0)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
