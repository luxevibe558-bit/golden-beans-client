"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { menuApi, orderApi, tableApi } from "@/lib/api";
import type { MenuCategory, MenuItem, CartItem, Table, Order } from "@/types";
import LiveOrderTracker from "@/components/LiveOrderTracker";

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

function playNotificationBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [0, 0.2, 0.4].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880 + (i * 220);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.25);
    });
  } catch { }
  try { navigator.vibrate?.([300, 100, 300]); } catch { }
}

async function showBrowserNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    try { await Notification.requestPermission(); } catch { }
  }
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png", tag: "golden-beans-order" });
  } catch { }
}

// ─── Customer Data Popup — Keyboard-aware, centered ───
function CustomerDataPopup({ onSubmit, onSkip }: {
  onSubmit: (data: { name: string; phone: string; birthdate: string; anniversary: string }) => void;
  onSkip: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [step, setStep] = useState(1);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setKeyboardOpen(heightDiff > 150);
      }
    };
    window.visualViewport?.addEventListener("resize", handler);
    return () => window.visualViewport?.removeEventListener("resize", handler);
  }, []);

  const handleSubmit = () => {
    if (step === 1) {
      if (!name.trim() || phone.length < 10) return alert("Please enter valid name and 10-digit phone number");
      setStep(2);
    } else {
      onSubmit({ name, phone, birthdate, anniversary });
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,14,6,0.85)",
      zIndex: 80, display: "flex",
      alignItems: keyboardOpen ? "flex-start" : "center",
      justifyContent: "center",
      padding: keyboardOpen ? "12px 16px" : "16px",
      backdropFilter: "blur(8px)",
      overflowY: "auto",
    }}>
      <div style={{
        width: "100%", maxWidth: "440px",
        background: "white", borderRadius: "28px",
        padding: "0 0 24px",
        animation: "scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: "0 24px 80px rgba(26,14,6,0.4)",
        marginTop: keyboardOpen ? "12px" : "auto",
        marginBottom: keyboardOpen ? "12px" : "auto",
      }}>
        <div style={{ height: "4px", background: `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold},${BRAND.goldLight},${BRAND.gold},${BRAND.goldDark})`, borderRadius: "28px 28px 0 0" }} />

        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            <div style={{ fontSize: "40px", marginBottom: "6px" }}>{step === 1 ? "👋" : "🎂"}</div>
            <h2 style={{ fontWeight: 900, fontSize: "20px", color: BRAND.espresso, margin: "0 0 4px", fontFamily: "'Playfair Display', serif" }}>
              {step === 1 ? "Welcome to Golden Beans!" : "Any special dates?"}
            </h2>
            <p style={{ fontSize: "13px", color: "#7a6050", margin: 0, lineHeight: 1.5 }}>
              {step === 1 ? "A quick detail to personalize your experience" : "We'll surprise you on these days! 🎁"}
            </p>
          </div>

          {step === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: BRAND.textMuted, marginBottom: "5px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Your Name *</label>
                <input type="text" placeholder="e.g. Nirav" value={name} onChange={e => setName(e.target.value)} autoFocus
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: `2px solid ${name ? BRAND.gold : BRAND.creamDark}`, background: BRAND.cream, color: BRAND.espresso, fontSize: "15px", fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: BRAND.textMuted, marginBottom: "5px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Mobile Number *</label>
                <input type="tel" placeholder="10-digit number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: `2px solid ${phone.length === 10 ? BRAND.gold : BRAND.creamDark}`, background: BRAND.cream, color: BRAND.espresso, fontSize: "15px", fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: BRAND.textMuted, marginBottom: "5px", letterSpacing: "0.5px", textTransform: "uppercase" }}>🎂 Birthday (Optional)</label>
                <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: `2px solid ${birthdate ? BRAND.gold : BRAND.creamDark}`, background: BRAND.cream, color: BRAND.espresso, fontSize: "14px", fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: BRAND.textMuted, marginBottom: "5px", letterSpacing: "0.5px", textTransform: "uppercase" }}>💑 Anniversary (Optional)</label>
                <input type="date" value={anniversary} onChange={e => setAnniversary(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: `2px solid ${anniversary ? BRAND.gold : BRAND.creamDark}`, background: BRAND.cream, color: BRAND.espresso, fontSize: "14px", fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
            <button onClick={onSkip} style={{ flex: 1, padding: "13px", borderRadius: "12px", border: `1px solid ${BRAND.creamDark}`, background: "white", color: "#9ca3af", fontWeight: 700, cursor: "pointer", fontSize: "14px", fontFamily: "inherit" }}>Skip</button>
            <button onClick={handleSubmit} style={{ flex: 2, padding: "13px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`, color: BRAND.coffee, fontWeight: 900, cursor: "pointer", fontSize: "14px", fontFamily: "inherit", boxShadow: `0 6px 20px rgba(201,168,76,0.4)` }}>
              {step === 1 ? "Continue →" : "Place Order ☕"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeBackPopup({ message, onClose }: {
  message: { name: string; type: "normal" | "birthday" | "anniversary" };
  onClose: () => void;
}) {
  const configs = {
    normal: { emoji: "👋", title: `Welcome back, ${message.name}!`, sub: "Great to see you again ☕", bg: `linear-gradient(135deg,${BRAND.coffee},${BRAND.coffeeMid})`, accent: BRAND.gold },
    birthday: { emoji: "🎂", title: `Happy Birthday, ${message.name}! 🎉`, sub: "Enjoy a special treat from us 🎁", bg: "linear-gradient(135deg,#7c2d12,#c2410c)", accent: "#fbbf24" },
    anniversary: { emoji: "💑", title: `Happy Anniversary! ❤️`, sub: "Celebrate with us 🌹", bg: "linear-gradient(135deg,#4a0020,#831843)", accent: "#f9a8d4" },
  };
  const cfg = configs[message.type];

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", top: "80px", left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: "440px", background: cfg.bg, borderRadius: "20px", padding: "16px", zIndex: 35, boxShadow: "0 16px 48px rgba(0,0,0,0.3)", animation: "slideDown 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ fontSize: "36px" }}>{cfg.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 900, fontSize: "15px", color: cfg.accent, margin: 0 }}>{cfg.title}</p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", margin: "2px 0 0", fontWeight: 600 }}>{cfg.sub}</p>
        </div>
        <button onClick={onClose} style={{ width: "26px", height: "26px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "white", cursor: "pointer", fontSize: "12px" }}>✕</button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ display: "flex", background: "white", borderRadius: "20px", overflow: "hidden", marginBottom: "12px", boxShadow: "0 4px 16px rgba(44,26,14,0.06)" }}>
      <div style={{ width: "100px", height: "100px", flexShrink: 0, background: `linear-gradient(90deg,${BRAND.creamDark} 25%,${BRAND.cream} 50%,${BRAND.creamDark} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      <div style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ height: "14px", width: "60%", borderRadius: "6px", background: `linear-gradient(90deg,${BRAND.creamDark} 25%,${BRAND.cream} 50%,${BRAND.creamDark} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
        <div style={{ height: "10px", width: "85%", borderRadius: "6px", background: `linear-gradient(90deg,${BRAND.creamDark} 25%,${BRAND.cream} 50%,${BRAND.creamDark} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      </div>
    </div>
  );
}

function MenuItemCard({ item, cartQty, onAdd, onRemove }: {
  item: MenuItem; cartQty: number;
  onAdd: (item: MenuItem) => void;
  onRemove: (id: string) => void;
}) {
  const catName = typeof item.category === "object" ? item.category.name : "";
  const bg = CATEGORY_BG[catName] || `linear-gradient(145deg,${BRAND.coffeeMid},${BRAND.coffee})`;
  const emoji = ITEM_EMOJIS[item.name] || "🍽️";

  return (
    <div style={{ display: "flex", background: "white", borderRadius: "20px", overflow: "hidden", marginBottom: "12px", boxShadow: "0 4px 16px rgba(44,26,14,0.08)", opacity: item.isAvailable ? 1 : 0.5, border: `1px solid ${BRAND.creamDark}` }}>
      <div style={{ width: "105px", minHeight: "105px", flexShrink: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ fontSize: "42px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))", animation: "float 3s ease-in-out infinite" }}>{emoji}</div>
        {item.tags.includes("bestseller") && (
          <div style={{ position: "absolute", top: "6px", right: 0, background: `linear-gradient(135deg,${BRAND.gold},${BRAND.goldLight})`, padding: "2px 7px 2px 5px", borderRadius: "0 0 0 6px" }}>
            <span style={{ fontSize: "8px", color: BRAND.coffee, fontWeight: 900 }}>★ BEST</span>
          </div>
        )}
        <div style={{ position: "absolute", bottom: "6px", left: "6px", background: "rgba(22,163,74,0.9)", borderRadius: "5px", padding: "2px 5px" }}>
          <span style={{ fontSize: "8px", color: "white", fontWeight: 800 }}>🌿 VEG</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: "13px", color: BRAND.espresso, margin: "0 0 4px" }}>{item.name}</p>
          <p style={{ fontSize: "11px", color: "#7a6050", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4 }}>{item.description}</p>
          {item.preparationTime > 0 && <p style={{ fontSize: "10px", color: BRAND.goldDark, margin: "4px 0 0", fontWeight: 700 }}>⏱ {item.preparationTime} min</p>}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
          <span style={{ fontWeight: 900, fontSize: "15px", color: BRAND.espresso }}>₹{item.price}</span>
          {item.isAvailable && (
            cartQty === 0 ? (
              <button onClick={() => onAdd(item)} style={{ background: "white", color: BRAND.goldDark, border: `2px solid ${BRAND.gold}`, borderRadius: "10px", padding: "6px 18px", fontWeight: 900, fontSize: "12px", cursor: "pointer", letterSpacing: "0.5px", boxShadow: `0 3px 10px rgba(201,168,76,0.25)`, fontFamily: "inherit" }}>ADD +</button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", background: `linear-gradient(135deg,${BRAND.gold},${BRAND.goldLight})`, borderRadius: "10px", overflow: "hidden", boxShadow: `0 3px 10px rgba(201,168,76,0.35)` }}>
                <button onClick={() => onRemove(item._id)} style={{ width: "30px", height: "30px", background: "none", border: "none", color: BRAND.coffee, fontWeight: 900, fontSize: "18px", cursor: "pointer" }}>−</button>
                <span style={{ fontWeight: 900, color: BRAND.coffee, fontSize: "14px", minWidth: "18px", textAlign: "center" }}>{cartQty}</span>
                <button onClick={() => onAdd(item)} style={{ width: "30px", height: "30px", background: "none", border: "none", color: BRAND.coffee, fontWeight: 900, fontSize: "18px", cursor: "pointer" }}>+</button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

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
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", zIndex: 50, borderRadius: "28px 28px 0 0", maxHeight: "88vh", display: "flex", flexDirection: "column", transform: isOpen ? "translateY(0)" : "translateY(100%)", transition: "transform 0.4s cubic-bezier(0.32,0.72,0,1)", boxShadow: "0 -20px 60px rgba(26,14,6,0.25)" }}>
        <div style={{ height: "4px", background: `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold},${BRAND.goldLight},${BRAND.gold},${BRAND.goldDark})`, borderRadius: "4px 4px 0 0" }} />
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: "32px", height: "4px", borderRadius: "99px", background: BRAND.creamDark }} />
        </div>

        <div style={{ padding: "8px 18px 14px", borderBottom: `1px solid ${BRAND.creamDark}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ fontWeight: 900, fontSize: "20px", color: BRAND.espresso, margin: 0 }}>Your Order</h2>
                <span style={{ background: `linear-gradient(135deg,${BRAND.gold},${BRAND.goldLight})`, color: BRAND.coffee, fontSize: "11px", padding: "2px 9px", borderRadius: "99px", fontWeight: 900 }}>{totalItems} items</span>
              </div>
              {existingOrder && <p style={{ fontSize: "11px", color: BRAND.goldDark, margin: "4px 0 0", fontWeight: 700 }}>Adding to #{existingOrder.orderNumber}</p>}
            </div>
            <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "50%", background: BRAND.cream, border: `1px solid ${BRAND.creamDark}`, cursor: "pointer", fontSize: "14px", color: BRAND.textMuted }}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>🛒</div>
              <p style={{ fontWeight: 800, fontSize: "15px", color: BRAND.espresso }}>Cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.menuItemId} style={{ background: BRAND.cream, borderRadius: "16px", padding: "12px", marginBottom: "8px", border: `1px solid ${BRAND.creamDark}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontWeight: 800, fontSize: "13px", color: BRAND.espresso }}>{item.name}</span>
                <span style={{ fontWeight: 900, fontSize: "13px", color: BRAND.espresso }}>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", background: `linear-gradient(135deg,${BRAND.gold},${BRAND.goldLight})`, borderRadius: "10px", overflow: "hidden" }}>
                  <button onClick={() => onUpdateQty(item.menuItemId, -1)} style={{ width: "30px", height: "30px", background: "none", border: "none", color: BRAND.coffee, fontWeight: 900, fontSize: "18px", cursor: "pointer" }}>−</button>
                  <span style={{ fontWeight: 900, color: BRAND.coffee, fontSize: "13px", minWidth: "22px", textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => onUpdateQty(item.menuItemId, 1)} style={{ width: "30px", height: "30px", background: "none", border: "none", color: BRAND.coffee, fontWeight: 900, fontSize: "18px", cursor: "pointer" }}>+</button>
                </div>
                <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600 }}>₹{item.price} each</span>
              </div>
              <input type="text" placeholder="Add a note..." value={item.notes} onChange={e => onUpdateNote(item.menuItemId, e.target.value)}
                style={{ width: "100%", marginTop: "8px", fontSize: "11px", padding: "7px 10px", borderRadius: "8px", border: `1px solid ${BRAND.creamDark}`, background: "white", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: "0 14px 24px", borderTop: `1px solid ${BRAND.creamDark}` }}>
            <div style={{ background: BRAND.cream, borderRadius: "16px", padding: "12px 14px", margin: "12px 0 10px", border: `1px solid ${BRAND.creamDark}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#7a6050", marginBottom: "4px" }}>
                <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#7a6050", paddingBottom: "8px", borderBottom: `1px dashed ${BRAND.creamDark}`, marginBottom: "8px" }}>
                <span>GST (5%)</span><span>₹{tax.toFixed(0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "16px", color: BRAND.espresso }}>
                <span>Total</span>
                <span style={{ color: BRAND.goldDark }}>₹{total.toFixed(0)}</span>
              </div>
            </div>
            <button onClick={onPlaceOrder} disabled={isPlacing} style={{ width: "100%", background: isPlacing ? "#d1d5db" : `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold},${BRAND.goldLight})`, color: isPlacing ? "#9ca3af" : BRAND.coffee, border: "none", borderRadius: "16px", padding: "16px", fontWeight: 900, fontSize: "15px", cursor: isPlacing ? "not-allowed" : "pointer", boxShadow: isPlacing ? "none" : `0 8px 24px rgba(201,168,76,0.5)`, fontFamily: "inherit" }}>
              {isPlacing ? "☕ Placing order..." : `☕ Place Order • ₹${total.toFixed(0)}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Enhanced Cancel Bar — ALWAYS visible when cancellable ───
function TopCancelBar({ order, onCancelled }: { order: Order; onCancelled: () => void }) {
  const placedAt = new Date(order.createdAt).getTime();
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, 120 - Math.floor((Date.now() - placedAt) / 1000))
  );
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      const remaining = Math.max(0, 120 - Math.floor((Date.now() - placedAt) / 1000));
      setSecondsLeft(remaining);
    }, 1000);
    return () => clearInterval(iv);
  }, [placedAt]);

  if (secondsLeft <= 0) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft <= 30;
  const pct = (secondsLeft / 120) * 100;

  const handleCancel = async () => {
    if (cancelling) return;
    if (!confirm(`Cancel order #${order.orderNumber}?`)) return;
    setCancelling(true);
    try {
      await orderApi.cancelOrder(order._id);
      localStorage.removeItem("gb_active_table");
      localStorage.removeItem("gb_active_order");
      onCancelled();
    } catch {
      alert("Failed to cancel. Please contact staff.");
      setCancelling(false);
    }
  };

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 45,
      background: isUrgent
        ? "linear-gradient(135deg,#7f1d1d,#dc2626)"
        : `linear-gradient(135deg,${BRAND.coffeeMid},${BRAND.coffee})`,
      animation: isUrgent ? "pulse-urgent 1s infinite" : "none",
      borderBottom: `2px solid ${isUrgent ? "#ef4444" : BRAND.gold}`,
      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
    }}>
      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${isUrgent ? "white" : BRAND.gold}`,
            flexShrink: 0,
          }}>
            <span style={{ fontWeight: 900, fontSize: "13px", color: "white", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}>
              {mins}:{String(secs).padStart(2, "0")}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 900, fontSize: "12px", color: "white", margin: 0 }}>
              {isUrgent ? "⚠️ Last chance to cancel!" : "You can cancel within 2 min"}
            </p>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", margin: "2px 0 0", fontWeight: 600 }}>
              #{order.orderNumber}
            </p>
          </div>
        </div>

        <button onClick={handleCancel} disabled={cancelling} style={{
          flexShrink: 0, background: "white", color: isUrgent ? "#dc2626" : BRAND.goldDark,
          border: "none", borderRadius: "10px", padding: "8px 14px",
          fontWeight: 900, fontSize: "11px", cursor: cancelling ? "wait" : "pointer",
          fontFamily: "inherit", boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        }}>
          {cancelling ? "..." : "✕ CANCEL"}
        </button>
      </div>
      <div style={{ height: "3px", background: "rgba(0,0,0,0.25)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "white", transition: "width 1s linear" }} />
      </div>
    </div>
  );
}

// ─── Ready Alert Popup ───
function OrderReadyAlert({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(22,163,74,0.3)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", backdropFilter: "blur(8px)", animation: "fadeIn 0.3s ease" }}>
      <div style={{ background: "white", borderRadius: "24px", padding: "28px 20px", textAlign: "center", maxWidth: "320px", width: "100%", border: "3px solid #16a34a", boxShadow: "0 24px 80px rgba(22,163,74,0.4)", animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ fontSize: "64px", marginBottom: "10px", animation: "bounce-dot 1s infinite" }}>🔔</div>
        <h2 style={{ fontWeight: 900, fontSize: "22px", color: "#16a34a", margin: "0 0 6px", fontFamily: "'Playfair Display', serif" }}>Your Order is Ready!</h2>
        <p style={{ color: "#7a6050", fontSize: "13px", margin: "0 0 14px" }}>
          Order <strong style={{ color: BRAND.espresso }}>#{order.orderNumber}</strong>
        </p>
        <button onClick={onClose} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#166534,#16a34a)", color: "white", fontWeight: 900, cursor: "pointer", fontSize: "14px", fontFamily: "inherit" }}>
          Got it ✓
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───
export default function CustomerOrderPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [table, setTable] = useState<Table | null>(null);
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // For queue position
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "order" | "info">("menu");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [customerData, setCustomerData] = useState<{ name: string; phone: string } | null>(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState<{ name: string; type: "normal" | "birthday" | "anniversary" } | null>(null);

  const [readyAlertOrder, setReadyAlertOrder] = useState<Order | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      setTimeout(() => { Notification.requestPermission().catch(() => { }); }, 2000);
    }
  }, []);

  // ── Device Recognition + Check saved customer ──
  useEffect(() => {
    const saved = localStorage.getItem("gb_customer");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCustomerData({ name: data.name, phone: data.phone });
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const todayMMDD = `${mm}-${dd}`;
        let msgType: "normal" | "birthday" | "anniversary" = "normal";
        if (data.birthdate) {
          const bdMMDD = data.birthdate.slice(5);
          if (bdMMDD === todayMMDD) msgType = "birthday";
        }
        if (data.anniversary && msgType === "normal") {
          const annMMDD = data.anniversary.slice(5);
          if (annMMDD === todayMMDD) msgType = "anniversary";
        }
        setWelcomeMessage({ name: data.name, type: msgType });
        setShowWelcomeBack(true);
        setTimeout(() => setShowWelcomeBack(false), 5000);
      } catch { }
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
        if (orderRes.data.data) {
          const order = orderRes.data.data;
          // Auto-cleanup if settled/cancelled
          if (["settled", "cancelled"].includes(order.status)) {
            localStorage.removeItem("gb_active_table");
            localStorage.removeItem("gb_active_order");
            setExistingOrder(null);
          } else {
            setExistingOrder(order);
            prevStatusRef.current = order.status;
            localStorage.setItem("gb_active_table", tableId);
            localStorage.setItem("gb_active_order", order._id);
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally { setLoading(false); }
    }
    load();
  }, [tableId]);

  // Poll for status updates + all orders for queue position
  useEffect(() => {
    if (!existingOrder || ["settled", "cancelled"].includes(existingOrder.status)) return;
    pollRef.current = setInterval(async () => {
      try {
        const [orderRes, allRes] = await Promise.all([
          orderApi.getOrderByTable(tableId),
          orderApi.getKdsOrders(),
        ]);

        if (allRes.data.data) setAllOrders(allRes.data.data);

        if (!orderRes.data.data) return;
        const newOrder: Order = orderRes.data.data;
        const prevStatus = prevStatusRef.current;

        if (prevStatus && prevStatus !== newOrder.status) {
          const messages: Record<string, { title: string; body: string }> = {
            kotSent: { title: "☕ Order Confirmed!", body: "Chef started preparing your order" },
            partially_ready: { title: "🔔 Almost Ready!", body: "Some items are ready" },
            ready: { title: "✅ Order is Ready!", body: "Waiter will be with you shortly!" },
            cancelled: { title: "❌ Order Cancelled", body: "Contact staff if needed" },
            settled: { title: "🙏 Thank You!", body: "Hope you enjoyed your visit" },
          };
          const msg = messages[newOrder.status];
          if (msg) {
            playNotificationBeep();
            showBrowserNotification(msg.title, msg.body);
            if (newOrder.status === "ready") setReadyAlertOrder(newOrder);
          }

          // Auto-clean storage on settle/cancel
          if (["settled", "cancelled"].includes(newOrder.status)) {
            setTimeout(() => {
              localStorage.removeItem("gb_active_table");
              localStorage.removeItem("gb_active_order");
            }, 5000);
          }
        }

        prevStatusRef.current = newOrder.status;
        setExistingOrder(newOrder);
      } catch { }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [existingOrder, tableId]);

  // Queue position calculation
  const queuePosition = existingOrder
    ? allOrders
        .filter(o => ["kotSent", "open"].includes(o.status) && o._id !== existingOrder._id)
        .filter(o => new Date(o.createdAt).getTime() < new Date(existingOrder.createdAt).getTime())
        .length
    : undefined;

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

  const handlePlaceOrderClick = () => {
    setIsCartOpen(false);
    // Skip popup if we have customer data
    if (customerData) {
      placeOrder(customerData);
    } else {
      setShowCustomerPopup(true);
    }
  };

  const handleCustomerDataSubmit = (data: { name: string; phone: string; birthdate: string; anniversary: string }) => {
    setCustomerData({ name: data.name, phone: data.phone });
    localStorage.setItem("gb_customer", JSON.stringify(data));
    setShowCustomerPopup(false);
    placeOrder(data);
  };

  const placeOrder = async (customer?: { name: string; phone: string; birthdate?: string; anniversary?: string }) => {
    if (cart.length === 0) return;
    setIsPlacing(true);
    try {
      const res = await orderApi.createOrder({
        tableId, items: cart, createdBy: "customer",
        customerName: customer?.name || "",
        customerPhone: customer?.phone || "",
      });
      const newOrder: Order = res.data.data;
      setCart([]);
      setExistingOrder(newOrder);
      prevStatusRef.current = newOrder.status;
      localStorage.setItem("gb_active_table", tableId);
      localStorage.setItem("gb_active_order", newOrder._id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsPlacing(false);
    }
  };

  const handleCancelled = () => {
    setExistingOrder(null);
    prevStatusRef.current = null;
  };

  const totalCartItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalCartValue = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const filteredMenu = searchQuery
    ? menu.map(cat => ({ ...cat, items: cat.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) })).filter(cat => cat.items.length > 0)
    : menu;

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: BRAND.cream }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>☕</div>
          <h2 style={{ fontWeight: 900, color: BRAND.espresso, margin: "0 0 8px" }}>Something went wrong</h2>
          <p style={{ color: "#7a6050", marginBottom: "20px" }}>{error}</p>
          <button onClick={() => router.push("/")} style={{ background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`, color: BRAND.coffee, border: "none", borderRadius: "14px", padding: "14px 28px", fontWeight: 800, cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}>Back to Home</button>
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
        @keyframes scaleIn { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes slideDown { from{transform:translateX(-50%) translateY(-20px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
        @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes bounce-dot { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes pulse-urgent { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.15)} }
        @keyframes gold-shine { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        ::-webkit-scrollbar { display:none; }
        button,input { font-family:'Nunito',sans-serif; }
      `}</style>

      {showWelcomeBack && welcomeMessage && <WelcomeBackPopup message={welcomeMessage} onClose={() => setShowWelcomeBack(false)} />}
      {showCustomerPopup && <CustomerDataPopup onSubmit={handleCustomerDataSubmit} onSkip={() => { setShowCustomerPopup(false); placeOrder(); }} />}
      {readyAlertOrder && <OrderReadyAlert order={readyAlertOrder} onClose={() => setReadyAlertOrder(null)} />}

      {/* TOP CANCEL BAR — Shows for 2 min */}
      {existingOrder && !["settled", "cancelled"].includes(existingOrder.status) && (
        <TopCancelBar order={existingOrder} onCancelled={handleCancelled} />
      )}

      <header style={{ background: `linear-gradient(180deg,${BRAND.coffee} 0%,${BRAND.coffeeMid} 100%)`, position: "sticky", top: 0, zIndex: 30, boxShadow: `0 4px 16px rgba(44,26,14,0.3)` }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold},${BRAND.goldLight},${BRAND.gold},${BRAND.goldDark})`, backgroundSize: "200% 100%", animation: "gold-shine 3s linear infinite" }} />
        <div style={{ padding: "12px 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", overflow: "hidden", boxShadow: `0 4px 12px rgba(201,168,76,0.4)`, flexShrink: 0, background: BRAND.coffee, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src="/logo-small.png" alt="Golden Beans" style={{ width: "42px", height: "42px", objectFit: "contain" }} />
            </div>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: "18px", color: BRAND.gold, margin: 0, fontFamily: "'Playfair Display', serif" }}>Golden Beans</h1>
              <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.6)", margin: 0, fontWeight: 700 }}>{table ? `TABLE ${table.tableNumber}` : "LOADING..."}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(74,222,128,0.15)", border: `1px solid rgba(74,222,128,0.3)`, borderRadius: "99px", padding: "3px 10px" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: "10px", color: "#4ade80", fontWeight: 800 }}>🌿 Pure Veg</span>
          </div>
        </div>

        <div style={{ padding: "0 14px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: searchFocused ? "white" : "rgba(255,255,255,0.1)", border: `1.5px solid ${searchFocused ? BRAND.gold : "rgba(201,168,76,0.3)"}`, borderRadius: "14px", padding: "10px 12px", transition: "all 0.25s ease" }}>
            <span style={{ fontSize: "14px", flexShrink: 0 }}>🔍</span>
            <input type="text" placeholder="Search dishes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              style={{ flex: 1, background: "none", border: "none", fontSize: "13px", color: searchFocused ? BRAND.espresso : "rgba(255,255,255,0.8)", fontWeight: 600, outline: "none" }}
            />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer", fontSize: "10px", color: "white" }}>✕</button>}
          </div>
        </div>

        {!searchQuery && menu.length > 0 && (
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", padding: "0 14px 12px", scrollbarWidth: "none" }}>
            {menu.map((cat, idx) => (
              <button key={cat._id} onClick={() => {
                setActiveCategory(cat._id);
                categoryRefs.current[cat._id]?.scrollIntoView({ behavior: "smooth", block: "start" });
              }} style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", borderRadius: "99px", fontSize: "12px", fontWeight: 800,
                border: `1.5px solid ${activeCategory === cat._id ? BRAND.gold : "rgba(201,168,76,0.3)"}`,
                cursor: "pointer",
                background: activeCategory === cat._id ? `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})` : "rgba(255,255,255,0.08)",
                color: activeCategory === cat._id ? BRAND.coffee : BRAND.gold,
                boxShadow: activeCategory === cat._id ? `0 4px 12px rgba(201,168,76,0.4)` : "none",
                animation: `slideUp 0.3s ${idx * 0.06}s ease both`,
              }}>
                <span style={{ fontSize: "13px" }}>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main style={{ flex: 1, overflowY: "auto", paddingBottom: "80px" }}>
        {/* LIVE ORDER TRACKER */}
        {existingOrder && !["settled", "cancelled"].includes(existingOrder.status) && (
          <LiveOrderTracker order={existingOrder} queuePosition={queuePosition} />
        )}

        {activeTab === "menu" && (
          <div style={{ padding: "10px 0" }}>
            {loading ? (
              <div style={{ padding: "14px" }}>{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>
            ) : filteredMenu.length === 0 ? (
              <div style={{ textAlign: "center", padding: "56px 24px" }}>
                <div style={{ fontSize: "48px", marginBottom: "10px" }}>☕</div>
                <p style={{ fontWeight: 800, color: BRAND.espresso, fontSize: "15px" }}>Nothing found</p>
              </div>
            ) : filteredMenu.map((cat, catIdx) => (
              <div key={cat._id} ref={el => { categoryRefs.current[cat._id] = el; }} style={{ marginBottom: "6px", animation: `slideUp 0.4s ${catIdx * 0.08}s ease both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 14px 10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: CATEGORY_BG[cat.name] || `linear-gradient(145deg,${BRAND.coffee},${BRAND.coffeeMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", flexShrink: 0 }}>{cat.icon}</div>
                  <div>
                    <h2 style={{ fontWeight: 900, fontSize: "16px", color: BRAND.espresso, margin: 0, fontFamily: "'Playfair Display', serif" }}>{cat.name}</h2>
                    <p style={{ fontSize: "11px", color: BRAND.goldDark, margin: 0, fontWeight: 700 }}>{cat.items.length} items</p>
                  </div>
                </div>
                <div style={{ padding: "0 14px" }}>
                  {cat.items.map(item => (
                    <MenuItemCard key={item._id} item={item} cartQty={cart.find(c => c.menuItemId === item._id)?.quantity || 0} onAdd={addToCart} onRemove={removeFromCart} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "order" && (
          <div style={{ padding: "14px" }}>
            {!existingOrder ? (
              <div style={{ textAlign: "center", padding: "56px 24px" }}>
                <div style={{ fontSize: "56px", marginBottom: "12px" }}>☕</div>
                <p style={{ fontWeight: 900, fontSize: "18px", color: BRAND.espresso, fontFamily: "'Playfair Display', serif" }}>No Active Order</p>
                <button onClick={() => setActiveTab("menu")} style={{ marginTop: "14px", background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`, color: BRAND.coffee, border: "none", borderRadius: "14px", padding: "14px 28px", fontWeight: 900, cursor: "pointer", fontSize: "14px", fontFamily: "inherit" }}>Browse Menu</button>
              </div>
            ) : (
              <LiveOrderTracker order={existingOrder} queuePosition={queuePosition} />
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: `linear-gradient(145deg,${BRAND.coffee},${BRAND.coffeeMid})`, borderRadius: "24px", padding: "28px 20px", textAlign: "center" }}>
              <img src="/logo-header.png" alt="Golden Beans" style={{ width: "100px", height: "100px", objectFit: "contain", marginBottom: "12px" }} />
              <h2 style={{ fontWeight: 800, fontSize: "22px", color: BRAND.gold, margin: "0 0 4px", fontFamily: "'Playfair Display', serif" }}>Golden Beans</h2>
              <p style={{ color: "rgba(201,168,76,0.7)", fontSize: "12px", margin: "0 0 8px", fontWeight: 600 }}>Cafe & Bistro</p>
              <span style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80", fontSize: "11px", padding: "3px 10px", borderRadius: "99px", fontWeight: 800 }}>🌿 100% Pure Vegetarian</span>
            </div>
            {[
              { icon: "📍", label: "ADDRESS", value: "123, MG Road, Surat, Gujarat" },
              { icon: "📞", label: "PHONE", value: "+91 98765 43210" },
              { icon: "🕐", label: "HOURS", value: "7:00 AM – 11:00 PM" },
              { icon: "📶", label: "WI-FI", value: "GoldenBeans_Guest" },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ background: "white", borderRadius: "14px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 2px 10px rgba(44,26,14,0.06)", border: `1px solid ${BRAND.creamDark}` }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: BRAND.cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{icon}</div>
                <div>
                  <p style={{ fontSize: "9px", color: BRAND.goldDark, margin: "0 0 2px", fontWeight: 800, letterSpacing: "1px" }}>{label}</p>
                  <p style={{ fontSize: "13px", color: BRAND.espresso, margin: 0, fontWeight: 700 }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", background: "white", borderTop: `2px solid ${BRAND.creamDark}`, zIndex: 30, display: "flex", boxShadow: `0 -8px 24px rgba(44,26,14,0.1)` }}>
        {[
          { id: "menu", label: "Menu", icon: "🍽️" },
          { id: "order", label: "My Order", icon: "📋" },
          { id: "info", label: "About", icon: "☕" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer",
            color: activeTab === tab.id ? BRAND.goldDark : "#9ca3af", position: "relative",
          }}>
            {activeTab === tab.id && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "28px", height: "3px", background: `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold})`, borderRadius: "0 0 4px 4px" }} />}
            <span style={{ fontSize: "22px", transform: activeTab === tab.id ? "scale(1.12)" : "scale(1)", transition: "transform 0.2s" }}>{tab.icon}</span>
            <span style={{ fontSize: "10px", fontWeight: 800, marginTop: "2px" }}>{tab.label}</span>
            {tab.id === "order" && existingOrder && !["settled", "cancelled"].includes(existingOrder.status) && <div style={{ position: "absolute", top: "6px", right: "calc(50% - 18px)", width: "7px", height: "7px", borderRadius: "50%", background: BRAND.gold, border: "2px solid white" }} />}
          </button>
        ))}
        <button onClick={() => cart.length > 0 && setIsCartOpen(true)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          padding: "10px 0 8px", background: "none", border: "none",
          cursor: cart.length > 0 ? "pointer" : "default",
          color: cart.length > 0 ? BRAND.goldDark : "#d1d5db", position: "relative",
        }}>
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: "22px" }}>🛒</span>
            {totalCartItems > 0 && <span style={{ position: "absolute", top: "-5px", right: "-9px", background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})`, color: BRAND.coffee, fontSize: "9px", width: "17px", height: "17px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, border: "2px solid white" }}>{totalCartItems}</span>}
          </div>
          <span style={{ fontSize: "10px", fontWeight: 800, marginTop: "2px" }}>
            {totalCartItems > 0 ? `₹${totalCartValue.toFixed(0)}` : "Cart"}
          </span>
        </button>
      </nav>

      <CartDrawer cart={cart} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onUpdateQty={updateQty} onUpdateNote={updateNote} onPlaceOrder={handlePlaceOrderClick} isPlacing={isPlacing} existingOrder={existingOrder} />
    </div>
  );
}
