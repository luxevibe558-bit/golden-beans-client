"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { orderApi } from "@/lib/api";
import { Icons } from "@/components/PremiumUI";
import type { Order } from "@/types";

const T = {
  emerald: "#0F3D2E", emeraldMid: "#1A5340",
  gold: "#D4A574", goldLight: "#E8C895", goldDark: "#B08550",
  cream: "#FAF6F0", creamDark: "#F0E8DA", ivory: "#FFFBF5",
  border: "#E5DCC9", text: "#1A1208", textMuted: "#7A6B54", textDim: "#A89B80",
  success: "#4A8B4A", danger: "#C0392B", info: "#4A7B9B",
};

type ViewMode = "daily" | "weekly" | "monthly";

function formatHour(h: number) {
  if (h === 0) return "12A";
  if (h === 12) return "12P";
  return h < 12 ? `${h}A` : `${h - 12}P`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

// ─── Stat Card ───
function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color?: string; icon: string }) {
  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "16px", border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(15,61,46,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
        <span style={{ fontSize: "20px" }}>{icon}</span>
      </div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 800, color: color || T.emerald, margin: "0 0 4px" }}>{value}</p>
      {sub && <p style={{ fontSize: "11px", color: T.textMuted, margin: 0, fontWeight: 600 }}>{sub}</p>}
    </div>
  );
}

// ─── Hourly Chart ───
function HourlyChart({ data }: { data: Array<{ hour: number; orders: number; revenue: number }> }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const peakHour = data.reduce((max, d) => d.revenue > max.revenue ? d : max, data[0]);

  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>Hourly Revenue</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>Today's Pattern</p>
        </div>
        {peakHour.revenue > 0 && (
          <div style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, borderRadius: "10px", padding: "6px 12px", textAlign: "center" }}>
            <p style={{ fontSize: "9px", fontWeight: 800, color: T.emerald, margin: 0, textTransform: "uppercase" }}>Peak</p>
            <p style={{ fontSize: "13px", fontWeight: 900, color: T.emerald, margin: 0 }}>{formatHour(peakHour.hour)}</p>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "100px", marginBottom: "8px" }}>
        {data.map((d, idx) => {
          const heightPct = (d.revenue / maxRevenue) * 100;
          const isPeak = d.hour === peakHour.hour && d.revenue > 0;
          return (
            <div key={idx} title={`${formatHour(d.hour)}: ₹${d.revenue.toFixed(0)} · ${d.orders} orders`}
              style={{ flex: 1, height: `${Math.max(heightPct, 2)}%`, background: isPeak ? `linear-gradient(180deg, ${T.gold}, ${T.goldLight})` : `linear-gradient(180deg, ${T.emerald}99, ${T.emerald}55)`, borderRadius: "3px 3px 0 0", cursor: "pointer", transition: "all 0.2s", boxShadow: isPeak ? `0 -4px 12px ${T.gold}66` : "none" }}
            />
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {[0, 6, 12, 18, 23].map(h => (
          <span key={h} style={{ fontSize: "9px", color: T.textDim, fontWeight: 700 }}>{formatHour(h)}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Weekly Trend ───
function WeeklyTrend({ weekData }: { weekData: Array<{ date: string; revenue: number; orders: number }> }) {
  const maxRevenue = Math.max(...weekData.map(d => d.revenue), 1);
  const total = weekData.reduce((s, d) => s + d.revenue, 0);
  const avg = weekData.length > 0 ? total / weekData.length : 0;

  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>7-Day Trend</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>Weekly Revenue</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "9px", color: T.textMuted, margin: 0, fontWeight: 700 }}>DAILY AVG</p>
          <p style={{ fontSize: "16px", fontWeight: 900, color: T.gold, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>₹{avg.toFixed(0)}</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "100px", marginBottom: "10px" }}>
        {weekData.map((d, idx) => {
          const heightPct = (d.revenue / maxRevenue) * 100;
          const isToday = idx === weekData.length - 1;
          return (
            <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              {d.revenue > 0 && (
                <span style={{ fontSize: "8px", fontWeight: 800, color: isToday ? T.gold : T.textMuted }}>
                  ₹{d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(1)}k` : d.revenue.toFixed(0)}
                </span>
              )}
              <div title={`${formatDate(d.date)}: ₹${d.revenue.toFixed(0)}`}
                style={{ width: "100%", height: `${Math.max(heightPct, 3)}%`, background: isToday ? `linear-gradient(180deg, ${T.gold}, ${T.goldLight})` : `linear-gradient(180deg, ${T.emerald}, ${T.emeraldMid})`, borderRadius: "6px 6px 0 0", opacity: isToday ? 1 : 0.7 }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {weekData.map((d, idx) => (
          <span key={idx} style={{ fontSize: "9px", color: idx === weekData.length - 1 ? T.gold : T.textDim, fontWeight: idx === weekData.length - 1 ? 800 : 600, flex: 1, textAlign: "center" }}>
            {new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 2)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Peak Hours Heatmap ───
function PeakHoursHeatmap({ hourlyData }: { hourlyData: Array<{ hour: number; orders: number; revenue: number }> }) {
  const maxRevenue = Math.max(...hourlyData.map(d => d.revenue), 1);

  const getIntensity = (revenue: number) => {
    const pct = revenue / maxRevenue;
    if (pct === 0) return { bg: T.creamDark, text: T.textDim };
    if (pct < 0.25) return { bg: `${T.emerald}33`, text: T.emerald };
    if (pct < 0.5) return { bg: `${T.emerald}66`, text: T.emerald };
    if (pct < 0.75) return { bg: `${T.emerald}99`, text: "white" };
    return { bg: T.emerald, text: "white" };
  };

  // Group by morning/afternoon/evening/night
  const slots = [
    { label: "🌅 Morning", hours: [6, 7, 8, 9, 10, 11] },
    { label: "☀️ Afternoon", hours: [12, 13, 14, 15, 16, 17] },
    { label: "🌆 Evening", hours: [18, 19, 20, 21, 22, 23] },
    { label: "🌙 Night", hours: [0, 1, 2, 3, 4, 5] },
  ];

  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", border: `1px solid ${T.border}` }}>
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>Activity Map</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>Peak Hours</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {slots.map(slot => (
          <div key={slot.label}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, margin: "0 0 6px" }}>{slot.label}</p>
            <div style={{ display: "flex", gap: "4px" }}>
              {slot.hours.map(h => {
                const d = hourlyData[h];
                const { bg, text } = getIntensity(d.revenue);
                return (
                  <div key={h} title={`${formatHour(h)}: ₹${d.revenue.toFixed(0)} · ${d.orders} orders`}
                    style={{ flex: 1, height: "36px", background: bg, borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}>
                    <span style={{ fontSize: "8px", fontWeight: 700, color: text }}>{formatHour(h)}</span>
                    {d.orders > 0 && <span style={{ fontSize: "8px", fontWeight: 800, color: text }}>{d.orders}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px" }}>
        <span style={{ fontSize: "9px", color: T.textMuted, fontWeight: 600 }}>Less</span>
        {[T.creamDark, `${T.emerald}33`, `${T.emerald}66`, `${T.emerald}99`, T.emerald].map((bg, i) => (
          <div key={i} style={{ width: "16px", height: "16px", background: bg, borderRadius: "4px" }} />
        ))}
        <span style={{ fontSize: "9px", color: T.textMuted, fontWeight: 600 }}>More</span>
      </div>
    </div>
  );
}

// ─── Top Items ───
function TopItemsList({ items }: { items: Array<{ name: string; quantity: number; revenue: number }> }) {
  const topItems = items.slice(0, 8);
  const maxRevenue = Math.max(...topItems.map(i => i.revenue), 1);

  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", border: `1px solid ${T.border}` }}>
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>Best Sellers</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>Top Items</p>
      </div>

      {topItems.length === 0 ? (
        <p style={{ textAlign: "center", color: T.textMuted, fontSize: "13px", padding: "20px 0", margin: 0 }}>No items sold</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {topItems.map((item, idx) => {
            const pct = (item.revenue / maxRevenue) * 100;
            return (
              <div key={idx}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: idx === 0 ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : idx === 1 ? `${T.emerald}22` : T.cream, color: idx === 0 ? T.emerald : T.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: T.text }}>{item.name}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "13px", fontWeight: 800, color: T.emerald, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>₹{item.revenue.toFixed(0)}</p>
                    <p style={{ fontSize: "10px", color: T.textMuted, margin: 0 }}>×{item.quantity}</p>
                  </div>
                </div>
                <div style={{ background: T.cream, height: "5px", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: idx === 0 ? `linear-gradient(90deg, ${T.gold}, ${T.goldLight})` : `linear-gradient(90deg, ${T.emerald}, ${T.emeraldMid})`, borderRadius: "99px", transition: "width 600ms ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Payment Breakdown ───
function PaymentBreakdown({ data, total }: { data: Record<string, number>; total: number }) {
  const methods = Object.entries(data).filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const colors: Record<string, string> = { cash: T.success, card: T.info, upi: T.gold, wallet: T.emerald, due: T.danger };
  const emojis: Record<string, string> = { cash: "💵", card: "💳", upi: "📱", wallet: "👛", due: "📒" };

  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", border: `1px solid ${T.border}` }}>
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>Payment Mix</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>Payment Methods</p>
      </div>

      {methods.length === 0 ? (
        <p style={{ textAlign: "center", color: T.textMuted, fontSize: "13px", padding: "20px 0", margin: 0 }}>No payments yet</p>
      ) : (
        <>
          {/* Donut-style summary */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            {methods.map(([method, amount]) => (
              <div key={method} style={{ background: `${colors[method] || T.emerald}15`, border: `1px solid ${colors[method] || T.emerald}33`, borderRadius: "10px", padding: "8px 12px", flex: 1, minWidth: "80px" }}>
                <p style={{ fontSize: "16px", margin: "0 0 2px" }}>{emojis[method] || "💰"}</p>
                <p style={{ fontSize: "12px", fontWeight: 800, color: colors[method] || T.emerald, margin: 0 }}>₹{amount.toFixed(0)}</p>
                <p style={{ fontSize: "10px", color: T.textMuted, margin: 0, textTransform: "capitalize" }}>{method}</p>
              </div>
            ))}
          </div>

          {methods.map(([method, amount]) => {
            const pct = (amount / total) * 100;
            return (
              <div key={method} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: T.text, textTransform: "capitalize" }}>{emojis[method]} {method}</span>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: T.textMuted }}>{pct.toFixed(0)}%</span>
                </div>
                <div style={{ background: T.cream, height: "8px", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: colors[method] || T.emerald, borderRadius: "99px", transition: "width 500ms ease" }} />
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── GST Summary ───
function GSTSummary({ settled }: { settled: Order[] }) {
  const subtotal = settled.reduce((s, o) => s + (o.subtotal || o.totalAmount / 1.05), 0);
  const gstCollected = settled.reduce((s, o) => s + (o.totalAmount - (o.subtotal || o.totalAmount / 1.05)), 0);
  const cgst = gstCollected / 2;
  const sgst = gstCollected / 2;

  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", border: `1px solid ${T.border}` }}>
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>Tax Summary</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>GST Collected</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {[
          { label: "Taxable Amount", value: subtotal, color: T.text, sub: "Before GST" },
          { label: "CGST (2.5%)", value: cgst, color: T.info, sub: "Central GST" },
          { label: "SGST (2.5%)", value: sgst, color: T.success, sub: "State GST" },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: T.cream, borderRadius: "10px", border: `1px solid ${T.creamDark}` }}>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: T.textMuted, margin: 0 }}>{row.label}</p>
              <p style={{ fontSize: "10px", color: T.textDim, margin: "2px 0 0" }}>{row.sub}</p>
            </div>
            <p style={{ fontSize: "16px", fontWeight: 900, color: row.color, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>₹{row.value.toFixed(0)}</p>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, borderRadius: "12px" }}>
          <p style={{ fontSize: "13px", fontWeight: 800, color: T.goldLight, margin: 0 }}>Total GST</p>
          <p style={{ fontSize: "20px", fontWeight: 900, color: T.gold, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>₹{gstCollected.toFixed(0)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Recent Orders ───
function RecentOrdersList({ orders }: { orders: Order[] }) {
  const recent = orders.filter(o => o.status === "settled").slice(0, 6);

  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", border: `1px solid ${T.border}` }}>
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>Recent</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>Settled Orders</p>
      </div>

      {recent.length === 0 ? (
        <p style={{ textAlign: "center", color: T.textMuted, fontSize: "13px", padding: "20px 0", margin: 0 }}>No settled orders</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {recent.map(order => (
            <div key={order._id} style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${T.creamDark}` }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <p style={{ fontWeight: 800, fontSize: "12px", color: T.emerald, margin: 0 }}>#{order.orderNumber}</p>
                  <span style={{ fontSize: "9px", background: `${T.success}22`, color: T.success, borderRadius: "4px", padding: "1px 6px", fontWeight: 700 }}>SETTLED</span>
                </div>
                <p style={{ fontSize: "10px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600 }}>
                  T{order.tableNumber} · {formatTime(order.createdAt)} · {order.paymentMethod?.toUpperCase()}
                </p>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 900, color: T.emerald, margin: 0 }}>₹{order.totalAmount.toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [weekOrders, setWeekOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Load selected date orders
      const res = await orderApi.getOrders({ date, all: "true" });
      setOrders(res.data.data || []);

      // Load last 7 days for weekly trend
      const weekPromises = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return orderApi.getOrders({ date: d.toISOString().split("T")[0], all: "true" })
          .then(r => ({ date: d.toISOString().split("T")[0], orders: r.data.data || [] }));
      });
      const weekResults = await Promise.all(weekPromises);
      setWeekOrders(weekResults.flatMap(r => r.orders.map((o: Order) => ({ ...o, _weekDate: r.date }))));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  // ─── Compute stats ───
  const settled = orders.filter(o => o.status === "settled");
  const totalRevenue = settled.reduce((s, o) => s + o.totalAmount, 0);
  const totalOrders = settled.length;
  const totalItems = settled.reduce((s, o) => s + o.items.reduce((s2, i) => s2 + i.quantity, 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const cancelledOrders = orders.filter(o => o.status === "cancelled").length;
  const gstCollected = settled.reduce((s, o) => s + (o.totalAmount - (o.subtotal || o.totalAmount / 1.05)), 0);

  // Top items
  const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  settled.forEach(o => o.items.forEach(item => {
    const ex = itemMap.get(item.name);
    if (ex) { ex.quantity += item.quantity; ex.revenue += item.price * item.quantity; }
    else itemMap.set(item.name, { name: item.name, quantity: item.quantity, revenue: item.price * item.quantity });
  }));
  const topItems = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);

  // Payment breakdown
  const paymentBreakdown: Record<string, number> = {};
  settled.forEach(o => { if (o.paymentMethod) paymentBreakdown[o.paymentMethod] = (paymentBreakdown[o.paymentMethod] || 0) + o.totalAmount; });

  // Hourly data
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0, revenue: 0 }));
  settled.forEach(o => {
    const hour = new Date(o.createdAt).getHours();
    hourlyData[hour].orders++;
    hourlyData[hour].revenue += o.totalAmount;
  });

  // Weekly trend
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayOrders = (weekOrders as any[]).filter(o => o._weekDate === dateStr && o.status === "settled");
    return { date: dateStr, revenue: dayOrders.reduce((s: number, o: Order) => s + o.totalAmount, 0), orders: dayOrders.length };
  });

  return (
    <div style={{ minHeight: "100vh", background: T.cream, display: "flex", fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;} ::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-thumb{background:${T.creamDark};border-radius:6px;}`}</style>
      <POSSidebar />

      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "12px 20px", boxShadow: "0 2px 8px rgba(15,61,46,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 800, color: T.emerald, margin: 0 }}>Analytics</h1>
              <p style={{ fontSize: "11px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600 }}>
                {currentTime.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {/* View Mode Toggle */}
              <div style={{ display: "flex", background: T.cream, borderRadius: "10px", padding: "3px", border: `1px solid ${T.border}` }}>
                {(["daily", "weekly"] as ViewMode[]).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: viewMode === mode ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "transparent", color: viewMode === mode ? T.gold : T.textMuted, fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
                    {mode}
                  </button>
                ))}
              </div>

              {/* Date Picker */}
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.ivory, color: T.text, fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }} />
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
            <StatCard label="Revenue" value={`₹${totalRevenue >= 1000 ? `${(totalRevenue / 1000).toFixed(1)}k` : totalRevenue.toFixed(0)}`} sub={`${totalOrders} orders`} color={T.gold} icon="💰" />
            <StatCard label="Avg Order" value={`₹${avgOrderValue.toFixed(0)}`} sub="Per order" icon="🧾" />
            <StatCard label="Items Sold" value={String(totalItems)} sub="Total qty" color={T.info} icon="☕" />
            <StatCard label="GST Collected" value={`₹${gstCollected.toFixed(0)}`} sub="5% GST" color={T.success} icon="🏛️" />
            <StatCard label="Cancelled" value={String(cancelledOrders)} sub={`${orders.length > 0 ? Math.round(cancelledOrders / orders.length * 100) : 0}% rate`} color={T.danger} icon="❌" />
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: "200px", background: T.ivory, borderRadius: "16px", border: `1px solid ${T.border}`, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
              {viewMode === "daily" ? (
                <>
                  <HourlyChart data={hourlyData} />
                  <WeeklyTrend weekData={weekData} />
                  <PeakHoursHeatmap hourlyData={hourlyData} />
                  <TopItemsList items={topItems} />
                  <PaymentBreakdown data={paymentBreakdown} total={totalRevenue} />
                  <GSTSummary settled={settled} />
                  <div style={{ gridColumn: "1 / -1" }}>
                    <RecentOrdersList orders={orders} />
                  </div>
                </>
              ) : (
                <>
                  <WeeklyTrend weekData={weekData} />
                  <TopItemsList items={topItems} />
                  <PaymentBreakdown data={paymentBreakdown} total={totalRevenue} />
                  <GSTSummary settled={settled} />
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}