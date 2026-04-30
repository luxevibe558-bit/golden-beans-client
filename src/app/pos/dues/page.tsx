"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { Icons, Button, Pill, StatCard, EmptyState } from "@/components/PremiumUI";

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
  warning: "#D4A574",
  info: "#4A7B9B",
};

interface DueEntry {
  id: number;
  orderId: string;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  notes: string;
  date: string;
  settled: boolean;
  settledAt?: string;
  settledBy?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Due Entry Card ───
function DueCard({ due, onMarkSettled, onDelete, onClick }: {
  due: DueEntry;
  onMarkSettled: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.ivory,
        borderRadius: "16px",
        padding: "14px 16px",
        border: `1.5px solid ${due.settled ? T.border : T.danger + "40"}`,
        boxShadow: due.settled ? "0 2px 6px rgba(15,61,46,0.04)" : "0 4px 16px rgba(192,57,43,0.08)",
        cursor: "pointer",
        transition: "all 250ms ease",
        animation: "gb-fadeInUp 0.3s ease both",
        opacity: due.settled ? 0.7 : 1,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Avatar */}
        <div style={{
          width: "44px", height: "44px", borderRadius: "12px",
          background: due.settled
            ? `linear-gradient(135deg, ${T.success}, #2d6a2d)`
            : `linear-gradient(135deg, ${T.danger}, #a93226)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 800, fontSize: "14px",
          fontFamily: "'Playfair Display', serif",
          flexShrink: 0,
          boxShadow: due.settled ? "0 4px 12px rgba(74,139,74,0.3)" : "0 4px 12px rgba(192,57,43,0.3)",
        }}>
          {getInitials(due.customerName)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "16px", fontWeight: 800,
              color: T.emerald, margin: 0,
              letterSpacing: "-0.01em",
            }}>{due.customerName}</p>
            <Pill variant={due.settled ? "success" : "danger"} size="sm">
              {due.settled ? "✓ Paid" : "📒 Due"}
            </Pill>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {due.customerPhone && (
              <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600 }}>
                📞 {due.customerPhone}
              </span>
            )}
            <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600 }}>
              🪑 Table {due.tableNumber}
            </span>
            <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600 }}>
              #{due.orderNumber}
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "3px" }}>
            <span style={{ fontSize: "10px", color: T.textDim, fontWeight: 600 }}>
              📅 {formatDate(due.date)} {formatTime(due.date)}
            </span>
            {due.settled && due.settledAt && (
              <span style={{ fontSize: "10px", color: T.success, fontWeight: 700 }}>
                ✓ Paid on {formatDate(due.settledAt)}
              </span>
            )}
          </div>

          {due.notes && (
            <p style={{ fontSize: "11px", color: T.textMuted, margin: "4px 0 0", fontWeight: 600, fontStyle: "italic" }}>
              "{due.notes}"
            </p>
          )}
        </div>

        {/* Amount */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "20px", fontWeight: 900,
            color: due.settled ? T.success : T.danger,
            margin: "0 0 8px",
            fontVariantNumeric: "tabular-nums",
          }}>₹{due.amount.toFixed(0)}</p>

          {!due.settled && (
            <button
              onClick={e => { e.stopPropagation(); onMarkSettled(); }}
              style={{
                padding: "7px 12px",
                background: `linear-gradient(135deg, ${T.success}, #2d6a2d)`,
                color: "white", border: "none", borderRadius: "8px",
                fontWeight: 800, fontSize: "11px", cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                boxShadow: "0 4px 10px rgba(74,139,74,0.3)",
                display: "block", whiteSpace: "nowrap",
              }}
            >
              ✓ Mark Paid
            </button>
          )}
        </div>
      </div>

      {/* Items Preview */}
      <div style={{
        marginTop: "10px",
        background: T.cream, borderRadius: "8px",
        padding: "8px 10px",
        border: `1px dashed ${T.creamDark}`,
      }}>
        <p style={{ fontSize: "10px", color: T.textMuted, margin: 0, fontWeight: 600 }}>
          {due.items.slice(0, 3).map(i => `${i.name} ×${i.quantity}`).join(" · ")}
          {due.items.length > 3 && ` · +${due.items.length - 3} more`}
        </p>
      </div>
    </div>
  );
}

// ─── Due Detail Modal ───
function DueDetailModal({ due, isOpen, onClose, onMarkSettled }: {
  due: DueEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkSettled: () => void;
}) {
  if (!isOpen || !due) return null;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,61,46,0.7)",
      zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", backdropFilter: "blur(8px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.ivory, borderRadius: "20px",
        maxWidth: "440px", width: "100%", maxHeight: "90vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 32px 64px rgba(15,61,46,0.2)",
        animation: "gb-scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
        <div style={{ height: "3px", background: due.settled ? `linear-gradient(90deg, ${T.success}, #86c686)` : `linear-gradient(90deg, ${T.danger}, #e74c3c)` }} />

        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: due.settled ? `linear-gradient(135deg, ${T.success}, #2d6a2d)` : `linear-gradient(135deg, ${T.danger}, #a93226)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 800, fontSize: "16px",
              fontFamily: "'Playfair Display', serif",
            }}>
              {getInitials(due.customerName)}
            </div>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>
                {due.customerName}
              </h2>
              <p style={{ fontSize: "11px", color: T.textMuted, margin: "3px 0 0", fontWeight: 600 }}>
                Order #{due.orderNumber} · Table {due.tableNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: T.cream, border: `1px solid ${T.border}`,
            color: T.textMuted, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icons.Close size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            <div style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>Status</p>
              <Pill variant={due.settled ? "success" : "danger"} size="sm">
                {due.settled ? "✓ Paid" : "📒 Pending"}
              </Pill>
            </div>
            <div style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>Date</p>
              <p style={{ fontSize: "12px", fontWeight: 800, color: T.emerald, margin: 0 }}>{formatDate(due.date)}</p>
            </div>
            {due.customerPhone && (
              <div style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>Phone</p>
                <p style={{ fontSize: "12px", fontWeight: 800, color: T.emerald, margin: 0 }}>{due.customerPhone}</p>
              </div>
            )}
            {due.notes && (
              <div style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>Notes</p>
                <p style={{ fontSize: "11px", fontWeight: 600, color: T.text, margin: 0 }}>{due.notes}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Items</p>
          <div style={{ background: T.cream, borderRadius: "12px", overflow: "hidden", border: `1px solid ${T.border}`, marginBottom: "16px" }}>
            {due.items.map((item, idx) => (
              <div key={idx} style={{
                padding: "10px 12px",
                borderBottom: idx < due.items.length - 1 ? `1px solid ${T.creamDark}` : "none",
                display: "flex", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: T.text }}>
                  {item.name} <span style={{ color: T.textMuted }}>×{item.quantity}</span>
                </span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: T.emerald, fontFamily: "'DM Sans', sans-serif" }}>
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{
            background: due.settled ? "rgba(74,139,74,0.1)" : "rgba(192,57,43,0.08)",
            borderRadius: "12px", padding: "14px 16px",
            border: `1.5px solid ${due.settled ? T.success + "40" : T.danger + "30"}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald }}>
              Total Due
            </span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "24px", fontWeight: 900,
              color: due.settled ? T.success : T.danger,
              fontVariantNumeric: "tabular-nums",
            }}>₹{due.amount.toFixed(0)}</span>
          </div>

          {due.settled && due.settledAt && (
            <p style={{ fontSize: "11px", color: T.success, textAlign: "center", margin: "10px 0 0", fontWeight: 700 }}>
              ✓ Paid on {formatDate(due.settledAt)} at {formatTime(due.settledAt)}
            </p>
          )}
        </div>

        {!due.settled && (
          <div style={{ padding: "14px 20px 18px", borderTop: `1px solid ${T.border}` }}>
            <Button variant="primary" fullWidth size="lg" onClick={() => { onMarkSettled(); onClose(); }}>
              ✓ Mark as Paid — ₹{due.amount.toFixed(0)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───
export default function DueLedgerPage() {
  const [dues, setDues] = useState<DueEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "settled">("pending");
  const [search, setSearch] = useState("");
  const [selectedDue, setSelectedDue] = useState<DueEntry | null>(null);

  const loadDues = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("gb_dues") || "[]");
      // Sort: pending first, then by date descending
      stored.sort((a: DueEntry, b: DueEntry) => {
        if (a.settled !== b.settled) return a.settled ? 1 : -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setDues(stored);
    } catch { setDues([]); }
  }, []);

  useEffect(() => { loadDues(); }, [loadDues]);

  const handleMarkSettled = (id: number) => {
    const updated = dues.map(d =>
      d.id === id ? { ...d, settled: true, settledAt: new Date().toISOString(), settledBy: "pos" } : d
    );
    localStorage.setItem("gb_dues", JSON.stringify(updated));
    setDues(updated);
    if (selectedDue?.id === id) {
      setSelectedDue(updated.find(d => d.id === id) || null);
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Remove this due entry permanently?")) return;
    const updated = dues.filter(d => d.id !== id);
    localStorage.setItem("gb_dues", JSON.stringify(updated));
    setDues(updated);
  };

  // ─── Stats ───
  const pendingDues = dues.filter(d => !d.settled);
  const settledDues = dues.filter(d => d.settled);
  const totalPending = pendingDues.reduce((s, d) => s + d.amount, 0);
  const totalSettled = settledDues.reduce((s, d) => s + d.amount, 0);

  // ─── Unique customers with pending dues ───
  const uniqueCustomers = new Set(pendingDues.map(d => d.customerName.toLowerCase())).size;

  // ─── Filter & Search ───
  const filtered = dues.filter(d => {
    if (filter === "pending" && d.settled) return false;
    if (filter === "settled" && !d.settled) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.customerName.toLowerCase().includes(q) ||
        d.customerPhone?.includes(q) ||
        d.orderNumber.toLowerCase().includes(q) ||
        d.tableNumber.toLowerCase().includes(q);
    }
    return true;
  });

  // ─── Customer-wise pending dues grouping ───
  const customerGroups = pendingDues.reduce((acc, due) => {
    const key = due.customerName.toLowerCase();
    if (!acc[key]) acc[key] = { name: due.customerName, phone: due.customerPhone, total: 0, count: 0 };
    acc[key].total += due.amount;
    acc[key].count++;
    return acc;
  }, {} as Record<string, { name: string; phone: string; total: number; count: number }>);

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
              }}>Due Ledger</h1>
              <p style={{ fontSize: "12px", color: T.textMuted, margin: 0, fontWeight: 500 }}>
                Track credit sales and pending payments
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "16px" }}>
            <StatCard
              label="Total Pending"
              value={`₹${totalPending.toFixed(0)}`}
              icon={<Icons.Receipt size={18} />}
              variant="danger"
              subtitle={`${pendingDues.length} orders`}
            />
            <StatCard
              label="Customers"
              value={uniqueCustomers}
              icon={<Icons.Users size={18} />}
              variant="gold"
              subtitle="With pending dues"
            />
            <StatCard
              label="Settled"
              value={`₹${totalSettled.toFixed(0)}`}
              icon={<Icons.Check size={18} />}
              variant="success"
              subtitle={`${settledDues.length} orders`}
            />
            <StatCard
              label="Total Entries"
              value={dues.length}
              icon={<Icons.Box size={18} />}
              variant="default"
              subtitle="All time"
            />
          </div>

          {/* Customer summary (if pending) */}
          {Object.keys(customerGroups).length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                Pending by Customer
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {Object.values(customerGroups).map(cg => (
                  <div key={cg.name} style={{
                    background: "rgba(192,57,43,0.08)",
                    border: "1.5px solid rgba(192,57,43,0.2)",
                    borderRadius: "99px",
                    padding: "6px 14px",
                    display: "flex", alignItems: "center", gap: "8px",
                  }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: T.text }}>{cg.name}</span>
                    <span style={{ fontSize: "12px", fontWeight: 900, color: T.danger, fontFamily: "'DM Sans', sans-serif" }}>
                      ₹{cg.total.toFixed(0)}
                    </span>
                    {cg.count > 1 && (
                      <span style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700 }}>
                        ({cg.count} orders)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search + Filter */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: T.textMuted }}>
                  <Icons.Search size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Search name, phone, order..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px 10px 34px",
                    borderRadius: "10px", border: `1.5px solid ${T.border}`,
                    background: T.ivory, color: T.text, fontSize: "13px",
                    fontWeight: 600, outline: "none", boxSizing: "border-box",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "4px", background: T.ivory, padding: "4px", borderRadius: "10px", border: `1px solid ${T.border}` }}>
              {[
                { id: "pending", label: "Pending", count: pendingDues.length },
                { id: "settled", label: "Settled", count: settledDues.length },
                { id: "all", label: "All", count: dues.length },
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id as typeof filter)}
                  style={{
                    padding: "7px 14px", borderRadius: "7px",
                    background: filter === id ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "transparent",
                    color: filter === id ? T.gold : T.textMuted,
                    fontWeight: 800, fontSize: "12px", cursor: "pointer",
                    fontFamily: "'Inter', sans-serif", border: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label} <span style={{ opacity: 0.7, marginLeft: "3px", fontFamily: "'DM Sans', sans-serif" }}>{count}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {dues.length === 0 ? (
            <EmptyState
              icon={<Icons.Receipt size={32} color={T.emerald} />}
              title="No due entries yet"
              description="When you settle a bill with 'Due' payment, it will appear here."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icons.Search size={32} color={T.emerald} />}
              title="No results found"
              description="Try a different search or filter."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filtered.map((due, idx) => (
                <div key={due.id} style={{ animationDelay: `${idx * 30}ms` }}>
                  <DueCard
                    due={due}
                    onMarkSettled={() => handleMarkSettled(due.id)}
                    onDelete={() => handleDelete(due.id)}
                    onClick={() => setSelectedDue(due)}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <DueDetailModal
        due={selectedDue}
        isOpen={!!selectedDue}
        onClose={() => setSelectedDue(null)}
        onMarkSettled={() => {
          if (selectedDue) handleMarkSettled(selectedDue.id);
        }}
      />
    </div>
  );
}
