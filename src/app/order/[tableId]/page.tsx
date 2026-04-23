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
  "Hot Beverages": "linear-gradient(145deg,#2C1A0E,#4A2C1A)",
  "Cold Beverages": "linear-gradient(145deg,#0c3547,#1a6b8a)",
  "Snacks": "linear-gradient(145deg,#3d1f00,#7a3d00)",
  "Desserts": "linear-gradient(145deg,#4a0020,#8b0040)",
  "Breakfast": "linear-gradient(145deg,#2d3a00,#5a7200)",
};

const BRAND = {
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  goldDark: "#A07830",
  coffee: "#1A0E06",
  coffeeMid: "#2C1A0E",
  cream: "#FDF6E9",
  creamDark: "#F0E0C0",
  espresso: "#0D0700",
  text: "#E8D5B0",
  textMuted: "#9A7A5A",
};

// ─── Welcome Back Popup ───
function WelcomeBackPopup({ message, onClose }: {
  message: { name: string; type: "normal" | "birthday" | "anniversary" };
  onClose: () => void;
}) {
  const configs = {
    normal: {
      emoji: "👋",
      title: `Welcome back, ${message.name}!`,
      sub: "Great to see you again at Golden Beans ☕",
      bg: `linear-gradient(135deg, ${BRAND.coffee}, ${BRAND.coffeeMid})`,
      accent: BRAND.gold,
    },
    birthday: {
      emoji: "🎂",
      title: `Happy Birthday, ${message.name}! 🎉`,
      sub: "Wishing you a wonderful day! Enjoy a special treat from us 🎁",
      bg: "linear-gradient(135deg, #7c2d12, #c2410c)",
      accent: "#fbbf24",
    },
    anniversary: {
      emoji: "💑",
      title: `Happy Anniversary, ${message.name}! ❤️`,
      sub: "Celebrate this special day with us! A surprise awaits you 🌹",
      bg: "linear-gradient(135deg, #4a0020, #831843)",
      accent: "#f9a8d4",
    },
  };

  const cfg = configs[message.type];

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", top: "80px", left: "50%", transform: "translateX(-50%)",
      width: "calc(100% - 32px)", maxWidth: "440px",
      background: cfg.bg, borderRadius: "24px", padding: "20px",
      zIndex: 35, boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
      animation: "slideDown 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      border: `1px solid rgba(255,255,255,0.1)`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ fontSize: "44px", animation: message.type !== "normal" ? "bounce-dot 1s infinite" : "float 3s infinite" }}>
          {cfg.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 900, fontSize: "16px", color: cfg.accent, margin: "0 0 4px", lineHeight: 1.3, fontFamily: "'Playfair Display', serif" }}>{cfg.title}</p>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.4, fontWeight: 600 }}>{cfg.sub}</p>
        </div>
        <button onClick={onClose} style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "white", cursor: "pointer", fontSize: "14px", flexShrink: 0 }}>✕</button>
      </div>

      {/* Progress bar */}
      <div style={{ height: "3px", background: "rgba(255,255,255,0.2)", borderRadius: "99px", marginTop: "14px", overflow: "hidden" }}>
        <div style={{ height: "100%", background: cfg.accent, borderRadius: "99px", animation: "progress-bar 5s linear forwards" }} />
      </div>
    </div>
  );
}

// ─── Customer Data Popup ───
function CustomerDataPopup({ onSubmit, onSkip }: {
  onSubmit: (data: { name: string; phone: string; birthdate: string; anniversary: string }) => void;
  onSkip: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [step, setStep] = useState(1);

  const handleSubmit = () => {
    if (step === 1) {
      if (!name.trim() || phone.length < 10) return alert("Please enter valid name and 10-digit phone number");
      setStep(2);
    } else {
      onSubmit({ name, phone, birthdate, anniversary });
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,14,6,0.85)", zIndex: 80, display: "flex", alignItems: "flex-end", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", background: "white", borderRadius: "32px 32px 0 0", padding: "0 0 32px", animation: "slideUp 0.4s cubic-bezier(0.32,0.72,0,1)", boxShadow: "0 -24px 80px rgba(26,14,6,0.3)" }}>
        {/* Gold line */}
        <div style={{ height: "4px", background: `linear-gradient(90deg, ${BRAND.goldDark}, ${BRAND.gold}, ${BRAND.goldLight}, ${BRAND.gold}, ${BRAND.goldDark})`, borderRadius: "4px 4px 0 0" }} />

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "99px", background: BRAND.creamDark }} />
        </div>

        <div style={{ padding: "0 24px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>
              {step === 1 ? "👋" : "🎂"}
            </div>
            <h2 style={{ fontWeight: 900, fontSize: "22px", color: BRAND.espresso, margin: "0 0 6px", fontFamily: "'Playfair Display', serif" }}>
              {step === 1 ? "Welcome to Golden Beans!" : "One more thing... 🌟"}
            </h2>
            <p style={{ fontSize: "14px", color: "#7a6050", margin: 0, lineHeight: 1.5 }}>
              {step === 1
                ? "Help us personalize your experience. Takes just 10 seconds!"
                : "Share your special dates for exclusive birthday & anniversary surprises! 🎁"}
            </p>
          </div>

          {step === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: BRAND.textMuted, marginBottom: "6px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Your Name *</label>
                <input
                  type="text" placeholder="e.g. Nirav Dobariya"
                  value={name} onChange={e => setName(e.target.value)}
                  autoFocus
                  style={{ width: "100%", padding: "14px 16px", borderRadius: "14px", border: `2px solid ${name ? BRAND.gold : BRAND.creamDark}`, background: BRAND.cream, color: BRAND.espresso, fontSize: "16px", fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: BRAND.textMuted, marginBottom: "6px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Mobile Number *</label>
                <input
                  type="tel" placeholder="10-digit mobile number"
                  value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  style={{ width: "100%", padding: "14px 16px", borderRadius: "14px", border: `2px solid ${phone.length === 10 ? BRAND.gold : BRAND.creamDark}`, background: BRAND.cream, color: BRAND.espresso, fontSize: "16px", fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s" }}
                />
                {phone.length > 0 && phone.length < 10 && (
                  <p style={{ fontSize: "11px", color: "#dc2626", margin: "4px 0 0", fontWeight: 700 }}>Enter 10-digit number</p>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: BRAND.textMuted, marginBottom: "6px", letterSpacing: "0.5px", textTransform: "uppercase" }}>🎂 Birthday (Optional)</label>
                <input
                  type="date"
                  value={birthdate} onChange={e => setBirthdate(e.target.value)}
                  style={{ width: "100%", padding: "14px 16px", borderRadius: "14px", border: `2px solid ${birthdate ? BRAND.gold : BRAND.creamDark}`, background: BRAND.cream, color: BRAND.espresso, fontSize: "14px", fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: BRAND.textMuted, marginBottom: "6px", letterSpacing: "0.5px", textTransform: "uppercase" }}>💑 Anniversary (Optional)</label>
                <input
                  type="date"
                  value={anniversary} onChange={e => setAnniversary(e.target.value)}
                  style={{ width: "100%", padding: "14px 16px", borderRadius: "14px", border: `2px solid ${anniversary ? BRAND.gold : BRAND.creamDark}`, background: BRAND.cream, color: BRAND.espresso, fontSize: "14px", fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
              <div style={{ background: `linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.05))`, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: "14px", padding: "12px 14px" }}>
                <p style={{ fontSize: "12px", color: BRAND.goldDark, margin: 0, fontWeight: 700, lineHeight: 1.5 }}>
                  🎁 We'll send you a special offer on your birthday & anniversary! Your data is safe with us.
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button onClick={onSkip} style={{
              flex: 1, padding: "15px", borderRadius: "14px",
              border: `1px solid ${BRAND.creamDark}`, background: "white",
              color: "#9ca3af", fontWeight: 700, cursor: "pointer",
              fontSize: "14px", fontFamily: "inherit",
            }}>
              {step === 2 ? "Skip" : "Skip for now"}
            </button>
            <button onClick={handleSubmit} style={{
              flex: 2, padding: "15px", borderRadius: "14px", border: "none",
              background: `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})`,
              color: BRAND.coffee, fontWeight: 900, cursor: "pointer",
              fontSize: "15px", fontFamily: "inherit",
              boxShadow: `0 8px 24px rgba(201,168,76,0.4)`,
            }}>
              {step === 1 ? "Continue →" : "Place Order ☕"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2-Minute Cancellation Window ───
function CancellationWindow({ order, onCancel, onDismiss }: {
  order: Order;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) { onDismiss(); return; }
    const timer = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, onDismiss]);

  const pct = (secondsLeft / 120) * 100;
  const isUrgent = secondsLeft <= 30;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  if (cancelled) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(26,14,6,0.85)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", backdropFilter: "blur(8px)" }}>
        <div style={{ background: "white", borderRadius: "28px", padding: "32px 24px", textAlign: "center", maxWidth: "320px", width: "100%" }}>
          <div style={{ fontSize: "56px", marginBottom: "12px" }}>✅</div>
          <h2 style={{ fontWeight: 900, fontSize: "20px", color: BRAND.espresso, margin: "0 0 8px" }}>Order Cancelled</h2>
          <p style={{ color: "#7a6050", fontSize: "14px", margin: "0 0 20px" }}>Your order has been cancelled successfully.</p>
          <button onClick={onDismiss} style={{ width: "100%", padding: "14px", borderRadius: "14px", border: "none", background: BRAND.coffeeMid, color: "white", fontWeight: 800, cursor: "pointer", fontSize: "14px", fontFamily: "inherit" }}>Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,14,6,0.85)", zIndex: 80, display: "flex", alignItems: "flex-end", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", background: "white", borderRadius: "32px 32px 0 0", padding: "0 0 32px", animation: "slideUp 0.4s cubic-bezier(0.32,0.72,0,1)" }}>
        {/* Progress bar */}
        <div style={{ height: "5px", background: BRAND.creamDark, borderRadius: "5px 5px 0 0" }}>
          <div style={{
            height: "100%", borderRadius: "5px 5px 0 0",
            background: isUrgent ? "linear-gradient(90deg,#dc2626,#ef4444)" : `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold})`,
            width: `${pct}%`, transition: "width 1s linear, background 0.5s ease",
          }} />
        </div>

        <div style={{ padding: "20px 24px 0" }}>
          {/* Timer display */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "90px", height: "90px", borderRadius: "50%",
              background: isUrgent ? "rgba(220,38,38,0.1)" : `rgba(201,168,76,0.1)`,
              border: `3px solid ${isUrgent ? "#dc2626" : BRAND.gold}`,
              fontSize: "28px", fontWeight: 900,
              color: isUrgent ? "#dc2626" : BRAND.goldDark,
              animation: isUrgent ? "pulse-ring 1s infinite" : "none",
              marginBottom: "12px",
              fontVariantNumeric: "tabular-nums",
            }}>
              {mins}:{String(secs).padStart(2, "0")}
            </div>

            <h2 style={{ fontWeight: 900, fontSize: "20px", color: BRAND.espresso, margin: "0 0 6px", fontFamily: "'Playfair Display', serif" }}>
              Order Placed! #{order.orderNumber}
            </h2>

            {isUrgent ? (
              <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "12px", padding: "10px 14px", margin: "8px 0" }}>
                <p style={{ fontSize: "13px", color: "#dc2626", margin: 0, fontWeight: 800, lineHeight: 1.4 }}>
                  ⚠️ Cancellation window closing in {secondsLeft} seconds! After this, your order cannot be cancelled.
                </p>
              </div>
            ) : (
              <p style={{ fontSize: "14px", color: "#7a6050", margin: 0, lineHeight: 1.5 }}>
                You can cancel your order within the next {mins} minute{mins !== 1 ? "s" : ""}. After that, it will be prepared.
              </p>
            )}
          </div>

          {/* Order summary */}
          <div style={{ background: BRAND.cream, borderRadius: "16px", padding: "14px", marginBottom: "20px", border: `1px solid ${BRAND.creamDark}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: BRAND.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Your Order</span>
              <span style={{ fontSize: "12px", color: BRAND.goldDark, fontWeight: 800 }}>#{order.orderNumber}</span>
            </div>
            {order.items.slice(0, 3).map(item => (
              <div key={item._id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "3px 0" }}>
                <span style={{ color: BRAND.coffeeMid, fontWeight: 600 }}>{item.name} ×{item.quantity}</span>
                <span style={{ fontWeight: 800, color: BRAND.espresso }}>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            {order.items.length > 3 && (
              <p style={{ fontSize: "12px", color: "#9ca3af", margin: "4px 0 0" }}>+{order.items.length - 3} more items</p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "15px", paddingTop: "10px", borderTop: `1px solid ${BRAND.creamDark}`, marginTop: "6px" }}>
              <span>Total</span>
              <span style={{ color: BRAND.goldDark }}>₹{order.totalAmount.toFixed(0)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={async () => {
                try {
                  await orderApi.cancelOrder(order._id);
                  setCancelled(true);
                } catch {
                  alert("Failed to cancel. Please contact staff.");
                }
              }}
              style={{
                flex: 1, padding: "15px", borderRadius: "14px",
                border: "2px solid #dc2626", background: "rgba(220,38,38,0.06)",
                color: "#dc2626", fontWeight: 800, cursor: "pointer",
                fontSize: "14px", fontFamily: "inherit",
                animation: isUrgent ? "pulse-ring 1.5s infinite" : "none",
              }}>
              ✕ Cancel Order
            </button>
            <button onClick={onDismiss} style={{
              flex: 2, padding: "15px", borderRadius: "14px", border: "none",
              background: `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})`,
              color: BRAND.coffee, fontWeight: 900, cursor: "pointer",
              fontSize: "14px", fontFamily: "inherit",
              boxShadow: `0 8px 24px rgba(201,168,76,0.4)`,
            }}>
              ✓ Keep My Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ───
function SkeletonCard() {
  return (
    <div style={{ display: "flex", gap: "0", background: "white", borderRadius: "24px", overflow: "hidden", marginBottom: "14px", boxShadow: "0 4px 20px rgba(44,26,14,0.08)", border: `1px solid ${BRAND.creamDark}` }}>
      <div style={{ width: "115px", height: "115px", flexShrink: 0, background: `linear-gradient(90deg,${BRAND.creamDark} 25%,${BRAND.cream} 50%,${BRAND.creamDark} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      <div style={{ flex: 1, padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ height: "16px", width: "65%", borderRadius: "8px", background: `linear-gradient(90deg,${BRAND.creamDark} 25%,${BRAND.cream} 50%,${BRAND.creamDark} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
        <div style={{ height: "12px", width: "85%", borderRadius: "8px", background: `linear-gradient(90deg,${BRAND.creamDark} 25%,${BRAND.cream} 50%,${BRAND.creamDark} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
        <div style={{ height: "32px", width: "80px", borderRadius: "10px", background: `linear-gradient(90deg,${BRAND.creamDark} 25%,${BRAND.cream} 50%,${BRAND.creamDark} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", marginTop: "auto" }} />
      </div>
    </div>
  );
}

// ─── Menu Item Card (Pure Veg — no veg/nonveg indicator) ───
function MenuItemCard({ item, cartQty, onAdd, onRemove }: {
  item: MenuItem; cartQty: number;
  onAdd: (item: MenuItem) => void;
  onRemove: (id: string) => void;
}) {
  const catName = typeof item.category === "object" ? item.category.name : "";
  const bg = CATEGORY_BG[catName] || `linear-gradient(145deg,${BRAND.coffeeMid},${BRAND.coffee})`;
  const emoji = ITEM_EMOJIS[item.name] || "🍽️";

  return (
    <div style={{
      display: "flex", background: "white", borderRadius: "24px", overflow: "hidden",
      marginBottom: "14px", boxShadow: "0 4px 20px rgba(44,26,14,0.08), 0 1px 4px rgba(44,26,14,0.04)",
      opacity: item.isAvailable ? 1 : 0.55,
      border: `1px solid ${BRAND.creamDark}`,
      transition: "transform 0.15s ease",
    }}>
      {/* Image */}
      <div style={{ width: "115px", minHeight: "115px", flexShrink: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ fontSize: "48px", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))", animation: "float 3s ease-in-out infinite" }}>{emoji}</div>

        {/* Bestseller Badge */}
        {item.tags.includes("bestseller") && (
          <div style={{ position: "absolute", top: "8px", right: "0", background: `linear-gradient(135deg,${BRAND.gold},${BRAND.goldLight})`, padding: "3px 8px 3px 6px", borderRadius: "0 0 0 8px" }}>
            <span style={{ fontSize: "9px", color: BRAND.coffee, fontWeight: 900, letterSpacing: "0.5px" }}>★ BEST</span>
          </div>
        )}

        {/* Pure Veg badge */}
        <div style={{ position: "absolute", bottom: "6px", left: "6px", background: "rgba(22,163,74,0.9)", borderRadius: "6px", padding: "2px 6px" }}>
          <span style={{ fontSize: "9px", color: "white", fontWeight: 800 }}>🌿 VEG</span>
        </div>

        {!item.isAvailable && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: "11px", fontWeight: 800, background: "rgba(0,0,0,0.4)", padding: "4px 10px", borderRadius: "8px" }}>Unavailable</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "14px 12px 12px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: "14px", color: BRAND.espresso, margin: "0 0 5px", lineHeight: 1.3 }}>{item.name}</p>
          <p style={{ fontSize: "12px", color: "#7a6050", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>
          {item.preparationTime > 0 && (
            <p style={{ fontSize: "11px", color: BRAND.goldDark, margin: "5px 0 0", fontWeight: 700 }}>⏱ {item.preparationTime} min</p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
          <span style={{ fontWeight: 900, fontSize: "17px", color: BRAND.espresso }}>₹{item.price}</span>

          {item.isAvailable && (
            cartQty === 0 ? (
              <button onClick={() => onAdd(item)} style={{
                background: "white", color: BRAND.goldDark,
                border: `2px solid ${BRAND.gold}`, borderRadius: "12px",
                padding: "7px 20px", fontWeight: 900, fontSize: "13px",
                cursor: "pointer", letterSpacing: "0.8px",
                boxShadow: `0 4px 12px rgba(201,168,76,0.25)`,
                fontFamily: "inherit",
              }}>ADD +</button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", background: `linear-gradient(135deg,${BRAND.gold},${BRAND.goldLight})`, borderRadius: "12px", overflow: "hidden", boxShadow: `0 4px 12px rgba(201,168,76,0.4)` }}>
                <button onClick={() => onRemove(item._id)} style={{ width: "34px", height: "34px", background: "none", border: "none", color: BRAND.coffee, fontWeight: 900, fontSize: "20px", cursor: "pointer" }}>−</button>
                <span style={{ fontWeight: 900, color: BRAND.coffee, fontSize: "15px", minWidth: "22px", textAlign: "center" }}>{cartQty}</span>
                <button onClick={() => onAdd(item)} style={{ width: "34px", height: "34px", background: "none", border: "none", color: BRAND.coffee, fontWeight: 900, fontSize: "20px", cursor: "pointer" }}>+</button>
              </div>
            )
          )}
        </div>
      </div>
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
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(26,14,6,0.7)", zIndex: 40, opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none", transition: "opacity 0.35s", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", zIndex: 50, borderRadius: "32px 32px 0 0", maxHeight: "90vh", display: "flex", flexDirection: "column", transform: isOpen ? "translateY(0)" : "translateY(100%)", transition: "transform 0.4s cubic-bezier(0.32,0.72,0,1)", boxShadow: "0 -24px 80px rgba(26,14,6,0.25)" }}>
        {/* Gold line */}
        <div style={{ height: "4px", background: `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold},${BRAND.goldLight},${BRAND.gold},${BRAND.goldDark})`, borderRadius: "4px 4px 0 0" }} />

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "99px", background: BRAND.creamDark }} />
        </div>

        {/* Header */}
        <div style={{ padding: "8px 20px 16px", borderBottom: `1px solid ${BRAND.creamDark}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ fontWeight: 900, fontSize: "22px", color: BRAND.espresso, margin: 0 }}>Your Order</h2>
                <span style={{ background: `linear-gradient(135deg,${BRAND.gold},${BRAND.goldLight})`, color: BRAND.coffee, fontSize: "12px", padding: "3px 10px", borderRadius: "99px", fontWeight: 900 }}>{totalItems} items</span>
              </div>
              {existingOrder && <p style={{ fontSize: "12px", color: BRAND.goldDark, margin: "4px 0 0", fontWeight: 700 }}>Adding to #{existingOrder.orderNumber}</p>}
            </div>
            <button onClick={onClose} style={{ width: "36px", height: "36px", borderRadius: "50%", background: BRAND.cream, border: `1px solid ${BRAND.creamDark}`, cursor: "pointer", fontSize: "16px", color: BRAND.textMuted }}>✕</button>
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: "56px", marginBottom: "12px" }}>🛒</div>
              <p style={{ fontWeight: 800, fontSize: "16px", color: BRAND.espresso }}>Cart is empty</p>
              <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>Add delicious items to get started</p>
            </div>
          ) : cart.map(item => (
            <div key={item.menuItemId} style={{ background: BRAND.cream, borderRadius: "18px", padding: "13px 14px", marginBottom: "10px", border: `1px solid ${BRAND.creamDark}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontWeight: 800, fontSize: "14px", color: BRAND.espresso }}>{item.name}</span>
                <span style={{ fontWeight: 900, fontSize: "14px", color: BRAND.espresso }}>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", background: `linear-gradient(135deg,${BRAND.gold},${BRAND.goldLight})`, borderRadius: "12px", overflow: "hidden" }}>
                  <button onClick={() => onUpdateQty(item.menuItemId, -1)} style={{ width: "34px", height: "34px", background: "none", border: "none", color: BRAND.coffee, fontWeight: 900, fontSize: "20px", cursor: "pointer" }}>−</button>
                  <span style={{ fontWeight: 900, color: BRAND.coffee, fontSize: "15px", minWidth: "24px", textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => onUpdateQty(item.menuItemId, 1)} style={{ width: "34px", height: "34px", background: "none", border: "none", color: BRAND.coffee, fontWeight: 900, fontSize: "20px", cursor: "pointer" }}>+</button>
                </div>
                <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 600 }}>₹{item.price} each</span>
              </div>
              <input type="text" placeholder="Add a note (e.g. less sugar)..."
                value={item.notes} onChange={e => onUpdateNote(item.menuItemId, e.target.value)}
                style={{ width: "100%", marginTop: "10px", fontSize: "12px", padding: "8px 12px", borderRadius: "10px", border: `1px solid ${BRAND.creamDark}`, background: "white", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>
          ))}
        </div>

        {/* Bill + CTA */}
        {cart.length > 0 && (
          <div style={{ padding: "0 16px 28px", borderTop: `1px solid ${BRAND.creamDark}` }}>
            <div style={{ background: BRAND.cream, borderRadius: "18px", padding: "14px 16px", margin: "14px 0 12px", border: `1px solid ${BRAND.creamDark}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#7a6050", marginBottom: "6px" }}>
                <span>Item Total</span><span>₹{subtotal.toFixed(0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#7a6050", paddingBottom: "10px", borderBottom: `1px dashed ${BRAND.creamDark}`, marginBottom: "10px" }}>
                <span>GST (5%)</span><span>₹{tax.toFixed(0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "17px", color: BRAND.espresso }}>
                <span>Total</span>
                <span style={{ color: BRAND.goldDark }}>₹{total.toFixed(0)}</span>
              </div>
            </div>
            <button onClick={onPlaceOrder} disabled={isPlacing} style={{
              width: "100%",
              background: isPlacing ? "#d1d5db" : `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold},${BRAND.goldLight})`,
              color: isPlacing ? "#9ca3af" : BRAND.coffee,
              border: "none", borderRadius: "18px", padding: "18px",
              fontWeight: 900, fontSize: "16px", cursor: isPlacing ? "not-allowed" : "pointer",
              boxShadow: isPlacing ? "none" : `0 8px 28px rgba(201,168,76,0.5)`,
              fontFamily: "inherit",
            }}>
              {isPlacing ? "☕ Placing order..." : `☕ Place Order • ₹${total.toFixed(0)}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Order Status Banner ───
function OrderStatusBanner({ order }: { order: Order }) {
  const cfgs: Record<string, { label: string; sub: string; icon: string; pulse: boolean }> = {
    open: { label: "Order Received!", sub: "Our team has your order", icon: "📋", pulse: false },
    kotSent: { label: "Being Crafted", sub: "Chef is preparing your order", icon: "👨‍🍳", pulse: true },
    partially_ready: { label: "Almost Ready!", sub: "Some items are ready", icon: "🔔", pulse: true },
    ready: { label: "Ready to Serve!", sub: "Waiter will be with you shortly", icon: "✅", pulse: false },
    settled: { label: "Thank You! 🙏", sub: "Hope you enjoyed your visit", icon: "⭐", pulse: false },
    cancelled: { label: "Order Cancelled", sub: "Please contact our staff", icon: "❌", pulse: false },
  };
  const cfg = cfgs[order.status] || cfgs.open;

  return (
    <div style={{ margin: "14px 16px 4px", padding: "14px 16px", borderRadius: "20px", background: `linear-gradient(135deg,${BRAND.coffeeMid},${BRAND.coffee})`, display: "flex", alignItems: "center", gap: "14px", boxShadow: `0 8px 24px rgba(44,26,14,0.25)`, border: `1px solid rgba(201,168,76,0.2)` }}>
      <div style={{ fontSize: "32px" }}>{cfg.icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 900, fontSize: "15px", color: BRAND.gold, margin: 0 }}>{cfg.label}</p>
        <p style={{ fontSize: "12px", color: "rgba(201,168,76,0.7)", margin: "3px 0 0", fontWeight: 600 }}>{cfg.sub} • #{order.orderNumber}</p>
      </div>
      {cfg.pulse && (
        <div style={{ display: "flex", gap: "4px" }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: BRAND.gold, animation: `bounce-dot 1.2s ${i * 0.2}s infinite` }} />)}
        </div>
      )}
    </div>
  );
}

// ─── Success Screen ───
function SuccessScreen({ order, onContinue }: { order: Order; onContinue: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: BRAND.cream, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", animation: "fadeIn 0.4s ease" }}>
      <div style={{ position: "relative", marginBottom: "24px" }}>
        <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "56px", boxShadow: `0 20px 60px rgba(201,168,76,0.5)`, animation: "scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>☕</div>
        <div style={{ position: "absolute", inset: "-8px", borderRadius: "50%", border: `2px solid ${BRAND.gold}`, opacity: 0.4, animation: "ping 1.5s ease-out infinite" }} />
      </div>

      <h1 style={{ fontWeight: 900, fontSize: "28px", color: BRAND.espresso, marginBottom: "6px", textAlign: "center", fontFamily: "'Playfair Display', serif" }}>Order Confirmed!</h1>
      <p style={{ color: "#7a6050", textAlign: "center", marginBottom: "24px", fontSize: "15px", fontWeight: 600 }}>Your order is brewing in the kitchen ☕</p>

      <div style={{ background: `linear-gradient(135deg,${BRAND.coffee},${BRAND.coffeeMid})`, borderRadius: "24px", padding: "18px 40px", marginBottom: "24px", textAlign: "center", boxShadow: `0 12px 36px rgba(44,26,14,0.3)` }}>
        <p style={{ color: "rgba(201,168,76,0.7)", fontSize: "11px", margin: "0 0 4px", fontWeight: 700, letterSpacing: "2px" }}>ORDER NUMBER</p>
        <p style={{ fontWeight: 900, fontSize: "26px", color: BRAND.gold, margin: 0, letterSpacing: "2px" }}>{order.orderNumber}</p>
      </div>

      <div style={{ width: "100%", maxWidth: "340px", background: "white", borderRadius: "20px", padding: "16px", marginBottom: "20px", boxShadow: "0 4px 20px rgba(44,26,14,0.08)", border: `1px solid ${BRAND.creamDark}` }}>
        {order.items.map(item => (
          <div key={item._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BRAND.creamDark}`, fontSize: "14px" }}>
            <span style={{ color: BRAND.coffeeMid, fontWeight: 600 }}>{item.name} <span style={{ color: "#9ca3af" }}>×{item.quantity}</span></span>
            <span style={{ fontWeight: 800, color: BRAND.espresso }}>₹{(item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "16px", paddingTop: "10px" }}>
          <span style={{ color: BRAND.espresso }}>Total</span>
          <span style={{ color: BRAND.goldDark }}>₹{order.totalAmount.toFixed(0)}</span>
        </div>
      </div>

      <button onClick={onContinue} style={{ width: "100%", maxWidth: "340px", background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`, color: BRAND.coffee, border: "none", borderRadius: "18px", padding: "18px", fontWeight: 900, fontSize: "16px", cursor: "pointer", boxShadow: `0 10px 30px rgba(201,168,76,0.4)`, fontFamily: "inherit" }}>
        ← Browse More Items
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
  const [activeTab, setActiveTab] = useState<"menu" | "order" | "info">("menu");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // New states
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [showCancellationWindow, setShowCancellationWindow] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [customerData, setCustomerData] = useState<{ name: string; phone: string } | null>(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState<{ name: string; type: "normal" | "birthday" | "anniversary" } | null>(null);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ── Device Recognition ──
  useEffect(() => {
    const saved = localStorage.getItem("gb_customer");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCustomerData({ name: data.name, phone: data.phone });

        // Check birthday
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const todayMMDD = `${mm}-${dd}`;

        let msgType: "normal" | "birthday" | "anniversary" = "normal";

        if (data.birthdate) {
          const bdMMDD = data.birthdate.slice(5); // YYYY-MM-DD → MM-DD
          if (bdMMDD === todayMMDD) msgType = "birthday";
        }

        if (data.anniversary && msgType === "normal") {
          const annMMDD = data.anniversary.slice(5);
          if (annMMDD === todayMMDD) msgType = "anniversary";
        }

        setWelcomeMessage({ name: data.name, type: msgType });
        setShowWelcomeBack(true);
        setTimeout(() => setShowWelcomeBack(false), 5000);
      } catch {}
    }
  }, []);

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
        setError(err instanceof Error ? err.message : "Failed to load menu");
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
      } catch { }
    }, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [existingOrder, tableId]);

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === item._id);
      if (ex) return prev.map(c => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, notes: "", isVeg: true }];
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

  // ── Handle Place Order — show customer popup first ──
  const handlePlaceOrderClick = () => {
    setIsCartOpen(false);
    if (!customerData) {
      setShowCustomerPopup(true);
    } else {
      placeOrder(customerData);
    }
  };

  // ── Customer data submitted ──
  const handleCustomerDataSubmit = (data: { name: string; phone: string; birthdate: string; anniversary: string }) => {
    setCustomerData({ name: data.name, phone: data.phone });
    // Save to localStorage for future visits
    localStorage.setItem("gb_customer", JSON.stringify(data));
    setShowCustomerPopup(false);
    placeOrder(data);
  };

  // ── Place order ──
  const placeOrder = async (customer?: { name: string; phone: string; birthdate?: string; anniversary?: string }) => {
    if (cart.length === 0) return;
    setIsPlacing(true);
    try {
      const res = await orderApi.createOrder({
        tableId,
        items: cart,
        createdBy: "customer",
        customerName: customer?.name || "",
        customerPhone: customer?.phone || "",
      });
      const newOrder: Order = res.data.data;
      setCart([]);
      setExistingOrder(newOrder);

      // Show cancellation window
      setPendingOrder(newOrder);
      setShowCancellationWindow(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsPlacing(false);
    }
  };

  const handleCancellationDismiss = () => {
    setShowCancellationWindow(false);
    if (pendingOrder) {
      setSuccessOrder(pendingOrder);
      setPendingOrder(null);
    }
  };

  const handleCancelOrder = () => {
    setExistingOrder(null);
    setPendingOrder(null);
  };

  const totalCartItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalCartValue = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const filteredMenu = searchQuery
    ? menu.map(cat => ({ ...cat, items: cat.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase())) })).filter(cat => cat.items.length > 0)
    : menu;

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: BRAND.cream }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>☕</div>
          <h2 style={{ fontWeight: 900, color: BRAND.espresso, margin: "0 0 8px" }}>Something went wrong</h2>
          <p style={{ color: "#7a6050", marginBottom: "20px" }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`, color: BRAND.coffee, border: "none", borderRadius: "14px", padding: "14px 28px", fontWeight: 800, cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BRAND.cream, display: "flex", flexDirection: "column", maxWidth: "480px", margin: "0 auto", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; font-family: 'Nunito', sans-serif; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scale-in { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes bounce-dot { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes ping { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(1.4);opacity:0} }
        @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{box-shadow:0 0 0 8px rgba(220,38,38,0)} }
        @keyframes gold-shine { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes slideDown { from{transform:translateX(-50%) translateY(-20px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
        @keyframes progress-bar { from{width:100%} to{width:0%} }
        ::-webkit-scrollbar { display:none; }
        button { font-family:'Nunito',sans-serif; }
        input { font-family:'Nunito',sans-serif; }
      `}</style>

      {/* Overlays */}
      {showWelcomeBack && welcomeMessage && (
        <WelcomeBackPopup
          message={welcomeMessage}
          onClose={() => setShowWelcomeBack(false)}
        />
      )}

      {showCustomerPopup && (
        <CustomerDataPopup
          onSubmit={handleCustomerDataSubmit}
          onSkip={() => { setShowCustomerPopup(false); placeOrder(); }}
        />
      )}

      {showCancellationWindow && pendingOrder && (
        <CancellationWindow
          order={pendingOrder}
          onCancel={handleCancelOrder}
          onDismiss={handleCancellationDismiss}
        />
      )}

      {successOrder && <SuccessScreen order={successOrder} onContinue={() => setSuccessOrder(null)} />}

      {/* ── HEADER ── */}
      <header style={{ background: `linear-gradient(180deg,${BRAND.coffee} 0%,${BRAND.coffeeMid} 100%)`, position: "sticky", top: 0, zIndex: 30, boxShadow: `0 4px 24px rgba(44,26,14,0.4)` }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold},${BRAND.goldLight},${BRAND.gold},${BRAND.goldDark})`, backgroundSize: "200% 100%", animation: "gold-shine 3s linear infinite" }} />

        <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", boxShadow: `0 4px 12px rgba(201,168,76,0.4)`, flexShrink: 0 }}>☕</div>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: "20px", color: BRAND.gold, margin: 0, fontFamily: "'Playfair Display', serif" }}>Golden Beans</h1>
              <p style={{ fontSize: "11px", color: "rgba(201,168,76,0.6)", margin: 0, fontWeight: 700, letterSpacing: "0.5px" }}>{table ? `TABLE ${table.tableNumber}` : "LOADING..."}</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(201,168,76,0.15)", border: `1px solid rgba(201,168,76,0.3)`, borderRadius: "99px", padding: "4px 10px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: "11px", color: BRAND.gold, fontWeight: 700 }}>🌿 Pure Veg</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: searchFocused ? "white" : "rgba(255,255,255,0.1)", border: `1.5px solid ${searchFocused ? BRAND.gold : "rgba(201,168,76,0.3)"}`, borderRadius: "16px", padding: "11px 14px", transition: "all 0.25s ease" }}>
            <span style={{ fontSize: "16px", flexShrink: 0 }}>🔍</span>
            <input type="text" placeholder="Search dishes, beverages..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              style={{ flex: 1, background: "none", border: "none", fontSize: "14px", color: searchFocused ? BRAND.espresso : "rgba(255,255,255,0.8)", fontWeight: 600, outline: "none" }}
            />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "11px", color: "white" }}>✕</button>}
          </div>
        </div>

        {/* Category pills */}
        {!searchQuery && menu.length > 0 && (
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "0 16px 14px", scrollbarWidth: "none" }}>
            {menu.map((cat, idx) => (
              <button key={cat._id} onClick={() => {
                setActiveCategory(cat._id);
                categoryRefs.current[cat._id]?.scrollIntoView({ behavior: "smooth", block: "start" });
              }} style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: "7px",
                padding: "8px 16px", borderRadius: "99px", fontSize: "13px", fontWeight: 800,
                border: `1.5px solid ${activeCategory === cat._id ? BRAND.gold : "rgba(201,168,76,0.3)"}`,
                cursor: "pointer", transition: "all 0.25s ease",
                background: activeCategory === cat._id ? `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})` : "rgba(255,255,255,0.08)",
                color: activeCategory === cat._id ? BRAND.coffee : BRAND.gold,
                boxShadow: activeCategory === cat._id ? `0 4px 16px rgba(201,168,76,0.4)` : "none",
                animation: `slideUp 0.3s ${idx * 0.06}s ease both`,
              }}>
                <span style={{ fontSize: "15px" }}>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, overflowY: "auto", paddingBottom: "90px" }}>
        {existingOrder && !["settled", "cancelled"].includes(existingOrder.status) && (
          <OrderStatusBanner order={existingOrder} />
        )}

        {/* MENU TAB */}
        {activeTab === "menu" && (
          <div style={{ padding: "12px 0" }}>
            {loading ? (
              <div style={{ padding: "16px" }}>{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>
            ) : filteredMenu.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 24px" }}>
                <div style={{ fontSize: "56px", marginBottom: "12px" }}>☕</div>
                <p style={{ fontWeight: 800, color: BRAND.espresso, fontSize: "16px" }}>Nothing found</p>
              </div>
            ) : filteredMenu.map((cat, catIdx) => (
              <div key={cat._id} ref={el => { categoryRefs.current[cat._id] = el; }} style={{ marginBottom: "8px", animation: `slideUp 0.4s ${catIdx * 0.08}s ease both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "18px 16px 12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "14px", background: CATEGORY_BG[cat.name] || `linear-gradient(145deg,${BRAND.coffee},${BRAND.coffeeMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", flexShrink: 0 }}>
                    {cat.icon}
                  </div>
                  <div>
                    <h2 style={{ fontWeight: 900, fontSize: "17px", color: BRAND.espresso, margin: 0, fontFamily: "'Playfair Display', serif" }}>{cat.name}</h2>
                    <p style={{ fontSize: "12px", color: BRAND.goldDark, margin: 0, fontWeight: 700 }}>{cat.items.length} items • 100% Vegetarian</p>
                  </div>
                </div>
                <div style={{ padding: "0 16px" }}>
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
          <div style={{ padding: "16px" }}>
            {!existingOrder ? (
              <div style={{ textAlign: "center", padding: "64px 24px" }}>
                <div style={{ fontSize: "64px", marginBottom: "16px" }}>☕</div>
                <p style={{ fontWeight: 900, fontSize: "20px", color: BRAND.espresso, fontFamily: "'Playfair Display', serif" }}>No Active Order</p>
                <p style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "24px" }}>Browse our menu and add items</p>
                <button onClick={() => setActiveTab("menu")} style={{ background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`, color: BRAND.coffee, border: "none", borderRadius: "16px", padding: "16px 32px", fontWeight: 900, cursor: "pointer", fontSize: "15px", boxShadow: `0 8px 24px rgba(201,168,76,0.35)`, fontFamily: "inherit" }}>Browse Menu</button>
              </div>
            ) : (
              <div style={{ background: "white", borderRadius: "24px", overflow: "hidden", boxShadow: "0 4px 24px rgba(44,26,14,0.1)", border: `1px solid ${BRAND.creamDark}` }}>
                <div style={{ background: `linear-gradient(135deg,${BRAND.coffee},${BRAND.coffeeMid})`, padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ color: "rgba(201,168,76,0.7)", fontSize: "11px", margin: "0 0 2px", fontWeight: 700, letterSpacing: "1.5px" }}>ORDER</p>
                      <p style={{ color: BRAND.gold, fontWeight: 900, fontSize: "22px", margin: 0, fontFamily: "'Playfair Display', serif" }}>#{existingOrder.orderNumber}</p>
                    </div>
                    <span style={{ background: "rgba(201,168,76,0.2)", color: BRAND.gold, fontSize: "12px", padding: "6px 14px", borderRadius: "99px", fontWeight: 800, border: `1px solid rgba(201,168,76,0.3)` }}>
                      {existingOrder.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
                <div style={{ padding: "16px" }}>
                  {existingOrder.items.map(item => (
                    <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BRAND.cream}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0, background: item.status === "ready" ? "#16a34a" : item.status === "preparing" ? BRAND.gold : BRAND.creamDark }} />
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 800, color: BRAND.espresso, margin: 0 }}>{item.name}</p>
                          <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0", fontWeight: 600, textTransform: "capitalize" }}>{item.status} • ×{item.quantity}</p>
                        </div>
                      </div>
                      <span style={{ fontWeight: 900, color: BRAND.espresso }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "17px", paddingTop: "14px" }}>
                    <span style={{ color: BRAND.espresso }}>Total</span>
                    <span style={{ color: BRAND.goldDark }}>₹{existingOrder.totalAmount.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INFO TAB */}
        {activeTab === "info" && (
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: `linear-gradient(145deg,${BRAND.coffee},${BRAND.coffeeMid})`, borderRadius: "28px", padding: "32px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 30% 70%,rgba(201,168,76,0.15) 0%,transparent 60%)` }} />
              <div style={{ fontSize: "56px", marginBottom: "14px" }}>☕</div>
              <h2 style={{ fontWeight: 800, fontSize: "26px", color: BRAND.gold, margin: "0 0 6px", fontFamily: "'Playfair Display', serif" }}>Golden Beans</h2>
              <p style={{ color: "rgba(201,168,76,0.7)", fontSize: "14px", margin: "0 0 8px", fontWeight: 600 }}>Cafe & Bistro</p>
              <span style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80", fontSize: "12px", padding: "4px 12px", borderRadius: "99px", fontWeight: 800, border: "1px solid rgba(74,222,128,0.3)" }}>🌿 100% Pure Vegetarian</span>
            </div>

            {[
              { icon: "📍", label: "ADDRESS", value: "123, MG Road, Surat, Gujarat" },
              { icon: "📞", label: "PHONE", value: "+91 98765 43210" },
              { icon: "🕐", label: "HOURS", value: "7:00 AM – 11:00 PM, All Days" },
              { icon: "📶", label: "WI-FI", value: "GoldenBeans_Guest (Free)" },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ background: "white", borderRadius: "18px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 2px 12px rgba(44,26,14,0.06)", border: `1px solid ${BRAND.creamDark}` }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: BRAND.cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{icon}</div>
                <div>
                  <p style={{ fontSize: "10px", color: BRAND.goldDark, margin: "0 0 3px", fontWeight: 800, letterSpacing: "1px" }}>{label}</p>
                  <p style={{ fontSize: "14px", color: BRAND.espresso, margin: 0, fontWeight: 700 }}>{value}</p>
                </div>
              </div>
            ))}

            <div style={{ background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`, borderRadius: "18px", padding: "16px 18px" }}>
              <p style={{ fontWeight: 900, color: BRAND.coffee, fontSize: "14px", margin: "0 0 8px" }}>📋 Our Promise</p>
              {["100% Pure Vegetarian menu", "Fresh ingredients, brewed with love", "GST @ 5% included in all prices", "Payment at the counter"].map(p => (
                <p key={p} style={{ fontSize: "13px", color: BRAND.coffeeMid, margin: "4px 0", fontWeight: 700 }}>✓ {p}</p>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", background: "white", borderTop: `2px solid ${BRAND.creamDark}`, zIndex: 30, display: "flex", boxShadow: `0 -8px 32px rgba(44,26,14,0.12)` }}>
        {[
          { id: "menu", label: "Menu", icon: "🍽️" },
          { id: "order", label: "My Order", icon: "📋" },
          { id: "info", label: "About", icon: "☕" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            padding: "12px 0 10px", background: "none", border: "none", cursor: "pointer",
            color: activeTab === tab.id ? BRAND.goldDark : "#9ca3af",
            position: "relative", transition: "color 0.2s ease",
          }}>
            {activeTab === tab.id && (
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "32px", height: "3px", background: `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold})`, borderRadius: "0 0 4px 4px" }} />
            )}
            <span style={{ fontSize: "24px", transform: activeTab === tab.id ? "scale(1.15)" : "scale(1)", transition: "transform 0.2s ease" }}>{tab.icon}</span>
            <span style={{ fontSize: "11px", fontWeight: 800, marginTop: "2px" }}>{tab.label}</span>
            {tab.id === "order" && existingOrder && !["settled", "cancelled"].includes(existingOrder.status) && (
              <div style={{ position: "absolute", top: "8px", right: "calc(50% - 20px)", width: "8px", height: "8px", borderRadius: "50%", background: BRAND.gold, border: "2px solid white" }} />
            )}
          </button>
        ))}

        {/* Cart */}
        <button onClick={() => cart.length > 0 && setIsCartOpen(true)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          padding: "12px 0 10px", background: "none", border: "none",
          cursor: cart.length > 0 ? "pointer" : "default",
          color: cart.length > 0 ? BRAND.goldDark : "#d1d5db",
          position: "relative", transition: "color 0.2s ease",
        }}>
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: "24px" }}>🛒</span>
            {totalCartItems > 0 && (
              <span style={{
                position: "absolute", top: "-6px", right: "-10px",
                background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`,
                color: BRAND.coffee, fontSize: "10px", width: "18px", height: "18px",
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, border: "2px solid white",
                animation: "scale-in 0.2s cubic-bezier(0.34,1.56,0.64,1)",
              }}>{totalCartItems}</span>
            )}
          </div>
          <span style={{ fontSize: "11px", fontWeight: 800, marginTop: "2px" }}>
            {totalCartItems > 0 ? `₹${totalCartValue.toFixed(0)}` : "Cart"}
          </span>
        </button>
      </nav>

      <CartDrawer
        cart={cart} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}
        onUpdateQty={updateQty} onUpdateNote={updateNote}
        onPlaceOrder={handlePlaceOrderClick}
        isPlacing={isPlacing} existingOrder={existingOrder}
      />
    </div>
  );
}
