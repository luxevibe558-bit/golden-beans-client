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
  @keyframes fadeInUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #F0E8DA; border-radius: 6px; }
`;

export default function CancellationLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
      let url = `${API}/orders/cancellation-logs`;
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (params.toString()) url += `?${params}`;
      const res = await fetch(url).then(r => r.json());
      setLogs(res.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter(l =>
    !search || l.tableNumber?.toLowerCase().includes(search.toLowerCase()) ||
    l.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    (l as any).cancellationReason?.toLowerCase().includes(search.toLowerCase())
  );

  const totalLost = filtered.reduce((s: number, l: any) => s + (l.totalAmount || 0), 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.cream, fontFamily: "'Nunito', sans-serif" }}>
      <style>{STYLES}</style>
      <POSSidebar />
      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column" }}>
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "18px 28px", boxShadow: "0 2px 8px rgba(15,61,46,0.05)" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 800, color: T.emerald, margin: 0 }}>Cancellation Logs</h1>
          <p style={{ fontSize: "12px", color: T.textMuted, margin: "4px 0 0", fontWeight: 600 }}>Track cancelled orders with reasons</p>
        </header>

        <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto" }}>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Total Cancelled", value: filtered.length, color: T.danger, icon: "🚫" },
              { label: "Revenue Lost", value: `₹${totalLost.toFixed(0)}`, color: "#D97706", icon: "💸" },
              { label: "Avg Order Value", value: filtered.length ? `₹${(totalLost / filtered.length).toFixed(0)}` : "₹0", color: T.emerald, icon: "📊" },
            ].map(s => (
              <div key={s.label} style={{ background: T.ivory, borderRadius: "16px", padding: "18px 20px", border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "22px" }}>{s.icon}</span>
                  <p style={{ fontSize: "11px", color: T.textMuted, fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</p>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "28px", fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ background: T.ivory, borderRadius: "16px", padding: "16px 20px", border: `1px solid ${T.border}`, marginBottom: "20px", display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ fontSize: "11px", fontWeight: 800, color: T.textMuted, margin: "0 0 6px", textTransform: "uppercase" }}>Search</p>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Table, customer, reason..." style={{ width: "100%", padding: "9px 14px", borderRadius: "10px", border: `1px solid ${T.creamDark}`, background: T.cream, fontSize: "13px", fontWeight: 600, outline: "none" }} />
            </div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 800, color: T.textMuted, margin: "0 0 6px", textTransform: "uppercase" }}>From</p>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: "9px 14px", borderRadius: "10px", border: `1px solid ${T.creamDark}`, background: T.cream, fontSize: "13px", fontWeight: 600, outline: "none" }} />
            </div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 800, color: T.textMuted, margin: "0 0 6px", textTransform: "uppercase" }}>To</p>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ padding: "9px 14px", borderRadius: "10px", border: `1px solid ${T.creamDark}`, background: T.cream, fontSize: "13px", fontWeight: 600, outline: "none" }} />
            </div>
            <button onClick={load} style={{ padding: "9px 20px", borderRadius: "10px", border: "none", background: T.emerald, color: T.gold, fontWeight: 800, fontSize: "13px", cursor: "pointer" }}>Apply</button>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: T.textMuted, fontSize: "14px", fontWeight: 700 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ fontSize: "48px", margin: "0 0 12px" }}>✅</p>
              <p style={{ fontSize: "16px", fontWeight: 800, color: T.emerald, margin: 0 }}>No Cancellations Found</p>
              <p style={{ fontSize: "13px", color: T.textMuted, margin: "4px 0 0" }}>Great job keeping orders intact!</p>
            </div>
          ) : (
            <div style={{ background: T.ivory, borderRadius: "16px", border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "80px 100px 140px 1fr 140px 100px 120px", padding: "12px 20px", borderBottom: `2px solid ${T.creamDark}`, background: T.cream }}>
                {["Order #", "Table", "Customer", "Reason", "Items", "Amount", "Date"].map(h => (
                  <p key={h} style={{ fontSize: "10px", fontWeight: 900, color: T.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</p>
                ))}
              </div>
              {filtered.map((log: any, i: number) => (
                <div key={log._id} style={{ display: "grid", gridTemplateColumns: "80px 100px 140px 1fr 140px 100px 120px", padding: "14px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.creamDark}` : "none", animation: `fadeInUp 0.3s ${i * 0.03}s ease both`, alignItems: "center" }}>
                  <p style={{ fontSize: "12px", fontWeight: 800, color: T.emerald, margin: 0 }}>#{log.orderNumber}</p>
                  <div style={{ background: `${T.emerald}15`, borderRadius: "8px", padding: "3px 10px", display: "inline-flex", width: "fit-content" }}>
                    <p style={{ fontSize: "12px", fontWeight: 800, color: T.emerald, margin: 0 }}>{log.tableNumber}</p>
                  </div>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: T.text, margin: 0 }}>{log.customerName || "—"}</p>
                  <div style={{ background: "#FEF2F2", borderRadius: "8px", padding: "4px 10px", border: "1px solid #FECACA", width: "fit-content" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: T.danger, margin: 0 }}>{(log as any).cancellationReason || "No reason"}</p>
                  </div>
                  <p style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600, margin: 0 }}>{log.items?.length || 0} item{log.items?.length !== 1 ? "s" : ""}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 900, color: T.danger, margin: 0 }}>₹{log.totalAmount?.toFixed(0)}</p>
                  <p style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600, margin: 0 }}>
                    {new Date(log.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    <br />
                    <span style={{ fontSize: "10px" }}>{new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
