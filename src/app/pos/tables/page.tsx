"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { tableApi, orderApi } from "@/lib/api";
import type { Table, Order } from "@/types";

const STATUS_CONFIG = {
  available: { label: "Available", color: "bg-green-50 border-green-300 text-green-700", dot: "bg-green-500" },
  occupied: { label: "Occupied", color: "bg-red-50 border-red-300 text-red-700", dot: "bg-red-500" },
  reserved: { label: "Reserved", color: "bg-blue-50 border-blue-300 text-blue-700", dot: "bg-blue-500" },
  cleaning: { label: "Cleaning", color: "bg-yellow-50 border-yellow-300 text-yellow-700", dot: "bg-yellow-500" },
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const load = useCallback(async () => {
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        tableApi.getTables(),
        orderApi.getOrders(),
      ]);
      setTables(tablesRes.data.data);
      setOrders(ordersRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [load]);

  const handleStatusChange = async (table: Table, status: Table["status"]) => {
    try {
      await tableApi.updateTableStatus(table._id, status);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    const order = orders.find((o) => o.tableNumber === table.tableNumber && o.status !== "settled" && o.status !== "cancelled");
    setSelectedOrder(order || null);
  };

  const stats = {
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
    cleaning: tables.filter((t) => t.status === "cleaning").length,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <POSSidebar />
      <div className="flex-1 ml-16 lg:ml-56 overflow-hidden flex flex-col">
        <header className="bg-white border-b border-surface-200 px-6 py-4 flex-shrink-0">
          <h1 className="font-display font-bold text-surface-900 text-xl">Table Management</h1>
          <div className="flex gap-3 mt-2">
            {Object.entries(stats).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status as Table["status"]];
              return (
                <div key={status} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold ${cfg.color}`}>
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  {cfg.label}: {count}
                </div>
              );
            })}
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Table grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="skeleton h-28 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tables.map((table) => {
                  const cfg = STATUS_CONFIG[table.status];
                  const tableOrder = orders.find(
                    (o) => o.tableNumber === table.tableNumber && o.status !== "settled" && o.status !== "cancelled"
                  );
                  const isSelected = selectedTable?._id === table._id;
                  return (
                    <button
                      key={table._id}
                      onClick={() => handleSelectTable(table)}
                      className={`relative border-2 rounded-2xl p-4 text-left transition-all no-select hover:shadow-lg ${cfg.color} ${
                        isSelected ? "ring-2 ring-brand-500 ring-offset-2 scale-105" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">{table.tableNumber}</span>
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      </div>
                      <p className="text-xs opacity-70">{table.capacity} seats</p>
                      <p className="text-xs font-semibold mt-0.5">{cfg.label}</p>
                      {tableOrder && (
                        <div className="mt-2 text-xs font-medium bg-white/60 rounded-lg px-2 py-1">
                          ₹{tableOrder.totalAmount.toFixed(0)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedTable && (
            <div className="w-72 bg-white border-l border-surface-200 overflow-y-auto flex-shrink-0">
              <div className="p-5 border-b border-surface-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-surface-900 text-lg">
                    {selectedTable.tableNumber}
                  </h3>
                  <button onClick={() => setSelectedTable(null)} className="text-surface-400 hover:text-surface-700">✕</button>
                </div>
                <p className="text-sm text-surface-500">{selectedTable.capacity} seats • {STATUS_CONFIG[selectedTable.status].label}</p>
              </div>

              {/* Status change */}
              <div className="p-5 border-b border-surface-100">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Change Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STATUS_CONFIG) as Table["status"][]).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedTable, s)}
                      disabled={selectedTable.status === s}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all disabled:opacity-50 ${
                        selectedTable.status === s
                          ? STATUS_CONFIG[s].color + " cursor-default"
                          : "border-surface-200 text-surface-600 hover:border-surface-300 bg-white"
                      }`}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current order */}
              <div className="p-5">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Current Order</p>
                {!selectedOrder ? (
                  <p className="text-sm text-surface-400">No active order</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-surface-900">#{selectedOrder.orderNumber}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        selectedOrder.status === "ready" ? "bg-green-100 text-green-700" :
                        selectedOrder.status === "kotSent" ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    {selectedOrder.items.map((item) => (
                      <div key={item._id} className="flex justify-between text-xs text-surface-600 bg-surface-50 rounded-lg px-3 py-2">
                        <span>{item.name} ×{item.quantity}</span>
                        <span className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-surface-900 pt-1 border-t border-surface-100">
                      <span>Total</span>
                      <span>₹{selectedOrder.totalAmount.toFixed(0)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
