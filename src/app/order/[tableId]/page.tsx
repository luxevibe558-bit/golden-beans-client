"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { menuApi, orderApi, tableApi } from "@/lib/api";
import { getThumbnailUrl, getHeroUrl } from "@/lib/cloudinary";
import { Icons, Pill, Button, Skeleton } from "@/components/PremiumUI";
import LiveOrderTracker from "@/components/LiveOrderTracker";
import type { MenuCategory, MenuItem, CartItem, Table, Order, VariantGroup } from "@/types";

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
  text: "#1A1208",
  textMuted: "#7A6B54",
  textDim: "#A89B80",
  border: "#E5DCC9",
  success: "#4A8B4A",
  danger: "#C0392B",
};

interface ExtendedCartItem extends CartItem {
  variants?: { groupName: string; selected: string[]; }[];
  totalPriceModifier?: number;
  imageUrl?: string;
}

type BottomTab = "menu" | "order" | "cart" | "info";

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

// ─────────── Image Placeholder ───────────
function ItemImagePlaceholder({ name, size = 100 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size,
      background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
      borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: T.gold, fontWeight: 800, fontSize: size * 0.25,
      fontFamily: "'Playfair Display', serif",
      letterSpacing: "0.03em",
      boxShadow: "inset 0 -3px 8px rgba(0,0,0,0.2), 0 4px 12px rgba(15,61,46,0.15)",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─────────── Vertical Category Tabs ───────────
function VerticalCategoryTabs({ categories, activeCategoryId, onSelect }: {
  categories: MenuCategory[];
  activeCategoryId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{
      width: "44px", flexShrink: 0,
      background: T.emerald,
      borderRadius: "0 16px 16px 0",
      display: "flex", flexDirection: "column",
      paddingTop: "8px", paddingBottom: "8px",
      boxShadow: "2px 0 12px rgba(15,61,46,0.15)",
      position: "sticky", top: "120px",
      maxHeight: "calc(100vh - 200px)",
      overflowY: "auto",
    }} className="scrollbar-hide">
      {categories.map((cat, idx) => {
        const isActive = activeCategoryId === cat._id;
        return (
          <button
            key={cat._id}
            onClick={() => onSelect(cat._id)}
            style={{
              padding: "16px 4px",
              background: isActive ? T.gold : "transparent",
              color: isActive ? T.emerald : "rgba(212,165,116,0.7)",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              fontWeight: isActive ? 800 : 600,
              fontSize: "11px",
              letterSpacing: "0.05em",
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transition: "all 200ms ease",
              borderRadius: isActive ? "10px" : "0",
              margin: "2px 4px",
              animation: `gb-fadeInUp 0.3s ${idx * 0.05}s ease both`,
            }}
          >
            {cat.name.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

// ─────────── Product Card ───────────
function ProductCard({ item, onTap, cartQty }: {
  item: MenuItem;
  onTap: () => void;
  cartQty: number;
}) {
  return (
    <div
      onClick={onTap}
      style={{
        background: T.ivory,
        borderRadius: "20px",
        padding: "16px 12px 12px",
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(15,61,46,0.06), 0 1px 4px rgba(15,61,46,0.04)",
        transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        border: `1px solid ${T.creamDark}`,
        overflow: "hidden",
      }}
      onMouseDown={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = ""; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
      onTouchStart={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
      onTouchEnd={e => { e.currentTarget.style.transform = ""; }}
    >
      {item.tags?.includes("bestseller") && (
        <div style={{
          position: "absolute", top: "8px", left: "8px",
          background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
          padding: "3px 8px",
          borderRadius: "99px",
          fontSize: "9px", fontWeight: 800,
          color: T.emerald, letterSpacing: "0.04em",
          zIndex: 2,
          display: "flex", alignItems: "center", gap: "3px",
        }}>
          <Icons.Sparkle size={9} /> BEST
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", position: "relative" }}>
        {item.imageUrl ? (
          <div style={{
            width: "100px", height: "100px",
            borderRadius: "50%",
            overflow: "hidden",
            border: `3px solid ${T.cream}`,
            boxShadow: "0 6px 16px rgba(15,61,46,0.15)",
            background: T.cream,
          }}>
            <img
              src={getThumbnailUrl(item.imageUrl)}
              alt={item.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
              draggable={false}
              loading="lazy"
            />
          </div>
        ) : (
          <ItemImagePlaceholder name={item.name} size={100} />
        )}

        <div style={{
          position: "absolute", bottom: "0", right: "calc(50% - 50px - 4px)",
          width: "20px", height: "20px",
          background: T.success, borderRadius: "5px",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid white",
        }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white" }} />
        </div>
      </div>

      <p style={{
        fontWeight: 800, fontSize: "14px",
        color: T.text, margin: "0 0 4px",
        textAlign: "center",
        fontFamily: "'Inter', sans-serif",
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{item.name}</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", padding: "0 4px" }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 800, fontSize: "16px",
          color: T.emerald,
          fontVariantNumeric: "tabular-nums",
        }}>₹{item.price}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span style={{ color: T.gold, fontSize: "11px" }}>★</span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
            {item.rating?.toFixed(1) || "4.5"}
          </span>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onTap(); }}
        style={{
          width: "100%",
          background: cartQty > 0
            ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`
            : `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
          color: cartQty > 0 ? T.gold : T.emerald,
          border: "none",
          borderRadius: "12px",
          padding: "10px",
          fontWeight: 800, fontSize: "12px",
          cursor: "pointer",
          letterSpacing: "0.02em",
          boxShadow: cartQty > 0
            ? "0 4px 12px rgba(15,61,46,0.3)"
            : "0 4px 12px rgba(212,165,116,0.4)",
          fontFamily: "'Inter', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
          transition: "all 150ms ease",
        }}
      >
        {cartQty > 0 ? (
          <><Icons.Check size={12} /> ADDED ({cartQty})</>
        ) : (
          <><Icons.Plus size={12} /> ADD</>
        )}
      </button>
    </div>
  );
}

// ─────────── Product Detail Modal ───────────
function ProductDetailModal({ item, isOpen, onClose, onAddToCart }: {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, variants: { groupName: string; selected: string[]; }[], priceModifier: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (item) {
      setQuantity(1);
      const defaults: Record<string, string[]> = {};
      item.variantGroups?.forEach(group => {
        const def = group.options.find(o => o.isDefault);
        if (def) defaults[group.name] = [def.name];
        else if (group.required && group.options.length > 0) defaults[group.name] = [group.options[0].name];
        else defaults[group.name] = [];
      });
      setSelections(defaults);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const toggleVariant = (groupName: string, optionName: string, multiSelect: boolean) => {
    setSelections(prev => {
      const current = prev[groupName] || [];
      if (multiSelect) {
        return {
          ...prev,
          [groupName]: current.includes(optionName)
            ? current.filter(n => n !== optionName)
            : [...current, optionName],
        };
      } else {
        return { ...prev, [groupName]: [optionName] };
      }
    });
  };

  let priceModifier = 0;
  item.variantGroups?.forEach(group => {
    const selected = selections[group.name] || [];
    selected.forEach(name => {
      const opt = group.options.find(o => o.name === name);
      if (opt) priceModifier += opt.priceModifier;
    });
  });

  const itemTotal = (item.price + priceModifier) * quantity;

  const variantSelections = Object.entries(selections).map(([groupName, selected]) => ({
    groupName, selected,
  }));

  const handleAdd = () => {
    onAddToCart(item, quantity, variantSelections, priceModifier);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,61,46,0.75)",
        zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        animation: "gb-fadeIn 200ms ease-out",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.ivory,
          width: "100%", maxWidth: "480px",
          maxHeight: "92vh",
          borderRadius: "28px 28px 0 0",
          display: "flex", flexDirection: "column",
          animation: "gb-slideUpModal 350ms cubic-bezier(0.32, 0.72, 0, 1)",
          overflow: "hidden",
        }}
      >
        <div style={{
          position: "relative",
          height: "260px",
          background: item.imageUrl ? "transparent" : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
          overflow: "hidden",
        }}>
          {item.imageUrl ? (
            <img
              src={getHeroUrl(item.imageUrl)}
              alt={item.name}
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ItemImagePlaceholder name={item.name} size={140} />
            </div>
          )}

          <div style={{
            position: "absolute", bottom: "-1px", left: 0, right: 0,
            height: "32px", background: T.ivory, borderRadius: "32px 32px 0 0",
          }} />

          <button
            onClick={onClose}
            style={{
              position: "absolute", top: "16px", right: "16px",
              width: "36px", height: "36px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(10px)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: T.emerald,
              boxShadow: "0 4px 12px rgba(15,61,46,0.2)",
            }}
          >
            <Icons.Close size={18} />
          </button>

          <div style={{ position: "absolute", top: "16px", left: "16px", display: "flex", gap: "6px" }}>
            <Pill variant="success" size="sm" icon={<Icons.Leaf size={10} />}>VEG</Pill>
            {item.tags?.includes("bestseller") && (
              <Pill variant="gold" size="sm" icon={<Icons.Sparkle size={10} />}>BESTSELLER</Pill>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px", gap: "12px" }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "24px", fontWeight: 800,
              color: T.text, margin: 0, letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}>{item.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, background: T.cream, padding: "4px 10px", borderRadius: "99px" }}>
              <span style={{ color: T.gold, fontSize: "13px" }}>★</span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: T.emerald, fontFamily: "'DM Sans', sans-serif" }}>
                {item.rating?.toFixed(1) || "4.5"}
              </span>
            </div>
          </div>

          {item.description && (
            <p style={{ fontSize: "13px", color: T.textMuted, margin: "0 0 16px", lineHeight: 1.5, fontWeight: 500 }}>
              {item.description}
            </p>
          )}

          {item.variantGroups?.map((group: VariantGroup, gIdx: number) => (
            <div key={group.name} style={{ marginBottom: "20px", animation: `gb-fadeInUp 0.3s ${gIdx * 0.08}s ease both` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "16px", fontWeight: 700,
                  color: T.emerald, margin: 0, letterSpacing: "-0.01em",
                }}>{group.name}</h3>
                {group.required && <Pill variant="danger" size="sm">Required</Pill>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: group.options.length > 3 ? "1fr 1fr" : `repeat(${group.options.length}, 1fr)`, gap: "8px" }}>
                {group.options.map(opt => {
                  const isSelected = selections[group.name]?.includes(opt.name);
                  return (
                    <button
                      key={opt.name}
                      onClick={() => toggleVariant(group.name, opt.name, group.multiSelect)}
                      style={{
                        padding: "12px",
                        background: isSelected ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.cream,
                        border: `2px solid ${isSelected ? T.emerald : T.creamDark}`,
                        borderRadius: "14px",
                        cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                        transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                        fontFamily: "'Inter', sans-serif",
                        boxShadow: isSelected ? "0 4px 12px rgba(15,61,46,0.25)" : "none",
                      }}
                    >
                      <span style={{
                        fontWeight: 800, fontSize: "13px",
                        color: isSelected ? T.gold : T.text,
                      }}>{opt.name}</span>
                      {opt.priceModifier !== 0 && (
                        <span style={{
                          fontSize: "11px",
                          color: isSelected ? "rgba(212,165,116,0.7)" : T.textMuted,
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 600,
                        }}>
                          {opt.priceModifier > 0 ? `+₹${opt.priceModifier}` : `-₹${Math.abs(opt.priceModifier)}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 20px 20px", borderTop: `1px solid ${T.border}`, background: T.ivory }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", color: T.textMuted, fontWeight: 700 }}>Quantity</span>
            <div style={{
              display: "flex", alignItems: "center",
              background: T.emerald,
              borderRadius: "99px", overflow: "hidden",
              boxShadow: "0 4px 12px rgba(15,61,46,0.25)",
            }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ width: "36px", height: "36px", background: "none", border: "none", color: T.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icons.Minus size={14} />
              </button>
              <span style={{
                minWidth: "30px", textAlign: "center",
                color: T.gold, fontWeight: 900, fontSize: "16px",
                fontFamily: "'DM Sans', sans-serif",
              }}>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{ width: "36px", height: "36px", background: "none", border: "none", color: T.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icons.Plus size={14} />
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            style={{
              width: "100%",
              background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
              color: T.gold, border: "none", borderRadius: "16px",
              padding: "16px 22px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800, fontSize: "15px",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(15,61,46,0.35)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <span>Add to Cart</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontVariantNumeric: "tabular-nums" }}>₹{itemTotal.toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────── Customer Popup ───────────
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
      if (!name.trim() || phone.length < 10) return alert("Please enter valid name and 10-digit phone");
      setStep(2);
    } else {
      onSubmit({ name, phone, birthdate, anniversary });
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,61,46,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxWidth: "400px", background: T.ivory, borderRadius: "20px", padding: "0 0 16px", animation: "gb-scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: "0 20px 50px rgba(15,61,46,0.4)" }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})`, borderRadius: "20px 20px 0 0" }} />
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "32px", marginBottom: "4px" }}>{step === 1 ? "👋" : "🎂"}</div>
            <h2 style={{ fontWeight: 800, fontSize: "20px", color: T.emerald, margin: "0 0 3px", fontFamily: "'Playfair Display', serif" }}>
              {step === 1 ? "Welcome!" : "Special dates?"}
            </h2>
            <p style={{ fontSize: "12px", color: T.textMuted, margin: 0 }}>
              {step === 1 ? "Quick detail for personalization" : "We'll surprise you! 🎁"}
            </p>
          </div>

          {step === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "4px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Your Name *</label>
                <input type="text" placeholder="e.g. Nirav" value={name} onChange={e => setName(e.target.value)} autoFocus
                  style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", border: `2px solid ${name ? T.gold : T.creamDark}`, background: T.cream, color: T.text, fontSize: "16px", fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "4px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Mobile Number *</label>
                <input type="tel" placeholder="10-digit number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", border: `2px solid ${phone.length === 10 ? T.gold : T.creamDark}`, background: T.cream, color: T.text, fontSize: "16px", fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "4px", letterSpacing: "0.05em", textTransform: "uppercase" }}>🎂 Birthday (Optional)</label>
                <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)}
                  style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", border: `2px solid ${birthdate ? T.gold : T.creamDark}`, background: T.cream, color: T.text, fontSize: "16px", fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "4px", letterSpacing: "0.05em", textTransform: "uppercase" }}>💑 Anniversary (Optional)</label>
                <input type="date" value={anniversary} onChange={e => setAnniversary(e.target.value)}
                  style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", border: `2px solid ${anniversary ? T.gold : T.creamDark}`, background: T.cream, color: T.text, fontSize: "16px", fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }}
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <Button variant="secondary" fullWidth onClick={onSkip}>Skip</Button>
            <Button variant="primary" fullWidth onClick={handleSubmit}>
              {step === 1 ? "Continue →" : "Place Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── Top Cancel Bar ───────────
function TopCancelBar({ order, onCancelled }: { order: Order; onCancelled: () => void }) {
  const placedAt = new Date(order.createdAt).getTime();
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, 120 - Math.floor((Date.now() - placedAt) / 1000))
  );
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setSecondsLeft(Math.max(0, 120 - Math.floor((Date.now() - placedAt) / 1000)));
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
    <div style={{ position: "sticky", top: 0, zIndex: 45, background: isUrgent ? "linear-gradient(135deg, #7f1d1d, #C0392B)" : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, borderBottom: `2px solid ${isUrgent ? "#ef4444" : T.gold}` }}>
      <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${isUrgent ? "white" : T.gold}` }}>
            <span style={{ fontWeight: 800, fontSize: "10px", color: "white", fontFamily: "'DM Sans', sans-serif", fontVariantNumeric: "tabular-nums" }}>{mins}:{String(secs).padStart(2, "0")}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: "11px", color: "white", margin: 0 }}>
              {isUrgent ? "⚠️ Cancel ending!" : "Cancel within 2 min"}
            </p>
            <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.75)", margin: "1px 0 0", fontWeight: 600 }}>#{order.orderNumber}</p>
          </div>
        </div>
        <button onClick={handleCancel} disabled={cancelling} style={{ background: "white", color: isUrgent ? T.danger : T.emerald, border: "none", borderRadius: "8px", padding: "6px 12px", fontWeight: 800, fontSize: "10px", cursor: cancelling ? "wait" : "pointer", fontFamily: "'Inter', sans-serif" }}>
          {cancelling ? "..." : "✕ CANCEL"}
        </button>
      </div>
      <div style={{ height: "2px", background: "rgba(0,0,0,0.2)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "white", transition: "width 1s linear" }} />
      </div>
    </div>
  );
}

// ─────────── Cart Tab View ───────────
function CartView({ cart, onUpdateQty, onPlaceOrder, isPlacing }: {
  cart: ExtendedCartItem[];
  onUpdateQty: (key: string, delta: number) => void;
  onPlaceOrder: () => void;
  isPlacing: boolean;
}) {
  const subtotal = cart.reduce((s, i) => s + (i.price + (i.totalPriceModifier || 0)) * i.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{ padding: "16px 14px 100px" }}>
      <h2 style={{
        fontWeight: 800, fontSize: "22px", color: T.emerald, margin: "0 0 4px",
        fontFamily: "'Playfair Display', serif", letterSpacing: "-0.02em",
      }}>My Cart</h2>
      <p style={{ fontSize: "12px", color: T.textMuted, margin: "0 0 16px" }}>
        {totalItems > 0 ? `${totalItems} item${totalItems !== 1 ? "s" : ""} in cart` : "Cart is empty"}
      </p>

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: "80px", height: "80px", margin: "0 auto 16px", borderRadius: "20px", background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald }}>
            <Icons.Cart size={36} />
          </div>
          <p style={{ fontWeight: 800, fontSize: "16px", color: T.emerald, margin: "0 0 4px" }}>Your cart is empty</p>
          <p style={{ fontSize: "12px", color: T.textMuted, margin: 0 }}>Browse the menu to add items</p>
        </div>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.menuItemId + JSON.stringify(item.variants)} style={{
              background: T.ivory,
              borderRadius: "16px",
              padding: "12px",
              marginBottom: "10px",
              border: `1px solid ${T.creamDark}`,
              display: "flex",
              gap: "12px",
              boxShadow: "0 2px 6px rgba(15,61,46,0.05)",
            }}>
              <div style={{ flexShrink: 0 }}>
                {item.imageUrl ? (
                  <img src={getThumbnailUrl(item.imageUrl)} alt={item.name} draggable={false} style={{ width: "60px", height: "60px", borderRadius: "12px", objectFit: "cover", pointerEvents: "none" }} />
                ) : (
                  <ItemImagePlaceholder name={item.name} size={60} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: "14px", color: T.text, margin: "0 0 2px" }}>{item.name}</p>
                {item.variants && item.variants.length > 0 && item.variants.some(v => v.selected.length > 0) && (
                  <p style={{ fontSize: "10px", color: T.textMuted, margin: "0 0 4px", fontWeight: 600 }}>
                    {item.variants.flatMap(v => v.selected).join(", ")}
                  </p>
                )}
                <p style={{ fontWeight: 800, fontSize: "13px", color: T.emerald, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  ₹{((item.price + (item.totalPriceModifier || 0)) * item.quantity).toFixed(0)}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", background: T.emerald, borderRadius: "10px", overflow: "hidden", height: "fit-content", boxShadow: "0 3px 8px rgba(15,61,46,0.2)" }}>
                <button onClick={() => onUpdateQty(item.menuItemId + JSON.stringify(item.variants), -1)} style={{ width: "28px", height: "28px", background: "none", border: "none", color: T.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Minus size={12} /></button>
                <span style={{ fontWeight: 900, color: T.gold, fontSize: "12px", minWidth: "20px", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>{item.quantity}</span>
                <button onClick={() => onUpdateQty(item.menuItemId + JSON.stringify(item.variants), 1)} style={{ width: "28px", height: "28px", background: "none", border: "none", color: T.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Plus size={12} /></button>
              </div>
            </div>
          ))}

          <div style={{ background: T.ivory, borderRadius: "16px", padding: "14px", marginTop: "14px", border: `1px solid ${T.creamDark}`, boxShadow: "0 2px 6px rgba(15,61,46,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.textMuted, marginBottom: "5px" }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: T.text }}>₹{subtotal.toFixed(0)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.textMuted, paddingBottom: "9px", borderBottom: `1px dashed ${T.creamDark}`, marginBottom: "9px" }}>
              <span>Taxes (5%)</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: T.text }}>₹{tax.toFixed(0)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "16px", color: T.emerald }}>
              <span>Total</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontVariantNumeric: "tabular-nums" }}>₹{total.toFixed(0)}</span>
            </div>
          </div>

          <div style={{ marginTop: "14px" }}>
            <Button variant="primary" size="xl" fullWidth onClick={onPlaceOrder} loading={isPlacing}>
              Proceed to Checkout
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────── Order Tab View ───────────
function OrderView({ order, queuePosition }: { order: Order | null; queuePosition?: number }) {
  if (!order) {
    return (
      <div style={{ padding: "16px 14px 100px" }}>
        <h2 style={{
          fontWeight: 800, fontSize: "22px", color: T.emerald, margin: "0 0 4px",
          fontFamily: "'Playfair Display', serif", letterSpacing: "-0.02em",
        }}>My Orders</h2>
        <p style={{ fontSize: "12px", color: T.textMuted, margin: "0 0 16px" }}>Your active orders will appear here</p>

        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: "80px", height: "80px", margin: "0 auto 16px", borderRadius: "20px", background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald }}>
            <Icons.Receipt size={36} />
          </div>
          <p style={{ fontWeight: 800, fontSize: "16px", color: T.emerald, margin: "0 0 4px" }}>No active orders</p>
          <p style={{ fontSize: "12px", color: T.textMuted, margin: 0 }}>Place an order to see live tracking here</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: "100px" }}>
      <div style={{ padding: "16px 14px 0" }}>
        <h2 style={{
          fontWeight: 800, fontSize: "22px", color: T.emerald, margin: "0 0 4px",
          fontFamily: "'Playfair Display', serif", letterSpacing: "-0.02em",
        }}>My Order</h2>
        <p style={{ fontSize: "12px", color: T.textMuted, margin: "0 0 12px" }}>Live tracking</p>
      </div>
      <LiveOrderTracker order={order} queuePosition={queuePosition} />
    </div>
  );
}

// ─────────── Info Tab View ───────────
function InfoView({ table }: { table: Table | null }) {
  return (
    <div style={{ padding: "16px 14px 100px" }}>
      <h2 style={{
        fontWeight: 800, fontSize: "22px", color: T.emerald, margin: "0 0 4px",
        fontFamily: "'Playfair Display', serif", letterSpacing: "-0.02em",
      }}>About Us</h2>
      <p style={{ fontSize: "12px", color: T.textMuted, margin: "0 0 16px" }}>Golden Beans Cafe & Bistro</p>

      <div style={{ background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, borderRadius: "20px", padding: "20px", marginBottom: "12px", boxShadow: "0 8px 20px rgba(15,61,46,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <img src="/logo-small.png" alt="GB" style={{ width: "48px", height: "48px", borderRadius: "12px" }} draggable={false} />
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.gold, margin: 0, letterSpacing: "-0.02em" }}>
              Golden Beans
            </p>
            <p style={{ fontSize: "10px", color: "rgba(212,165,116,0.8)", margin: "2px 0 0", fontWeight: 600, letterSpacing: "0.1em" }}>
              CAFE & BISTRO
            </p>
          </div>
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.6 }}>
          Premium 100% pure vegetarian cafe in Surat. Handcrafted coffee, fresh snacks, and authentic flavors.
        </p>
      </div>

      {table && (
        <div style={{ background: T.ivory, borderRadius: "16px", padding: "14px", marginBottom: "12px", border: `1px solid ${T.creamDark}`, display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald }}>
            <Icons.ChairFill size={20} />
          </div>
          <div>
            <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>Your Table</p>
            <p style={{ fontWeight: 800, fontSize: "14px", color: T.emerald, margin: "2px 0 0" }}>Table {table.tableNumber}</p>
          </div>
        </div>
      )}

      <div style={{ background: T.ivory, borderRadius: "16px", padding: "14px", marginBottom: "12px", border: `1px solid ${T.creamDark}`, display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald }}>
          <Icons.Phone size={18} />
        </div>
        <div>
          <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>Contact</p>
          <p style={{ fontWeight: 800, fontSize: "14px", color: T.emerald, margin: "2px 0 0" }}>+91 XXXXX XXXXX</p>
        </div>
      </div>

      <div style={{ background: T.ivory, borderRadius: "16px", padding: "14px", marginBottom: "12px", border: `1px solid ${T.creamDark}`, display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald }}>
          <Icons.Location size={18} />
        </div>
        <div>
          <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>Location</p>
          <p style={{ fontWeight: 800, fontSize: "14px", color: T.emerald, margin: "2px 0 0" }}>Surat, Gujarat</p>
        </div>
      </div>

      <div style={{ marginTop: "20px", textAlign: "center", padding: "16px" }}>
        <Pill variant="success" size="md" icon={<Icons.Leaf size={11} />}>
          100% Pure Vegetarian
        </Pill>
      </div>
    </div>
  );
}

// ─────────── MAIN ───────────
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
  const [cart, setCart] = useState<ExtendedCartItem[]>([]);
  const [activeTab, setActiveTab] = useState<BottomTab>("menu");
  const [isPlacing, setIsPlacing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [customerData, setCustomerData] = useState<{ name: string; phone: string } | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

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
            kotSent: { title: "☕ Confirmed!", body: "Chef started preparing" },
            partially_ready: { title: "🔔 Almost Ready!", body: "Some items ready" },
            ready: { title: "✅ Ready!", body: "Waiter coming!" },
          };
          const msg = messages[newOrder.status];
          if (msg) {
            playNotificationBeep();
            showBrowserNotification(msg.title, msg.body);
          }
        }
        prevStatusRef.current = newOrder.status;
        setExistingOrder(newOrder);
      } catch { }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [existingOrder, tableId]);

  const queuePosition = existingOrder
    ? allOrders.filter(o => ["kotSent", "open"].includes(o.status) && o._id !== existingOrder._id)
      .filter(o => new Date(o.createdAt).getTime() < new Date(existingOrder.createdAt).getTime()).length
    : undefined;

  const handleAddToCart = (item: MenuItem, qty: number, variants: { groupName: string; selected: string[]; }[], modifier: number) => {
    const cartKey = item._id + JSON.stringify(variants);
    setCart(prev => {
      const existing = prev.find(c => (c.menuItemId + JSON.stringify(c.variants)) === cartKey);
      if (existing) {
        return prev.map(c => (c.menuItemId + JSON.stringify(c.variants)) === cartKey ? { ...c, quantity: c.quantity + qty } : c);
      }
      return [...prev, {
        menuItemId: item._id, name: item.name, price: item.price, quantity: qty,
        notes: "", isVeg: true, variants, totalPriceModifier: modifier,
        imageUrl: item.imageUrl,
      }];
    });
  };

  const updateQty = (cartKey: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(c => (c.menuItemId + JSON.stringify(c.variants)) === cartKey);
      if (!existing) return prev;
      if (existing.quantity + delta <= 0) {
        return prev.filter(c => (c.menuItemId + JSON.stringify(c.variants)) !== cartKey);
      }
      return prev.map(c => (c.menuItemId + JSON.stringify(c.variants)) === cartKey ? { ...c, quantity: c.quantity + delta } : c);
    });
  };

  const handlePlaceOrderClick = () => {
    if (customerData) placeOrder(customerData);
    else setShowCustomerPopup(true);
  };

  const handleCustomerDataSubmit = (data: { name: string; phone: string; birthdate: string; anniversary: string }) => {
    setCustomerData({ name: data.name, phone: data.phone });
    localStorage.setItem("gb_customer", JSON.stringify(data));
    setShowCustomerPopup(false);
    placeOrder(data);
  };

  const placeOrder = async (customer?: { name: string; phone: string }) => {
    if (cart.length === 0) return;
    setIsPlacing(true);
    try {
      const orderItems = cart.map(c => ({
        menuItemId: c.menuItemId,
        name: c.name,
        price: c.price + (c.totalPriceModifier || 0),
        quantity: c.quantity,
        notes: c.variants && c.variants.length > 0
          ? c.variants.flatMap(v => v.selected).join(", ")
          : c.notes,
        isVeg: c.isVeg,
      }));
      const res = await orderApi.createOrder({
        tableId, items: orderItems, createdBy: "customer",
        customerName: customer?.name || "",
        customerPhone: customer?.phone || "",
      });
      const newOrder: Order = res.data.data;
      setCart([]);
      setExistingOrder(newOrder);
      prevStatusRef.current = newOrder.status;
      localStorage.setItem("gb_active_table", tableId);
      localStorage.setItem("gb_active_order", newOrder._id);
      setActiveTab("order"); // Switch to Order tab automatically
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to place order");
    } finally { setIsPlacing(false); }
  };

  const handleCancelled = () => { setExistingOrder(null); prevStatusRef.current = null; };

  const totalCartItems = cart.reduce((s, i) => s + i.quantity, 0);
  const activeCategoryItems = (menu.find(c => c._id === activeCategory)?.items || []) as MenuItem[];

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: T.cream }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "44px", marginBottom: "10px" }}>☕</div>
          <h2 style={{ fontWeight: 800, color: T.emerald, margin: "0 0 5px", fontSize: "16px" }}>Something went wrong</h2>
          <p style={{ color: T.textMuted, marginBottom: "14px", fontSize: "12px" }}>{error}</p>
          <Button variant="primary" onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-app" style={{ minHeight: "100vh", background: T.cream, display: "flex", flexDirection: "column", width: "100%", margin: "0 auto", overflowX: "hidden" }}>
      <style>{`
        html, body {
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          max-width: 100vw;
          touch-action: pan-y;
          overscroll-behavior: none;
        }

        .customer-app {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }

        .customer-app input, .customer-app textarea {
          -webkit-user-select: text;
          user-select: text;
        }

        .customer-app img {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
          pointer-events: none;
        }

        @media (hover: none) and (pointer: coarse) {
          html, body {
            -webkit-touch-callout: none;
          }
        }
      `}</style>

      {showCustomerPopup && <CustomerDataPopup onSubmit={handleCustomerDataSubmit} onSkip={() => { setShowCustomerPopup(false); placeOrder(); }} />}

      {existingOrder && !["settled", "cancelled"].includes(existingOrder.status) && (
        <TopCancelBar order={existingOrder} onCancelled={handleCancelled} />
      )}

      {/* Header */}
      <header style={{
        background: `linear-gradient(180deg, ${T.cream} 0%, ${T.ivory} 100%)`,
        position: "sticky", top: 0, zIndex: 30,
        padding: "12px 16px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", overflow: "hidden", background: T.emerald, flexShrink: 0 }}>
            <img src="/logo-small.png" alt="GB" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
          </div>

          <div style={{ flex: 1, textAlign: "center", padding: "0 12px" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0, letterSpacing: "-0.02em" }}>
              Golden Beans
            </p>
            <p style={{ fontSize: "10px", color: T.textMuted, margin: "1px 0 0", fontWeight: 600 }}>
              {table ? `Table ${table.tableNumber}` : "..."}
            </p>
          </div>

          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: T.emerald, color: T.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icons.Coffee size={16} />
          </div>
        </div>

        {activeTab === "menu" && (
          <div>
            <p style={{ fontSize: "13px", color: T.textMuted, fontWeight: 600, margin: "0 0 2px" }}>
              Welcome{customerData ? "," : "!"}
            </p>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "24px", fontWeight: 800,
              color: T.emerald, margin: 0,
              letterSpacing: "-0.02em", lineHeight: 1.1,
            }}>
              {customerData?.name || "Order Now"} ☕
            </h1>
          </div>
        )}
      </header>

      {/* Main Tab Content */}
      <main style={{ flex: 1, paddingBottom: "80px" }}>
        {activeTab === "menu" && (
          <div style={{ display: "flex", paddingBottom: "12px" }}>
            {menu.length > 0 && (
              <VerticalCategoryTabs
                categories={menu}
                activeCategoryId={activeCategory}
                onSelect={setActiveCategory}
              />
            )}

            <div style={{ flex: 1, padding: "12px 14px 12px 12px" }}>
              {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} height="200px" style={{ borderRadius: "20px" }} />
                  ))}
                </div>
              ) : activeCategoryItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 16px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "8px" }}>☕</div>
                  <p style={{ fontWeight: 700, color: T.emerald, fontSize: "14px" }}>No items here yet</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {activeCategoryItems.map((item, idx) => {
                    const cartQty = cart.filter(c => c.menuItemId === item._id).reduce((s, c) => s + c.quantity, 0);
                    return (
                      <div key={item._id} style={{ animation: `gb-fadeInUp 0.3s ${idx * 0.05}s ease both` }}>
                        <ProductCard item={item} cartQty={cartQty} onTap={() => setSelectedItem(item)} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "cart" && (
          <CartView
            cart={cart}
            onUpdateQty={updateQty}
            onPlaceOrder={handlePlaceOrderClick}
            isPlacing={isPlacing}
          />
        )}

        {activeTab === "order" && (
          <OrderView order={existingOrder} queuePosition={queuePosition} />
        )}

        {activeTab === "info" && (
          <InfoView table={table} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: "fixed", bottom: "12px", left: "50%", transform: "translateX(-50%)",
        background: T.emerald, borderRadius: "99px",
        padding: "6px",
        display: "flex", alignItems: "center", gap: "4px",
        boxShadow: "0 8px 32px rgba(15,61,46,0.4)",
        zIndex: 40,
        border: `1px solid rgba(212,165,116,0.2)`,
      }}>
        {[
          { id: "menu" as BottomTab, icon: <Icons.Menu size={18} />, label: "Menu" },
          { id: "order" as BottomTab, icon: <Icons.Receipt size={18} />, label: "Order", badge: existingOrder ? "•" : null },
          { id: "cart" as BottomTab, icon: <Icons.Cart size={18} />, label: "Cart", badge: totalCartItems > 0 ? totalCartItems : null },
          { id: "info" as BottomTab, icon: <Icons.Coffee size={18} />, label: "Info" },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : "transparent",
                color: isActive ? T.emerald : "rgba(212,165,116,0.7)",
                borderRadius: "99px",
                padding: isActive ? "10px 16px" : "10px 12px",
                display: "flex", alignItems: "center", gap: "6px",
                cursor: "pointer",
                transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800, fontSize: "11px",
                position: "relative",
                whiteSpace: "nowrap",
              }}
            >
              {tab.icon}
              {isActive && <span>{tab.label}</span>}
              {tab.badge !== null && tab.badge !== undefined && !isActive && (
                <div style={{
                  position: "absolute", top: "4px", right: "4px",
                  minWidth: typeof tab.badge === "number" ? "16px" : "8px",
                  height: typeof tab.badge === "number" ? "16px" : "8px",
                  padding: typeof tab.badge === "number" ? "0 4px" : "0",
                  borderRadius: "99px",
                  background: T.danger,
                  color: "white",
                  fontSize: "9px", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `2px solid ${T.emerald}`,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {typeof tab.badge === "number" ? tab.badge : ""}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <ProductDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
