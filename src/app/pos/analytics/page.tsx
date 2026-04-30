"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { analyticsApi, orderApi } from "@/lib/api";
import { Card, Pill, StatCard, EmptyState, Skeleton, Icons } from "@/components/PremiumUI";
import type { Order } from "@/types";

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
  info: "#4A7B9B",
};

interface DailyStats {
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
  avgOrderValue: number;
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
  paymentBreakdown: Record<string, number>;
  hourlyData: Array<{ hour: number; orders: number; revenue: number }>;
  cancelledOrders: number;
  rejectedAmount: number;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

// ─── Mini Bar Chart ───
function HourlyChart({ data }: { data: Array<{ hour: number; orders: number; revenue: number }> }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "16px", border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>
            Hourly Revenue
          </p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0, letterSpacing: "-0.02em" }}>
            Today&apos;s Pattern
          </p>
        </div>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald }}>
          <Icons.Chart size={18} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "120px", marginBottom: "8px" }}>
        {data.map((d, idx) => {
          const heightPct = (d.revenue / maxRevenue) * 100;
          const isPeak = d.revenue === maxRevenue && d.revenue > 0;
          return (
            <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div title={`${formatHour(d.hour)}: ₹${d.revenue.toFixed(0)} (${d.orders} orders)`} style={{
                width: "100%",
                height: `${Math.max(heightPct, 2)}%`,
                background: isPeak ? `linear-gradient(180deg, ${T.gold}, ${T.goldLight})` : `linear-gradient(180deg, ${T.emerald}, ${T.emeraldMid})`,
                borderRadius: "4px 4px 0 0",
                transition: "all 250ms ease",
                cursor: "pointer",
                boxShadow: isPeak ? "0 4px 8px rgba(212,165,116,0.3)" : "none",
              }} />
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "4px", justifyContent: "space-between" }}>
        {data.filter((_, i) => i % 4 === 0).map(d => (
          <span key={d.hour} style={{ fontSize: "9px", color: T.textDim, fontWeight: 700 }}>
            {formatHour(d.hour)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Top Items List ───
function TopItemsList({ items }: { items: Array<{ name: string; quantity: number; revenue: number }> }) {
  const topItems = items.slice(0, 5);
  const maxRevenue = Math.max(...topItems.map(i => i.revenue), 1);

  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "16px", border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>
            Best Sellers
          </p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0, letterSpacing: "-0.02em" }}>
            Top Items Today
          </p>
        </div>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", color: T.gold }}>
          <Icons.Sparkle size={18} />
        </div>
      </div>

      {topItems.length === 0 ? (
        <p style={{ textAlign: "center", color: T.textMuted, fontSize: "13px", fontWeight: 700, padding: "20px 0", margin: 0 }}>
          No items sold today
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {topItems.map((item, idx) => {
            const pct = (item.revenue / maxRevenue) * 100;
            return (
              <div key={idx} style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "20px", height: "20px",
                      borderRadius: "50%",
                      background: idx === 0 ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : T.cream,
                      color: idx === 0 ? T.emerald : T.textMuted,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: 800,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: T.text }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: T.emerald, fontFamily: "'DM Sans', sans-serif" }}>
                    ₹{item.revenue.toFixed(0)}
                  </span>
                </div>
                <div style={{ background: T.cream, height: "5px", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: idx === 0 ? `linear-gradient(90deg, ${T.gold}, ${T.goldLight})` : `linear-gradient(90deg, ${T.emerald}, ${T.emeraldMid})`,
                    borderRadius: "99px",
                    transition: "width 500ms ease",
                  }} />
                </div>
                <p style={{ fontSize: "10px", color: T.textMuted, margin: "3px 0 0", fontWeight: 600 }}>
                  {item.quantity} sold
                </p>
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
  const methods = Object.entries(data).filter(([_, v]) => v > 0);

  const colors: Record<string, { bg: string; light: string }> = {
    cash: { bg: T.success, light: "#E8F4ED" },
    card: { bg: T.info, light: "#E8F1F7" },
    upi: { bg: T.gold, light: "#FAF3E8" },
    wallet: { bg: T.emerald, light: "#E8F4ED" },
  };

  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "16px", border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>
            Payment Mix
          </p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0, letterSpacing: "-0.02em" }}>
            Payment Methods
          </p>
        </div>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald }}>
          <Icons.Money size={18} />
        </div>
      </div>

      {methods.length === 0 ? (
        <p style={{ textAlign: "center", color: T.textMuted, fontSize: "13px", fontWeight: 700, padding: "20px 0", margin: 0 }}>
          No payments yet
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {methods.map(([method, amount]) => {
            const pct = (amount / total) * 100;
            const c = colors[method.toLowerCase()] || { bg: T.emerald, light: T.cream };
            return (
              <div key={method}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: c.bg }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: T.text, textTransform: "capitalize" }}>{method}</span>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: T.emerald, fontFamily: "'DM Sans', sans-serif" }}>
                    ₹{amount.toFixed(0)}
                  </span>
                </div>
                <div style={{ background: c.light, height: "8px", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: c.bg, borderRadius: "99px",
                    transition: "width 500ms ease",
                  }} />
                </div>
                <p style={{ fontSize: "9px", color: T.textMuted, margin: "3px 0 0", fontWeight: 700, textAlign: "right" }}>
                  {pct.toFixed(0)}% of revenue
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Recent Orders Mini List ───
function RecentOrdersList({ orders }: { orders: Order[] }) {
  const recent = orders.filter(o => o.status === "settled").slice(0, 5);

  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "16px", border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>
            Recent
          </p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0, letterSpacing: "-0.02em" }}>
            Settled Orders
          </p>
        </div>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `linear-gradient(135deg, ${T.success}, #2d6a2d)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
          <Icons.Check size={18} />
        </div>
      </div>

      {recent.length === 0 ? (
        <p style={{ textAlign: "center", color: T.textMuted, fontSize: "13px", fontWeight: 700, padding: "20px 0", margin: 0 }}>
          No settled orders yet
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {recent.map(order => (
            <div key={order._id} style={{
              background: T.cream, borderRadius: "10px", padding: "10px 12px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: `1px solid ${T.border}`,
            }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: "12px", color: T.emerald, margin: 0 }}>#{order.orderNumber}</p>
                <p style={{ fontSize: "10px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600 }}>
                  Table {order.tableNumber} · {formatTime(order.createdAt)} · {order.paymentMethod}
                </p>
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 800, color: T.emerald }}>
                ₹{order.totalAmount.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const load = useCallback(async () => {
    try {
      const res = await orderApi.getOrders({ date, all: "true" });
      setOrders(res.data.data);
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

  // Top items aggregation
  const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  settled.forEach(o => {
    o.items.forEach(item => {
      const ex = itemMap.get(item.name);
      if (ex) {
        ex.quantity += item.quantity;
        ex.revenue += item.price * item.quantity;
      } else {
        itemMap.set(item.name, { name: item.name, quantity: item.quantity, revenue: item.price * item.quantity });
      }
    });
  });
  const topItems = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);

  // Payment breakdown
  const paymentBreakdown: Record<string, number> = {};
  settled.forEach(o => {
    if (o.paymentMethod) {
      paymentBreakdown[o.paymentMethod] = (paymentBreakdown[o.paymentMethod] || 0) + o.totalAmount;
    }
  });

  // Hourly data
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0, revenue: 0 }));
  settled.forEach(o => {
    const hour = new Date(o.createdAt).getHours();
    hourlyData[hour].orders++;
    hourlyData[hour].revenue += o.totalAmount;
  });

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
              }}>Analytics</h1>
              <p style={{ fontSize: "12px", color: T.textMuted, margin: 0, fontWeight: 500 }}>
                Performance insights & business intelligence
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{
                  padding: "10px 14px", borderRadius: "10px",
                  border: `1.5px solid ${T.border}`, background: T.ivory,
                  color: T.text, fontSize: "13px", fontWeight: 600,
                  outline: "none", fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            <StatCard
              label="Total Revenue"
              value={`₹${totalRevenue.toFixed(0)}`}
              icon={<Icons.Money size={18} />}
              variant="gold"
              subtitle={`${totalOrders} orders settled`}
            />
            <StatCard
              label="Avg Order Value"
              value={`₹${avgOrderValue.toFixed(0)}`}
              icon={<Icons.Receipt size={18} />}
              variant="default"
              subtitle="Per order average"
            />
            <StatCard
              label="Items Sold"
              value={totalItems}
              icon={<Icons.Box size={18} />}
              variant="info"
              subtitle="Total quantity"
            />
            <StatCard
              label="Cancellations"
              value={cancelledOrders}
              icon={<Icons.Close size={18} />}
              variant="danger"
              subtitle={`${orders.length > 0 ? Math.round(cancelledOrders / orders.length * 100) : 0}% rate`}
            />
          </div>
        </header>

        <main style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height="200px" style={{ borderRadius: "16px" }} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={<Icons.Chart size={32} color={T.emerald} />}
              title="No data for this date"
              description="Start serving customers to see analytics here."
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px", animation: "gb-fadeInUp 0.4s ease both" }}>
              <HourlyChart data={hourlyData} />
              <TopItemsList items={topItems} />
              <PaymentBreakdown data={paymentBreakdown} total={totalRevenue} />
              <RecentOrdersList orders={orders} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
