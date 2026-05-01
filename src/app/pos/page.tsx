"use client";

import SettleBillModal from "@/components/SettleBillModal";
import { useState, useEffect, useCallback, useRef } from "react";
import POSSidebar from "@/components/POSSidebar";
import { menuApi, orderApi, tableApi, inventoryApi } from "@/lib/api";
import { getThumbnailUrl } from "@/lib/cloudinary";
import type { MenuCategory, MenuItem, CartItem, Table, Order } from "@/types";

const T = {
  emerald: "#0F3D2E", emeraldMid: "#1A5340", emeraldLight: "#2D7A5F",
  emeraldDeep: "#0A2C20", gold: "#D4A574", goldLight: "#E8C895", goldDark: "#B08550",
  cream: "#FAF6F0", creamDark: "#F0E8DA", ivory: "#FFFBF5",
  text: "#2C2418", textMuted: "#7A6B54", textDim: "#A89B80",
  border: "#E5DCC9", success: "#4A8B4A", danger: "#C0392B", warning: "#D4A574",
};

const ITEM_EMOJIS: Record<string, string> = {
  Espresso: "☕", Cappuccino: "☕", Latte: "🥛", "Masala Chai": "🫖",
  "Hot Chocolate": "🍫", "Cold Brew": "🧊", "Iced Latte": "🥤",
  "Chocolate Frappe": "🧋", "Butter Toast": "🍞", "Cheese Sandwich": "🥪",
  "Garlic Bread": "🥖", "Chocolate Brownie": "🍫", "Cheesecake Slice": "🍰",
  "Classic Omelette": "🍳", "Pancake Stack": "🥞",
};

// ─── Low Stock Banner ─────────────────────────────────────────────────────────
function LowStockBanner({ items }: { items: any[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (items.length === 0 || dismissed) return null;
  return (
    <div style={{ background: '#FEF2F2', borderBottom: '2px solid #FECACA', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>⚠️</span>
        <div>
          <p style={{ fontWeight: 800, fontSize: '13px', color: T.danger, margin: 0 }}>Low Stock — {items.length} item{items.length > 1 ? 's' : ''} running low!</p>
          <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0', fontWeight: 600 }}>{items.slice(0, 3).map((i: any) => i.name).join(', ')}{items.length > 3 ? ` +${items.length - 3} more` : ''}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <a href="/pos/inventory" style={{ padding: '6px 14px', borderRadius: '8px', background: T.danger, color: 'white', fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>Restock →</a>
        <button onClick={() => setDismissed(true)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #FECACA', background: 'white', color: '#999', cursor: 'pointer', fontSize: '12px' }}>✕</button>
      </div>
    </div>
  );
}

// ─── Pending Approval Bell ────────────────────────────────────────────────────
function PendingApprovalBell({ orders, onAccept, onReject }: { orders: Order[]; onAccept: (id: string) => void; onReject: (id: string) => void; }) {
  const [timers, setTimers] = useState<Record<string, number>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (orders.length === 0) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      [0, 0.4, 0.8].forEach(delay => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 1100;
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.2);
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
        <div key={order._id} style={{ background: T.ivory, borderRadius: "16px", padding: "16px", marginBottom: "10px", border: `2px solid ${T.gold}`, boxShadow: "0 16px 40px rgba(15,61,46,0.3)", animation: `slideInRight 0.4s ${idx * 0.1}s ease both` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", animation: "ring 1.5s infinite" }}>🔔</div>
              <div>
                <p style={{ fontWeight: 900, fontSize: "13px", color: T.emerald, margin: 0, fontFamily: "'Playfair Display', serif" }}>New QR Order!</p>
                <p style={{ fontSize: "11px", color: T.textMuted, margin: "1px 0 0", fontWeight: 700 }}>{order.tableNumber} • #{order.orderNumber}</p>
              </div>
            </div>
            <div style={{ background: timers[order._id] <= 10 ? T.danger : T.emerald, color: "white", padding: "3px 8px", borderRadius: "8px", fontSize: "12px", fontWeight: 900 }}>{timers[order._id] || 60}s</div>
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
            <button onClick={() => onReject(order._id)} style={{ flex: 1, padding: "9px", borderRadius: "9px", border: `1px solid ${T.danger}`, background: "white", color: T.danger, fontWeight: 800, cursor: "pointer", fontSize: "11px" }}>✕ Reject</button>
            <button onClick={() => onAccept(order._id)} style={{ flex: 2, padding: "9px", borderRadius: "9px", border: "none", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, fontWeight: 900, cursor: "pointer", fontSize: "11px" }}>✓ Accept & Send</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Smart Table Card ─────────────────────────────────────────────────────────
function TableCard({ table, order, onSelect }: { table: Table; order: Order | null; onSelect: () => void }) {
  const isOccupied = table.status === "occupied";
  const hasPending = order?.status === "pending_approval";
  const hasOrder = !!order && !["settled", "cancelled"].includes(order.status);

  return (
    <div onClick={onSelect} style={{
      background: isOccupied ? `linear-gradient(135deg, ${T.ivory}, #FFF8F0)` : T.ivory,
      borderRadius: "20px", padding: "20px",
      border: `2px solid ${hasPending ? T.gold : isOccupied ? T.emerald : T.border}`,
      cursor: "pointer", position: "relative", overflow: "hidden",
      boxShadow: isOccupied ? `0 8px 24px rgba(15,61,46,0.12)` : `0 2px 8px rgba(0,0,0,0.04)`,
      transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
      animation: "fadeInUp 0.3s ease both",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(15,61,46,0.16)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = isOccupied ? "0 8px 24px rgba(15,61,46,0.12)" : "0 2px 8px rgba(0,0,0,0.04)"; }}
    >
      {/* Pending badge */}
      {hasPending && (
        <div style={{ position: "absolute", top: "12px", right: "12px", background: T.gold, borderRadius: "8px", padding: "3px 10px", fontSize: "10px", fontWeight: 800, color: T.emerald, animation: "pulse 1.5s infinite" }}>
          🔔 QR Order
        </div>
      )}

      {/* Table number */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: isOccupied ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.cream, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "22px" }}>{isOccupied ? "🪑" : "⬜"}</span>
        </div>
        <div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: 0 }}>Table {table.tableNumber}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: isOccupied ? T.success : T.textDim }} />
            <span style={{ fontSize: "11px", color: isOccupied ? T.success : T.textMuted, fontWeight: 700 }}>{isOccupied ? "Occupied" : "Available"}</span>
          </div>
        </div>
      </div>

      {/* Order info */}
      {hasOrder && order ? (
        <div style={{ background: T.cream, borderRadius: "12px", padding: "12px", border: `1px solid ${T.creamDark}` }}>
          {/* Customer */}
          {order.customerName && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", paddingBottom: "8px", borderBottom: `1px dashed ${T.creamDark}` }}>
              <span style={{ fontSize: "14px" }}>👤</span>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 800, color: T.text, margin: 0 }}>{order.customerName}</p>
                {order.customerPhone && <p style={{ fontSize: "10px", color: T.textMuted, margin: 0 }}>{order.customerPhone}</p>}
              </div>
            </div>
          )}

          {/* Items preview */}
          <div style={{ marginBottom: "8px" }}>
            {order.items.slice(0, 2).map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                <span style={{ fontSize: "11px", color: T.text, fontWeight: 600 }}>{item.name} ×{item.quantity}</span>
                <span style={{ fontSize: "11px", color: T.emerald, fontWeight: 700 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            {order.items.length > 2 && <p style={{ fontSize: "10px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600 }}>+{order.items.length - 2} more items</p>}
          </div>

          {/* Bill amount */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: `1px dashed ${T.creamDark}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Bill</span>
              <span style={{ fontSize: "9px", background: order.status === "pending_approval" ? "#FFF3E0" : order.status === "kotSent" ? "#E8F5E9" : T.cream, color: order.status === "pending_approval" ? "#E65100" : order.status === "kotSent" ? T.success : T.textMuted, borderRadius: "4px", padding: "1px 6px", fontWeight: 700 }}>
                {order.status === "pending_approval" ? "Pending" : order.status === "kotSent" ? "KOT Sent" : order.status}
              </span>
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "18px", fontWeight: 900, color: T.emerald }}>₹{order.totalAmount.toFixed(0)}</span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p style={{ fontSize: "12px", color: T.textDim, fontWeight: 600, margin: 0 }}>Tap to start order</p>
        </div>
      )}

      {/* Hover arrow */}
      <div style={{ position: "absolute", bottom: "16px", right: "16px", opacity: 0.3, fontSize: "16px" }}>→</div>
    </div>
  );
}

// ─── CRED Menu Card ───────────────────────────────────────────────────────────
function MenuCard({ item, cartQty, onAdd, onRemove }: { item: MenuItem; cartQty: number; onAdd: () => void; onRemove: () => void }) {
  const [pressed, setPressed] = useState(false);

  return (
    <div style={{
      background: T.ivory, borderRadius: "18px", overflow: "hidden",
      border: `1.5px solid ${cartQty > 0 ? T.emerald : T.border}`,
      boxShadow: cartQty > 0 ? `0 8px 24px rgba(15,61,46,0.15)` : `0 2px 8px rgba(0,0,0,0.04)`,
      transition: "all 0.2s ease", opacity: item.isAvailable ? 1 : 0.6,
      transform: pressed ? "scale(0.97)" : "scale(1)",
    }}>
      {/* Image */}
      <div style={{ position: "relative", height: "130px", background: item.imageUrl ? "transparent" : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, overflow: "hidden" }}>
        {item.imageUrl ? (
          <img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px" }}>
            {ITEM_EMOJIS[item.name] || "🍽️"}
          </div>
        )}
        {!item.isAvailable && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ background: T.danger, color: "white", borderRadius: "8px", padding: "4px 12px", fontSize: "11px", fontWeight: 800 }}>OUT OF STOCK</span>
          </div>
        )}
        {item.tags?.includes("bestseller") && (
          <div style={{ position: "absolute", top: "8px", left: "8px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, borderRadius: "6px", padding: "2px 8px", fontSize: "9px", fontWeight: 800, color: T.emerald }}>⭐ BEST</div>
        )}
        {cartQty > 0 && (
          <div style={{ position: "absolute", top: "8px", right: "8px", background: T.emerald, borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900, color: T.gold }}>
            {cartQty}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px" }}>
        <p style={{ fontWeight: 800, fontSize: "13px", color: T.text, margin: "0 0 2px", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 900, color: T.emerald }}>₹{item.price}</span>
          {item.isAvailable && (
            cartQty > 0 ? (
              <div style={{ display: "flex", alignItems: "center", background: T.emerald, borderRadius: "8px", overflow: "hidden" }}>
                <button onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onClick={onRemove}
                  style={{ width: "28px", height: "28px", background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: "16px", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ color: T.gold, fontWeight: 900, fontSize: "13px", minWidth: "20px", textAlign: "center" }}>{cartQty}</span>
                <button onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onClick={onAdd}
                  style={{ width: "28px", height: "28px", background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: "16px", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            ) : (
              <button onClick={onAdd}
                style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, border: "none", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 800, color: T.emerald, cursor: "pointer" }}>
                + ADD
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function POSPage() {
  const [view, setView] = useState<"tables" | "order">("tables");
  const [tables, setTables] = useState<Table[]>([]);
  const [tableOrders, setTableOrders] = useState<Record<string, Order>>({});
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [settleModalOrder, setSettleModalOrder] = useState<Order | null>(null);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const loadTables = useCallback(async () => {
    try {
      const res = await tableApi.getTables();
      const tbls: Table[] = res.data.data;
      setTables(tbls);
      // Load orders for all occupied tables
      const orderMap: Record<string, Order> = {};
      await Promise.all(tbls.filter(t => t.currentOrderId).map(async t => {
        try {
          const r = await orderApi.getOrderByTable(t._id);
          if (r.data.data) orderMap[t._id] = r.data.data;
        } catch { }
      }));
      setTableOrders(orderMap);
    } catch { }
  }, []);

  const loadPendingApprovals = useCallback(async () => {
    try {
      const res = await orderApi.getPendingApproval();
      setPendingOrders(res.data.data || []);
    } catch { }
  }, []);

  const loadLowStock = useCallback(async () => {
    try {
      const res = await inventoryApi.getLowStock();
      setLowStockItems(res.data.data || []);
    } catch { }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const [tablesRes, menuRes] = await Promise.all([tableApi.getTables(), menuApi.getMenu()]);
        const tbls: Table[] = tablesRes.data.data;
        setTables(tbls);
        setMenu(menuRes.data.data);
        if (menuRes.data.data.length > 0) setActiveCategory(menuRes.data.data[0]._id);
        // Load orders
        const orderMap: Record<string, Order> = {};
        await Promise.all(tbls.filter(t => t.currentOrderId).map(async t => {
          try {
            const r = await orderApi.getOrderByTable(t._id);
            if (r.data.data) orderMap[t._id] = r.data.data;
          } catch { }
        }));
        setTableOrders(orderMap);
      } catch { }
      finally { setLoading(false); }
    }
    init();
    loadPendingApprovals();
    loadLowStock();
    const iv = setInterval(() => { loadTables(); loadPendingApprovals(); loadLowStock(); }, 5000);
    return () => clearInterval(iv);
  }, [loadTables, loadPendingApprovals, loadLowStock]);

  const handleSelectTable = async (table: Table) => {
    setSelectedTable(table);
    setCart([]);
    if (table.currentOrderId) {
      try {
        const res = await orderApi.getOrderByTable(table._id);
        setCurrentOrder(res.data.data || null);
      } catch { setCurrentOrder(null); }
    } else { setCurrentOrder(null); }
    setView("order");
  };

  const handleAcceptApproval = async (orderId: string) => {
    try {
      await orderApi.approveOrder(orderId);
      setPendingOrders(prev => prev.filter(o => o._id !== orderId));
      loadTables();
    } catch { }
  };

  const handleRejectApproval = async (orderId: string) => {
    try {
      await orderApi.rejectOrder(orderId, "Rejected by staff");
      setPendingOrders(prev => prev.filter(o => o._id !== orderId));
      loadTables();
    } catch { }
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
      loadLowStock();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed to send KOT"); }
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const activeItems = searchQuery
    ? menu.flatMap(c => c.items).filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : (menu.find(c => c._id === activeCategory)?.items || []);

  // ── TABLE VIEW ──────────────────────────────────────────────────────────────
  if (view === "tables") return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.cream, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes slideInRight { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes ring { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-15deg)} 75%{transform:rotate(15deg)} }
        @keyframes fadeInUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: ${T.creamDark}; border-radius: 6px; }
      `}</style>

      <POSSidebar />
      <PendingApprovalBell orders={pendingOrders} onAccept={handleAcceptApproval} onReject={handleRejectApproval} />

      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <LowStockBanner items={lowStockItems} />

        {/* Header */}
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(15,61,46,0.05)" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "24px", color: T.emerald, margin: 0 }}>Golden Beans POS</h1>
            <p style={{ fontSize: "11px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600 }}>
              {currentTime.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} • {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {[
              { label: "Available", count: tables.filter(t => t.status === "available").length, color: T.success },
              { label: "Occupied", count: tables.filter(t => t.status === "occupied").length, color: T.danger },
              { label: "Orders", count: Object.keys(tableOrders).length, color: T.gold },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ background: T.cream, borderRadius: "12px", padding: "8px 16px", textAlign: "center", border: `1px solid ${T.creamDark}` }}>
                <p style={{ fontWeight: 900, fontSize: "22px", color, margin: 0 }}>{count}</p>
                <p style={{ fontSize: "9px", color: T.textMuted, margin: 0, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
              </div>
            ))}
            {lowStockItems.length > 0 && (
              <div style={{ background: "#FEF2F2", borderRadius: "12px", padding: "8px 16px", textAlign: "center", border: `1px solid #FECACA` }}>
                <p style={{ fontWeight: 900, fontSize: "22px", color: T.danger, margin: 0 }}>{lowStockItems.length}</p>
                <p style={{ fontSize: "9px", color: T.danger, margin: 0, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Low Stock</p>
              </div>
            )}
          </div>
        </header>

        {/* Table Grid */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>
              Select Table
            </h2>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => handleSelectTable({ _id: "counter", tableNumber: "Counter", status: "available", currentOrderId: null, capacity: 1, qrCode: "" } as any)}
                style={{ padding: "10px 20px", borderRadius: "12px", border: `2px solid ${T.emerald}`, background: T.emerald, color: T.gold, fontWeight: 800, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
                🏪 Counter Order
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: "200px", background: T.ivory, borderRadius: "20px", border: `1px solid ${T.border}`, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {tables.map((table, idx) => (
                <div key={table._id} style={{ animation: `fadeInUp 0.3s ${idx * 0.04}s ease both` }}>
                  <TableCard
                    table={table}
                    order={tableOrders[table._id] || null}
                    onSelect={() => handleSelectTable(table)}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <SettleBillModal order={settleModalOrder} isOpen={!!settleModalOrder} onClose={() => setSettleModalOrder(null)}
        onSettled={() => { setSettleModalOrder(null); setCurrentOrder(null); setSelectedTable(null); loadTables(); loadPendingApprovals(); }} />
    </div>
  );

  // ── ORDER VIEW ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.cream, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes slideInRight { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes ring { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-15deg)} 75%{transform:rotate(15deg)} }
        @keyframes fadeInUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: ${T.creamDark}; border-radius: 6px; }
      `}</style>

      <POSSidebar />
      <PendingApprovalBell orders={pendingOrders} onAccept={handleAcceptApproval} onReject={handleRejectApproval} />

      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <LowStockBanner items={lowStockItems} />

        {/* Header */}
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "12px 20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 2px 8px rgba(15,61,46,0.05)" }}>
          <button onClick={() => { setView("tables"); setSelectedTable(null); setCurrentOrder(null); setCart([]); }}
            style={{ width: "36px", height: "36px", borderRadius: "10px", border: `1px solid ${T.border}`, background: T.cream, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
            ←
          </button>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "20px", color: T.emerald, margin: 0 }}>
              Table {selectedTable?.tableNumber}
            </h1>
            <p style={{ fontSize: "11px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600 }}>
              {currentOrder ? `Order #${currentOrder.orderNumber} • ${currentOrder.status}` : "New Order"}
              {currentOrder?.customerName && ` • ${currentOrder.customerName}`}
            </p>
          </div>
          {currentOrder && (
            <div style={{ marginLeft: "auto", background: `${T.success}15`, border: `1px solid ${T.success}33`, borderRadius: "10px", padding: "6px 14px" }}>
              <p style={{ fontSize: "11px", fontWeight: 800, color: T.success, margin: 0 }}>₹{currentOrder.totalAmount.toFixed(0)} Due</p>
            </div>
          )}
        </header>

        {/* Content */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", overflow: "hidden" }}>

          {/* Menu */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: `1px solid ${T.border}` }}>
            {/* Search + Categories */}
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, background: T.ivory }}>
              <input type="text" placeholder="🔍 Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "9px 14px", borderRadius: "10px", border: `1px solid ${T.creamDark}`, background: T.cream, fontSize: "13px", fontWeight: 600, outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
              {!searchQuery && (
                <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
                  {menu.map(cat => (
                    <button key={cat._id} onClick={() => setActiveCategory(cat._id)} style={{
                      flexShrink: 0, padding: "5px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: 800,
                      border: `1.5px solid ${activeCategory === cat._id ? T.emerald : T.creamDark}`,
                      background: activeCategory === cat._id ? T.emerald : "white",
                      color: activeCategory === cat._id ? T.gold : T.emerald,
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}>{cat.icon} {cat.name}</button>
                  ))}
                </div>
              )}
            </div>

            {/* CRED Menu Grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
                {(activeItems as MenuItem[]).map((item, idx) => {
                  const cartQty = cart.find(c => c.menuItemId === item._id)?.quantity || 0;
                  return (
                    <div key={item._id} style={{ animation: `fadeInUp 0.25s ${idx * 0.03}s ease both` }}>
                      <MenuCard
                        item={item}
                        cartQty={cartQty}
                        onAdd={() => addToCart(item)}
                        onRemove={() => removeFromCart(item._id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Panel */}
          <div style={{ display: "flex", flexDirection: "column", background: T.ivory, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 800, color: T.emerald, margin: 0 }}>
                {currentOrder ? "Active Order" : "New Order"}
              </p>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {/* Existing order items */}
              {currentOrder && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 8px" }}>Ordered Items</p>
                  {currentOrder.items.map((item, i) => (
                    <div key={i} style={{ background: T.cream, borderRadius: "10px", padding: "9px 12px", marginBottom: "6px", border: `1px solid ${T.creamDark}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: 800, color: T.text, margin: 0 }}>{item.name}</p>
                        <p style={{ fontSize: "10px", color: T.textMuted, margin: "2px 0 0", fontWeight: 600, textTransform: "capitalize" }}>{item.status} • ×{item.quantity}</p>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 900, color: T.emerald }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cart items */}
              {cart.length > 0 && (
                <div>
                  <p style={{ fontSize: "10px", color: T.gold, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 8px" }}>New Items</p>
                  {cart.map(item => (
                    <div key={item.menuItemId} style={{ background: `${T.gold}15`, borderRadius: "10px", padding: "9px 12px", marginBottom: "6px", border: `1px solid ${T.gold}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: 800, color: T.text, margin: 0 }}>{item.name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                          <button onClick={() => removeFromCart(item.menuItemId)} style={{ width: "20px", height: "20px", borderRadius: "5px", border: "none", background: T.emerald, color: T.gold, fontWeight: 900, cursor: "pointer", fontSize: "11px" }}>−</button>
                          <span style={{ fontSize: "12px", fontWeight: 900, minWidth: "16px", textAlign: "center" }}>{item.quantity}</span>
                          <button onClick={() => addToCart({ _id: item.menuItemId, name: item.name, price: item.price } as MenuItem)} style={{ width: "20px", height: "20px", borderRadius: "5px", border: "none", background: T.emerald, color: T.gold, fontWeight: 900, cursor: "pointer", fontSize: "11px" }}>+</button>
                        </div>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 900, color: T.emerald }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}

              {!currentOrder && cart.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <p style={{ fontSize: "40px", margin: "0 0 8px" }}>🍽️</p>
                  <p style={{ fontSize: "13px", color: T.textDim, fontWeight: 600 }}>Select items from menu</p>
                </div>
              )}
            </div>

            {/* Bill + Actions */}
            {(cart.length > 0 || currentOrder) && (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: "14px" }}>
                {cart.length > 0 && (
                  <div style={{ background: T.cream, borderRadius: "12px", padding: "10px 12px", marginBottom: "10px", border: `1px solid ${T.creamDark}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: T.textMuted, marginBottom: "4px" }}>
                      <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: T.textMuted, marginBottom: "6px", paddingBottom: "6px", borderBottom: `1px dashed ${T.creamDark}` }}>
                      <span>GST (5%)</span><span>₹{tax.toFixed(0)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "15px", color: T.emerald }}>
                      <span>Total</span><span>₹{total.toFixed(0)}</span>
                    </div>
                  </div>
                )}

                {cart.length > 0 && (
                  <button onClick={sendKOT} style={{ width: "100%", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, border: "none", borderRadius: "12px", padding: "12px", fontWeight: 900, fontSize: "14px", cursor: "pointer", boxShadow: `0 6px 16px rgba(15,61,46,0.3)`, marginBottom: currentOrder ? "8px" : 0 }}>
                    📤 Send KOT
                  </button>
                )}

                {currentOrder && (
                  <button onClick={() => setSettleModalOrder(currentOrder)} style={{ width: "100%", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.emerald, border: "none", borderRadius: "12px", padding: "12px", fontWeight: 900, fontSize: "14px", cursor: "pointer", boxShadow: `0 6px 16px rgba(212,165,116,0.4)` }}>
                    💰 Settle Bill (₹{currentOrder.totalAmount.toFixed(0)})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <SettleBillModal order={settleModalOrder} isOpen={!!settleModalOrder} onClose={() => setSettleModalOrder(null)}
        onSettled={() => {
          setSettleModalOrder(null); setCurrentOrder(null);
          setSelectedTable(null); setCart([]);
          setView("tables");
          loadTables(); loadPendingApprovals(); loadLowStock();
        }} />
    </div>
  );
}