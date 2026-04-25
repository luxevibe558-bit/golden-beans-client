"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { tableApi, orderApi } from "@/lib/api";
import { Card, Pill, StatCard, EmptyState, Skeleton, Icons, Button } from "@/components/PremiumUI";
import type { Table, Order } from "@/types";

const T = {
  emerald: "#0F3D2E",
  emeraldMid: "#1A5340",
  emeraldLight: "#2D7A5F",
  gold: "#D4A574",
  goldLight: "#E8C895",
  goldDark: "#B08550",
  cream: "#FAF6F0",
  ivory: "#FFFBF5",
  border: "#E5DCC9",
  text: "#1A1208",
  textMuted: "#7A6B54",
  textDim: "#A89B80",
  success: "#4A8B4A",
  danger: "#C0392B",
};

interface TableWithOrder extends Table {
  activeOrder?: Order | null;
}

function formatTimer(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function TableCard({ table, onSelect }: { table: TableWithOrder; onSelect: (t: TableWithOrder) => void }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!table.activeOrder) return;
    const update = () => {
      const ms = Date.now() - new Date(table.activeOrder!.createdAt).getTime();
      setElapsed(Math.floor(ms / 1000));
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [table.activeOrder]);

  const isOccupied = table.status === "occupied" || !!table.activeOrder;
  const order = table.activeOrder;

  return (
    <div
      onClick={() => onSelect(table)}
      style={{
        background: isOccupied
          ? `linear-gradient(145deg, ${T.emerald}, ${T.emeraldMid})`
          : T.ivory,
        border: `1.5px solid ${isOccupied ? "rgba(212,165,116,0.3)" : T.border}`,
        borderRadius: "16px",
        padding: "16px",
        cursor: "pointer",
        boxShadow: isOccupied
          ? "0 8px 24px rgba(15,61,46,0.25)"
          : "0 2px 6px rgba(15,61,46,0.05)",
        transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        animation: "gb-fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = isOccupied
          ? "0 16px 32px rgba(15,61,46,0.35)"
          : "0 8px 20px rgba(15,61,46,0.1)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = isOccupied
          ? "0 8px 24px rgba(15,61,46,0.25)"
          : "0 2px 6px rgba(15,61,46,0.05)";
      }}
      onMouseDown={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = "translateY(-3px)"; }}
    >
      {isOccupied && (
        <div style={{
          position: "absolute", top: 0, right: 0,
          background: T.gold, color: T.emerald,
          padding: "3px 9px", fontSize: "9px", fontWeight: 800,
          letterSpacing: "0.5px", borderRadius: "0 16px 0 10px",
        }}>
          ACTIVE
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <p style={{
            fontSize: "10px", fontWeight: 800,
            color: isOccupied ? "rgba(212,165,116,0.7)" : T.textMuted,
            margin: "0 0 2px", letterSpacing: "0.08em", textTransform: "uppercase",
          }}>Table</p>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "32px", fontWeight: 800,
            color: isOccupied ? T.gold : T.emerald,
            margin: 0, letterSpacing: "-0.02em", lineHeight: 1,
          }}>
            {table.tableNumber}
          </p>
        </div>

        <div style={{
          width: "38px", height: "38px",
          borderRadius: "10px",
          background: isOccupied ? "rgba(212,165,116,0.18)" : T.cream,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isOccupied ? T.gold : T.emerald,
        }}>
          <Icons.ChairFill size={18} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: order ? "12px" : 0 }}>
        <Icons.Users size={11} color={isOccupied ? "rgba(212,165,116,0.7)" : T.textMuted} />
        <span style={{ fontSize: "11px", fontWeight: 700, color: isOccupied ? "rgba(212,165,116,0.7)" : T.textMuted }}>
          {table.capacity} seats
        </span>
        <span style={{ flex: 1 }} />
        <Pill
          variant={isOccupied ? "danger" : "success"}
          size="sm"
        >
          {isOccupied ? "Occupied" : "Free"}
        </Pill>
      </div>

      {order && (
        <div style={{
          background: "rgba(255,251,245,0.08)",
          borderRadius: "10px",
          padding: "10px 12px",
          border: "1px solid rgba(212,165,116,0.15)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "10px", color: "rgba(212,165,116,0.7)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Order #{order.orderNumber.split("-").pop()}
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 800, color: T.gold, fontVariantNumeric: "tabular-nums" }}>
              {formatTimer(elapsed)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "11px", color: "rgba(212,165,116,0.6)", fontWeight: 600 }}>
              {order.items.length} items
            </span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "16px", fontWeight: 800,
              color: T.gold,
              fontVariantNumeric: "tabular-nums",
            }}>
              ₹{order.totalAmount.toFixed(0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const tablesRes = await tableApi.getTables();
      const tablesList: Table[] = tablesRes.data.data;

      const enriched: TableWithOrder[] = await Promise.all(
        tablesList.map(async (table) => {
          if (!table.currentOrderId) return { ...table, activeOrder: null };
          try {
            const orderRes = await orderApi.getOrderByTable(table._id);
            return { ...table, activeOrder: orderRes.data.data };
          } catch {
            return { ...table, activeOrder: null };
          }
        })
      );

      setTables(enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [load]);

  const totalTables = tables.length;
  const availableCount = tables.filter(t => !t.activeOrder && t.status === "available").length;
  const occupiedCount = tables.filter(t => t.activeOrder || t.status === "occupied").length;
  const totalRevenue = tables.reduce((s, t) => s + (t.activeOrder?.totalAmount || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: T.cream, display: "flex" }}>
      <POSSidebar />

      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header style={{
          background: T.ivory,
          borderBottom: `1px solid ${T.border}`,
          padding: "20px 24px",
          boxShadow: "0 1px 2px rgba(15,61,46,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "28px", fontWeight: 800,
                color: T.emerald, margin: "0 0 4px",
                letterSpacing: "-0.02em", lineHeight: 1.1,
              }}>
                Table Management
              </h1>
              <p style={{ fontSize: "12px", color: T.textMuted, margin: 0, fontWeight: 500 }}>
                Real-time view of all tables and active orders
              </p>
            </div>

            <Pill variant="success" size="md" icon={<span style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.success, animation: "gb-pulse 1.8s ease-in-out infinite" }} />}>
              Live
            </Pill>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            <StatCard label="Total Tables" value={totalTables} icon={<Icons.ChairFill size={18} />} variant="default" />
            <StatCard label="Available" value={availableCount} icon={<Icons.Check size={18} />} variant="success" subtitle={`${totalTables ? Math.round((availableCount / totalTables) * 100) : 0}% free`} />
            <StatCard label="Occupied" value={occupiedCount} icon={<Icons.Users size={18} />} variant="danger" subtitle={`${totalTables ? Math.round((occupiedCount / totalTables) * 100) : 0}% busy`} />
            <StatCard label="Live Revenue" value={`₹${totalRevenue.toFixed(0)}`} icon={<Icons.Money size={18} />} variant="gold" subtitle="Active orders" />
          </div>
        </header>

        {/* Body */}
        <main style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} height="180px" style={{ borderRadius: "16px" }} />
              ))}
            </div>
          ) : tables.length === 0 ? (
            <EmptyState
              icon={<Icons.ChairFill size={32} color={T.emerald} />}
              title="No tables configured"
              description="Add tables from the admin panel to see them here."
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
              {tables.map((table, idx) => (
                <div key={table._id} style={{ animationDelay: `${idx * 30}ms` }}>
                  <TableCard
                    table={table}
                    onSelect={() => {
                      window.location.href = "/pos";
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
