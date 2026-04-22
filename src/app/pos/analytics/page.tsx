"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { analyticsApi } from "@/lib/api";
import type { DailySales, Order, AdjustmentWallet } from "@/types";

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-5">
      <p className="text-sm font-medium text-surface-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<DailySales | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentWallet[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [todayRes, adjRes] = await Promise.all([
        analyticsApi.getToday(),
        analyticsApi.getAdjustments(),
      ]);
      setSummary(todayRes.data.data.summary);
      setRecentOrders(todayRes.data.data.recentOrders);
      setAdjustments(adjRes.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const totalAdjShortfall = adjustments.reduce((s, a) => s + a.shortfall, 0);

  return (
    <div className="flex h-screen overflow-hidden">
      <POSSidebar />
      <div className="flex-1 ml-16 lg:ml-56 overflow-y-auto">
        <header className="bg-white border-b border-surface-200 px-6 py-4 sticky top-0 z-10">
          <h1 className="font-display font-bold text-surface-900 text-xl">Analytics</h1>
          <p className="text-surface-400 text-xs">
            Today — {new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}
          </p>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats row */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Today's Revenue"
                value={`₹${(summary?.totalRevenue || 0).toFixed(0)}`}
                sub={`${summary?.totalOrders || 0} orders settled`}
                color="text-green-600"
              />
              <StatCard
                label="Cash Revenue"
                value={`₹${(summary?.cashRevenue || 0).toFixed(0)}`}
                color="text-surface-900"
              />
              <StatCard
                label="UPI Revenue"
                value={`₹${(summary?.upiRevenue || 0).toFixed(0)}`}
                color="text-blue-600"
              />
              <StatCard
                label="GST Collected"
                value={`₹${(summary?.totalTax || 0).toFixed(0)}`}
                sub={`Discounts: ₹${(summary?.totalDiscount || 0).toFixed(0)}`}
                color="text-purple-600"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent orders */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
              <div className="p-4 border-b border-surface-100">
                <h2 className="font-display font-bold text-surface-900">Recent Settled Orders</h2>
              </div>
              <div className="divide-y divide-surface-50 max-h-72 overflow-y-auto">
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center text-surface-400">
                    <p className="text-3xl mb-2">📋</p>
                    <p className="text-sm">No orders settled today yet</p>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order._id} className="px-4 py-3 flex items-center justify-between hover:bg-surface-50">
                      <div>
                        <p className="font-semibold text-surface-900 text-sm">#{order.orderNumber}</p>
                        <p className="text-xs text-surface-400">
                          {order.tableNumber} •{" "}
                          {new Date(order.settledAt || order.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit", minute: "2-digit",
                          })} •{" "}
                          <span className="capitalize">{order.paymentMethod}</span>
                        </p>
                      </div>
                      <span className="font-bold text-surface-900">₹{order.totalAmount.toFixed(0)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Adjustment wallet */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
              <div className="p-4 border-b border-surface-100 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-surface-900">Adjustment Wallet</h2>
                  <p className="text-xs text-surface-400">Unresolved shortfalls</p>
                </div>
                {totalAdjShortfall > 0 && (
                  <span className="text-sm font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                    Total: ₹{totalAdjShortfall.toFixed(0)}
                  </span>
                )}
              </div>
              <div className="divide-y divide-surface-50 max-h-72 overflow-y-auto">
                {adjustments.length === 0 ? (
                  <div className="p-8 text-center text-surface-400">
                    <p className="text-3xl mb-2">✅</p>
                    <p className="text-sm">No pending adjustments</p>
                  </div>
                ) : (
                  adjustments.map((adj) => (
                    <div key={adj._id} className="px-4 py-3 flex items-center justify-between hover:bg-amber-50/30">
                      <div>
                        <p className="font-semibold text-surface-900 text-sm">#{adj.orderNumber}</p>
                        <p className="text-xs text-surface-400">
                          {adj.tableNumber} • Paid: ₹{adj.amountPaid.toFixed(0)} / ₹{adj.totalAmount.toFixed(0)}
                        </p>
                        <p className="text-xs text-surface-400">{adj.reason}</p>
                      </div>
                      <span className="font-bold text-amber-700 text-sm flex-shrink-0 ml-2">
                        -₹{adj.shortfall.toFixed(0)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Payment breakdown */}
          {summary && (
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-5">
              <h2 className="font-display font-bold text-surface-900 mb-4">Payment Breakdown</h2>
              <div className="space-y-3">
                {[
                  { label: "Cash", amount: summary.cashRevenue, color: "bg-green-500" },
                  { label: "UPI", amount: summary.upiRevenue, color: "bg-blue-500" },
                  { label: "Card", amount: summary.cardRevenue, color: "bg-purple-500" },
                ].map(({ label, amount, color }) => {
                  const pct = summary.totalRevenue > 0 ? (amount / summary.totalRevenue) * 100 : 0;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="w-10 text-xs font-medium text-surface-600 text-right flex-shrink-0">{label}</span>
                      <div className="flex-1 bg-surface-100 rounded-full h-3 overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-surface-700 w-20 text-right flex-shrink-0">
                        ₹{amount.toFixed(0)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
