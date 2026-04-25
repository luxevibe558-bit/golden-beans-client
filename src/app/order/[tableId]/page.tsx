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
  textDim: "#A89B80",
  success: "#4A8B4A",
  danger: "#C0392B",
};

const CATEGORY_BG: Record<string, string> = {
  "Hot Beverages": `linear-gradient(145deg, ${T.emerald}, ${T.emeraldMid})`,
  "Cold Beverages": "linear-gradient(145deg, #1E3A5F, #2E5A8F)",
  "Snacks": "linear-gradient(145deg, #6B4423, #8B5A2B)",
  "Desserts": "linear-gradient(145deg, #5C2751, #8B3A6B)",
  "Breakfast": "linear-gradient(145deg, #4A5D23, #6B8E23)",
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
    new Notification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png", tag: "gb-order" });
  } catch { }
}

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
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,61,46,0.75)", zIndex: 80, display: "flex", alignItems: keyboardOpen ? "flex-start" : "center", justifyContent: "center", padding: keyboardOpen ? "10px 12px" : "16px", backdropFilter: "blur(8px)", overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: "400px", background: T.ivory, borderRadius: "20px", padding: "0 0 16px", animation: "scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: "0 20px 50px rgba(15,61,46,0.4)", marginTop: keyboardOpen ? "10px" : "auto", marginBottom: keyboardOpen ? "10px" : "auto" }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})`, borderRadius: "20px 20px 0 0" }} />
        <div style={{ padding: "16px 18px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "32px", marginBottom: "4px" }}>{step === 1 ? "👋" : "🎂"}</div>
            <h2 style={{ fontWeight: 900, fontSize: "17px", color: T.emerald, margin: "0 0 3px", fontFamily: "'Playfair Display', serif" }}>
              {step === 1 ? "Welcome!" : "Special dates?"}
            </h2>
            <p style={{ fontSize: "11px", color: T.textMuted, margin: 0, lineHeight: 1.4 }}>
              {step === 1 ? "Quick detail for personalization" : "We'll surprise you! 🎁"}
            </p>
          </div>

          {step === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              <div>
                <label style={{ display: "block", fontSize: "9px", fontWeight: 800, color: T.textMuted, marginBottom: "3px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Your Name *</label>
                <input type="text" placeholder="e.g. Nirav" value={name} onChange={e => setName(e.target.value)} autoFocus
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "9px", border: `2px solid ${name ? T.gold : T.creamDark}`, background: T.cream, color: T.text, fontSize: "14px", fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "9px", fontWeight: 800, color: T.textMuted, marginBottom: "3px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Mobile Number *</label>
                <input type="tel" placeholder="10-digit number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "9px", border: `2px solid ${phone.length === 10 ? T.gold : T.creamDark}`, background: T.cream, color: T.text, fontSize: "14px", fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              <div>
                <label style={{ display: "block", fontSize: "9px", fontWeight: 800, color: T.textMuted, marginBottom: "3px", letterSpacing: "0.5px", textTransform: "uppercase" }}>🎂 Birthday (Optional)</label>
                <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "9px", border: `2px solid ${birthdate ? T.gold : T.creamDark}`, background: T.cream, color: T.text, fontSize: "13px", fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "9px", fontWeight: 800, color: T.textMuted, marginBottom: "3px", letterSpacing: "0.5px", textTransform: "uppercase" }}>💑 Anniversary (Optional)</label>
                <input type="date" value={anniversary} onChange={e => setAnniversary(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "9px", border: `2px solid ${anniversary ? T.gold : T.creamDark}`, background: T.cream, color: T.text, fontSize: "13px", fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "7px", marginTop: "14px" }}>
            <button onClick={onSkip} style={{ flex: 1, padding: "11px", borderRadius: "9px", border: `1px solid ${T.creamDark}`, background: T.ivory, color: T.textDim, fontWeight: 700, cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>Skip</button>
            <button onClick={handleSubmit} style={{ flex: 2, padding: "11px", borderRadius: "9px", border: "none", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, fontWeight: 900, cursor: "pointer", fontSize: "12px", fontFamily: "inherit", boxShadow: `0 5px 14px rgba(15,61,46,0.3)` }}>
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
    normal: { emoji: "👋", title: `Welcome back, ${message.name}!`, sub: "Great to see you again ☕", bg: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, accent: T.gold },
    birthday: { emoji: "🎂", title: `Happy Birthday, ${message.name}!`, sub: "Enjoy a special treat 🎁", bg: "linear-gradient(135deg, #7c2d12, #c2410c)", accent: "#fbbf24" },
    anniversary: { emoji: "💑", title: `Happy Anniversary! ❤️`, sub: "Celebrate with us 🌹", bg: "linear-gradient(135deg, #4a0020, #831843)", accent: "#f9a8d4" },
  };
  const cfg = configs[message.type];

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", top: "65px", left: "50%", transform: "translateX(-50%)", width: "calc(100% - 20px)", maxWidth: "400px", background: cfg.bg, borderRadius: "14px", padding: "12px", zIndex: 35, boxShadow: "0 14px 36px rgba(0,0,0,0.3)", animation: "slideDown 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
        <div style={{ fontSize: "28px", flexShrink: 0 }}>{cfg.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 900, fontSize: "12px", color: cfg.accent, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cfg.title}</p>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.8)", margin: "2px 0 0", fontWeight: 600 }}>{cfg.sub}</p>
        </div>
        <button onClick={onClose} style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "white", cursor: "pointer", fontSize: "10px", flexShrink: 0 }}>✕</button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ display: "flex", background: T.ivory, borderRadius: "16px", overflow: "hidden", marginBottom: "9px", boxShadow: "0 2px 10px rgba(15,61,46,0.05)" }}>
      <div style={{ width: "90px", height: "90px", flexShrink: 0, background: `linear-gradient(90deg, ${T.creamDark} 25%, ${T.cream} 50%, ${T.creamDark} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      <div style={{ flex: 1, padding: "10px", display: "flex", flexDirection: "column", gap: "5px" }}>
        <div style={{ height: "11px", width: "60%", borderRadius: "5px", background: `linear-gradient(90deg, ${T.creamDark} 25%, ${T.cream} 50%, ${T.creamDark} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
        <div style={{ height: "9px", width: "85%", borderRadius: "5px", background: `linear-gradient(90deg, ${T.creamDark} 25%, ${T.cream} 50%, ${T.creamDark} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
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
  const bg = CATEGORY_BG[catName] || `linear-gradient(145deg, ${T.emerald}, ${T.emeraldMid})`;
  const emoji = ITEM_EMOJIS[item.name] || "🍽️";

  return (
    <div style={{ display: "flex", background: T.ivory, borderRadius: "16px", overflow: "hidden", marginBottom: "9px", boxShadow: "0 2px 10px rgba(15,61,46,0.07)", opacity: item.isAvailable ? 1 : 0.5, border: `1px solid ${T.creamDark}`, maxWidth: "100%" }}>
      <div style={{ width: "90px", minHeight: "90px", flexShrink: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ fontSize: "32px", filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.3))", animation: "float 3s ease-in-out infinite" }}>{emoji}</div>
        {item.tags.includes("bestseller") && (
          <div style={{ position: "absolute", top: "4px", right: 0, background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, padding: "1px 5px 1px 3px", borderRadius: "0 0 0 4px" }}>
            <span style={{ fontSize: "7px", color: T.emerald, fontWeight: 900 }}>★ BEST</span>
          </div>
        )}
        <div style={{ position: "absolute", bottom: "4px", left: "4px", background: "rgba(74,139,74,0.95)", borderRadius: "3px", padding: "1px 4px" }}>
          <span style={{ fontSize: "7px", color: "white", fontWeight: 800 }}>🌿 VEG</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: "9px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: "11px", color: T.text, margin: "0 0 2px", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.name}</p>
          <p style={{ fontSize: "9px", color: T.textMuted, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>{item.description}</p>
          {item.preparationTime > 0 && <p style={{ fontSize: "8px", color: T.emerald, margin: "2px 0 0", fontWeight: 700 }}>⏱ {item.preparationTime} min</p>}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px", gap: "6px" }}>
          <span style={{ fontWeight: 900, fontSize: "13px", color: T.emerald, flexShrink: 0 }}>₹{item.price}</span>
          {item.isAvailable && (
            cartQty === 0 ? (
              <button onClick={() => onAdd(item)} style={{ background: T.ivory, color: T.emerald, border: `2px solid ${T.emerald}`, borderRadius: "8px", padding: "4px 12px", fontWeight: 900, fontSize: "10px", cursor: "pointer", letterSpacing: "0.3px", boxShadow: `0 2px 5px rgba(15,61,46,0.15)`, fontFamily: "inherit", flexShrink: 0 }}>ADD +</button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", background: T.emerald, borderRadius: "8px", overflow: "hidden", boxShadow: `0 2px 6px rgba(15,61,46,0.25)`, flexShrink: 0 }}>
                <button onClick={() => onRemove(item._id)} style={{ width: "24px", height: "24px", background: "none", border: "none", color: T.gold, fontWeight: 900, fontSize: "14px", cursor: "pointer" }}>−</button>
                <span style={{ fontWeight: 900, color: T.gold, fontSize: "11px", minWidth: "14px", textAlign: "center" }}>{cartQty}</span>
                <button onClick={() => onAdd(item)} style={{ width: "24px", height: "24px", background: "none", border: "none", color: T.gold, fontWeight: 900, fontSize: "14px", cursor: "pointer" }}>+</button>
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
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,61,46,0.7)", zIndex: 40, opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none", transition: "opacity 0.35s", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.ivory, zIndex: 50, borderRadius: "22px 22px 0 0", maxHeight: "85vh", display: "flex", flexDirection: "column", transform: isOpen ? "translateY(0)" : "translateY(100%)", transition: "transform 0.4s cubic-bezier(0.32,0.72,0,1)", boxShadow: "0 -18px 40px rgba(15,61,46,0.2)" }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})`, borderRadius: "3px 3px 0 0" }} />
        <div style={{ display: "flex", justifyContent: "center", padding: "7px 0 2px" }}>
          <div style={{ width: "28px", height: "3px", borderRadius: "99px", background: T.creamDark }} />
        </div>

        <div style={{ padding: "5px 14px 10px", borderBottom: `1px solid ${T.creamDark}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <h2 style={{ fontWeight: 900, fontSize: "17px", color: T.emerald, margin: 0, fontFamily: "'Playfair Display', serif" }}>Your Order</h2>
                <span style={{ background: T.emerald, color: T.gold, fontSize: "9px", padding: "2px 7px", borderRadius: "99px", fontWeight: 900 }}>{totalItems}</span>
              </div>
              {existingOrder && <p style={{ fontSize: "10px", color: T.textMuted, margin: "2px 0 0", fontWeight: 700 }}>Adding to #{existingOrder.orderNumber}</p>}
            </div>
            <button onClick={onClose} style={{ width: "28px", height: "28px", borderRadius: "50%", background: T.cream, border: `1px solid ${T.creamDark}`, cursor: "pointer", fontSize: "12px", color: T.textMuted }}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "9px 11px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "6px" }}>🛒</div>
              <p style={{ fontWeight: 800, fontSize: "13px", color: T.emerald }}>Cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.menuItemId} style={{ background: T.cream, borderRadius: "12px", padding: "9px 10px", marginBottom: "6px", border: `1px solid ${T.creamDark}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", gap: "6px" }}>
                <span style={{ fontWeight: 800, fontSize: "11px", color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                <span style={{ fontWeight: 900, fontSize: "11px", color: T.emerald, flexShrink: 0 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", background: T.emerald, borderRadius: "7px", overflow: "hidden" }}>
                  <button onClick={() => onUpdateQty(item.menuItemId, -1)} style={{ width: "24px", height: "24px", background: "none", border: "none", color: T.gold, fontWeight: 900, fontSize: "14px", cursor: "pointer" }}>−</button>
                  <span style={{ fontWeight: 900, color: T.gold, fontSize: "11px", minWidth: "16px", textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => onUpdateQty(item.menuItemId, 1)} style={{ width: "24px", height: "24px", background: "none", border: "none", color: T.gold, fontWeight: 900, fontSize: "14px", cursor: "pointer" }}>+</button>
                </div>
                <span style={{ fontSize: "9px", color: T.textDim, fontWeight: 600 }}>₹{item.price} each</span>
              </div>
              <input type="text" placeholder="Add note..." value={item.notes} onChange={e => onUpdateNote(item.menuItemId, e.target.value)}
                style={{ width: "100%", marginTop: "5px", fontSize: "10px", padding: "5px 8px", borderRadius: "6px", border: `1px solid ${T.creamDark}`, background: T.ivory, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: "0 11px 18px", borderTop: `1px solid ${T.creamDark}` }}>
            <div style={{ background: T.cream, borderRadius: "12px", padding: "9px 11px", margin: "9px 0 7px", border: `1px solid ${T.creamDark}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: T.textMuted, marginBottom: "3px" }}>
                <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: T.textMuted, paddingBottom: "5px", borderBottom: `1px dashed ${T.creamDark}`, marginBottom: "5px" }}>
                <span>GST (5%)</span><span>₹{tax.toFixed(0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "14px", color: T.emerald }}>
                <span>Total</span>
                <span>₹{total.toFixed(0)}</span>
              </div>
            </div>
            <button onClick={onPlaceOrder} disabled={isPlacing} style={{ width: "100%", background: isPlacing ? "#d1d5db" : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid}, ${T.emeraldLight})`, color: isPlacing ? "#9ca3af" : T.gold, border: "none", borderRadius: "12px", padding: "13px", fontWeight: 900, fontSize: "13px", cursor: isPlacing ? "not-allowed" : "pointer", boxShadow: isPlacing ? "none" : `0 7px 18px rgba(15,61,46,0.35)`, fontFamily: "inherit" }}>
              {isPlacing ? "☕ Placing..." : `☕ Place Order • ₹${total.toFixed(0)}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

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
    <div style={{ position: "sticky", top: 0, zIndex: 45, background: isUrgent ? "linear-gradient(135deg, #7f1d1d, #C0392B)" : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, animation: isUrgent ? "pulse-urgent 1s infinite" : "none", borderBottom: `2px solid ${isUrgent ? "#ef4444" : T.gold}`, boxShadow: "0 3px 10px rgba(0,0,0,0.2)" }}>
      <div style={{ padding: "7px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "7px" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "7px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${isUrgent ? "white" : T.gold}`, flexShrink: 0 }}>
            <span style={{ fontWeight: 900, fontSize: "10px", color: "white", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}>
              {mins}:{String(secs).padStart(2, "0")}
            </span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontWeight: 900, fontSize: "10px", color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isUrgent ? "⚠️ Cancel window ending!" : "Cancel within 2 minutes"}
            </p>
            <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.75)", margin: "1px 0 0", fontWeight: 600 }}>
              #{order.orderNumber}
            </p>
          </div>
        </div>

        <button onClick={handleCancel} disabled={cancelling} style={{ flexShrink: 0, background: "white", color: isUrgent ? T.danger : T.emerald, border: "none", borderRadius: "7px", padding: "5px 10px", fontWeight: 900, fontSize: "9px", cursor: cancelling ? "wait" : "pointer", fontFamily: "inherit", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}>
          {cancelling ? "..." : "✕ CANCEL"}
        </button>
      </div>
      <div style={{ height: "2px", background: "rgba(0,0,0,0.2)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "white", transition: "width 1s linear" }} />
      </div>
    </div>
  );
}

function OrderReadyAlert({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(74,139,74,0.4)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(8px)", animation: "fadeIn 0.3s ease" }}>
      <div style={{ background: T.ivory, borderRadius: "18px", padding: "20px 16px", textAlign: "center", maxWidth: "280px", width: "100%", border: `3px solid ${T.success}`, boxShadow: "0 18px 50px rgba(74,139,74,0.5)", animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ fontSize: "48px", marginBottom: "6px", animation: "bounce-dot 1s infinite" }}>🔔</div>
        <h2 style={{ fontWeight: 900, fontSize: "18px", color: T.success, margin: "0 0 3px", fontFamily: "'Playfair Display', serif" }}>Order is Ready!</h2>
        <p style={{ color: T.textMuted, fontSize: "11px", margin: "0 0 10px" }}>
          <strong style={{ color: T.emerald }}>#{order.orderNumber}</strong>
        </p>
        <button onClick={onClose} style={{ width: "100%", padding: "10px", borderRadius: "9px", border: "none", background: `linear-gradient(135deg, #2d6a2d, ${T.success})`, color: "white", fontWeight: 900, cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>
          Got it ✓
        </button>
      </div>
    </div>
  );
}

export default function CustomerOrderPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [table, setTable] = useState<Table | null>(null);
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
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
    if (customerData) placeOrder(customerData);
    else setShowCustomerPopup(true);
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: T.cream }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "42px", marginBottom: "10px" }}>☕</div>
          <h2 style={{ fontWeight: 900, color: T.emerald, margin: "0 0 5px", fontSize: "16px" }}>Something went wrong</h2>
          <p style={{ color: T.textMuted, marginBottom: "14px", fontSize: "12px" }}>{error}</p>
          <button onClick={() => router.push("/")} style={{ background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, border: "none", borderRadius: "10px", padding: "11px 22px", fontWeight: 800, cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.cream, display: "flex", flexDirection: "column", width: "100%", margin: "0 auto", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        html, body { overflow-x: hidden; margin: 0; padding: 0; max-width: 100vw; width: 100%; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; font-family: 'Nunito', sans-serif; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes slideDown { from{transform:translateX(-50%) translateY(-16px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
        @keyframes slideUp { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes bounce-dot { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes pulse-urgent { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.15)} }
        @keyframes gold-shine { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        ::-webkit-scrollbar { display:none; }
        button,input { font-family:'Nunito',sans-serif; }
      `}</style>

      {showWelcomeBack && welcomeMessage && <WelcomeBackPopup message={welcomeMessage} onClose={() => setShowWelcomeBack(false)} />}
      {showCustomerPopup && <CustomerDataPopup onSubmit={handleCustomerDataSubmit} onSkip={() => { setShowCustomerPopup(false); placeOrder(); }} />}
      {readyAlertOrder && <OrderReadyAlert order={readyAlertOrder} onClose={() => setReadyAlertOrder(null)} />}

      {existingOrder && !["settled", "cancelled"].includes(existingOrder.status) && (
        <TopCancelBar order={existingOrder} onCancelled={handleCancelled} />
      )}

      <header style={{ background: `linear-gradient(180deg, ${T.emerald} 0%, ${T.emeraldMid} 100%)`, position: "sticky", top: 0, zIndex: 30, boxShadow: `0 2px 10px rgba(15,61,46,0.3)` }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})`, backgroundSize: "200% 100%", animation: "gold-shine 3s linear infinite" }} />
        <div style={{ padding: "9px 10px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", overflow: "hidden", flexShrink: 0, background: T.emerald, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src="/logo-small.png" alt="GB" style={{ width: "34px", height: "34px", objectFit: "contain" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontWeight: 800, fontSize: "15px", color: T.gold, margin: 0, fontFamily: "'Playfair Display', serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Golden Beans</h1>
              <p style={{ fontSize: "9px", color: "rgba(212,165,116,0.7)", margin: 0, fontWeight: 700 }}>{table ? `TABLE ${table.tableNumber}` : "..."}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(74,139,74,0.2)", border: `1px solid rgba(74,139,74,0.4)`, borderRadius: "99px", padding: "2px 7px", flexShrink: 0 }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: T.success }} />
            <span style={{ fontSize: "9px", color: T.success, fontWeight: 800 }}>🌿 VEG</span>
          </div>
        </div>

        <div style={{ padding: "0 10px 7px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", background: searchFocused ? T.ivory : "rgba(255,255,255,0.1)", border: `1.5px solid ${searchFocused ? T.gold : "rgba(212,165,116,0.3)"}`, borderRadius: "10px", padding: "8px 10px", transition: "all 0.25s ease" }}>
            <span style={{ fontSize: "12px", flexShrink: 0 }}>🔍</span>
            <input type="text" placeholder="Search dishes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              style={{ flex: 1, background: "none", border: "none", fontSize: "12px", color: searchFocused ? T.text : "rgba(255,255,255,0.85)", fontWeight: 600, outline: "none", minWidth: 0 }}
            />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "15px", height: "15px", cursor: "pointer", fontSize: "8px", color: "white", flexShrink: 0 }}>✕</button>}
          </div>
        </div>

        {!searchQuery && menu.length > 0 && (
          <div style={{ display: "flex", gap: "4px", overflowX: "auto", padding: "0 10px 9px", scrollbarWidth: "none" }}>
            {menu.map((cat, idx) => (
              <button key={cat._id} onClick={() => {
                setActiveCategory(cat._id);
                categoryRefs.current[cat._id]?.scrollIntoView({ behavior: "smooth", block: "start" });
              }} style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: "4px",
                padding: "5px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 800,
                border: `1.5px solid ${activeCategory === cat._id ? T.gold : "rgba(212,165,116,0.3)"}`,
                cursor: "pointer",
                background: activeCategory === cat._id ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : "rgba(255,255,255,0.08)",
                color: activeCategory === cat._id ? T.emerald : T.gold,
                boxShadow: activeCategory === cat._id ? `0 2px 8px rgba(212,165,116,0.4)` : "none",
                animation: `slideUp 0.3s ${idx * 0.06}s ease both`,
                whiteSpace: "nowrap",
              }}>
                <span style={{ fontSize: "11px" }}>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main style={{ flex: 1, overflowY: "auto", paddingBottom: "64px" }}>
        {existingOrder && !["settled", "cancelled"].includes(existingOrder.status) && (
          <LiveOrderTracker order={existingOrder} queuePosition={queuePosition} />
        )}

        {activeTab === "menu" && (
          <div style={{ padding: "6px 0" }}>
            {loading ? (
              <div style={{ padding: "10px" }}>{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>
            ) : filteredMenu.length === 0 ? (
              <div style={{ textAlign: "center", padding: "42px 16px" }}>
                <div style={{ fontSize: "38px", marginBottom: "6px" }}>☕</div>
                <p style={{ fontWeight: 800, color: T.emerald, fontSize: "13px" }}>Nothing found</p>
              </div>
            ) : filteredMenu.map((cat, catIdx) => (
              <div key={cat._id} ref={el => { categoryRefs.current[cat._id] = el; }} style={{ marginBottom: "4px", animation: `slideUp 0.4s ${catIdx * 0.08}s ease both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 10px 7px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "9px", background: CATEGORY_BG[cat.name] || `linear-gradient(145deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", boxShadow: "0 2px 8px rgba(15,61,46,0.2)", flexShrink: 0 }}>{cat.icon}</div>
                  <div>
                    <h2 style={{ fontWeight: 900, fontSize: "14px", color: T.emerald, margin: 0, fontFamily: "'Playfair Display', serif" }}>{cat.name}</h2>
                    <p style={{ fontSize: "9px", color: T.goldDark, margin: 0, fontWeight: 700 }}>{cat.items.length} items</p>
                  </div>
                </div>
                <div style={{ padding: "0 10px" }}>
                  {cat.items.map(item => (
                    <MenuItemCard key={item._id} item={item} cartQty={cart.find(c => c.menuItemId === item._id)?.quantity || 0} onAdd={addToCart} onRemove={removeFromCart} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "order" && (
          <div style={{ padding: "10px" }}>
            {!existingOrder ? (
              <div style={{ textAlign: "center", padding: "42px 16px" }}>
                <div style={{ fontSize: "42px", marginBottom: "8px" }}>☕</div>
                <p style={{ fontWeight: 900, fontSize: "14px", color: T.emerald, fontFamily: "'Playfair Display', serif" }}>No Active Order</p>
                <button onClick={() => setActiveTab("menu")} style={{ marginTop: "10px", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, border: "none", borderRadius: "10px", padding: "11px 22px", fontWeight: 900, cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>Browse Menu</button>
              </div>
            ) : (
              <LiveOrderTracker order={existingOrder} queuePosition={queuePosition} />
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "7px" }}>
            <div style={{ background: `linear-gradient(145deg, ${T.emerald}, ${T.emeraldMid})`, borderRadius: "18px", padding: "20px 14px", textAlign: "center" }}>
              <img src="/logo-header.png" alt="GB" style={{ width: "80px", height: "80px", objectFit: "contain", marginBottom: "8px" }} />
              <h2 style={{ fontWeight: 800, fontSize: "18px", color: T.gold, margin: "0 0 2px", fontFamily: "'Playfair Display', serif" }}>Golden Beans</h2>
              <p style={{ color: "rgba(212,165,116,0.7)", fontSize: "10px", margin: "0 0 5px", fontWeight: 600 }}>Cafe & Bistro</p>
              <span style={{ background: "rgba(74,139,74,0.25)", color: T.success, fontSize: "9px", padding: "2px 8px", borderRadius: "99px", fontWeight: 800 }}>🌿 100% Pure Vegetarian</span>
            </div>
            {[
              { icon: "📍", label: "ADDRESS", value: "123, MG Road, Surat" },
              { icon: "📞", label: "PHONE", value: "+91 98765 43210" },
              { icon: "🕐", label: "HOURS", value: "7:00 AM – 11:00 PM" },
              { icon: "📶", label: "WI-FI", value: "GoldenBeans_Guest" },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ background: T.ivory, borderRadius: "10px", padding: "9px 11px", display: "flex", alignItems: "center", gap: "9px", boxShadow: "0 2px 6px rgba(15,61,46,0.05)", border: `1px solid ${T.creamDark}` }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>{icon}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: "8px", color: T.emerald, margin: "0 0 1px", fontWeight: 800, letterSpacing: "0.8px" }}>{label}</p>
                  <p style={{ fontSize: "11px", color: T.text, margin: 0, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.ivory, borderTop: `2px solid ${T.creamDark}`, zIndex: 30, display: "flex", boxShadow: `0 -5px 15px rgba(15,61,46,0.1)` }}>
        {[
          { id: "menu", label: "Menu", icon: "🍽️" },
          { id: "order", label: "Order", icon: "📋" },
          { id: "info", label: "About", icon: "☕" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            padding: "7px 0 6px", background: "none", border: "none", cursor: "pointer",
            color: activeTab === tab.id ? T.emerald : T.textDim, position: "relative",
          }}>
            {activeTab === tab.id && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "22px", height: "3px", background: `linear-gradient(90deg, ${T.emerald}, ${T.emeraldLight})`, borderRadius: "0 0 4px 4px" }} />}
            <span style={{ fontSize: "18px", transform: activeTab === tab.id ? "scale(1.1)" : "scale(1)", transition: "transform 0.2s" }}>{tab.icon}</span>
            <span style={{ fontSize: "9px", fontWeight: 800, marginTop: "1px" }}>{tab.label}</span>
            {tab.id === "order" && existingOrder && !["settled", "cancelled"].includes(existingOrder.status) && <div style={{ position: "absolute", top: "5px", right: "calc(50% - 14px)", width: "5px", height: "5px", borderRadius: "50%", background: T.gold, border: "2px solid white" }} />}
          </button>
        ))}
        <button onClick={() => cart.length > 0 && setIsCartOpen(true)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          padding: "7px 0 6px", background: "none", border: "none",
          cursor: cart.length > 0 ? "pointer" : "default",
          color: cart.length > 0 ? T.emerald : T.textDim, position: "relative",
        }}>
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: "18px" }}>🛒</span>
            {totalCartItems > 0 && <span style={{ position: "absolute", top: "-3px", right: "-7px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.emerald, fontSize: "8px", width: "14px", height: "14px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, border: "2px solid white" }}>{totalCartItems}</span>}
          </div>
          <span style={{ fontSize: "9px", fontWeight: 800, marginTop: "1px" }}>
            {totalCartItems > 0 ? `₹${totalCartValue.toFixed(0)}` : "Cart"}
          </span>
        </button>
      </nav>

      <CartDrawer cart={cart} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onUpdateQty={updateQty} onUpdateNote={updateNote} onPlaceOrder={handlePlaceOrderClick} isPlacing={isPlacing} existingOrder={existingOrder} />
    </div>
  );
}
