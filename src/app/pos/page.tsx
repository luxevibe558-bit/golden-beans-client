"use client";

import SettleBillModal from "@/components/SettleBillModal";
import { useState, useEffect, useCallback, useRef } from "react";
import POSSidebar from "@/components/POSSidebar";
import { menuApi, orderApi, tableApi } from "@/lib/api";
import type { MenuCategory, MenuItem, CartItem, Table, Order } from "@/types";

const T = {
  emerald: "#0F3D2E",
  emeraldMid: "#1A5340",
  emeraldLight: "#2D7A5F",
  emeraldDeep: "#0A2C20",
  sage: "#7A9E7E",
  gold: "#D4A574",
  goldLight: "#E8C895",
  goldDark: "#B08550",
  cream: "#FAF6F0",
  creamDark: "#F0E8DA",
  ivory: "#FFFBF5",
  text: "#2C2418",
  textMuted: "#7A6B54",
  textDim: "#A89B80",
  border: "#E5DCC9",
  success: "#4A8B4A",
  danger: "#C0392B",
  warning: "#D4A574",
};

const ITEM_EMOJIS: Record<string, string> = {
  Espresso: "☕", Cappuccino: "☕", Latte: "🥛", "Masala Chai": "🫖",
  "Hot Chocolate": "🍫", "Cold Brew": "🧊", "Iced Latte": "🥤",
  "Chocolate Frappe": "🧋", "Butter Toast": "🍞", "Cheese Sandwich": "🥪",
  "Garlic Bread": "🥖", "Chocolate Brownie": "🍫", "Cheesecake Slice": "🍰",
  "Classic Omelette": "🍳", "Pancake Stack": "🥞",
};

function PendingApprovalBell({ orders, onAccept, onReject }: {
  orders: Order[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [timers, setTimers] = useState<Record<string, number>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (orders.length === 0) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      [0, 0.4, 0.8].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 1100;
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch { }
  }, [orders.length]);

  useEffect(() => {
    const iv = setInterval(() => {
      const newTimers: Record<string, number> = {};
      orders.forEach(o => {
        const elapsed = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 1000);
        const remaining = Math.max(0, 60 - elapsed);
        newTimers[o._id] = remaining;
        if (remaining === 0) onAccept(o._id);
      });
      setTimers(newTimers);
    }, 1000);
    return () => clearInterval(iv);
  }, [orders, onAccept]);

  if (orders.length === 0) return null;

  return (
    <div style={{ position: "fixed", top: "18px", right: "18px", zIndex: 100, width: "340px", maxHeight: "calc(100vh - 36px)", overflowY: "auto" }}>
      {orders.map((order, idx) => (
        <div key={order._id} style={{
          background: T.ivory, borderRadius: "16px", padding: "16px", marginBottom: "10px",
          border: `2px solid ${T.gold}`, boxShadow: "0 16px 40px rgba(15,61,46,0.3)",
          animation: `slideInRight 0.4s ${idx * 0.1}s ease both`,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", animation: "ring 1.5s infinite" }}>🔔</div>
              <div>
                <p style={{ fontWeight: 900, fontSize: "13px", color: T.emerald, margin: 0, fontFamily: "'Playfair Display', serif" }}>New QR Order!</p>
                <p style={{ fontSize: "11px", color: T.textMuted, margin: "1px 0 0", fontWeight: 700 }}>{order.tableNumber} • #{order.orderNumber}</p>
              </div>
            </div>
            <div style={{ background: timers[order._id] && timers[order._id] <= 10 ? T.danger : T.emerald, color: "white", padding: "3px 8px", borderRadius: "8px", fontSize: "12px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
              {timers[order._id] || 60}s
            </div>
          </div>
          <div style={{ background: T.cream, borderRadius: "10px", padding: "9px 11px", marginBottom: "10px", border: `1px solid ${T.creamDark}` }}>
            {order.items.slice(0, 3).map(item => (
              <div key={item._id} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span style={{ fontSize: "11px", color: T.text, fontWeight: 700 }}>{item.name} <span style={{ color: T.textMuted }}>×{item.quantity}</span></span>
                <span style={{ fontSize: "11px", color: T.emerald, fontWeight: 800 }}>₹{item.price * item.quantity}</span>
              </div>
            ))}
            {order.items.length > 3 && <p style={{ fontSize: "10px", color: T.textMuted, margin: "3px 0 0", fontWeight: 700 }}>+{order.items.length - 3} more items</p>}
            <div style={{ borderTop: `1px dashed ${T.creamDark}`, paddingTop: "5px", marginTop: "5px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: T.emerald }}>Total</span>
              <span style={{ fontSize: "13px", fontWeight: 900, color: T.emerald }}>₹{order.totalAmount.toFixed(0)}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => onReject(order._id)} style={{ flex: 1, padding: "9px", borderRadius: "9px", border: `1px solid ${T.danger}`, background: "white", color: T.danger, fontWeight: 800, cursor: "pointer", fontSize: "11px", fontFamily: "inherit" }}>✕ Reject</button>
            <button onClick={() => onAccept(order._id)} style={{ flex: 2, padding: "9px", borderRadius: "9px", border: "none", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, fontWeight: 900, cursor: "pointer", fontSize: "11px", fontFamily: "inherit", boxShadow: `0 4px 10px rgba(15,61,46,0.3)` }}>✓ Accept & Send</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function POSPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [settleModalOrder, setSettleModalOrder] = useState<Order | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const loadTables = useCallback(async () => {
    try {
      const res = await tableApi.getTables();
      setTables(res.data.data);
    } catch (e) { console.error(e); }
  }, []);

  const loadPendingApprovals = useCallback(async () => {
    try {
      const res = await orderApi.getPendingApproval();
      setPendingOrders(res.data.data || []);
    } catch { }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const [tablesRes, menuRes] = await Promise.all([tableApi.getTables(), menuApi.getMenu()]);
        setTables(tablesRes.data.data);
        setMenu(menuRes.data.data);
        if (menuRes.data.data.length > 0) setActiveCategory(menuRes.data.data[0]._id);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    init();
    const iv = setInterval(() => { loadTables(); loadPendingApprovals(); }, 5000);
    return () => clearInterval(iv);
  }, [loadTables, loadPendingApprovals]);

  const handleAcceptApproval = async (orderId: string) => {
    try { await orderApi.approveOrder(orderId); setPendingOrders(prev => prev.filter(o => o._id !== orderId)); loadTables(); } catch (e) { console.error(e); }
  };

  const handleRejectApproval = async (orderId: string) => {
    try { await orderApi.rejectOrder(orderId, "Rejected by staff"); setPendingOrders(prev => prev.filter(o => o._id !== orderId)); loadTables(); } catch (e) { console.error(e); }
  };

  const handleSelectTable = async (table: Table) => {
    setSelectedTable(table);
    if (table.currentOrderId) {
      try { const res = await orderApi.getOrderByTable(table._id); setCurrentOrder(res.data.data || null); }
      catch { setCurrentOrder(null); }
    } else { setCurrentOrder(null); }
    setCart([]);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === item._id);
      if (ex) return prev.map(c => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, notes: "", isVeg: true }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === itemId);
      if (!ex) return prev;
      if (ex.quantity === 1) return prev.filter(c => c.menuItemId !== itemId);
      return prev.map(c => c.menuItemId === itemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const sendKOT = async () => {
    if (!selectedTable || cart.length === 0) return;
    try {
      const res = await orderApi.createOrder({ tableId: selectedTable._id, items: cart, createdBy: "pos" });
      setCurrentOrder(res.data.data);
      setCart([]);
      loadTables();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed to send KOT"); }
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const filteredMenu = searchQuery
    ? menu.map(cat => ({ ...cat, items: cat.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) })).filter(cat => cat.items.length > 0)
    : menu;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.cream, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        @keyframes slideInRight { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes ring { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-15deg)} 75%{transform:rotate(15deg)} }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.creamDark}; border-radius: 6px; }
        button, input { font-family: 'Nunito', sans-serif; }
      `}</style>

      <POSSidebar />
      <PendingApprovalBell orders={pendingOrders} onAccept={handleAcceptApproval} onReject={handleRejectApproval} />

      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(15,61,46,0.05)" }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "22px", color: T.emerald, margin: 0, fontFamily: "'Playfair Display', serif" }}>Point of Sale</h1>
            <p style={{ fontSize: "11px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600 }}>
              {currentTime.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} • {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {[
              { label: "Available", count: tables.filter(t => t.status === "available").length, color: T.success },
              { label: "Occupied", count: tables.filter(t => t.status === "occupied").length, color: T.danger },
              { label: "Active Orders", count: tables.filter(t => t.currentOrderId).length, color: T.gold },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ background: T.cream, borderRadius: "12px", padding: "8px 14px", textAlign: "center", border: `1px solid ${T.creamDark}`, minWidth: "90px" }}>
                <p style={{ fontWeight: 900, fontSize: "20px", color, margin: 0 }}>{count}</p>
                <p style={{ fontSize: "9px", color: T.textMuted, margin: 0, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</p>
              </div>
            ))}
          </div>
        </header>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 380px", overflow: "hidden" }}>
          {/* Tables */}
          <div style={{ borderRight: `1px solid ${T.border}`, padding: "16px", overflowY: "auto" }}>
            <h2 style={{ fontWeight: 900, fontSize: "16px", color: T.emerald, margin: "0 0 12px", fontFamily: "'Playfair Display', serif" }}>SELECT TABLE</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: "8px" }}>
              {tables.map(table => {
                const isSelected = selectedTable?._id === table._id;
                const isOccupied = table.status === "occupied";
                return (
                  <button key={table._id} onClick={() => handleSelectTable(table)} style={{
                    aspectRatio: "1", background: isSelected ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : isOccupied ? "#fee" : T.ivory,
                    border: `2px solid ${isSelected ? T.goldDark : isOccupied ? T.danger : T.creamDark}`,
                    borderRadius: "12px", cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "13px",
                    color: isSelected ? T.emerald : isOccupied ? T.danger : T.emerald,
                    transition: "all 0.2s ease", fontFamily: "inherit",
                    boxShadow: isSelected ? `0 4px 12px rgba(212,165,116,0.4)` : "none",
                  }}>
                    <span style={{ fontSize: "11px", opacity: 0.7 }}>Table</span>
                    <span style={{ fontSize: "16px" }}>{table.tableNumber}</span>
                    <span style={{ fontSize: "8px", marginTop: "2px", opacity: 0.7 }}>{isOccupied ? "Active" : "Free"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu */}
          <div style={{ borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px 16px 10px", borderBottom: `1px solid ${T.border}` }}>
              <input type="text" placeholder="🔍 Search menu items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${T.creamDark}`, background: T.cream, fontSize: "13px", fontWeight: 600, outline: "none", color: T.text, boxSizing: "border-box" }} />
            </div>
            {!searchQuery && menu.length > 0 && (
              <div style={{ display: "flex", gap: "5px", overflowX: "auto", padding: "10px 16px", borderBottom: `1px solid ${T.border}` }}>
                {menu.map(cat => (
                  <button key={cat._id} onClick={() => setActiveCategory(cat._id)} style={{
                    flexShrink: 0, padding: "5px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: 800,
                    border: `1.5px solid ${activeCategory === cat._id ? T.emerald : T.creamDark}`,
                    background: activeCategory === cat._id ? T.emerald : "white",
                    color: activeCategory === cat._id ? T.gold : T.emerald,
                    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                  }}>{cat.icon} {cat.name}</button>
                ))}
              </div>
            )}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {loading ? (
                <p style={{ textAlign: "center", color: T.textMuted, padding: "30px", fontWeight: 700, fontSize: "13px" }}>Loading menu...</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
                  {(searchQuery ? filteredMenu.flatMap(c => c.items) : menu.find(c => c._id === activeCategory)?.items || []).map(item => (
                    <button key={item._id} onClick={() => addToCart(item)} disabled={!item.isAvailable} style={{
                      background: T.ivory, border: `1px solid ${T.creamDark}`, borderRadius: "12px",
                      padding: "10px 9px", cursor: item.isAvailable ? "pointer" : "not-allowed",
                      opacity: item.isAvailable ? 1 : 0.5, fontFamily: "inherit",
                      transition: "all 0.2s ease", textAlign: "center", boxShadow: "0 2px 6px rgba(15,61,46,0.05)",
                    }}>
                      <div style={{ fontSize: "26px", marginBottom: "4px" }}>{ITEM_EMOJIS[item.name] || "🍽️"}</div>
                      <p style={{ fontWeight: 800, fontSize: "11px", color: T.text, margin: "0 0 2px", lineHeight: 1.2 }}>{item.name}</p>
                      <p style={{ fontWeight: 900, fontSize: "13px", color: T.emerald, margin: 0 }}>₹{item.price}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ display: "flex", flexDirection: "column", background: T.ivory }}>
            <div style={{ padding: "16px", borderBottom: `1px solid ${T.border}` }}>
              <h2 style={{ fontWeight: 900, fontSize: "15px", color: T.emerald, margin: 0, fontFamily: "'Playfair Display', serif" }}>
                {currentOrder ? "Active Order" : selectedTable ? "New Order" : "No Table Selected"}
              </h2>
              {selectedTable && (
                <p style={{ fontSize: "11px", color: T.textMuted, margin: "3px 0 0", fontWeight: 700 }}>
                  Table {selectedTable.tableNumber}{currentOrder && ` • #${currentOrder.orderNumber}`}
                </p>
              )}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {currentOrder && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 6px" }}>Existing Items</p>
                  {currentOrder.items.map(item => (
                    <div key={item._id} style={{ background: T.cream, borderRadius: "9px", padding: "8px 10px", marginBottom: "5px", border: `1px solid ${T.creamDark}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: T.text }}>{item.name}</span>
                        <span style={{ fontSize: "11px", fontWeight: 900, color: T.emerald }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                      <p style={{ fontSize: "9px", color: T.textMuted, margin: 0, fontWeight: 700, textTransform: "capitalize" }}>{item.status} • ×{item.quantity}</p>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <>
                  <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 6px" }}>New Items</p>
                  {cart.map(item => (
                    <div key={item.menuItemId} style={{ background: T.cream, borderRadius: "9px", padding: "8px 10px", marginBottom: "5px", border: `1px solid ${T.gold}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: T.text }}>{item.name}</span>
                        <span style={{ fontSize: "11px", fontWeight: 900, color: T.emerald }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <button onClick={() => removeFromCart(item.menuItemId)} style={{ width: "22px", height: "22px", borderRadius: "6px", border: "none", background: T.emerald, color: T.gold, fontWeight: 900, cursor: "pointer", fontSize: "12px" }}>−</button>
                          <span style={{ fontWeight: 900, fontSize: "12px", minWidth: "16px", textAlign: "center" }}>{item.quantity}</span>
                          <button onClick={() => addToCart({ _id: item.menuItemId, name: item.name, price: item.price } as MenuItem)} style={{ width: "22px", height: "22px", borderRadius: "6px", border: "none", background: T.emerald, color: T.gold, fontWeight: 900, cursor: "pointer", fontSize: "12px" }}>+</button>
                        </div>
                        <span style={{ fontSize: "10px", color: T.textMuted, fontWeight: 600 }}>₹{item.price}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!currentOrder && cart.length === 0 && selectedTable && (
                <p style={{ textAlign: "center", color: T.textDim, padding: "30px 16px", fontSize: "13px", fontWeight: 700 }}>Select items from menu</p>
              )}
              {!selectedTable && (
                <p style={{ textAlign: "center", color: T.textDim, padding: "30px 16px", fontSize: "13px", fontWeight: 700 }}>Select a table to begin</p>
              )}
            </div>

            {(cart.length > 0 || currentOrder) && (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px" }}>
                {cart.length > 0 && (
                  <div style={{ background: T.cream, borderRadius: "10px", padding: "10px", marginBottom: "8px", border: `1px solid ${T.creamDark}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: T.textMuted, marginBottom: "3px" }}>
                      <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: T.textMuted, marginBottom: "5px", paddingBottom: "5px", borderBottom: `1px dashed ${T.creamDark}` }}>
                      <span>GST (5%)</span><span>₹{tax.toFixed(0)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "14px", color: T.emerald }}>
                      <span>Total</span><span>₹{total.toFixed(0)}</span>
                    </div>
                  </div>
                )}
                {cart.length > 0 && (
                  <button onClick={sendKOT} style={{
                    width: "100%", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
                    color: T.gold, border: "none", borderRadius: "10px",
                    padding: "11px", fontWeight: 900, fontSize: "13px", cursor: "pointer",
                    boxShadow: `0 6px 16px rgba(15,61,46,0.3)`, fontFamily: "inherit",
                    marginBottom: currentOrder ? "6px" : 0,
                  }}>📤 Send KOT</button>
                )}
                {currentOrder && (
                  <button onClick={() => setSettleModalOrder(currentOrder)} style={{
                    width: "100%", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                    color: T.emerald, border: "none", borderRadius: "10px",
                    padding: "11px", fontWeight: 900, fontSize: "13px", cursor: "pointer",
                    boxShadow: `0 6px 16px rgba(212,165,116,0.4)`, fontFamily: "inherit",
                  }}>💰 Settle Bill (₹{currentOrder.totalAmount.toFixed(0)})</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <SettleBillModal
        order={settleModalOrder}
        isOpen={!!settleModalOrder}
        onClose={() => setSettleModalOrder(null)}
        onSettled={() => {
          setSettleModalOrder(null);
          setCurrentOrder(null);
          setSelectedTable(null);
          loadTables();
          loadPendingApprovals();
        }}
      />
    </div>
  );
}
