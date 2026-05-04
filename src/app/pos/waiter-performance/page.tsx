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
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #F0E8DA; border-radius: 6px; }
`;

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

export default function WaiterPerformancePage() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/waiter/performance`).then(r => r.json());
      setStats(res.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, []);

  const totalRequests = stats.reduce((s, w) => s + w.totalRequests, 0);
  const totalCompleted = stats.reduce((s, w) => s + w.completedRequests, 0);
  const avgCompletion = stats.length > 0 ? Math.round(stats.reduce((s, w) => s + w.completionRate, 0) / stats.length) : 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.cream, fontFamily: "'Nunito', sans-serif" }}>
      <style>{STYLES}</style>
      <POSSidebar />
      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column" }}>
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(15,61,46,0.05)" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 800, color: T.emerald, margin: 0 }}>Waiter Performance</h1>
            <p style={{ fontSize: "12px", color: T.textMuted, margin: "4px 0 0", fontWeight: 600 }}>Today's live stats — auto refreshes every 30s</p>
          </div>
          <button onClick={load} style={{ padding: "8px 18px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: "white", color: T.emerald, fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>🔄 Refresh</button>
        </header>

        <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto" }}>

          {/* Summary Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
            {[
              { label: "Total Requests", value: totalRequests, icon: "🙋", color: T.emerald },
              { label: "Completed", value: totalCompleted, icon: "✅", color: T.success },
              { label: "Avg Completion", value: `${avgCompletion}%`, icon: "📊", color: T.gold },
            ].map(s => (
              <div key={s.label} style={{ background: T.ivory, borderRadius: "16px", padding: "20px", border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", animation: "fadeInUp 0.3s ease both" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "24px" }}>{s.icon}</span>
                  <p style={{ fontSize: "11px", color: T.textMuted, fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</p>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "32px", fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Waiter Cards */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: "220px", background: T.ivory, borderRadius: "20px", animation: "pulse 1.5s infinite" }} />)}
            </div>
          ) : stats.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ fontSize: "48px", margin: "0 0 12px" }}>👥</p>
              <p style={{ fontSize: "16px", fontWeight: 800, color: T.emerald, margin: 0 }}>No Active Waiters</p>
              <p style={{ fontSize: "13px", color: T.textMuted, margin: "4px 0 0" }}>Waiters on shift will appear here</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {stats.sort((a, b) => b.completedRequests - a.completedRequests).map((w, i) => (
                <div key={w._id} style={{ background: T.ivory, borderRadius: "20px", padding: "20px", border: `1.5px solid ${w.currentShift ? T.emerald : T.border}`, boxShadow: w.currentShift ? "0 6px 20px rgba(15,61,46,0.12)" : "0 2px 8px rgba(0,0,0,0.04)", animation: `fadeInUp 0.3s ${i * 0.08}s ease both`, position: "relative", overflow: "hidden" }}>

                  {/* Top accent */}
                  {w.currentShift && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${T.emerald}, ${T.gold})` }} />}

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 900, color: T.gold, fontFamily: "'Nunito', sans-serif" }}>
                        {w.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontSize: "15px", fontWeight: 800, color: T.emerald, margin: 0 }}>{w.name}</p>
                        <p style={{ fontSize: "10px", color: T.textMuted, margin: 0, fontWeight: 600 }}>@{w.username} • {w.role}</p>
                      </div>
                    </div>
                    <div style={{ background: w.currentShift ? `${T.success}15` : T.creamDark, borderRadius: "8px", padding: "4px 10px", border: `1px solid ${w.currentShift ? T.success + '40' : T.border}` }}>
                      <p style={{ fontSize: "10px", fontWeight: 800, color: w.currentShift ? T.success : T.textMuted, margin: 0 }}>{w.currentShift ? "🟢 ON SHIFT" : "⚫ OFF"}</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                    {[
                      { label: "Total", value: w.totalRequests, color: T.emerald },
                      { label: "Completed", value: w.completedRequests, color: T.success },
                      { label: "Pending", value: w.pendingRequests, color: w.pendingRequests > 0 ? "#D97706" : T.textMuted },
                      { label: "Avg Time", value: `${w.avgResponseTime}m`, color: T.emerald },
                    ].map(s => (
                      <div key={s.label} style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${T.creamDark}` }}>
                        <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.3px" }}>{s.label}</p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "20px", fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Completion Rate Bar */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: T.textMuted, margin: 0 }}>Completion Rate</p>
                      <p style={{ fontSize: "11px", fontWeight: 900, color: w.completionRate >= 80 ? T.success : w.completionRate >= 50 ? "#D97706" : T.danger, margin: 0 }}>{w.completionRate}%</p>
                    </div>
                    <div style={{ background: T.creamDark, borderRadius: "99px", height: "8px", overflow: "hidden" }}>
                      <div style={{ width: `${w.completionRate}%`, height: "100%", background: w.completionRate >= 80 ? `linear-gradient(90deg, ${T.success}, #22C55E)` : w.completionRate >= 50 ? "linear-gradient(90deg, #D97706, #F59E0B)" : `linear-gradient(90deg, ${T.danger}, #EF4444)`, borderRadius: "99px", transition: "width 0.6s ease" }} />
                    </div>
                  </div>

                  {/* Rank badge */}
                  {i === 0 && stats.length > 1 && (
                    <div style={{ position: "absolute", top: "14px", right: "14px", fontSize: "20px" }}>🏆</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
