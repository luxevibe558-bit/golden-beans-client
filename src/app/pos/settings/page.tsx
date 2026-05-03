"use client";
import { useState, useEffect } from "react";
import POSSidebar from "@/components/POSSidebar";

const T = {
  emerald: "#0F3D2E", emeraldMid: "#1A5340", gold: "#D4A574", goldLight: "#E8C895",
  cream: "#FAF6F0", creamDark: "#F0E8DA", ivory: "#FFFBF5",
  text: "#2C2418", textMuted: "#7A6B54", textDim: "#A89B80",
  border: "#E5DCC9", danger: "#C0392B", success: "#4A8B4A",
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #F0E8DA; border-radius: 6px; }
`;

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

export default function POSSettingsPage() {
  const [paymentMode, setPaymentMode] = useState<"counter" | "online" | "both">("both");
  const [revenueGoal, setRevenueGoal] = useState(10000);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [anniversaries, setAnniversaries] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [pm, rg, bd] = await Promise.all([
          fetch(`${API}/settings/payment_mode`).then(r => r.json()),
          fetch(`${API}/settings/revenue_goal`).then(r => r.json()),
          fetch(`${API}/settings/crm/birthdays-today`).then(r => r.json()),
        ]);
        if (pm.data) setPaymentMode(pm.data);
        if (rg.data) setRevenueGoal(rg.data);
        if (bd.data) { setBirthdays(bd.data.birthdays || []); setAnniversaries(bd.data.anniversaries || []); }
      } catch { }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch(`${API}/settings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "payment_mode", value: paymentMode, label: "Payment Mode" }) }),
        fetch(`${API}/settings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "revenue_goal", value: revenueGoal, label: "Daily Revenue Goal" }) }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { }
    setSaving(false);
  };

  const openWhatsApp = (phone: string, name: string, type: "birthday" | "anniversary") => {
    const msg = type === "birthday"
      ? `🎂 Happy Birthday ${name}! Golden Beans Café wishes you a wonderful day! 🎉 Enjoy a special treat on us today. 💛`
      : `🎊 Happy Anniversary ${name}! Golden Beans Café celebrates your special day with you! 💛`;
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const paymentOptions: { key: "counter" | "online" | "both"; label: string; desc: string; icon: string }[] = [
    { key: "counter", label: "Pay at Counter Only", desc: "QR orders route to KDS immediately", icon: "🏪" },
    { key: "online", label: "Pay Online Only", desc: "QR orders route to KDS after payment", icon: "📱" },
    { key: "both", label: "Both Options", desc: "Customer can choose payment method", icon: "💳" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.cream, fontFamily: "'Nunito', sans-serif" }}>
      <style>{STYLES}</style>
      <POSSidebar />
      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column" }}>
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(15,61,46,0.05)" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 800, color: T.emerald, margin: 0 }}>POS Settings</h1>
            <p style={{ fontSize: "12px", color: T.textMuted, margin: "4px 0 0", fontWeight: 600 }}>Payment, goals & notifications</p>
          </div>
          <button onClick={save} disabled={saving} style={{ padding: "10px 24px", borderRadius: "12px", border: "none", background: saved ? T.success : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: saved ? "white" : T.gold, fontWeight: 900, fontSize: "14px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "all 0.3s" }}>
            {saved ? "✓ Saved!" : saving ? "Saving..." : "💾 Save Settings"}
          </button>
        </header>

        <div style={{ padding: "28px", flex: 1, overflowY: "auto", maxWidth: "800px" }}>

          {/* Payment Toggle */}
          <div style={{ background: T.ivory, borderRadius: "20px", padding: "24px", border: `1px solid ${T.border}`, marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>💳</div>
              <div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: 0 }}>Payment Mode</p>
                <p style={{ fontSize: "11px", color: T.textMuted, margin: 0, fontWeight: 600 }}>Controls how QR orders are processed</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {paymentOptions.map(opt => (
                <label key={opt.key} onClick={() => setPaymentMode(opt.key)} style={{ display: "flex", alignItems: "center", gap: "14px", background: paymentMode === opt.key ? `${T.emerald}10` : T.cream, borderRadius: "14px", padding: "14px 18px", border: `2px solid ${paymentMode === opt.key ? T.emerald : T.creamDark}`, cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${paymentMode === opt.key ? T.emerald : T.textDim}`, background: paymentMode === opt.key ? T.emerald : "white", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {paymentMode === opt.key && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white" }} />}
                  </div>
                  <span style={{ fontSize: "20px" }}>{opt.icon}</span>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 800, color: paymentMode === opt.key ? T.emerald : T.text, margin: 0 }}>{opt.label}</p>
                    <p style={{ fontSize: "11px", color: T.textMuted, margin: 0, fontWeight: 600 }}>{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Revenue Goal */}
          <div style={{ background: T.ivory, borderRadius: "20px", padding: "24px", border: `1px solid ${T.border}`, marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🎯</div>
              <div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: 0 }}>Daily Revenue Goal</p>
                <p style={{ fontSize: "11px", color: T.textMuted, margin: 0, fontWeight: 600 }}>Shown on POS dashboard as progress bar</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px", fontWeight: 900, color: T.emerald }}>₹</span>
              <input
                type="number"
                value={revenueGoal}
                onChange={e => setRevenueGoal(Number(e.target.value))}
                step={1000}
                min={1000}
                style={{ flex: 1, padding: "12px 16px", borderRadius: "12px", border: `2px solid ${T.creamDark}`, background: T.cream, fontSize: "22px", fontWeight: 900, color: T.emerald, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
              {[5000, 10000, 15000, 20000, 25000].map(g => (
                <button key={g} onClick={() => setRevenueGoal(g)} style={{ padding: "6px 14px", borderRadius: "8px", border: `1.5px solid ${revenueGoal === g ? T.emerald : T.creamDark}`, background: revenueGoal === g ? T.emerald : "white", color: revenueGoal === g ? T.gold : T.text, fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
                  ₹{g.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Today's Birthdays & Anniversaries */}
          {(birthdays.length > 0 || anniversaries.length > 0) && (
            <div style={{ background: T.ivory, borderRadius: "20px", padding: "24px", border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #EC4899, #F97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🎂</div>
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: 0 }}>Today's Special Days</p>
                  <p style={{ fontSize: "11px", color: T.textMuted, margin: 0, fontWeight: 600 }}>Send WhatsApp wishes instantly</p>
                </div>
              </div>

              {birthdays.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 800, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>🎂 Birthdays Today</p>
                  {birthdays.map((c: any) => (
                    <div key={c._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFF0FB", borderRadius: "12px", padding: "12px 16px", marginBottom: "8px", border: "1px solid #FECDD3" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #EC4899, #F97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 900, color: "white" }}>{c.name.charAt(0)}</div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 800, color: T.text, margin: 0 }}>{c.name}</p>
                          <p style={{ fontSize: "11px", color: T.textMuted, margin: 0 }}>📞 {c.phone}</p>
                        </div>
                      </div>
                      <button onClick={() => openWhatsApp(c.phone, c.name, "birthday")} style={{ padding: "8px 16px", borderRadius: "10px", border: "none", background: "#25D366", color: "white", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>📱</span> WhatsApp
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {anniversaries.length > 0 && (
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 800, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>💍 Anniversaries Today</p>
                  {anniversaries.map((c: any) => (
                    <div key={c._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFF7ED", borderRadius: "12px", padding: "12px 16px", marginBottom: "8px", border: "1px solid #FED7AA" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #F59E0B, #EF4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 900, color: "white" }}>{c.name.charAt(0)}</div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 800, color: T.text, margin: 0 }}>{c.name}</p>
                          <p style={{ fontSize: "11px", color: T.textMuted, margin: 0 }}>📞 {c.phone}</p>
                        </div>
                      </div>
                      <button onClick={() => openWhatsApp(c.phone, c.name, "anniversary")} style={{ padding: "8px 16px", borderRadius: "10px", border: "none", background: "#25D366", color: "white", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>📱</span> WhatsApp
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {birthdays.length === 0 && anniversaries.length === 0 && (
            <div style={{ background: T.ivory, borderRadius: "20px", padding: "24px", border: `1px solid ${T.border}`, textAlign: "center" }}>
              <p style={{ fontSize: "36px", margin: "0 0 8px" }}>🎂</p>
              <p style={{ fontSize: "14px", fontWeight: 800, color: T.emerald, margin: 0 }}>No Special Days Today</p>
              <p style={{ fontSize: "12px", color: T.textMuted, margin: "4px 0 0" }}>Birthday/Anniversary wishes will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
