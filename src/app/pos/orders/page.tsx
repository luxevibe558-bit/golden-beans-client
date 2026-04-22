"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { orderApi } from "@/lib/api";
import type { Order } from "@/types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  kotSent: "bg-amber-100 text-amber-700",
  partially_ready: "bg-orange-100 text-orange-700",
  ready: "bg-green-100 text-green-700",
  settled: "bg-surface-100 text-surface-500",
  cancelled: "bg-red-100 text-red-600",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [selected, setSelected] = useState<Order | null>(null);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  const load = useCallback(async () => {
    try {
      const params: Record<string, string> = { date: dateFilter };
      if (filter === "active") params.status = "";
      else if (filter !== "all") params.status = filter;
      const res = await orderApi.getOrders(filter === "all" ? { date: dateFilter } : params);
      setOrders(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter, dateFilter]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [load]);

  const handleCancel = async (order: Order) => {
    if (!confirm(`Cancel order ${order.orderNumber}?`)) return;
    try {
      await orderApi.cancelOrder(order._id);
      load();
      if (selected?._id === order._id) setSelected(null);
    } catch (e) {
      console.error(e);
    }
  };

  const displayedOrders = filter === "active"
    ? orders.filter((o) => !["settled", "cancelled"].includes(o.status))
    : orders;

  return (
    <div className="flex h-screen overflow-hidden">
      <POSSidebar />
      <div className="flex-1 ml-16 lg:ml-56 overflow-hidden flex flex-col">
        <header className="bg-white border-b border-surface-200 px-6 py-4 flex-shrink-0 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-surface-900 text-xl">Orders</h1>
            <p className="text-surface-400 text-xs mt-0.5">{displayedOrders.length} orders shown</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field py-1.5 text-sm w-40"
            />
            <div className="flex rounded-xl overflow-hidden border border-surface-200">
              {["active", "all", "settled", "cancelled"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    filter === f ? "bg-surface-950 text-white" : "bg-white text-surface-600 hover:bg-surface-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Orders list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-20 rounded-2xl" />
                ))}
              </div>
            ) : displayedOrders.length === 0 ? (
              <div className="flex items-center justify-center h-full text-surface-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="font-medium">No orders found</p>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-2">
                {displayedOrders.map((order) => (
                  <div
                    key={order._id}
                    onClick={() => setSelected(order)}
                    className={`bg-white border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${
                      selected?._id === order._id ? "border-brand-400 shadow-md" : "border-surface-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-center flex-shrink-0">
                          <p className="font-bold text-surface-900 text-sm">{order.tableNumber}</p>
                          <p className="text-xs text-surface-400">{formatTime(order.createdAt)}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-surface-800 text-sm">#{order.orderNumber}</p>
                          <p className="text-xs text-surface-500 truncate">
                            {order.items.length} items • {order.items.map((i) => i.name).slice(0, 2).join(", ")}
                            {order.items.length > 2 ? ` +${order.items.length - 2}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-surface-900 text-sm">₹{order.totalAmount.toFixed(0)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[order.status] || "bg-surface-100 text-surface-600"}`}>
                          {order.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-80 bg-white border-l border-surface-200 overflow-y-auto flex-shrink-0">
              <div className="p-5 border-b border-surface-100 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-surface-900">#{selected.orderNumber}</h3>
                  <p className="text-sm text-surface-500">{selected.tableNumber} • {formatTime(selected.createdAt)}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-surface-400 hover:text-surface-700">✕</button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Items</p>
                  <div className="space-y-2">
                    {selected.items.map((item) => (
                      <div key={item._id} className="flex items-center justify-between bg-surface-50 rounded-xl px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-surface-900">{item.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-surface-400">×{item.quantity}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              item.status === "ready" ? "bg-green-100 text-green-600" :
                              item.status === "preparing" ? "bg-amber-100 text-amber-600" :
                              "bg-surface-100 text-surface-500"
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                        <span className="font-semibold text-surface-900 text-sm">
                          ₹{(item.price * item.quantity).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-50 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-sm text-surface-500">
                    <span>Subtotal</span><span>₹{selected.subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-surface-500">
                    <span>GST</span><span>₹{selected.tax.toFixed(0)}</span>
                  </div>
                  {selected.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span><span>-₹{selected.discount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-surface-900 pt-1 border-t border-surface-200">
                    <span>Total</span><span>₹{selected.totalAmount.toFixed(0)}</span>
                  </div>
                  {selected.status === "settled" && (
                    <>
                      <div className="flex justify-between text-sm text-surface-500">
                        <span>Paid ({selected.paymentMethod})</span>
                        <span>₹{selected.amountPaid.toFixed(0)}</span>
                      </div>
                    </>
                  )}
                </div>

                {selected.status !== "settled" && selected.status !== "cancelled" && (
                  <button
                    onClick={() => handleCancel(selected)}
                    className="btn-danger w-full text-sm"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
