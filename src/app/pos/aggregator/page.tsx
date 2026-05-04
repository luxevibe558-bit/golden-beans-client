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

const SOURCE_CONFIG: Record<string, { color: string; bg: string; emoji: string; label: string }> = {
  swiggy: { color: "#FF5200", bg: "#FFF0E8", emoji: "🧡", label: "Swiggy" },
  zomato: { color: "#E23744", bg: "#FFF0F0", emoji: "❤️", label: "Zomato" },
};

export default function AggregatorPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testForm, setTestForm] = useState({ source: "swiggy", customerName: "Test Customer", item: "Cappuccino", price: "120", qty: "2" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/aggregator/orders`).then(r => r.json());
      setOrders(res.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, []);

  const sendTestOrder = async () => {
    setSending(true);
    try {
      await fetch(`${API}/aggregator/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: testForm.source,
          customerName: testForm.customerName,
          externalOrderId: `TEST-${Date.now()}`,
          items: [{ name: testForm.item, price: Number(testForm.price), quantity: Number(testForm.qty) }],
        }),
      });
      setSent(true);
      setTimeout(() => setSent(false), 2000);
      load();
    } catch { }
    setSending(false);
  };

  const swiggyOrders = orders.filter(o => o.createdBy === "swiggy");
  const zomatoOrders = orders.filter(o => o.createdBy === "zomato");
  const totalRevenue = orders.filter(o => o.status === "settled").reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.cream, fontFamily: "'Nunito', sans-serif" }}>
      <style>{STYLES}</style>
      <POSSidebar />
      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column" }}>
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "18px 28px", boxShadow: "0 2px 8px rgba(15,61,46,0.05)" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 800, color: T.emerald, margin: 0 }}>Aggregator Orders</h1>
          <p style={{ fontSize: "12px", color: T.textMuted, margin: "4px 0 0", fontWeight: 600 }}>Swiggy & Zomato orders — live feed</p>
        </header>

        <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto" }}>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
            {[
              { label: "Total Today", value: orders.length, icon: "📦", color: T.emerald },
              { label: "Swiggy", value: swiggyOrders.length, icon: "🧡", color: "#FF5200" },
              { label: "Zomato", value: zomatoOrders.length, icon: "❤️", color: "#E23744" },
              { label: "Revenue", value: `₹${totalRevenue.toFixed(0)}`, icon: "💰", color: T.success },
            ].map(s => (
              <div key={s.label} style={{ background: T.ivory, borderRadius: "14px", padding: "16px", border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "20px" }}>{s.icon}</span>
                  <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</p>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "26px", fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>

            {/* Orders List */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: 0 }}>Today's Orders</h2>
                <button onClick={load} style={{ padding: "7px 16px", borderRadius: "8px", border: `1px solid ${T.border}`, background: "white", color: T.emerald, fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>🔄 Refresh</button>
              </div>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[1, 2, 3].map(i => <div key={i} style={{ height: "100px", background: T.ivory, borderRadius: "14px", animation: "pulse 1.5s infinite" }} />)}
                </div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px", background: T.ivory, borderRadius: "20px", border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: "48px", margin: "0 0 12px" }}>📦</p>
                  <p style={{ fontSize: "16px", fontWeight: 800, color: T.emerald, margin: 0 }}>No Aggregator Orders Today</p>
                  <p style={{ fontSize: "13px", color: T.textMuted, margin: "4px 0 0" }}>Swiggy/Zomato orders will appear here automatically</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {orders.map((order, i) => {
                    const cfg = SOURCE_CONFIG[order.createdBy] || SOURCE_CONFIG.swiggy;
                    const statusColors: Record<string, string> = {
                      kotSent: T.success, preparing: "#2563EB", ready: T.success, settled: T.textMuted, cancelled: T.danger
                    };
                    return (
                      <div key={order._id} style={{ background: T.ivory, borderRadius: "14px", padding: "14px 16px", border: `1.5px solid ${T.border}`, animation: `fadeInUp 0.3s ${i * 0.04}s ease both`, display: "flex", alignItems: "center", gap: "14px" }}>
                        {/* Source badge */}
                        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0, border: `1px solid ${cfg.color}20` }}>
                          {cfg.emoji}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                            <p style={{ fontSize: "13px", fontWeight: 800, color: cfg.color, margin: 0 }}>{cfg.label}</p>
                            <p style={{ fontSize: "11px", color: T.textMuted, margin: 0 }}>#{order.orderNumber}</p>
                            <div style={{ background: `${statusColors[order.status] || T.textMuted}15`, borderRadius: "6px", padding: "2px 8px" }}>
                              <p style={{ fontSize: "10px", fontWeight: 800, color: statusColors[order.status] || T.textMuted, margin: 0, textTransform: "capitalize" }}>{order.status}</p>
                            </div>
                          </div>
                          <p style={{ fontSize: "12px", color: T.text, margin: "0 0 2px", fontWeight: 600 }}>{order.customerName}</p>
                          <p style={{ fontSize: "11px", color: T.textMuted, margin: 0 }}>{order.items?.length} items • {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</p>
                        </div>

                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "18px", fontWeight: 900, color: T.emerald, margin: 0 }}>₹{order.totalAmount?.toFixed(0)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Test Order Panel */}
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: "0 0 14px" }}>Test Webhook</h2>
              <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: "11px", color: T.textMuted, fontWeight: 700, margin: "0 0 14px", lineHeight: 1.5 }}>
                  Simulate a Swiggy/Zomato order — In production, connect your aggregator webhook to:
                </p>
                <div style={{ background: T.cream, borderRadius: "8px", padding: "8px 12px", marginBottom: "16px", border: `1px solid ${T.creamDark}` }}>
                  <p style={{ fontSize: "10px", fontWeight: 800, color: T.emerald, margin: 0, wordBreak: "break-all", fontFamily: "monospace" }}>POST /api/aggregator/order</p>
                </div>

                {[
                  { label: "Source", key: "source", type: "select", options: ["swiggy", "zomato"] },
                  { label: "Customer Name", key: "customerName", type: "text" },
                  { label: "Item Name", key: "item", type: "text" },
                  { label: "Price (₹)", key: "price", type: "number" },
                  { label: "Quantity", key: "qty", type: "number" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: "12px" }}>
                    <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, margin: "0 0 5px", textTransform: "uppercase" }}>{f.label}</p>
                    {f.type === "select" ? (
                      <select value={testForm[f.key as keyof typeof testForm]} onChange={e => setTestForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: `1px solid ${T.creamDark}`, background: T.cream, fontSize: "13px", fontWeight: 700, outline: "none" }}>
                        {f.options?.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} value={testForm[f.key as keyof typeof testForm]} onChange={e => setTestForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: `1px solid ${T.creamDark}`, background: T.cream, fontSize: "13px", fontWeight: 700, outline: "none", boxSizing: "border-box" }} />
                    )}
                  </div>
                ))}

                <button onClick={sendTestOrder} disabled={sending}
                  style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: sent ? T.success : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: sent ? "white" : T.gold, fontWeight: 900, fontSize: "13px", cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1, transition: "all 0.3s" }}>
                  {sent ? "✓ Order Sent to KDS!" : sending ? "Sending..." : "🛵 Send Test Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
