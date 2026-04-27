"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { Card, Pill, StatCard, EmptyState, Skeleton, Icons, Button, Input, Modal } from "@/components/PremiumUI";

const T = {
  emerald: "#0F3D2E",
  emeraldMid: "#1A5340",
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
  warning: "#D4A574",
  info: "#4A7B9B",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

interface Promotion {
  _id: string;
  name: string;
  type: "bogo" | "percentage" | "flat" | "golden_hour";
  description: string;
  discountValue: number;
  buyQuantity: number;
  getQuantity: number;
  minOrderAmount: number;
  maxDiscount: number;
  startDate: string | null;
  endDate: string | null;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  isActive: boolean;
  isAutoApply: boolean;
  usageCount: number;
}

interface PromoCode {
  _id: string;
  code: string;
  promotion: Promotion;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

const TYPE_CONFIG = {
  percentage: { label: "% Discount", icon: "%", color: T.gold, description: "Percentage off entire order" },
  flat: { label: "Flat Off", icon: "₹", color: T.success, description: "Fixed rupees off" },
  bogo: { label: "BOGO", icon: "🎁", color: T.info, description: "Buy X Get Y free" },
  golden_hour: { label: "Golden Hour", icon: "⏰", color: T.warning, description: "Time-based discount" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─────────── Promotion Card ───────────
function PromotionCard({ promo, onEdit, onDelete, onToggle }: {
  promo: Promotion;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const config = TYPE_CONFIG[promo.type];
  const isActive = promo.isActive;

  return (
    <div style={{
      background: T.ivory,
      borderRadius: "16px",
      padding: "16px",
      border: `1.5px solid ${isActive ? config.color + "40" : T.border}`,
      boxShadow: isActive ? `0 4px 16px ${config.color}20` : "0 2px 6px rgba(15,61,46,0.05)",
      transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
      animation: "gb-fadeInUp 0.3s ease both",
      opacity: isActive ? 1 : 0.6,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
          <div style={{
            width: "44px", height: "44px",
            borderRadius: "12px",
            background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px", fontWeight: 800, color: "white",
            flexShrink: 0,
          }}>
            {config.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "16px", fontWeight: 800,
              color: T.emerald, margin: "0 0 3px",
              letterSpacing: "-0.01em",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{promo.name}</p>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              <Pill variant="default" size="sm">{config.label}</Pill>
              {promo.isAutoApply ? (
                <Pill variant="success" size="sm">⚡ Auto</Pill>
              ) : (
                <Pill variant="info" size="sm">🎫 Code only</Pill>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          <Pill variant={isActive ? "success" : "danger"} size="sm">
            {isActive ? "Live" : "Off"}
          </Pill>
          <p style={{ fontSize: "10px", color: T.textMuted, margin: 0, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
            {promo.usageCount} uses
          </p>
        </div>
      </div>

      {promo.description && (
        <p style={{ fontSize: "12px", color: T.textMuted, margin: "0 0 10px", lineHeight: 1.5 }}>
          {promo.description}
        </p>
      )}

      <div style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", marginBottom: "10px", border: `1px dashed ${T.creamDark}` }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", fontSize: "11px" }}>
          {promo.type === "bogo" ? (
            <span style={{ fontWeight: 700, color: T.emerald }}>
              🎁 Buy {promo.buyQuantity}, Get {promo.getQuantity} Free
            </span>
          ) : promo.type === "percentage" || promo.type === "golden_hour" ? (
            <span style={{ fontWeight: 700, color: T.emerald }}>
              💰 {promo.discountValue}% off
              {promo.maxDiscount > 0 && ` (max ₹${promo.maxDiscount})`}
            </span>
          ) : (
            <span style={{ fontWeight: 700, color: T.emerald }}>
              💰 ₹{promo.discountValue} off
            </span>
          )}
          {promo.minOrderAmount > 0 && (
            <span style={{ fontWeight: 600, color: T.textMuted }}>
              Min ₹{promo.minOrderAmount}
            </span>
          )}
          {promo.startTime && promo.endTime && (
            <span style={{ fontWeight: 600, color: T.textMuted }}>
              ⏰ {promo.startTime} - {promo.endTime}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px" }}>
        <Button size="sm" variant="primary" icon={<Icons.Edit size={11} />} onClick={onEdit} fullWidth>
          Edit
        </Button>
        <button
          onClick={onToggle}
          style={{
            padding: "8px 14px", borderRadius: "8px",
            background: isActive ? T.cream : T.success,
            color: isActive ? T.textMuted : "white",
            border: `1px solid ${isActive ? T.border : T.success}`,
            fontWeight: 700, fontSize: "12px", cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {isActive ? "Pause" : "Activate"}
        </button>
        <button
          onClick={onDelete}
          style={{
            width: "36px", height: "36px",
            borderRadius: "8px",
            background: "white", border: `1px solid ${T.border}`,
            color: T.danger, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icons.Trash size={13} />
        </button>
      </div>
    </div>
  );
}

// ─────────── Promo Code Card ───────────
function PromoCodeCard({ promoCode, onDelete }: { promoCode: PromoCode; onDelete: () => void }) {
  const promo = promoCode.promotion;
  const isLimitReached = promoCode.usageLimit > 0 && promoCode.usedCount >= promoCode.usageLimit;

  return (
    <div style={{
      background: T.ivory,
      borderRadius: "12px",
      padding: "12px 14px",
      border: `1.5px solid ${T.border}`,
      animation: "gb-fadeInUp 0.3s ease both",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "14px", fontWeight: 800, color: T.gold,
              letterSpacing: "0.05em",
              background: T.cream, padding: "3px 8px",
              borderRadius: "6px",
              border: `1px dashed ${T.gold}`,
            }}>
              {promoCode.code}
            </span>
            {!promoCode.isActive && <Pill variant="danger" size="sm">Disabled</Pill>}
            {isLimitReached && <Pill variant="warning" size="sm">Limit reached</Pill>}
          </div>
          <p style={{ fontSize: "11px", color: T.textMuted, margin: 0, fontWeight: 600 }}>
            {promo?.name || "—"} · {promoCode.usedCount}{promoCode.usageLimit > 0 ? `/${promoCode.usageLimit}` : ""} uses
          </p>
        </div>
        <button
          onClick={onDelete}
          style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "white", border: `1px solid ${T.border}`,
            color: T.danger, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icons.Trash size={12} />
        </button>
      </div>
    </div>
  );
}

// ─────────── Promotion Edit Modal ───────────
function PromotionEditModal({ promo, isOpen, onClose, onSaved }: {
  promo: Promotion | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !promo;
  const [name, setName] = useState(promo?.name || "");
  const [type, setType] = useState<Promotion["type"]>(promo?.type || "percentage");
  const [description, setDescription] = useState(promo?.description || "");
  const [discountValue, setDiscountValue] = useState(String(promo?.discountValue || ""));
  const [buyQuantity, setBuyQuantity] = useState(String(promo?.buyQuantity || 1));
  const [getQuantity, setGetQuantity] = useState(String(promo?.getQuantity || 1));
  const [minOrderAmount, setMinOrderAmount] = useState(String(promo?.minOrderAmount || ""));
  const [maxDiscount, setMaxDiscount] = useState(String(promo?.maxDiscount || ""));
  const [startTime, setStartTime] = useState(promo?.startTime || "");
  const [endTime, setEndTime] = useState(promo?.endTime || "");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(promo?.daysOfWeek || []);
  const [isAutoApply, setIsAutoApply] = useState(promo?.isAutoApply ?? true);
  const [saving, setSaving] = useState(false);

  const toggleDay = (d: number) => {
    setDaysOfWeek(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a name");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type, description,
        discountValue: parseFloat(discountValue) || 0,
        buyQuantity: parseInt(buyQuantity) || 1,
        getQuantity: parseInt(getQuantity) || 1,
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        maxDiscount: parseFloat(maxDiscount) || 0,
        startTime: type === "golden_hour" ? startTime : "",
        endTime: type === "golden_hour" ? endTime : "",
        daysOfWeek,
        isAutoApply,
      };
      const url = isNew ? `${API_URL}/promotions` : `${API_URL}/promotions/${promo!._id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isNew ? "New Promotion" : "Edit Promotion"} maxWidth={520}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Input label="Promotion Name *" placeholder="e.g. Weekend Special" value={name} onChange={e => setName(e.target.value)} autoFocus />

        {/* Type Selector */}
        <div>
          <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Promotion Type</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map(t => {
              const config = TYPE_CONFIG[t];
              const isSelected = type === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    padding: "12px 10px",
                    borderRadius: "12px",
                    background: isSelected ? `linear-gradient(135deg, ${config.color}, ${config.color}dd)` : T.cream,
                    color: isSelected ? "white" : T.text,
                    border: `2px solid ${isSelected ? config.color : T.border}`,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    textAlign: "left",
                    transition: "all 150ms ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 800 }}>{config.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: "12px" }}>{config.label}</span>
                  </div>
                  <p style={{ fontSize: "10px", margin: 0, opacity: 0.85, lineHeight: 1.4, fontWeight: 600 }}>
                    {config.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Description (optional)"
          placeholder="e.g. Get 20% off on weekends"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        {/* Type-specific fields */}
        {(type === "percentage" || type === "golden_hour") && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input label="Discount % *" type="number" placeholder="20" value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
            <Input label="Max Discount ₹ (0=no cap)" type="number" placeholder="0" value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} />
          </div>
        )}

        {type === "flat" && (
          <Input label="Discount ₹ *" type="number" placeholder="50" value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
        )}

        {type === "bogo" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input label="Buy Quantity *" type="number" placeholder="1" value={buyQuantity} onChange={e => setBuyQuantity(e.target.value)} />
            <Input label="Get Free *" type="number" placeholder="1" value={getQuantity} onChange={e => setGetQuantity(e.target.value)} />
          </div>
        )}

        {type === "golden_hour" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Start Time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.ivory, fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>End Time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.ivory, fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }}
              />
            </div>
          </div>
        )}

        <Input label="Min Order Amount ₹ (0=no minimum)" type="number" placeholder="0" value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} />

        {/* Days of week */}
        <div>
          <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Active Days (none = every day)
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
            {DAYS.map((day, idx) => {
              const sel = daysOfWeek.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleDay(idx)}
                  style={{
                    padding: "8px 4px",
                    borderRadius: "8px",
                    background: sel ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.cream,
                    color: sel ? T.gold : T.textMuted,
                    border: `1.5px solid ${sel ? T.emerald : T.border}`,
                    fontWeight: 800, fontSize: "11px", cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto Apply Toggle */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setIsAutoApply(true)}
            style={{
              flex: 1, padding: "12px",
              background: isAutoApply ? `linear-gradient(135deg, ${T.success}, #2d6a2d)` : T.cream,
              color: isAutoApply ? "white" : T.textMuted,
              border: `1.5px solid ${isAutoApply ? T.success : T.border}`,
              borderRadius: "10px",
              fontWeight: 800, fontSize: "12px", cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            ⚡ Auto Apply
          </button>
          <button
            onClick={() => setIsAutoApply(false)}
            style={{
              flex: 1, padding: "12px",
              background: !isAutoApply ? `linear-gradient(135deg, ${T.info}, #36668a)` : T.cream,
              color: !isAutoApply ? "white" : T.textMuted,
              border: `1.5px solid ${!isAutoApply ? T.info : T.border}`,
              borderRadius: "10px",
              fontWeight: 800, fontSize: "12px", cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            🎫 Code Only
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={handleSave} loading={saving}>
            {isNew ? "Create" : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────── Code Create Modal ───────────
function PromoCodeModal({ promotions, isOpen, onClose, onSaved }: {
  promotions: Promotion[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState("");
  const [promotionId, setPromotionId] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setPromotionId(promotions[0]?._id || "");
      setUsageLimit("");
    }
  }, [isOpen, promotions]);

  const handleSave = async () => {
    if (!code.trim() || !promotionId) {
      alert("Please fill all fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/promotions/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          promotion: promotionId,
          usageLimit: parseInt(usageLimit) || 0,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Promo Code" maxWidth={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Input
          label="Code *"
          placeholder="e.g. GOLDEN20"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          autoFocus
        />

        <div>
          <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Linked Promotion *</label>
          <select
            value={promotionId}
            onChange={e => setPromotionId(e.target.value)}
            style={{
              width: "100%", padding: "11px 14px", borderRadius: "10px",
              border: `1.5px solid ${T.border}`, background: T.ivory,
              color: T.text, fontSize: "14px", fontWeight: 600,
              outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif",
            }}
          >
            {promotions.length === 0 ? (
              <option value="">No promotions — create one first</option>
            ) : (
              promotions.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} ({TYPE_CONFIG[p.type].label})
                </option>
              ))
            )}
          </select>
        </div>

        <Input label="Usage Limit (0 = unlimited)" type="number" placeholder="0" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} />

        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={handleSave} loading={saving} disabled={promotions.length === 0}>
            Create Code
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────── MAIN PAGE ───────────
export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"promotions" | "codes">("promotions");
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [showAddCode, setShowAddCode] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`${API_URL}/promotions`).then(r => r.json()),
        fetch(`${API_URL}/promotions/codes/all`).then(r => r.json()),
      ]);
      setPromotions(pRes.data || []);
      setCodes(cRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`${API_URL}/promotions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promotion permanently?")) return;
    try {
      await fetch(`${API_URL}/promotions/${id}`, { method: "DELETE" });
      load();
    } catch (e) { console.error(e); }
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    try {
      await fetch(`${API_URL}/promotions/codes/${id}`, { method: "DELETE" });
      load();
    } catch (e) { console.error(e); }
  };

  const activeCount = promotions.filter(p => p.isActive).length;
  const autoCount = promotions.filter(p => p.isAutoApply && p.isActive).length;
  const codeCount = codes.filter(c => c.isActive).length;
  const totalUsage = promotions.reduce((s, p) => s + p.usageCount, 0);

  return (
    <div style={{ minHeight: "100vh", background: T.cream, display: "flex" }}>
      <POSSidebar />

      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column" }}>
        <header style={{
          background: T.ivory, borderBottom: `1px solid ${T.border}`,
          padding: "20px 24px", boxShadow: "0 1px 2px rgba(15,61,46,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "28px", fontWeight: 800,
                color: T.emerald, margin: "0 0 4px",
                letterSpacing: "-0.02em", lineHeight: 1.1,
              }}>Promotions</h1>
              <p style={{ fontSize: "12px", color: T.textMuted, margin: 0, fontWeight: 500 }}>
                Boost sales with discounts and promo codes
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <Button variant="secondary" icon={<Icons.Sparkle size={14} />} onClick={() => setShowAddCode(true)}>
                New Code
              </Button>
              <Button variant="primary" icon={<Icons.Plus size={14} />} onClick={() => setShowAddPromo(true)}>
                New Promotion
              </Button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            <StatCard label="Total Promotions" value={promotions.length} icon={<Icons.Sparkle size={18} />} variant="default" />
            <StatCard label="Active Now" value={activeCount} icon={<Icons.Check size={18} />} variant="success" subtitle={`${autoCount} auto-apply`} />
            <StatCard label="Promo Codes" value={codes.length} icon={<Icons.Receipt size={18} />} variant="gold" subtitle={`${codeCount} active`} />
            <StatCard label="Total Uses" value={totalUsage} icon={<Icons.Chart size={18} />} variant="info" subtitle="Times redeemed" />
          </div>
        </header>

        {/* Tab Switcher */}
        <div style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "12px 24px" }}>
          <div style={{ display: "flex", gap: "5px", background: T.cream, padding: "4px", borderRadius: "10px", display: "inline-flex" }}>
            <button
              onClick={() => setTab("promotions")}
              style={{
                padding: "8px 16px", borderRadius: "8px",
                background: tab === "promotions" ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "transparent",
                color: tab === "promotions" ? T.gold : T.textMuted,
                fontWeight: 800, fontSize: "12px", cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                border: "none",
              }}
            >
              Promotions ({promotions.length})
            </button>
            <button
              onClick={() => setTab("codes")}
              style={{
                padding: "8px 16px", borderRadius: "8px",
                background: tab === "codes" ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "transparent",
                color: tab === "codes" ? T.gold : T.textMuted,
                fontWeight: 800, fontSize: "12px", cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                border: "none",
              }}
            >
              Promo Codes ({codes.length})
            </button>
          </div>
        </div>

        <main style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height="180px" style={{ borderRadius: "16px" }} />
              ))}
            </div>
          ) : tab === "promotions" ? (
            promotions.length === 0 ? (
              <EmptyState
                icon={<Icons.Sparkle size={32} color={T.gold} />}
                title="No promotions yet"
                description="Create your first promotion to boost sales!"
                action={
                  <Button variant="primary" icon={<Icons.Plus size={14} />} onClick={() => setShowAddPromo(true)}>
                    Create First Promotion
                  </Button>
                }
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                {promotions.map((promo, idx) => (
                  <div key={promo._id} style={{ animationDelay: `${idx * 30}ms` }}>
                    <PromotionCard
                      promo={promo}
                      onEdit={() => setEditPromo(promo)}
                      onDelete={() => handleDelete(promo._id)}
                      onToggle={() => handleToggle(promo._id, promo.isActive)}
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            codes.length === 0 ? (
              <EmptyState
                icon={<Icons.Receipt size={32} color={T.emerald} />}
                title="No promo codes yet"
                description="Create codes that customers can enter at checkout."
                action={
                  <Button variant="primary" icon={<Icons.Plus size={14} />} onClick={() => setShowAddCode(true)}>
                    Create First Code
                  </Button>
                }
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {codes.map((code, idx) => (
                  <div key={code._id} style={{ animationDelay: `${idx * 30}ms` }}>
                    <PromoCodeCard promoCode={code} onDelete={() => handleDeleteCode(code._id)} />
                  </div>
                ))}
              </div>
            )
          )}
        </main>
      </div>

      <PromotionEditModal
        promo={editPromo}
        isOpen={!!editPromo}
        onClose={() => setEditPromo(null)}
        onSaved={() => { setEditPromo(null); load(); }}
      />
      <PromotionEditModal
        promo={null}
        isOpen={showAddPromo}
        onClose={() => setShowAddPromo(false)}
        onSaved={() => { setShowAddPromo(false); load(); }}
      />
      <PromoCodeModal
        promotions={promotions.filter(p => p.isActive)}
        isOpen={showAddCode}
        onClose={() => setShowAddCode(false)}
        onSaved={() => { setShowAddCode(false); load(); }}
      />
    </div>
  );
}
