"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { menuApi, orderApi, tableApi } from "@/lib/api";
import type { MenuCategory, MenuItem, Table, Order, CartItem } from "@/types";

function formatINR(n: number) {
  return `₹${n.toFixed(0)}`;
}

const TAX_RATE = 0.05;

// ─── Settle Modal ───
function SettleModal({
  order,
  onSettle,
  onClose,
}: {
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

  useEffect(() => {
    setAmountPaid(total);
  }, [total]);

  const shortfall = total - amountPaid;

  const handleSettle = async () => {
    if (amountPaid <= 0) return alert("Enter amount paid");
    setLoading(true);
    try {
      await onSettle(amountPaid, method, discount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="p-5 border-b border-surface-100">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-surface-900">
              Settle Bill — {order.tableNumber}
            </h2>
            <button onClick={onClose} className="text-surface-400 hover:text-surface-700 text-xl">✕</button>
          </div>
          <p className="text-sm text-surface-500 mt-0.5">Order #{order.orderNumber}</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Items Summary */}
          <div className="bg-surface-50 rounded-xl p-3 space-y-1 max-h-40 overflow-y-auto">
            {order.items.map((item) => (
              <div key={item._id} className="flex justify-between text-sm">
                <span className="text-surface-700">{item.name} × {item.quantity}</span>
                <span className="font-medium">{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Discount (₹)
            </label>
            <input
              type="number"
              min="0"
              max={subtotal}
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="input-field"
            />
          </div>

          {/* Bill Breakdown */}
          <div className="bg-surface-50 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-sm text-surface-600">
              <span>Subtotal</span><span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-surface-600">
              <span>GST (5%)</span><span>{formatINR(tax)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span><span>−{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-surface-900 text-base pt-1.5 border-t border-surface-200">
              <span>Total</span><span>{formatINR(total)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["cash", "upi", "card", "wallet"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    method === m
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-surface-200 text-surface-600 hover:border-surface-300"
                  }`}
                >
                  {m === "cash" ? "💵" : m === "upi" ? "📱" : m === "card" ? "💳" : "👛"}
                  <br />
                  <span className="capitalize text-xs">{m}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Amount Paid (₹)
            </label>
            <input
              type="number"
              min="0"
              value={amountPaid}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              className="input-field text-lg font-bold"
            />
            {shortfall > 0.5 && (
              <p className="text-amber-600 text-xs mt-1 font-medium">
                ⚠️ Shortfall of {formatINR(shortfall)} will be logged to Adjustment Wallet
              </p>
            )}
            {amountPaid > total + 0.5 && (
              <p className="text-blue-600 text-xs mt-1 font-medium">
                💵 Change to return: {formatINR(amountPaid - total)}
              </p>
            )}
          </div>
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSettle}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : "✓"} Settle Bill
          </button>
        </div>
      </div>
    </div>
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
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [menuRes, tablesRes, ordersRes] = await Promise.all([
        menuApi.getMenu(),
        tableApi.getTables(),
        orderApi.getOrders(),
      ]);
      setMenu(menuRes.data.data);
      setTables(tablesRes.data.data);
      setActiveOrders(ordersRes.data.data);
      if (menuRes.data.data.length > 0 && !activeCategory) {
        setActiveCategory(menuRes.data.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const selectTable = async (table: Table) => {
    setSelectedTable(table);
    setCart([]);
    try {
      const res = await orderApi.getOrderByTable(table._id);
      setOrderForTable(res.data.data);
    } catch {
      setOrderForTable(null);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.menuItemId === item._id);
      if (ex) return prev.map((c) => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, notes: "", isVeg: item.isVeg }];
    });
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((c) => c.menuItemId === itemId);
      if (!item) return prev;
      if (item.quantity + delta <= 0) return prev.filter((c) => c.menuItemId !== itemId);
      return prev.map((c) => c.menuItemId === itemId ? { ...c, quantity: c.quantity + delta } : c);
    });
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const sendKot = async () => {
    if (!selectedTable || cart.length === 0) return;
    try {
      const res = await orderApi.createOrder({
        tableId: selectedTable._id,
        items: cart,
        createdBy: "pos",
      });
      const order: Order = res.data.data;
      await orderApi.sendKot(order._id);
      showToast(`✅ KOT sent for ${selectedTable.tableNumber}`);
      setCart([]);
      setOrderForTable(order);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      showToast(`❌ ${msg}`);
    }
  };

  const handleSettle = async (amountPaid: number, method: string, discount: number) => {
    if (!settleOrder) return;
    try {
      await orderApi.settleOrder(settleOrder._id, { amountPaid, paymentMethod: method, discount, resolvedBy: "cashier" });
      showToast(`✅ Bill settled for ${settleOrder.tableNumber}`);
      setSettleOrder(null);
      setOrderForTable(null);
      setSelectedTable(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      showToast(`❌ ${msg}`);
    }
  };

  const filteredItems = menu
    .find((c) => c._id === activeCategory)
    ?.items.filter(
      (item) =>
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const tableStatusColor: Record<string, string> = {
    available: "border-green-300 bg-green-50 hover:bg-green-100",
    occupied: "border-red-300 bg-red-50 hover:bg-red-100",
    reserved: "border-blue-300 bg-blue-50 hover:bg-blue-100",
    cleaning: "border-yellow-300 bg-yellow-50 hover:bg-yellow-100",
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <POSSidebar />

      {/* Main area */}
      <div className="flex-1 ml-16 lg:ml-56 flex overflow-hidden">

        {/* ── LEFT: Table Grid + Menu ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Top bar */}
          <header className="bg-white border-b border-surface-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="font-display font-bold text-surface-900 text-xl">
                Point of Sale
              </h1>
              <p className="text-surface-400 text-xs">
                {new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2 text-xs">
                {Object.entries({ available: "Available", occupied: "Occupied", cleaning: "Cleaning" }).map(([k, v]) => (
                  <span key={k} className={`px-2 py-1 rounded-lg border font-medium ${tableStatusColor[k]}`}>
                    {v}: {tables.filter((t) => t.status === k).length}
                  </span>
                ))}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Table selection */}
            <div className="bg-white border-b border-surface-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-semibold text-surface-700 text-sm">
                  Select Table
                </h2>
                {selectedTable && (
                  <span className="text-brand-600 text-xs font-medium bg-brand-50 px-2 py-0.5 rounded-full">
                    {selectedTable.tableNumber} selected
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {loading
                  ? Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="skeleton w-14 h-14 rounded-xl" />
                    ))
                  : tables.map((table) => {
                      const isSelected = selectedTable?._id === table._id;
                      const order = activeOrders.find(
                        (o) => o.tableNumber === table.tableNumber
                      );
                      return (
                        <button
                          key={table._id}
                          onClick={() => selectTable(table)}
                          className={`relative w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all text-xs font-bold no-select ${
                            isSelected
                              ? "border-brand-500 bg-brand-50 text-brand-700 shadow-glow scale-105"
                              : tableStatusColor[table.status]
                          }`}
                        >
                          <span>{table.tableNumber}</span>
                          <span className="text-[9px] font-normal opacity-70">
                            {table.capacity}p
                          </span>
                          {order && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white" />
                          )}
                        </button>
                      );
                    })}
              </div>
            </div>

            {/* Menu area */}
            {selectedTable ? (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Category tabs + search */}
                <div className="bg-white border-b border-surface-100 px-4 pt-2 pb-2 flex items-center gap-3">
                  <div className="flex gap-1 overflow-x-auto flex-1 no-scrollbar">
                    {menu.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => setActiveCategory(cat._id)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeCategory === cat._id
                            ? "bg-surface-950 text-white"
                            : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span className="hidden md:inline">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="relative flex-shrink-0 w-44">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm">🔍</span>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-field pl-8 py-1.5 text-xs"
                    />
                  </div>
                </div>

                {/* Menu grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredItems.map((item) => {
                      const inCart = cart.find((c) => c.menuItemId === item._id);
                      return (
                        <button
                          key={item._id}
                          onClick={() => item.isAvailable && addToCart(item)}
                          disabled={!item.isAvailable}
                          className={`relative bg-white rounded-xl border-2 p-3 text-left transition-all no-select ${
                            !item.isAvailable
                              ? "opacity-40 cursor-not-allowed border-surface-200"
                              : inCart
                              ? "border-brand-400 bg-brand-50 shadow-md"
                              : "border-surface-200 hover:border-brand-300 hover:shadow-md active:scale-95"
                          }`}
                        >
                          {/* Veg indicator */}
                          <div className={`w-3 h-3 rounded-sm border flex items-center justify-center mb-1.5 ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                          </div>
                          <p className="font-semibold text-surface-900 text-xs leading-tight line-clamp-2 mb-1">
                            {item.name}
                          </p>
                          <p className="text-brand-600 font-bold text-sm">{formatINR(item.price)}</p>
                          {inCart && (
                            <div className="absolute top-1.5 right-1.5 bg-brand-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                              {inCart.quantity}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-surface-400">
                <div className="text-center">
                  <div className="text-5xl mb-3">🪑</div>
                  <p className="font-semibold text-surface-600">Select a table to start an order</p>
                  <p className="text-sm mt-1">Click any table above</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Order Panel ── */}
        <div className="w-72 xl:w-80 bg-white border-l border-surface-200 flex flex-col flex-shrink-0 overflow-hidden">
          <div className="p-4 border-b border-surface-100 flex-shrink-0">
            <h2 className="font-display font-bold text-surface-900">
              {selectedTable ? `Order — ${selectedTable.tableNumber}` : "No Table Selected"}
            </h2>
            {orderForTable && (
              <p className="text-xs text-amber-600 font-medium mt-0.5">
                Active: #{orderForTable.orderNumber}
              </p>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 && !orderForTable && (
              <div className="text-center text-surface-400 py-8">
                <div className="text-3xl mb-2">🛒</div>
                <p className="text-sm">Select items from the menu</p>
              </div>
            )}

            {/* Existing order items */}
            {orderForTable && cart.length === 0 && (
              <div>
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">
                  Current Order
                </p>
                <div className="space-y-1.5">
                  {orderForTable.items.map((item) => (
                    <div key={item._id} className="flex items-center justify-between bg-surface-50 rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-surface-800 truncate">{item.name}</p>
                        <p className="text-xs text-surface-500">×{item.quantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs font-semibold text-surface-900">{formatINR(item.price * item.quantity)}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          item.status === "ready" ? "bg-green-100 text-green-700" :
                          item.status === "preparing" ? "bg-amber-100 text-amber-700" :
                          "bg-surface-100 text-surface-500"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New cart items */}
            {cart.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">
                  {orderForTable ? "Adding Items" : "New Order"}
                </p>
                <div className="space-y-1.5">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-surface-900 truncate">{item.name}</p>
                        <p className="text-xs text-brand-600 font-medium">{formatINR(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => updateCartQty(item.menuItemId, -1)}
                          className="w-5 h-5 rounded-full bg-white border border-surface-200 text-surface-600 flex items-center justify-center text-xs hover:bg-red-50 hover:border-red-300 hover:text-red-500"
                        >
                          −
                        </button>
                        <span className="text-xs font-bold text-surface-900 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.menuItemId, 1)}
                          className="w-5 h-5 rounded-full bg-white border border-surface-200 text-surface-600 flex items-center justify-center text-xs hover:bg-green-50 hover:border-green-300 hover:text-green-500"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs font-bold text-surface-900 w-10 text-right flex-shrink-0">
                        {formatINR(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order footer */}
          <div className="p-4 border-t border-surface-100 space-y-3 flex-shrink-0">
            {cart.length > 0 && (
              <div className="bg-surface-50 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-xs text-surface-500">
                  <span>Subtotal</span><span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-surface-500">
                  <span>GST (5%)</span><span>{formatINR(tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-surface-900 text-sm pt-1 border-t border-surface-200">
                  <span>Total</span><span>{formatINR(total)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCart([])}
                disabled={cart.length === 0}
                className="btn-secondary text-sm py-2 disabled:opacity-40"
              >
                Clear
              </button>
              <button
                onClick={sendKot}
                disabled={cart.length === 0 || !selectedTable}
                className="btn-primary text-sm py-2 disabled:opacity-50"
              >
                Send KOT 🖨️
              </button>
            </div>

            {orderForTable && orderForTable.status !== "settled" && (
              <button
                onClick={() => setSettleOrder(orderForTable)}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all active:scale-95 shadow-md"
              >
                💰 Settle Bill — {formatINR(orderForTable.totalAmount)}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 animate-slide-up font-medium text-sm">
          {toastMsg}
        </div>
      )}

      {/* Settle Modal */}
      {settleOrder && (
        <SettleModal
          order={settleOrder}
          onSettle={handleSettle}
          onClose={() => setSettleOrder(null)}
        />
      )}
    </div>
  );
}
