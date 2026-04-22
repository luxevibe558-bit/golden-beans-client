"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { orderApi } from "@/lib/api";
import type { Order, OrderItem, OrderItemStatus } from "@/types";

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
}

function isUrgent(iso: string, thresholdMins = 15) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  return mins >= thresholdMins;
}

const ITEM_STATUS_CONFIG: Record<
  OrderItemStatus,
  { label: string; next: OrderItemStatus | null; btnLabel: string; btnClass: string; cardClass: string }
> = {
  pending: {
    label: "Pending",
    next: "preparing",
    btnLabel: "Start Cooking",
    btnClass: "bg-blue-600 hover:bg-blue-700 text-white",
    cardClass: "border-amber-400 bg-surface-900",
  },
  preparing: {
    label: "Cooking",
    next: "ready",
    btnLabel: "Mark Ready",
    btnClass: "bg-green-600 hover:bg-green-700 text-white",
    cardClass: "border-blue-400 bg-surface-900",
  },
  ready: {
    label: "Ready",
    next: null,
    btnLabel: "Served",
    btnClass: "bg-surface-700 text-white",
    cardClass: "border-green-400 bg-surface-900/80",
  },
  served: {
    label: "Served",
    next: null,
    btnLabel: "",
    btnClass: "",
    cardClass: "border-surface-700 bg-surface-900/40 opacity-50",
  },
};

// ─── Single KDS Order Card ───
function KDSOrderCard({
  order,
  onUpdateItem,
  now,
}: {
  order: Order;
  onUpdateItem: (orderId: string, itemId: string, status: OrderItemStatus) => Promise<void>;
  now: number;
}) {
  const urgent = isUrgent(order.createdAt);
  const activeItems = order.items.filter((i) => i.status !== "served");
  const allReady = activeItems.every((i) => i.status === "ready");
  const mins = Math.floor((now - new Date(order.createdAt).getTime()) / 60000);

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden shadow-xl flex flex-col transition-all duration-300 ${
        urgent ? "border-red-500 shadow-red-900/30" : allReady ? "border-green-500 shadow-green-900/30" : "border-surface-700"
      }`}
    >
      {/* Card header */}
      <div
        className={`px-4 py-3 flex items-center justify-between ${
          urgent ? "bg-red-900/50" : allReady ? "bg-green-900/40" : "bg-surface-800"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-white font-display font-bold text-xl leading-none">
              {order.tableNumber}
            </p>
            <p className="text-surface-400 text-xs">Table</p>
          </div>
          <div className="w-px h-8 bg-surface-700" />
          <div>
            <p className="text-surface-300 text-xs font-mono">#{order.orderNumber}</p>
            <p className={`text-xs font-semibold ${urgent ? "text-red-400" : "text-surface-400"}`}>
              {urgent && "🔴 "}{mins}m ago
            </p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              allReady
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            {allReady ? "✓ All Ready" : `${activeItems.length} pending`}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 p-3 space-y-2 bg-surface-900">
        {order.items.map((item) => {
          const cfg = ITEM_STATUS_CONFIG[item.status];
          return (
            <div
              key={item._id}
              className={`rounded-xl border-2 p-3 transition-all duration-200 ${cfg.cardClass}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        item.status === "ready"
                          ? "bg-green-900/50 text-green-400"
                          : item.status === "preparing"
                          ? "bg-blue-900/50 text-blue-400"
                          : "bg-amber-900/50 text-amber-400"
                      }`}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-surface-200 font-bold text-sm">
                      ×{item.quantity}
                    </span>
                  </div>
                  <p className="text-white font-semibold">{item.name}</p>
                  {item.notes && (
                    <p className="text-amber-400 text-xs mt-1 font-medium">
                      📝 {item.notes}
                    </p>
                  )}
                </div>
                {cfg.next && (
                  <button
                    onClick={() => onUpdateItem(order._id, item._id, cfg.next!)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${cfg.btnClass}`}
                  >
                    {cfg.btnLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {allReady && (
        <div className="bg-green-900/30 border-t border-green-500/20 px-4 py-2 text-center">
          <p className="text-green-400 text-xs font-bold animate-pulse">
            🔔 Ready for service — Call waiter
          </p>
        </div>
      )}
    </div>
  );
}

export default function KDSPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [filter, setFilter] = useState<"all" | "pending" | "preparing" | "ready">("all");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrderCountRef = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await orderApi.getKdsOrders();
      const newOrders: Order[] = res.data.data;

      // Play sound on new order
      if (newOrders.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
        // Simple beep via AudioContext
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.value = 0.3;
          osc.start();
          setTimeout(() => { osc.stop(); ctx.close(); }, 200);
        } catch {
          // Audio not available, ignore
        }
      }
      prevOrderCountRef.current = newOrders.length;
      setOrders(newOrders);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const pollInterval = setInterval(load, 5000);
    const clockInterval = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      clearInterval(pollInterval);
      clearInterval(clockInterval);
    };
  }, [load]);

  const handleUpdateItem = async (
    orderId: string,
    itemId: string,
    status: OrderItemStatus
  ) => {
    try {
      await orderApi.updateItemStatus(orderId, { itemId, status });
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? {
                ...o,
                items: o.items.map((i) =>
                  i._id === itemId ? { ...i, status } : i
                ),
              }
            : o
        )
      );
      // Reload to get server-confirmed state
      setTimeout(load, 500);
    } catch (e) {
      console.error(e);
      load();
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "pending") return order.items.some((i) => i.status === "pending");
    if (filter === "preparing") return order.items.some((i) => i.status === "preparing");
    if (filter === "ready") return order.items.every((i) => i.status === "ready" || i.status === "served");
    return true;
  });

  const counts = {
    pending: orders.filter((o) => o.items.some((i) => i.status === "pending")).length,
    preparing: orders.filter((o) => o.items.some((i) => i.status === "preparing")).length,
    ready: orders.filter((o) => o.items.every((i) => i.status === "ready" || i.status === "served")).length,
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* KDS Header */}
      <header className="bg-surface-900 border-b border-surface-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/pos" className="text-surface-400 hover:text-white transition-colors text-sm">
            ← POS
          </Link>
          <div className="w-px h-5 bg-surface-700" />
          <div>
            <h1 className="font-display font-bold text-white text-lg">
              👨‍🍳 Kitchen Display
            </h1>
            <p className="text-surface-500 text-xs">
              Auto-refresh every 5s • Last: {lastUpdated.toLocaleTimeString("en-IN", { timeStyle: "short" })}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden border border-surface-700">
            {[
              { id: "all", label: `All (${orders.length})` },
              { id: "pending", label: `🔴 New (${counts.pending})` },
              { id: "preparing", label: `🔵 Cooking (${counts.preparing})` },
              { id: "ready", label: `🟢 Ready (${counts.ready})` },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilter(id as typeof filter)}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  filter === id
                    ? "bg-brand-500 text-white"
                    : "bg-surface-800 text-surface-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="text-white font-mono font-bold text-lg ml-2">
            {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-dark h-72 rounded-2xl" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-32 text-surface-500">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-xl font-semibold text-surface-400">All caught up!</p>
            <p className="text-sm mt-2">No active orders in the kitchen</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
            {filteredOrders.map((order) => (
              <KDSOrderCard
                key={order._id}
                order={order}
                onUpdateItem={handleUpdateItem}
                now={now}
              />
            ))}
          </div>
        )}
      </main>

      {/* Live indicator */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-surface-900 border border-surface-700 px-3 py-2 rounded-full shadow-xl">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-surface-400 text-xs font-medium">Live</span>
      </div>

      <audio ref={audioRef} />
    </div>
  );
}
