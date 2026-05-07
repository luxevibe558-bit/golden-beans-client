"use client";

import { useState } from "react";

// ─── Design tokens — same as customer page ───
const T = {
  bg0:    "#050505",
  bg1:    "#0B0B0B",
  bg2:    "#111111",
  bg3:    "#1A1A1A",
  gold:   "#C8922A",
  goldM:  "#E8B84B",
  goldL:  "#F5CC6A",
  goldG:  "rgba(200,146,42,0.28)",
  text:   "#F0E8D8",
  textS:  "#A89878",
  textD:  "#5C5040",
  green:  "#3D9A5C",
  red:    "#E53935",
  gl:     "rgba(255,255,255,0.04)",
  glB:    "rgba(255,255,255,0.08)",
};

const GG = `linear-gradient(135deg, ${T.gold}, ${T.goldM})`;
const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

interface Props {
  tableId: string;
  tableNumber: string;
}

export default function WaiterHelpSheet({ tableId, tableNumber }: Props) {
  const [open,      setOpen     ] = useState(false);
  const [sending,   setSending  ] = useState(false);
  const [sent,      setSent     ] = useState(false);
  const [selected,  setSelected ] = useState<string | null>(null);
  const [note,      setNote     ] = useState("");

  const HELP_OPTIONS = [
    { id: "waiter",   icon: "🙋", label: "Call Waiter",      desc: "Need assistance at table" },
    { id: "water",    icon: "💧", label: "Water Please",     desc: "Refill water at table" },
    { id: "bill",     icon: "🧾", label: "Request Bill",     desc: "Ready to pay the bill" },
    { id: "cutlery",  icon: "🍴", label: "Extra Cutlery",    desc: "Need extra fork / spoon" },
    { id: "tissue",   icon: "🧻", label: "Tissues / Napkin", desc: "Need tissues at table" },
    { id: "other",    icon: "💬", label: "Other Request",    desc: "Something else..." },
  ];

  const sendHelp = async () => {
    if (!selected) return;
    setSending(true);
    try {
      const option = HELP_OPTIONS.find(o => o.id === selected);
      await fetch(`${API}/help/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          tableNumber,
          requestType: selected,
          message: note || option?.desc || "",
          label: option?.label || selected,
        }),
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setOpen(false);
        setSelected(null);
        setNote("");
      }, 3000);
    } catch {
      // fail silently — show sent anyway
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setOpen(false);
        setSelected(null);
        setNote("");
      }, 3000);
    }
    setSending(false);
  };

  return (
    <>
      {/* ── Floating Help Button ── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 82,
          right: 16,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: GG,
          border: `2px solid rgba(255,255,255,0.15)`,
          boxShadow: `0 4px 20px ${T.goldG}, 0 0 0 0 ${T.goldG}`,
          color: T.bg0,
          fontSize: 22,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 39,
          animation: "helpPulse 3s ease-in-out infinite",
          transition: "transform 0.2s ease",
        }}
      >
        🙋
      </button>

      {/* ── Bottom Sheet ── */}
      {open && (
        <div
          onClick={() => { if (!sending) setOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(20px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: T.bg1,
              width: "100%", maxWidth: 480,
              borderRadius: "24px 24px 0 0",
              overflow: "hidden",
              animation: "slideUp 0.38s cubic-bezier(0.32,0.72,0,1)",
              border: `1px solid ${T.glB}`,
              borderBottom: "none",
              maxHeight: "88dvh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Gold top bar */}
            <div style={{ height: 3, background: GG, flexShrink: 0 }} />

            {/* Header */}
            <div style={{ padding: "18px 18px 14px", flexShrink: 0, borderBottom: `1px solid ${T.glB}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: T.text, margin: "0 0 2px" }}>
                    Need Help? 🙋
                  </h3>
                  <p style={{ fontSize: 12, color: T.textS, margin: 0, fontFamily: "Inter,sans-serif" }}>
                    We'll send a waiter to <strong style={{ color: T.gold }}>Table {tableNumber}</strong> immediately
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: T.gl, border: `1px solid ${T.glB}`, color: T.text, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content — scrollable */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
              {sent ? (
                /* Success state */
                <div style={{ textAlign: "center", padding: "32px 20px", animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${T.green}20`, border: `2px solid ${T.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 30 }}>
                    ✓
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: T.green, margin: "0 0 6px" }}>
                    Help is on the way!
                  </h3>
                  <p style={{ fontSize: 13, color: T.textS, fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>
                    Our team has been notified.<br />Someone will be at your table shortly.
                  </p>
                  <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, animation: "pulse 1s ease-in-out infinite" }} />
                    <span style={{ fontSize: 11, color: T.textD, fontFamily: "Inter,sans-serif" }}>Notifying your waiter...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Option grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {HELP_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setSelected(opt.id)}
                        style={{
                          background: selected === opt.id ? `linear-gradient(135deg, ${T.gold}1C, ${T.goldM}0E)` : T.gl,
                          border: `1.5px solid ${selected === opt.id ? T.gold : T.glB}`,
                          borderRadius: 14,
                          padding: "13px 12px",
                          cursor: "pointer",
                          textAlign: "left",
                          boxShadow: selected === opt.id ? `0 0 16px ${T.goldG}` : "none",
                          transition: "all 0.22s ease",
                        }}
                      >
                        <span style={{ fontSize: 24, display: "block", marginBottom: 6 }}>{opt.icon}</span>
                        <p style={{ fontSize: 13, fontWeight: 700, color: selected === opt.id ? T.gold : T.text, margin: "0 0 2px", fontFamily: "Inter,sans-serif" }}>{opt.label}</p>
                        <p style={{ fontSize: 10, color: T.textD, margin: 0, fontFamily: "Inter,sans-serif", lineHeight: 1.3 }}>{opt.desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Note input */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textD, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 7, fontFamily: "Inter,sans-serif" }}>
                      Additional Note (Optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="e.g. We need 2 extra glasses of water..."
                      rows={2}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 11, border: `1px solid ${T.glB}`, background: T.gl, color: T.text, fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "Inter,sans-serif", lineHeight: 1.5 }}
                    />
                  </div>

                  {/* CTA */}
                  <button
                    onClick={sendHelp}
                    disabled={!selected || sending}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: 14,
                      border: "none",
                      background: selected && !sending ? GG : T.gl,
                      color: selected && !sending ? T.bg0 : T.textD,
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: selected && !sending ? "pointer" : "not-allowed",
                      fontFamily: "Inter,sans-serif",
                      boxShadow: selected && !sending ? `0 8px 24px ${T.goldG}` : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.25s ease",
                    }}
                  >
                    {sending ? (
                      <>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2.5px solid ${T.textD}30`, borderTopColor: T.textD, animation: "spin 0.75s linear infinite" }} />
                        Sending...
                      </>
                    ) : (
                      <><span>🔔</span> Call for Help</>
                    )}
                  </button>

                  <p style={{ textAlign: "center", fontSize: 11, color: T.textD, margin: "10px 0 0", fontFamily: "Inter,sans-serif" }}>
                    Our team will be at your table within minutes
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes helpPulse {
          0%,100% { box-shadow: 0 4px 20px rgba(200,146,42,0.28), 0 0 0 0 rgba(200,146,42,0.3); }
          50% { box-shadow: 0 4px 20px rgba(200,146,42,0.5), 0 0 0 10px rgba(200,146,42,0); }
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
      `}</style>
    </>
  );
}
