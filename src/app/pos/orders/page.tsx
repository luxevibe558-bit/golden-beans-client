"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { orderApi } from "@/lib/api";
import { Card, Pill, StatCard, EmptyState, Skeleton, Icons, Button, Input } from "@/components/PremiumUI";
import type { Order } from "@/types";

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
  border: "#E5DCC9",
  text: "#1A1208",
  textMuted: "#7A6B54",
  textDim: "#A89B80",
  success: "#4A8B4A",
  danger: "#C0392B",
  warning: "#D4A574",
  info: "#4A7B9B",
};

type FilterTab = "all" | "active" | "settled" | "cancelled";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getStatusConfig(status: string) {
  switch (status) {
    case "pending_approval": return { label: "Pending Approval", variant: "warning" as const, color: T.warning };
    case "open": return { label: "Open", variant: "info" as const, color: T.info };
    case "kotSent": return { label: "In Kitchen", variant: "info" as const, color: T.info };
    case "partially_ready": return { label: "Partially Ready", variant: "warning" as const, color: T.warning };
    case "ready": return { label: "Ready", variant: "success" as const, color: T.success };
    case "settled": return { label: "Settled", variant: "success" as const, color: T.success };
    case "cancelled": return { label: "Cancelled", variant: "danger" as const, color: T.danger };
    default: return { label: status, variant: "default" as const, color: T.textMuted };
  }
}

function getSourceConfig(createdBy: string) {
  if (createdBy === "customer") return { label: "QR", variant: "info" as const, icon: "📱" };
  if (createdBy === "pos") return { label: "Counter", variant: "gold" as const, icon: "🖥️" };
  return { label: createdBy, variant: "default" as const, icon: "" };
}

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const status = getStatusConfig(order.status);
  const source = getSourceConfig(order.createdBy);
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div
      onClick={onClick}
      style={{
        background: T.ivory,
        borderRadius: "16px",
        padding: "14px 16px",
        cursor: "pointer",
        border: `1.5px solid ${T.border}`,
        boxShadow: "0 2px 6px rgba(15,61,46,0.05)",
        transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        animation: "gb-fadeInUp 0.3s ease both",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(15,61,46,0.1)";
        e.currentTarget.style.borderColor = T.gold;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 2px 6px rgba(15,61,46,0.05)";
        e.currentTarget.style.borderColor = T.border;
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "18px", fontWeight: 800,
              color: T.emerald, margin: 0, letterSpacing: "-0.02em",
            }}>#{order.orderNumber}</p>
            <Pill variant={source.variant} size="sm">
              <span style={{ fontSize: "10px" }}>{source.icon}</span>
              {source.label}
            </Pill>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 700 }}>
              <Icons.ChairFill size={10} /> Table {order.tableNumber}
            </span>
            <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 700 }}>
              <Icons.Clock size={10} /> {formatTime(order.createdAt)}
            </span>
            {order.customerName && (
              <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 700 }}>
                <Icons.Users size={10} /> {order.customerName}
              </span>
            )}
          </div>
        </div>

        <Pill variant={status.variant} size="sm">{status.label}</Pill>
      </div>

      <div style={{
        background: T.cream, borderRadius: "10px", padding: "8px 12px",
        marginBottom: "8px", border: `1px dashed ${T.creamDark}`,
      }}>
        <p style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600, margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {order.items.slice(0, 3).map(i => `${i.name} ×${i.quantity}`).join(" · ")}
          {order.items.length > 3 && ` · +${order.items.length - 3} more`}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 700 }}>
          {itemCount} {itemCount === 1 ? "item" : "items"} · {order.items.length} {order.items.length === 1 ? "type" : "types"}
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "16px", fontWeight: 800,
          color: T.emerald, fontVariantNumeric: "tabular-nums",
        }}>₹{order.totalAmount.toFixed(0)}</span>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, isOpen, onClose }: { order: Order | null; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !order) return null;
  const status = getStatusConfig(order.status);
  const source = getSourceConfig(order.createdBy);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,61,46,0.7)",
      zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", backdropFilter: "blur(8px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.ivory, borderRadius: "20px", padding: 0,
        maxWidth: "480px", width: "100%", maxHeight: "90vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 32px 64px rgba(15,61,46,0.16)",
        animation: "gb-scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})` }} />

        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "22px", fontWeight: 800, color: T.emerald, margin: 0,
              }}>#{order.orderNumber}</p>
              <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                <Pill variant={status.variant} size="sm">{status.label}</Pill>
                <Pill variant={source.variant} size="sm">{source.icon} {source.label}</Pill>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: T.cream, border: `1px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: T.textMuted, cursor: "pointer",
            }}>
              <Icons.Close size={14} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            <div style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 3px" }}>Table</p>
              <p style={{ fontSize: "14px", fontWeight: 800, color: T.emerald, margin: 0 }}>{order.tableNumber}</p>
            </div>
            <div style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 3px" }}>Time</p>
              <p style={{ fontSize: "14px", fontWeight: 800, color: T.emerald, margin: 0 }}>{formatTime(order.createdAt)}</p>
            </div>
            {order.customerName && (
              <>
                <div style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 3px" }}>Customer</p>
                  <p style={{ fontSize: "13px", fontWeight: 800, color: T.emerald, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.customerName}</p>
                </div>
                {order.customerPhone && (
                  <div style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${T.border}` }}>
                    <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 3px" }}>Phone</p>
                    <p style={{ fontSize: "13px", fontWeight: 800, color: T.emerald, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{order.customerPhone}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Items</p>

          {order.items.map((item, idx) => (
            <div key={idx} style={{
              background: T.cream, borderRadius: "10px", padding: "10px 12px",
              marginBottom: "6px", border: `1px solid ${T.border}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: "13px", color: T.text, margin: "0 0 2px" }}>
                    {item.name} <span style={{ color: T.gold, fontWeight: 800 }}>×{item.quantity}</span>
                  </p>
                  {item.notes && (
                    <p style={{ fontSize: "10px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600 }}>
                      📝 {item.notes}
                    </p>
                  )}
                  <p style={{ fontSize: "9px", color: T.textDim, margin: "3px 0 0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {item.status}
                  </p>
                </div>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "13px", fontWeight: 800,
                  color: T.emerald, fontVariantNumeric: "tabular-nums",
                }}>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 20px 18px", borderTop: `1px solid ${T.border}`, background: T.cream }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.textMuted, marginBottom: "4px" }}>
            <span>Subtotal</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>₹{order.subtotal.toFixed(0)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.textMuted, marginBottom: "8px", paddingBottom: "8px", borderBottom: `1px dashed ${T.creamDark}` }}>
            <span>Tax</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>₹{order.tax.toFixed(0)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "16px", color: T.emerald }}>
            <span>Total</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontVariantNumeric: "tabular-nums" }}>₹{order.totalAmount.toFixed(0)}</span>
          </div>
          {order.paymentMethod && (
            <p style={{ fontSize: "11px", color: T.success, fontWeight: 700, margin: "8px 0 0", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ✓ Paid via {order.paymentMethod}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const load = useCallback(async () => {
    try {
      const res = await orderApi.getOrders({ date, all: "true" });
      setOrders(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, [load]);

  const activeStatuses = ["pending_approval", "open", "kotSent", "partially_ready", "ready"];
  const totalCount = orders.length;
  const activeCount = orders.filter(o => activeStatuses.includes(o.status)).length;
  const settledCount = orders.filter(o => o.status === "settled").length;
  const cancelledCount = orders.filter(o => o.status === "cancelled").length;
  const totalRevenue = orders.filter(o => o.status === "settled").reduce((s, o) => s + o.totalAmount, 0);

  const filtered = orders.filter(o => {
    if (filter === "active" && !activeStatuses.includes(o.status)) return false;
    if (filter === "settled" && o.status !== "settled") return false;
    if (filter === "cancelled" && o.status !== "cancelled") return false;
    if (search && !o.orderNumber.toLowerCase().includes(search.toLowerCase()) &&
      !o.tableNumber.toLowerCase().includes(search.toLowerCase()) &&
      !(o.customerName || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
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
              }}>Orders</h1>
              <p style={{ fontSize: "12px", color: T.textMuted, margin: 0, fontWeight: 500 }}>
                Live order management & history
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
              <Pill variant="success" size="md" icon={<span style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.success, animation: "gb-pulse 1.8s ease-in-out infinite" }} />}>
                Live
              </Pill>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            <StatCard label="Total Orders" value={totalCount} icon={<Icons.Receipt size={18} />} variant="default" />
            <StatCard label="Active" value={activeCount} icon={<Icons.Clock size={18} />} variant="info" subtitle="In progress" />
            <StatCard label="Settled" value={settledCount} icon={<Icons.Check size={18} />} variant="success" subtitle="Completed" />
            <StatCard label="Revenue" value={`₹${totalRevenue.toFixed(0)}`} icon={<Icons.Money size={18} />} variant="gold" subtitle={`From ${settledCount} orders`} />
          </div>
        </header>

        <div style={{ padding: "16px 24px 0" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "240px" }}>
              <Input icon={<Icons.Search size={14} />} placeholder="Search orders, table, or customer..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "5px", background: T.ivory, padding: "4px", borderRadius: "12px", border: `1px solid ${T.border}` }}>
              {[
                { id: "all", label: "All", count: totalCount },
                { id: "active", label: "Active", count: activeCount },
                { id: "settled", label: "Settled", count: settledCount },
                { id: "cancelled", label: "Cancelled", count: cancelledCount },
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id as FilterTab)}
                  style={{
                    padding: "8px 14px", borderRadius: "8px",
                    fontSize: "12px", fontWeight: 700,
                    background: filter === id ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "transparent",
                    color: filter === id ? T.gold : T.textMuted,
                    cursor: "pointer", transition: "all 150ms ease",
                    fontFamily: "'Inter', sans-serif",
                    border: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label} <span style={{ opacity: 0.7, marginLeft: "3px", fontFamily: "'DM Sans', sans-serif" }}>{count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <main style={{ flex: 1, padding: "16px 24px 24px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height="120px" style={{ borderRadius: "16px" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icons.Receipt size={32} color={T.emerald} />}
              title={search ? "No orders found" : "No orders for this date"}
              description={search ? "Try a different search term." : "Orders will appear here as they come in."}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filtered.map((order, idx) => (
                <div key={order._id} style={{ animationDelay: `${idx * 30}ms` }}>
                  <OrderCard order={order} onClick={() => setSelectedOrder(order)} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <OrderDetailModal order={selectedOrder} isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
