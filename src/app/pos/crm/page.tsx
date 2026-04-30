"use client";

// ════════════════════════════════════════════════════════════
// CRM DASHBOARD
// Place at: client-new/src/app/pos/crm/page.tsx
// ════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { Icons, Button, Pill, StatCard, EmptyState, Skeleton } from "@/components/PremiumUI";
import { orderApi } from "@/lib/api";
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
  warning: "#D4A574",
};

interface CustomerProfile {
  phone: string;
  name: string;
  totalVisits: number;
  totalSpent: number;
  avgOrderValue: number;
  lastVisit: string;
  firstVisit: string;
  favoriteItems: Array<{ name: string; count: number }>;
  orders: Order[];
  birthdate?: string;
  anniversary?: string;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function daysSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function getCustomerTier(totalSpent: number, visits: number): { label: string; color: string; bg: string; icon: string } {
  if (totalSpent >= 5000 || visits >= 20) return { label: "Gold", color: T.goldDark, bg: "rgba(212,165,116,0.15)", icon: "👑" };
  if (totalSpent >= 2000 || visits >= 10) return { label: "Silver", color: T.info, bg: "rgba(74,123,155,0.12)", icon: "⭐" };
  if (totalSpent >= 500 || visits >= 3) return { label: "Regular", color: T.success, bg: "rgba(74,139,74,0.1)", icon: "☕" };
  return { label: "New", color: T.textMuted, bg: T.cream, icon: "🌱" };
}

// ─── Customer Card ───
function CustomerCard({ customer, onClick }: { customer: CustomerProfile; onClick: () => void }) {
  const tier = getCustomerTier(customer.totalSpent, customer.totalVisits);

  return (
    <div
      onClick={onClick}
      style={{
        background: T.ivory, borderRadius: "16px", padding: "14px 16px",
        cursor: "pointer", border: `1.5px solid ${T.border}`,
        boxShadow: "0 2px 6px rgba(15,61,46,0.05)",
        transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        animation: "gb-fadeInUp 0.3s ease both",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(15,61,46,0.1)"; e.currentTarget.style.borderColor = T.gold; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 6px rgba(15,61,46,0.05)"; e.currentTarget.style.borderColor = T.border; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Avatar */}
        <div style={{
          width: "48px", height: "48px", borderRadius: "14px",
          background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: T.gold, fontWeight: 800, fontSize: "16px",
          fontFamily: "'Playfair Display', serif", flexShrink: 0,
          boxShadow: "0 4px 12px rgba(15,61,46,0.2)",
        }}>
          {getInitials(customer.name)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "16px", fontWeight: 800,
              color: T.emerald, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{customer.name}</p>
            <div style={{
              background: tier.bg, color: tier.color,
              padding: "2px 8px", borderRadius: "99px",
              fontSize: "10px", fontWeight: 800,
              display: "flex", alignItems: "center", gap: "3px",
              flexShrink: 0,
            }}>
              {tier.icon} {tier.label}
            </div>
          </div>

          <p style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600, margin: "0 0 6px", fontFamily: "'DM Sans', sans-serif" }}>
            📞 {customer.phone}
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", fontWeight: 900, color: T.emerald, margin: 0 }}>
                {customer.totalVisits}
              </p>
              <p style={{ fontSize: "9px", color: T.textMuted, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Visits</p>
            </div>
            <div style={{ width: "1px", background: T.creamDark }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", fontWeight: 900, color: T.emerald, margin: 0 }}>
                ₹{customer.totalSpent.toFixed(0)}
              </p>
              <p style={{ fontSize: "9px", color: T.textMuted, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Spent</p>
            </div>
            <div style={{ width: "1px", background: T.creamDark }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 800, color: T.textMuted, margin: 0 }}>
                {daysSince(customer.lastVisit)}
              </p>
              <p style={{ fontSize: "9px", color: T.textMuted, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Last Visit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Favorite items */}
      {customer.favoriteItems.length > 0 && (
        <div style={{ marginTop: "10px", background: T.cream, borderRadius: "8px", padding: "7px 10px", border: `1px dashed ${T.creamDark}` }}>
          <p style={{ fontSize: "10px", color: T.textMuted, margin: 0, fontWeight: 600 }}>
            ❤️ {customer.favoriteItems.slice(0, 3).map(i => `${i.name} (${i.count}x)`).join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Customer Detail Modal ───
function CustomerDetailModal({ customer, isOpen, onClose }: {
  customer: CustomerProfile | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !customer) return null;
  const tier = getCustomerTier(customer.totalSpent, customer.totalVisits);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,61,46,0.7)",
      zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", backdropFilter: "blur(8px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.ivory, borderRadius: "20px",
        maxWidth: "480px", width: "100%", maxHeight: "90vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 32px 64px rgba(15,61,46,0.2)",
        animation: "gb-scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})` }} />

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
          padding: "20px", display: "flex", alignItems: "center", gap: "14px",
        }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "16px",
            background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.emerald, fontWeight: 800, fontSize: "22px",
            fontFamily: "'Playfair Display', serif", flexShrink: 0,
            boxShadow: "0 8px 20px rgba(212,165,116,0.4)",
          }}>
            {getInitials(customer.name)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 800, color: T.gold, margin: "0 0 4px" }}>
              {customer.name}
            </h2>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <p style={{ fontSize: "12px", color: "rgba(212,165,116,0.8)", margin: 0, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                📞 {customer.phone}
              </p>
              <div style={{ background: tier.bg, color: tier.color, padding: "2px 8px", borderRadius: "99px", fontSize: "10px", fontWeight: 800 }}>
                {tier.icon} {tier.label}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(212,165,116,0.2)",
            color: T.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icons.Close size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            {[
              { label: "Total Visits", value: customer.totalVisits, icon: "🏪" },
              { label: "Total Spent", value: `₹${customer.totalSpent.toFixed(0)}`, icon: "💰" },
              { label: "Avg Order", value: `₹${customer.avgOrderValue.toFixed(0)}`, icon: "📊" },
            ].map(stat => (
              <div key={stat.label} style={{ background: T.cream, borderRadius: "12px", padding: "12px", border: `1px solid ${T.border}`, textAlign: "center" }}>
                <p style={{ fontSize: "20px", margin: "0 0 4px" }}>{stat.icon}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", fontWeight: 900, color: T.emerald, margin: "0 0 2px" }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: "9px", color: T.textMuted, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            <div style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>First Visit</p>
              <p style={{ fontSize: "13px", fontWeight: 800, color: T.emerald, margin: 0 }}>{formatDate(customer.firstVisit)}</p>
            </div>
            <div style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>Last Visit</p>
              <p style={{ fontSize: "13px", fontWeight: 800, color: T.emerald, margin: 0 }}>{formatDate(customer.lastVisit)}</p>
            </div>
          </div>

          {/* Favorite Items */}
          {customer.favoriteItems.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                Favorite Items
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {customer.favoriteItems.slice(0, 5).map((item, idx) => {
                  const maxCount = customer.favoriteItems[0].count;
                  const pct = (item.count / maxCount) * 100;
                  return (
                    <div key={item.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{
                            width: "18px", height: "18px", borderRadius: "50%",
                            background: idx === 0 ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : T.cream,
                            color: idx === 0 ? T.emerald : T.textMuted,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "9px", fontWeight: 800,
                          }}>{idx + 1}</div>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: T.text }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: T.emerald, fontFamily: "'DM Sans', sans-serif" }}>
                          {item.count}x
                        </span>
                      </div>
                      <div style={{ background: T.cream, height: "4px", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${pct}%`,
                          background: idx === 0 ? `linear-gradient(90deg, ${T.gold}, ${T.goldLight})` : `linear-gradient(90deg, ${T.emerald}, ${T.emeraldMid})`,
                          borderRadius: "99px", transition: "width 500ms ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order History */}
          <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
            Order History ({customer.orders.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {customer.orders.slice(0, 5).map(order => (
              <div key={order._id} style={{
                background: T.cream, borderRadius: "10px", padding: "10px 12px",
                border: `1px solid ${T.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: "12px", color: T.emerald, margin: 0 }}>
                    #{order.orderNumber}
                  </p>
                  <p style={{ fontSize: "10px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600 }}>
                    {formatDate(order.createdAt)} · {formatTime(order.createdAt)} · Table {order.tableNumber}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 800, color: T.emerald, margin: 0 }}>
                    ₹{order.totalAmount.toFixed(0)}
                  </p>
                  <Pill variant={order.status === "settled" ? "success" : "danger"} size="sm">
                    {order.status}
                  </Pill>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───
export default function CRMPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"visits" | "spent" | "recent">("visits");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [filterTier, setFilterTier] = useState<"all" | "gold" | "silver" | "regular" | "new">("all");

  const loadData = useCallback(async () => {
    try {
      const res = await orderApi.getOrders({ all: "true" });
      const allOrders: Order[] = res.data.data || [];
      setOrders(allOrders);

      // Build customer profiles from orders
      const customerMap = new Map<string, CustomerProfile>();

      allOrders.forEach(order => {
        if (!order.customerPhone) return;
        const key = order.customerPhone;
        const existing = customerMap.get(key);

        const itemCounts = new Map<string, number>();
        order.items.forEach(item => {
          itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + item.quantity);
        });

        if (existing) {
          existing.totalVisits++;
          existing.totalSpent += order.totalAmount;
          existing.avgOrderValue = existing.totalSpent / existing.totalVisits;
          if (new Date(order.createdAt) > new Date(existing.lastVisit)) {
            existing.lastVisit = order.createdAt;
          }
          if (new Date(order.createdAt) < new Date(existing.firstVisit)) {
            existing.firstVisit = order.createdAt;
          }
          itemCounts.forEach((count, name) => {
            const fi = existing.favoriteItems.find(f => f.name === name);
            if (fi) fi.count += count;
            else existing.favoriteItems.push({ name, count });
          });
          existing.orders.push(order);
        } else {
          const favoriteItems: Array<{ name: string; count: number }> = [];
          itemCounts.forEach((count, name) => favoriteItems.push({ name, count }));

          customerMap.set(key, {
            phone: order.customerPhone,
            name: order.customerName || "Unknown",
            totalVisits: 1,
            totalSpent: order.totalAmount,
            avgOrderValue: order.totalAmount,
            lastVisit: order.createdAt,
            firstVisit: order.createdAt,
            favoriteItems,
            orders: [order],
          });
        }
      });

      // Sort favorite items by count
      const profiles = Array.from(customerMap.values()).map(c => ({
        ...c,
        favoriteItems: c.favoriteItems.sort((a, b) => b.count - a.count),
        orders: c.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      }));

      setCustomers(profiles);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Stats ───
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgSpend = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const goldCustomers = customers.filter(c => getCustomerTier(c.totalSpent, c.totalVisits).label === "Gold").length;

  // ─── Filter + Sort ───
  const filtered = customers
    .filter(c => {
      if (search) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.phone.includes(q);
      }
      if (filterTier !== "all") {
        return getCustomerTier(c.totalSpent, c.totalVisits).label.toLowerCase() === filterTier;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "visits") return b.totalVisits - a.totalVisits;
      if (sortBy === "spent") return b.totalSpent - a.totalSpent;
      return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
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
                color: T.emerald, margin: "0 0 4px", letterSpacing: "-0.02em",
              }}>CRM</h1>
              <p style={{ fontSize: "12px", color: T.textMuted, margin: 0, fontWeight: 500 }}>
                Customer relationship & visit history
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "16px" }}>
            <StatCard label="Total Customers" value={totalCustomers} icon={<Icons.Users size={18} />} variant="default" subtitle="All time" />
            <StatCard label="Gold Members" value={goldCustomers} icon={<Icons.Sparkle size={18} />} variant="gold" subtitle="Top customers" />
            <StatCard label="Total Revenue" value={`₹${totalRevenue.toFixed(0)}`} icon={<Icons.Money size={18} />} variant="success" subtitle="From QR orders" />
            <StatCard label="Avg Spend" value={`₹${avgSpend.toFixed(0)}`} icon={<Icons.Chart size={18} />} variant="info" subtitle="Per customer" />
          </div>

          {/* Search + Filter */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
              <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: T.textMuted }}>
                <Icons.Search size={14} />
              </div>
              <input
                type="text" placeholder="Search name or phone..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px 10px 34px",
                  borderRadius: "10px", border: `1.5px solid ${T.border}`,
                  background: T.ivory, color: T.text, fontSize: "13px",
                  fontWeight: 600, outline: "none", boxSizing: "border-box",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>

            {/* Tier Filter */}
            <div style={{ display: "flex", gap: "4px", background: T.ivory, padding: "4px", borderRadius: "10px", border: `1px solid ${T.border}` }}>
              {[
                { id: "all", label: "All" },
                { id: "gold", label: "👑 Gold" },
                { id: "silver", label: "⭐ Silver" },
                { id: "regular", label: "☕ Regular" },
                { id: "new", label: "🌱 New" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilterTier(id as typeof filterTier)}
                  style={{
                    padding: "6px 12px", borderRadius: "7px",
                    background: filterTier === id ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "transparent",
                    color: filterTier === id ? T.gold : T.textMuted,
                    fontWeight: 800, fontSize: "11px", cursor: "pointer",
                    fontFamily: "'Inter', sans-serif", border: "none", whiteSpace: "nowrap",
                  }}
                >{label}</button>
              ))}
            </div>

            {/* Sort */}
            <div style={{ display: "flex", gap: "4px", background: T.ivory, padding: "4px", borderRadius: "10px", border: `1px solid ${T.border}` }}>
              {[
                { id: "visits", label: "Visits" },
                { id: "spent", label: "Spent" },
                { id: "recent", label: "Recent" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setSortBy(id as typeof sortBy)}
                  style={{
                    padding: "6px 12px", borderRadius: "7px",
                    background: sortBy === id ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : "transparent",
                    color: sortBy === id ? T.emerald : T.textMuted,
                    fontWeight: 800, fontSize: "11px", cursor: "pointer",
                    fontFamily: "'Inter', sans-serif", border: "none", whiteSpace: "nowrap",
                  }}
                >{label}</button>
              ))}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height="140px" style={{ borderRadius: "16px" }} />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={<Icons.Users size={32} color={T.emerald} />}
              title="No customer data yet"
              description="CRM data is built from QR orders. Customers who order via QR will appear here."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icons.Search size={32} color={T.emerald} />}
              title="No results found"
              description="Try a different search or filter."
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
              {filtered.map((customer, idx) => (
                <div key={customer.phone} style={{ animationDelay: `${idx * 30}ms` }}>
                  <CustomerCard customer={customer} onClick={() => setSelectedCustomer(customer)} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <CustomerDetailModal
        customer={selectedCustomer}
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
}
