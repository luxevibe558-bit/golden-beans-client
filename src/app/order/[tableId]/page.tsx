"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { menuApi, orderApi, tableApi } from "@/lib/api";
import type { MenuCategory, MenuItem, CartItem, Table, Order } from "@/types";

function formatINR(amount: number) {
  return `₹${amount.toFixed(0)}`;
}

const ITEM_EMOJIS: Record<string, string> = {
  Espresso: "☕", Cappuccino: "☕", Latte: "🥛", "Masala Chai": "🫖",
  "Hot Chocolate": "🍫", "Cold Brew": "🧊", "Iced Latte": "🥤",
  "Chocolate Frappe": "🧋", "Butter Toast": "🍞", "Cheese Sandwich": "🥪",
  "Garlic Bread": "🥖", "Chocolate Brownie": "🍫", "Cheesecake Slice": "🍰",
  "Classic Omelette": "🍳", "Pancake Stack": "🥞",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Hot Beverages": "linear-gradient(135deg, #92400e, #d97706)",
  "Cold Beverages": "linear-gradient(135deg, #0369a1, #06b6d4)",
  "Snacks": "linear-gradient(135deg, #c2410c, #f59e0b)",
  "Desserts": "linear-gradient(135deg, #be185d, #f43f5e)",
  "Breakfast": "linear-gradient(135deg, #a16207, #f97316)",
};

function Skeleton() {
  return (
    <div style={{ padding: "16px" }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ marginBottom: "24px" }}>
          <div style={{ height: "20px", width: "120px", background: "#e5e7eb", borderRadius: "8px", marginBottom: "12px" }} />
          {[1, 2].map(j => (
            <div key={j} style={{ display: "flex", gap: "12px", background: "white", borderRadius: "16px", padding: "12px", marginBottom: "12px" }}>
              <div style={{ width: "96px", height: "96px", borderRadius: "12px", background: "#e5e7eb", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: "14px", background: "#e5e7eb", borderRadius: "6px", marginBottom: "8px" }} />
                <div style={{ height: "12px", background: "#e5e7eb", borderRadius: "6px", width: "80%" }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MenuItemCard({ item, cartQty, onAdd, onRemove }: {
  item: MenuItem; cartQty: number;
  onAdd: (item: MenuItem) => void; onRemove: (id: string) => void;
}) {
  const catName = typeof item.category === "object" ? item.category.name : "";
  const bg = CATEGORY_COLORS[catName] || "linear-gradient(135deg, #92400e, #d97706)";
  const emoji = ITEM_EMOJIS[item.name] || "🍽️";

  return (
    <div style={{
      background: "white", borderRadius: "16px", overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "12px",
      border: "1px solid #f3f4f6", opacity: item.isAvailable ? 1 : 0.6, display: "flex",
    }}>
      <div style={{ width: "112px", height: "112px", flexShrink: 0, position: "relative", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "40px" }}>{emoji}</span>
        <div style={{ position: "absolute", top: "6px", left: "6px", width: "16px", height: "16px", borderRadius: "3px", border: `2px solid ${item.isVeg ? "#16a34a" : "#dc2626"}`, background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.isVeg ? "#16a34a" : "#dc2626" }} />
        </div>
        {!item.isAvailable && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: "11px", fontWeight: 600 }}>Unavailable</span>
          </div>
        )}
      </div>
      <div style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ fontWeight: 700, fontSize: "14px", color: "#111827", lineHeight: 1.3, margin: 0 }}>{item.name}</p>
            {item.tags.includes("bestseller") && (
              <span style={{ flexShrink: 0, fontSize: "10px", background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "999px", fontWeight: 600 }}>⭐ Best</span>
            )}
          </div>
          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", marginBottom: 0, lineHeight: 1.4 }}>{item.description}</p>
          {item.preparationTime > 0 && <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px", marginBottom: 0 }}>⏱ {item.preparationTime} min</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
          <span style={{ fontWeight: 800, fontSize: "16px", color: "#111827" }}>{formatINR(item.price)}</span>
          {item.isAvailable && (
            cartQty === 0 ? (
              <button onClick={() => onAdd(item)} style={{ background: "#d4880f", color: "white", border: "none", borderRadius: "8px", padding: "6px 16px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>ADD</button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "8px", overflow: "hidden" }}>
                <button onClick={() => onRemove(item._id)} style={{ width: "28px", height: "28px", background: "none", border: "none", color: "#d4880f", fontWeight: 800, fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ fontWeight: 800, color: "#92400e", fontSize: "14px", minWidth: "16px", textAlign: "center" }}>{cartQty}</span>
                <button onClick={() => onAdd(item)} style={{ width: "28px", height: "28px", background: "none", border: "none", color: "#d4880f", fontWeight: 800, fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ cart, isOpen, onClose, onUpdateQty, onUpdateNote, onPlaceOrder, isPlacing, existingOrder }: {
  cart: CartItem[]; isOpen: boolean; onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onUpdateNote: (id: string, note: string) => void;
  onPlaceOrder: () => void; isPlacing: boolean; existingOrder: Order | null;
}) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40, opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none", transition: "opacity 0.3s" }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", zIndex: 50, borderRadius: "24px 24px 0 0", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)", maxHeight: "85vh", display: "flex", flexDirection: "column", transform: isOpen ? "translateY(0)" : "translateY(100%)", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: "40px", height: "4px", background: "#d1d5db", borderRadius: "99px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px", borderBottom: "1px solid #f3f4f6" }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "18px", color: "#111827", margin: 0 }}>Your Order</h2>
            {existingOrder && <p style={{ fontSize: "12px", color: "#d97706", margin: "2px 0 0", fontWeight: 600 }}>Adding to #{existingOrder.orderNumber}</p>}
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", fontSize: "16px" }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
              <div style={{ fontSize: "48px" }}>🛒</div>
              <p style={{ fontWeight: 600, marginTop: "8px" }}>Cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.menuItemId} style={{ background: "#f9fafb", borderRadius: "16px", padding: "12px", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{item.name}</span>
                <span style={{ fontWeight: 700, fontSize: "14px" }}>{formatINR(item.price * item.quantity)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                  <button onClick={() => onUpdateQty(item.menuItemId, -1)} style={{ width: "32px", height: "32px", background: "none", border: "none", color: "#d4880f", fontWeight: 800, fontSize: "18px", cursor: "pointer" }}>−</button>
                  <span style={{ fontWeight: 700, fontSize: "14px", minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => onUpdateQty(item.menuItemId, 1)} style={{ width: "32px", height: "32px", background: "none", border: "none", color: "#d4880f", fontWeight: 800, fontSize: "18px", cursor: "pointer" }}>+</button>
                </div>
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>{formatINR(item.price)} each</span>
              </div>
              <input type="text" placeholder="Add a note..." value={item.notes} onChange={e => onUpdateNote(item.menuItemId, e.target.value)}
                style={{ width: "100%", fontSize: "12px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "white", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div style={{ padding: "12px 16px 24px", borderTop: "1px solid #f3f4f6" }}>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}><span>GST (5%)</span><span>{formatINR(tax)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "16px", color: "#111827", paddingTop: "8px", borderTop: "1px solid #f3f4f6" }}><span>Total</span><span>{formatINR(total)}</span></div>
            </div>
            <button onClick={onPlaceOrder} disabled={isPlacing} style={{ width: "100%", background: isPlacing ? "#9ca3af" : "#d4880f", color: "white", border: "none", borderRadius: "14px", padding: "16px", fontWeight: 700, fontSize: "16px", cursor: isPlacing ? "not-allowed" : "pointer" }}>
              {isPlacing ? "Placing Order..." : `🚀 ${existingOrder ? "Add to Order" : "Place Order"} • ${formatINR(total)}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function OrderStatusBanner({ order }: { order: Order }) {
  const configs: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    open: { label: "Order received!", bg: "#eff6ff", color: "#1d4ed8", icon: "📋" },
    kotSent: { label: "Kitchen is preparing your order...", bg: "#fffbeb", color: "#b45309", icon: "👨‍🍳" },
    partially_ready: { label: "Some items are ready!", bg: "#fff7ed", color: "#c2410c", icon: "🔔" },
    ready: { label: "All items ready — calling waiter!", bg: "#f0fdf4", color: "#15803d", icon: "✅" },
    settled: { label: "Bill settled. Thank you!", bg: "#f9fafb", color: "#6b7280", icon: "🙏" },
    cancelled: { label: "Order cancelled", bg: "#fef2f2", color: "#b91c1c", icon: "❌" },
  };
  const cfg = configs[order.status] || configs.open;
  return (
    <div style={{ margin: "12px 16px", padding: "12px 16px", borderRadius: "16px", background: cfg.bg, display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "24px" }}>{cfg.icon}</span>
      <div>
        <p style={{ fontWeight: 700, fontSize: "14px", color: cfg.color, margin: 0 }}>{cfg.label}</p>
        <p style={{ fontSize: "12px", color: cfg.color, opacity: 0.7, margin: "2px 0 0" }}>Order #{order.orderNumber}</p>
      </div>
    </div>
  );
}

function SuccessScreen({ order, onContinue }: { order: Order; onContinue: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "white", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ fontSize: "72px", marginBottom: "16px" }}>🎉</div>
      <h1 style={{ fontWeight: 800, fontSize: "28px", color: "#111827", marginBottom: "8px", textAlign: "center" }}>Order Placed!</h1>
      <p style={{ color: "#6b7280", textAlign: "center", marginBottom: "8px" }}>Your order has been sent to the kitchen</p>
      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "16px", padding: "12px 32px", margin: "16px 0", textAlign: "center" }}>
        <p style={{ fontWeight: 800, fontSize: "20px", color: "#92400e", margin: 0 }}>{order.orderNumber}</p>
        <p style={{ fontSize: "13px", color: "#d97706", margin: "4px 0 0" }}>Order Number</p>
      </div>
      <div style={{ width: "100%", maxWidth: "360px", marginBottom: "24px" }}>
        {order.items.map(item => (
          <div key={item._id} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#374151", background: "#f9fafb", borderRadius: "10px", padding: "8px 16px", marginBottom: "6px" }}>
            <span>{item.name} × {item.quantity}</span>
            <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "16px", color: "#111827", background: "#fff7ed", borderRadius: "10px", padding: "10px 16px" }}>
          <span>Total</span><span>₹{order.totalAmount.toFixed(0)}</span>
        </div>
      </div>
      <button onClick={onContinue} style={{ width: "100%", maxWidth: "360px", background: "#d4880f", color: "white", border: "none", borderRadius: "14px", padding: "16px", fontWeight: 700, fontSize: "16px", cursor: "pointer" }}>← Back to Menu</button>
    </div>
  );
}

export default function CustomerOrderPage() {
  const params = useParams();
  const tableId = params.tableId as string;
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [table, setTable] = useState<Table | null>(null);
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<"menu" | "order" | "info">("menu");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [menuRes, tableRes] = await Promise.all([menuApi.getMenu(), tableApi.getTable(tableId)]);
        setMenu(menuRes.data.data);
        setTable(tableRes.data.data);
        if (menuRes.data.data.length > 0) setActiveCategory(menuRes.data.data[0]._id);
        const orderRes = await orderApi.getOrderByTable(tableId);
        if (orderRes.data.data) setExistingOrder(orderRes.data.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally { setLoading(false); }
    }
    load();
  }, [tableId]);

  useEffect(() => {
    if (!existingOrder || existingOrder.status === "settled") return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await orderApi.getOrderByTable(tableId);
        if (res.data.data) setExistingOrder(res.data.data);
      } catch { }
    }, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [existingOrder, tableId]);

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === item._id);
      if (ex) return prev.map(c => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, notes: "", isVeg: item.isVeg }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === itemId);
      if (!ex) return prev;
      if (ex.quantity === 1) return prev.filter(c => c.menuItemId !== itemId);
      return prev.map(c => c.menuItemId === itemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }, []);

  const updateQty = useCallback((itemId: string, delta: number) => {
    if (delta > 0) { const item = menu.flatMap(c => c.items).find(i => i._id === itemId); if (item) addToCart(item); }
    else removeFromCart(itemId);
  }, [menu, addToCart, removeFromCart]);

  const updateNote = useCallback((itemId: string, note: string) => {
    setCart(prev => prev.map(c => c.menuItemId === itemId ? { ...c, notes: note } : c));
  }, []);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setIsPlacing(true);
    try {
      const res = await orderApi.createOrder({ tableId, items: cart, createdBy: "customer" });
      setSuccessOrder(res.data.data);
      setCart([]);
      setIsCartOpen(false);
      setExistingOrder(res.data.data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to place order");
    } finally { setIsPlacing(false); }
  };

  const totalCartItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalCartValue = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const filteredMenu = searchQuery ? menu.map(cat => ({ ...cat, items: cat.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) })).filter(cat => cat.items.length > 0) : menu;

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "#f9fafb" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px" }}>⚠️</div>
          <h2 style={{ fontWeight: 700, color: "#111827", margin: "16px 0 8px" }}>Something went wrong</h2>
          <p style={{ color: "#6b7280", marginBottom: "16px" }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ background: "#d4880f", color: "white", border: "none", borderRadius: "12px", padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", flexDirection: "column", maxWidth: "480px", margin: "0 auto", position: "relative" }}>
      <style>{`* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }`}</style>

      {successOrder && <SuccessScreen order={successOrder} onContinue={() => setSuccessOrder(null)} />}

      <header style={{ background: "#0f0d0b", color: "white", position: "sticky", top: 0, zIndex: 30, boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "16px 16px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: "22px", color: "#f59e0b", margin: 0 }}>Golden Beans ☕</h1>
              <p style={{ color: "#9ca3af", fontSize: "12px", margin: "2px 0 0" }}>{table ? `Table ${table.tableNumber}` : "Loading..."}</p>
            </div>
            <p style={{ color: "#6b7280", fontSize: "12px", margin: 0 }}>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>🔍</span>
            <input type="text" placeholder="Search menu..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ width: "100%", background: "#1f1a14", color: "white", border: "1px solid #374151", borderRadius: "12px", padding: "10px 36px", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}>✕</button>}
          </div>
        </div>
        {!searchQuery && (
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "0 16px 12px", scrollbarWidth: "none" }}>
            {menu.map(cat => (
              <button key={cat._id} onClick={() => setActiveCategory(cat._id)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer", background: activeCategory === cat._id ? "#d4880f" : "#1f1a14", color: activeCategory === cat._id ? "white" : "#9ca3af" }}>
                <span>{cat.icon}</span><span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main style={{ flex: 1, overflowY: "auto", paddingBottom: "80px" }}>
        {existingOrder && !["settled", "cancelled"].includes(existingOrder.status) && <OrderStatusBanner order={existingOrder} />}

        {activeTab === "menu" && (
          <div style={{ padding: "12px 0" }}>
            {loading ? <Skeleton /> : filteredMenu.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: "40px" }}>🔍</div>
                <p style={{ fontWeight: 600, marginTop: "8px" }}>No items found</p>
              </div>
            ) : filteredMenu.map(cat => (
              <div key={cat._id} style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 16px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "22px" }}>{cat.icon}</span>
                  <h2 style={{ fontWeight: 700, fontSize: "16px", color: "#111827", margin: 0 }}>{cat.name}</h2>
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>({cat.items.length})</span>
                </div>
                <div style={{ padding: "0 16px" }}>
                  {cat.items.map(item => (
                    <MenuItemCard key={item._id} item={item} cartQty={cart.find(c => c.menuItemId === item._id)?.quantity || 0} onAdd={addToCart} onRemove={removeFromCart} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "order" && (
          <div style={{ padding: "16px" }}>
            {!existingOrder ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: "48px" }}>📋</div>
                <p style={{ fontWeight: 600, color: "#374151", marginTop: "12px" }}>No active order</p>
                <button onClick={() => setActiveTab("menu")} style={{ marginTop: "16px", background: "#d4880f", color: "white", border: "none", borderRadius: "12px", padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}>Browse Menu</button>
              </div>
            ) : (
              <div style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ fontWeight: 700, color: "#111827", margin: 0 }}>#{existingOrder.orderNumber}</h3>
                  <span style={{ fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "999px", background: "#fffbeb", color: "#92400e" }}>{existingOrder.status.replace("_", " ").toUpperCase()}</span>
                </div>
                {existingOrder.items.map(item => (
                  <div key={item._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.status === "ready" ? "#16a34a" : item.status === "preparing" ? "#d97706" : "#d1d5db" }} />
                      <span style={{ fontSize: "14px", color: "#111827" }}>{item.name} × {item.quantity}</span>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "16px", color: "#111827", paddingTop: "12px" }}>
                  <span>Total</span><span>₹{existingOrder.totalAmount.toFixed(0)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: "white", borderRadius: "16px", padding: "20px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "48px" }}>☕</div>
              <h2 style={{ fontWeight: 800, fontSize: "22px", color: "#111827", margin: "8px 0 4px" }}>Golden Beans Cafe</h2>
              <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Premium specialty coffee & artisan food</p>
            </div>
            <div style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              {[["📍", "123, MG Road, Surat, Gujarat"], ["📞", "+91 98765 43210"], ["🕐", "Open: 7:00 AM – 11:00 PM"], ["📶", "Wi-Fi: GoldenBeans_Guest"]].map(([icon, text]) => (
                <p key={text} style={{ fontSize: "14px", color: "#374151", marginBottom: "8px" }}>{icon} {text}</p>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", background: "white", borderTop: "1px solid #f3f4f6", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", zIndex: 30, display: "flex" }}>
        {[{ id: "menu", label: "Menu", icon: "🍽️" }, { id: "order", label: "My Order", icon: "📋" }, { id: "info", label: "Info", icon: "ℹ️" }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", background: "none", border: "none", cursor: "pointer", color: activeTab === tab.id ? "#d4880f" : "#9ca3af", position: "relative" }}>
            {activeTab === tab.id && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "32px", height: "3px", background: "#d4880f", borderRadius: "999px" }} />}
            <span style={{ fontSize: "22px" }}>{tab.icon}</span>
            <span style={{ fontSize: "11px", fontWeight: 600, marginTop: "2px" }}>{tab.label}</span>
          </button>
        ))}
        <button onClick={() => setIsCartOpen(true)} disabled={cart.length === 0} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", background: "none", border: "none", cursor: cart.length === 0 ? "default" : "pointer", color: cart.length > 0 ? "#d4880f" : "#d1d5db", position: "relative" }}>
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: "22px" }}>🛒</span>
            {totalCartItems > 0 && <span style={{ position: "absolute", top: "-4px", right: "-8px", background: "#d4880f", color: "white", fontSize: "10px", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{totalCartItems}</span>}
          </div>
          <span style={{ fontSize: "11px", fontWeight: 600, marginTop: "2px" }}>{totalCartItems > 0 ? formatINR(totalCartValue) : "Cart"}</span>
        </button>
      </nav>

      <CartDrawer cart={cart} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onUpdateQty={updateQty} onUpdateNote={updateNote} onPlaceOrder={placeOrder} isPlacing={isPlacing} existingOrder={existingOrder} />
    </div>
  );
}
