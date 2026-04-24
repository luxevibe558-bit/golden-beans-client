"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { menuApi, orderApi, tableApi } from "@/lib/api";
import type { MenuCategory, MenuItem, Table, Order, CartItem } from "@/types";
import OrderApprovalPanel from "@/components/OrderApprovalPanel";

const BRAND = {
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  goldDark: "#A07830",
  coffee: "#1A0E06",
  coffeeMid: "#2C1A0E",
  coffeeLight: "#4A2C1A",
  coffeeBorder: "#3D2410",
  cream: "#FDF6E9",
  creamDark: "#F0E0C0",
  espresso: "#0D0700",
  surface: "#231508",
  surfaceHover: "#2E1B0F",
  text: "#E8D5B0",
  textMuted: "#9A7A5A",
  textDim: "#6A4A2A",
  success: "#4ade80",
  warning: "#fbbf24",
  danger: "#f87171",
  blue: "#60a5fa",
};

function formatINR(n: number) {
  return `₹${n.toFixed(0)}`;
}

const TAX_RATE = 0.05;

// ─── Settle Modal ───
function SettleModal({ order, onSettle, onClose }: {
  order: Order;
  onSettle: (amountPaid: number, method: string, discount: number) => Promise<void>;
  onClose: () => void;
}) {
  const [method, setMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [loading, setLoading] = useState(false);

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = Math.max(0, subtotal + tax - discount);

  useEffect(() => { setAmountPaid(total); }, [total]);

  const shortfall = total - amountPaid;
  const change = amountPaid - total;

  const handleSettle = async () => {
    if (amountPaid <= 0) return alert("Enter amount paid");
    setLoading(true);
    try { await onSettle(amountPaid, method, discount); }
    finally { setLoading(false); }
  };

  const payMethods = [
    { id: "cash", label: "Cash", icon: "💵" },
    { id: "upi", label: "UPI", icon: "📱" },
    { id: "card", label: "Card", icon: "💳" },
    { id: "wallet", label: "Wallet", icon: "👛" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(8px)" }}>
      <div style={{ background: BRAND.surface, border: `1px solid ${BRAND.coffeeBorder}`, borderRadius: "28px", width: "100%", maxWidth: "460px", overflow: "hidden", boxShadow: `0 32px 80px rgba(0,0,0,0.5)`, animation: "scaleIn 0.2s ease" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${BRAND.coffeeMid}, ${BRAND.coffeeLight})`, padding: "20px 24px", borderBottom: `1px solid ${BRAND.coffeeBorder}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontWeight: 900, fontSize: "20px", color: BRAND.gold, margin: 0 }}>Settle Bill</h2>
              <p style={{ fontSize: "13px", color: BRAND.textMuted, margin: "3px 0 0" }}>{order.tableNumber} • #{order.orderNumber}</p>
            </div>
            <button onClick={onClose} style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: `1px solid ${BRAND.coffeeBorder}`, color: BRAND.textMuted, cursor: "pointer", fontSize: "16px" }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "20px 24px", maxHeight: "70vh", overflowY: "auto" }}>
          {/* Items */}
          <div style={{ background: BRAND.coffeeMid, borderRadius: "16px", padding: "14px", marginBottom: "16px", border: `1px solid ${BRAND.coffeeBorder}`, maxHeight: "160px", overflowY: "auto" }}>
            {order.items.map(item => (
              <div key={item._id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0", borderBottom: `1px solid ${BRAND.coffeeBorder}` }}>
                <span style={{ color: BRAND.text }}>{item.name} <span style={{ color: BRAND.textMuted }}>×{item.quantity}</span></span>
                <span style={{ color: BRAND.gold, fontWeight: 700 }}>{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Discount */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: BRAND.textMuted, marginBottom: "6px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Discount (₹)</label>
            <input type="number" min="0" value={discount}
              onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: `1px solid ${BRAND.coffeeBorder}`, background: BRAND.coffeeMid, color: BRAND.text, fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          {/* Bill breakdown */}
          <div style={{ background: BRAND.coffeeMid, borderRadius: "16px", padding: "14px 16px", marginBottom: "16px", border: `1px solid ${BRAND.coffeeBorder}` }}>
            {[
              { label: "Subtotal", value: formatINR(subtotal) },
              { label: "GST (5%)", value: formatINR(tax) },
              ...(discount > 0 ? [{ label: "Discount", value: `−${formatINR(discount)}` }] : []),
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: BRAND.textMuted, marginBottom: "6px" }}>
                <span>{label}</span><span>{value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "18px", paddingTop: "10px", borderTop: `1px solid ${BRAND.coffeeBorder}` }}>
              <span style={{ color: BRAND.text }}>Total</span>
              <span style={{ color: BRAND.gold }}>{formatINR(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: BRAND.textMuted, marginBottom: "8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Payment Method</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
              {payMethods.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)} style={{
                  padding: "10px 8px", borderRadius: "14px", cursor: "pointer",
                  border: `2px solid ${method === m.id ? BRAND.gold : BRAND.coffeeBorder}`,
                  background: method === m.id ? `rgba(201,168,76,0.15)` : BRAND.coffeeMid,
                  color: method === m.id ? BRAND.gold : BRAND.textMuted,
                  fontWeight: 800, fontSize: "11px", transition: "all 0.2s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                }}>
                  <span style={{ fontSize: "20px" }}>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount paid */}
          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: BRAND.textMuted, marginBottom: "6px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Amount Paid (₹)</label>
            <input type="number" min="0" value={amountPaid}
              onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
              style={{ width: "100%", padding: "14px", borderRadius: "12px", border: `2px solid ${BRAND.gold}`, background: BRAND.coffeeMid, color: BRAND.gold, fontSize: "22px", fontWeight: 900, outline: "none", fontFamily: "inherit", boxSizing: "border-box", textAlign: "right" }}
            />
            {shortfall > 0.5 && (
              <p style={{ color: BRAND.warning, fontSize: "12px", margin: "6px 0 0", fontWeight: 700 }}>⚠️ Shortfall ₹{shortfall.toFixed(0)} → logged to Adjustment Wallet</p>
            )}
            {change > 0.5 && (
              <p style={{ color: BRAND.success, fontSize: "12px", margin: "6px 0 0", fontWeight: 700 }}>💵 Return change: ₹{change.toFixed(0)}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px 24px", display: "flex", gap: "10px", borderTop: `1px solid ${BRAND.coffeeBorder}` }}>
          <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: "14px", border: `1px solid ${BRAND.coffeeBorder}`, background: BRAND.coffeeMid, color: BRAND.textMuted, fontWeight: 700, cursor: "pointer", fontSize: "14px", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleSettle} disabled={loading} style={{
            flex: 2, padding: "14px", borderRadius: "14px", border: "none",
            background: loading ? BRAND.coffeeBorder : `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})`,
            color: loading ? BRAND.textMuted : BRAND.coffee,
            fontWeight: 900, cursor: loading ? "not-allowed" : "pointer",
            fontSize: "15px", fontFamily: "inherit",
            boxShadow: loading ? "none" : `0 8px 24px rgba(201,168,76,0.35)`,
          }}>
            {loading ? "Processing..." : "✓ Settle Bill"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Table Button ───
function TableButton({ table, isSelected, order, onClick }: {
  table: Table; isSelected: boolean; order?: Order; onClick: () => void;
}) {
  const statusColors = {
    available: { bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.3)", text: "#4ade80" },
    occupied: { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", text: "#f87171" },
    reserved: { bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.3)", text: "#60a5fa" },
    cleaning: { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)", text: "#fbbf24" },
  };
  const sc = statusColors[table.status] || statusColors.available;

  return (
    <button onClick={onClick} style={{
      position: "relative", width: "64px", height: "64px", borderRadius: "18px",
      border: `2px solid ${isSelected ? BRAND.gold : sc.border}`,
      background: isSelected ? `rgba(201,168,76,0.2)` : sc.bg,
      cursor: "pointer", transition: "all 0.2s ease",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px",
      boxShadow: isSelected ? `0 0 0 3px rgba(201,168,76,0.3), 0 8px 20px rgba(0,0,0,0.3)` : "0 2px 8px rgba(0,0,0,0.2)",
      transform: isSelected ? "scale(1.08)" : "scale(1)",
    }}>
      <span style={{ fontWeight: 900, fontSize: "13px", color: isSelected ? BRAND.gold : sc.text }}>{table.tableNumber}</span>
      <span style={{ fontSize: "9px", color: isSelected ? BRAND.goldDark : sc.text, opacity: 0.8, fontWeight: 700 }}>{table.capacity}p</span>
      {order && (
        <div style={{ position: "absolute", top: "4px", right: "4px", width: "8px", height: "8px", borderRadius: "50%", background: BRAND.gold, border: "1.5px solid " + BRAND.coffee }} />
      )}
    </button>
  );
}

// ─── Menu Item Tile ───
function MenuTile({ item, inCart, qty, onClick }: {
  item: MenuItem; inCart: boolean; qty: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={!item.isAvailable} style={{
      position: "relative", background: inCart ? `rgba(201,168,76,0.15)` : BRAND.surface,
      border: `2px solid ${inCart ? BRAND.gold : BRAND.coffeeBorder}`,
      borderRadius: "18px", padding: "12px 10px", textAlign: "left",
      cursor: item.isAvailable ? "pointer" : "not-allowed",
      transition: "all 0.18s ease", opacity: item.isAvailable ? 1 : 0.4,
      boxShadow: inCart ? `0 4px 16px rgba(201,168,76,0.2)` : "0 2px 8px rgba(0,0,0,0.2)",
      transform: inCart ? "scale(1.02)" : "scale(1)",
    }}>
      {/* Veg indicator */}
      <div style={{ width: "12px", height: "12px", borderRadius: "3px", border: `2px solid ${item.isVeg ? "#4ade80" : "#f87171"}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "6px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: item.isVeg ? "#4ade80" : "#f87171" }} />
      </div>
      <p style={{ fontWeight: 800, fontSize: "12px", color: BRAND.text, margin: "0 0 4px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.name}</p>
      <p style={{ fontWeight: 900, fontSize: "14px", color: BRAND.gold, margin: 0 }}>{formatINR(item.price)}</p>
      {qty > 0 && (
        <div style={{ position: "absolute", top: "8px", right: "8px", width: "22px", height: "22px", borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})`, color: BRAND.coffee, fontWeight: 900, fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>{qty}</div>
      )}
    </button>
  );
}

export default function POSPage() {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderForTable, setOrderForTable] = useState<Order | null>(null);
  const [settleOrder, setSettleOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [menuRes, tablesRes, ordersRes] = await Promise.all([
        menuApi.getMenu(), tableApi.getTables(), orderApi.getOrders(),
      ]);
      setMenu(menuRes.data.data);
      setTables(tablesRes.data.data);
      setActiveOrders(ordersRes.data.data);
      if (menuRes.data.data.length > 0 && !activeCategory) {
        setActiveCategory(menuRes.data.data[0]._id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [activeCategory]);

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 10000);
    return () => clearInterval(iv);
  }, [loadData]);

  const selectTable = async (table: Table) => {
    setSelectedTable(table);
    setCart([]);
    try {
      const res = await orderApi.getOrderByTable(table._id);
      setOrderForTable(res.data.data);
    } catch { setOrderForTable(null); }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === item._id);
      if (ex) return prev.map(c => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, notes: "", isVeg: item.isVeg }];
    });
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart(prev => {
      const item = prev.find(c => c.menuItemId === itemId);
      if (!item) return prev;
      if (item.quantity + delta <= 0) return prev.filter(c => c.menuItemId !== itemId);
      return prev.map(c => c.menuItemId === itemId ? { ...c, quantity: c.quantity + delta } : c);
    });
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const sendKot = async () => {
    if (!selectedTable || cart.length === 0) return;
    try {
      const res = await orderApi.createOrder({ tableId: selectedTable._id, items: cart, createdBy: "pos" });
      const order: Order = res.data.data;
      await orderApi.sendKot(order._id);
      showToast(`✓ KOT sent for ${selectedTable.tableNumber}`);
      setCart([]);
      setOrderForTable(order);
      loadData();
    } catch (err: unknown) {
      showToast(`✗ ${err instanceof Error ? err.message : "Failed"}`, "error");
    }
  };

  const handleSettle = async (amountPaid: number, method: string, discount: number) => {
    if (!settleOrder) return;
    try {
      await orderApi.settleOrder(settleOrder._id, { amountPaid, paymentMethod: method, discount, resolvedBy: "cashier" });
      showToast(`✓ Bill settled for ${settleOrder.tableNumber}`);
      setSettleOrder(null);
      setOrderForTable(null);
      setSelectedTable(null);
      loadData();
    } catch (err: unknown) {
      showToast(`✗ ${err instanceof Error ? err.message : "Failed"}`, "error");
    }
  };

  const filteredItems = menu.find(c => c._id === activeCategory)?.items.filter(
    item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const stats = {
    available: tables.filter(t => t.status === "available").length,
    occupied: tables.filter(t => t.status === "occupied").length,
    orders: activeOrders.length,
    revenue: activeOrders.filter(o => o.status === "settled").reduce((s, o) => s + o.totalAmount, 0),
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: BRAND.coffee, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes scaleIn { from{transform:scale(0.95);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes toastIn { from{transform:translateX(-50%) translateY(20px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${BRAND.coffeeBorder}; border-radius: 4px; }
        input { font-family: 'Nunito', sans-serif; }
        button { font-family: 'Nunito', sans-serif; }
      `}</style>

      <POSSidebar />
      <OrderApprovalPanel />

      {/* Main area */}
      <div style={{ flex: 1, marginLeft: "64px", display: "flex", overflow: "hidden" }}>

        {/* ── LEFT: Tables + Menu ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Top header */}
          <header style={{ background: BRAND.surface, borderBottom: `1px solid ${BRAND.coffeeBorder}`, padding: "16px 24px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h1 style={{ fontWeight: 900, fontSize: "22px", color: BRAND.gold, margin: 0, fontFamily: "'Playfair Display', serif" }}>Point of Sale</h1>
                <p style={{ color: BRAND.textMuted, fontSize: "12px", margin: "3px 0 0", fontWeight: 600 }}>
                  {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} • {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Stats pills */}
              <div style={{ display: "flex", gap: "10px" }}>
                {[
                  { label: "Available", value: stats.available, color: BRAND.success },
                  { label: "Occupied", value: stats.occupied, color: BRAND.danger },
                  { label: "Active Orders", value: stats.orders, color: BRAND.gold },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: BRAND.coffeeMid, border: `1px solid ${BRAND.coffeeBorder}`, borderRadius: "12px", padding: "8px 14px", textAlign: "center" }}>
                    <p style={{ fontWeight: 900, fontSize: "18px", color, margin: 0 }}>{value}</p>
                    <p style={{ fontSize: "10px", color: BRAND.textMuted, margin: 0, fontWeight: 700, letterSpacing: "0.3px" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </header>

          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Table grid */}
            <div style={{ background: BRAND.coffeeMid, borderBottom: `1px solid ${BRAND.coffeeBorder}`, padding: "16px 24px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: BRAND.textMuted, letterSpacing: "0.5px", textTransform: "uppercase" }}>Select Table</span>
                {selectedTable && (
                  <span style={{ background: `rgba(201,168,76,0.2)`, color: BRAND.gold, fontSize: "12px", padding: "3px 10px", borderRadius: "99px", fontWeight: 800, border: `1px solid rgba(201,168,76,0.3)` }}>
                    {selectedTable.tableNumber} Selected
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {loading
                  ? Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} style={{ width: "64px", height: "64px", borderRadius: "18px", background: BRAND.coffeeBorder, animation: "pulse 1.5s infinite" }} />
                    ))
                  : tables.map(table => (
                      <TableButton key={table._id} table={table}
                        isSelected={selectedTable?._id === table._id}
                        order={activeOrders.find(o => o.tableNumber === table.tableNumber)}
                        onClick={() => selectTable(table)}
                      />
                    ))
                }
              </div>
            </div>

            {/* Menu */}
            {selectedTable ? (
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Category tabs + search */}
                <div style={{ background: BRAND.surface, borderBottom: `1px solid ${BRAND.coffeeBorder}`, padding: "12px 24px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: "6px", flex: 1, overflowX: "auto", scrollbarWidth: "none" }}>
                    {menu.map(cat => (
                      <button key={cat._id} onClick={() => setActiveCategory(cat._id)} style={{
                        flexShrink: 0, display: "flex", alignItems: "center", gap: "6px",
                        padding: "7px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 800,
                        border: `1.5px solid ${activeCategory === cat._id ? BRAND.gold : BRAND.coffeeBorder}`,
                        cursor: "pointer", transition: "all 0.2s",
                        background: activeCategory === cat._id ? `rgba(201,168,76,0.15)` : "transparent",
                        color: activeCategory === cat._id ? BRAND.gold : BRAND.textMuted,
                      }}>
                        <span>{cat.icon}</span>
                        <span className="hidden lg:inline">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ position: "relative", flexShrink: 0, width: "180px" }}>
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>🔍</span>
                    <input type="text" placeholder="Search menu..." value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: "10px", border: `1px solid ${BRAND.coffeeBorder}`, background: BRAND.coffeeMid, color: BRAND.text, fontSize: "13px", outline: "none" }}
                    />
                  </div>
                </div>

                {/* Menu grid */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
                    {filteredItems.map(item => (
                      <MenuTile key={item._id} item={item}
                        inCart={!!cart.find(c => c.menuItemId === item._id)}
                        qty={cart.find(c => c.menuItemId === item._id)?.quantity || 0}
                        onClick={() => item.isAvailable && addToCart(item)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "64px", marginBottom: "16px" }}>☕</div>
                  <p style={{ fontWeight: 800, fontSize: "18px", color: BRAND.textMuted, fontFamily: "'Playfair Display', serif" }}>Select a table to begin</p>
                  <p style={{ fontSize: "14px", color: BRAND.textDim }}>Click any table above</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Order Panel ── */}
        <div style={{ width: "300px", background: BRAND.surface, borderLeft: `1px solid ${BRAND.coffeeBorder}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Panel header */}
          <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${BRAND.coffeeBorder}`, flexShrink: 0 }}>
            <h2 style={{ fontWeight: 900, fontSize: "16px", color: BRAND.gold, margin: 0, fontFamily: "'Playfair Display', serif" }}>
              {selectedTable ? `Order — ${selectedTable.tableNumber}` : "No Table Selected"}
            </h2>
            {orderForTable && (
              <p style={{ fontSize: "12px", color: BRAND.textMuted, margin: "4px 0 0", fontWeight: 700 }}>Active: #{orderForTable.orderNumber}</p>
            )}
          </div>

          {/* Order items */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
            {/* Existing order */}
            {orderForTable && cart.length === 0 && (
              <div>
                <p style={{ fontSize: "11px", fontWeight: 800, color: BRAND.textMuted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Current Order</p>
                {orderForTable.items.map(item => (
                  <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: BRAND.coffeeMid, borderRadius: "12px", padding: "10px 12px", marginBottom: "6px", border: `1px solid ${BRAND.coffeeBorder}` }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 800, color: BRAND.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                        <span style={{ fontSize: "11px", color: BRAND.textMuted }}>×{item.quantity}</span>
                        <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "6px", fontWeight: 700,
                          background: item.status === "ready" ? "rgba(74,222,128,0.15)" : item.status === "preparing" ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.05)",
                          color: item.status === "ready" ? BRAND.success : item.status === "preparing" ? BRAND.warning : BRAND.textDim,
                        }}>{item.status}</span>
                      </div>
                    </div>
                    <span style={{ fontWeight: 900, fontSize: "13px", color: BRAND.gold, flexShrink: 0, marginLeft: "8px" }}>{formatINR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* New cart items */}
            {cart.length > 0 && (
              <div>
                <p style={{ fontSize: "11px", fontWeight: 800, color: BRAND.gold, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>
                  {orderForTable ? "Adding Items" : "New Order"}
                </p>
                {cart.map(item => (
                  <div key={item.menuItemId} style={{ display: "flex", alignItems: "center", gap: "8px", background: `rgba(201,168,76,0.08)`, border: `1px solid rgba(201,168,76,0.2)`, borderRadius: "12px", padding: "10px 12px", marginBottom: "6px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 800, color: BRAND.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                      <p style={{ fontSize: "12px", color: BRAND.gold, margin: "2px 0 0", fontWeight: 700 }}>{formatINR(item.price)}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                      <button onClick={() => updateCartQty(item.menuItemId, -1)} style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: BRAND.danger, fontWeight: 900, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ fontSize: "13px", fontWeight: 900, color: BRAND.gold, minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.menuItemId, 1)} style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: BRAND.success, fontWeight: 900, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                    <span style={{ fontWeight: 900, fontSize: "13px", color: BRAND.gold, minWidth: "44px", textAlign: "right" }}>{formatINR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}

            {cart.length === 0 && !orderForTable && (
              <div style={{ textAlign: "center", padding: "48px 0", color: BRAND.textDim }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>🛒</div>
                <p style={{ fontWeight: 700, fontSize: "14px" }}>Select items from menu</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "14px", borderTop: `1px solid ${BRAND.coffeeBorder}`, flexShrink: 0 }}>
            {/* Bill summary */}
            {cart.length > 0 && (
              <div style={{ background: BRAND.coffeeMid, borderRadius: "14px", padding: "12px 14px", marginBottom: "12px", border: `1px solid ${BRAND.coffeeBorder}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: BRAND.textMuted, marginBottom: "4px" }}>
                  <span>Subtotal</span><span>{formatINR(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: BRAND.textMuted, marginBottom: "8px", paddingBottom: "8px", borderBottom: `1px solid ${BRAND.coffeeBorder}` }}>
                  <span>GST (5%)</span><span>{formatINR(tax)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "16px" }}>
                  <span style={{ color: BRAND.text }}>Total</span>
                  <span style={{ color: BRAND.gold }}>{formatINR(total)}</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
              <button onClick={() => setCart([])} disabled={cart.length === 0} style={{
                padding: "12px", borderRadius: "12px", border: `1px solid ${BRAND.coffeeBorder}`,
                background: cart.length === 0 ? "transparent" : BRAND.coffeeMid,
                color: cart.length === 0 ? BRAND.textDim : BRAND.textMuted,
                fontWeight: 700, cursor: cart.length === 0 ? "not-allowed" : "pointer",
                fontSize: "13px", fontFamily: "inherit",
              }}>Clear</button>
              <button onClick={sendKot} disabled={cart.length === 0 || !selectedTable} style={{
                padding: "12px", borderRadius: "12px", border: "none",
                background: cart.length === 0 ? BRAND.coffeeBorder : `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})`,
                color: cart.length === 0 ? BRAND.textDim : BRAND.coffee,
                fontWeight: 900, cursor: cart.length === 0 ? "not-allowed" : "pointer",
                fontSize: "13px", fontFamily: "inherit",
                boxShadow: cart.length > 0 ? `0 4px 12px rgba(201,168,76,0.3)` : "none",
              }}>🖨️ Send KOT</button>
            </div>

            {orderForTable && orderForTable.status !== "settled" && (
              <button onClick={() => setSettleOrder(orderForTable)} style={{
                width: "100%", padding: "14px", borderRadius: "14px", border: "none",
                background: `linear-gradient(135deg, #166534, #16a34a)`,
                color: "white", fontWeight: 900, cursor: "pointer",
                fontSize: "15px", fontFamily: "inherit",
                boxShadow: "0 6px 20px rgba(22,163,74,0.35)",
              }}>
                💰 Settle Bill — {formatINR(orderForTable.totalAmount)}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          background: toast.type === "success" ? "rgba(22,163,74,0.95)" : "rgba(220,38,38,0.95)",
          color: "white", padding: "12px 24px", borderRadius: "16px",
          fontWeight: 800, fontSize: "14px", zIndex: 60,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "toastIn 0.3s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Settle Modal */}
      {settleOrder && (
        <SettleModal order={settleOrder} onSettle={handleSettle} onClose={() => setSettleOrder(null)} />
      )}
    </div>
  );
}
