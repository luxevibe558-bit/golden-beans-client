"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { inventoryApi } from "@/lib/api";
import type { Ingredient } from "@/types";

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "low">("all");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Ingredient | null>(null);
  const [restockItem, setRestockItem] = useState<Ingredient | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({
    name: "", unit: "grams", stockQuantity: "", lowStockThreshold: "", costPerUnit: "",
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const load = useCallback(async () => {
    try {
      const res = await inventoryApi.getAll();
      setIngredients(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: "", unit: "grams", stockQuantity: "", lowStockThreshold: "100", costPerUnit: "" });
    setShowForm(true);
  };

  const openEdit = (item: Ingredient) => {
    setEditItem(item);
    setForm({
      name: item.name, unit: item.unit,
      stockQuantity: item.stockQuantity.toString(),
      lowStockThreshold: item.lowStockThreshold.toString(),
      costPerUnit: item.costPerUnit.toString(),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) return alert("Name required");
    try {
      const payload = {
        ...form,
        stockQuantity: parseFloat(form.stockQuantity) || 0,
        lowStockThreshold: parseFloat(form.lowStockThreshold) || 100,
        costPerUnit: parseFloat(form.costPerUnit) || 0,
      };
      if (editItem) {
        await inventoryApi.update(editItem._id, payload);
        showToast("✅ Updated");
      } else {
        await inventoryApi.create(payload);
        showToast("✅ Ingredient added");
      }
      setShowForm(false);
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      showToast(`❌ ${msg}`);
    }
  };

  const handleRestock = async () => {
    if (!restockItem || !restockQty) return;
    try {
      await inventoryApi.restock(restockItem._id, parseFloat(restockQty));
      showToast(`✅ Restocked ${restockItem.name}`);
      setRestockItem(null);
      setRestockQty("");
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      showToast(`❌ ${msg}`);
    }
  };

  const handleDelete = async (item: Ingredient) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await inventoryApi.delete(item._id);
      showToast("🗑 Deleted");
      load();
    } catch (e) { console.error(e); }
  };

  const lowCount = ingredients.filter((i) => i.stockQuantity <= i.lowStockThreshold).length;
  const displayed = filter === "low"
    ? ingredients.filter((i) => i.stockQuantity <= i.lowStockThreshold)
    : ingredients;

  return (
    <div className="flex h-screen overflow-hidden">
      <POSSidebar />
      <div className="flex-1 ml-16 lg:ml-56 overflow-hidden flex flex-col">
        <header className="bg-white border-b border-surface-200 px-6 py-4 flex-shrink-0 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-surface-900 text-xl">Inventory</h1>
            <div className="flex gap-3 mt-1">
              <span className="text-xs text-surface-500">{ingredients.length} ingredients</span>
              {lowCount > 0 && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  ⚠️ {lowCount} low stock
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-xl overflow-hidden border border-surface-200">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold ${filter === "all" ? "bg-surface-950 text-white" : "bg-white text-surface-600"}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("low")}
                className={`px-3 py-1.5 text-xs font-semibold ${filter === "low" ? "bg-red-600 text-white" : "bg-white text-surface-600"}`}
              >
                Low Stock {lowCount > 0 && `(${lowCount})`}
              </button>
            </div>
            <button onClick={openCreate} className="btn-primary text-sm">+ Add Ingredient</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
          ) : (
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Ingredient</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Stock</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide hidden md:table-cell">Low Threshold</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide hidden lg:table-cell">Cost/Unit</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Status</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {displayed.map((item) => {
                    const isLow = item.stockQuantity <= item.lowStockThreshold;
                    const pct = Math.min(100, (item.stockQuantity / (item.lowStockThreshold * 3)) * 100);
                    return (
                      <tr key={item._id} className={`hover:bg-surface-50 transition-colors ${isLow ? "bg-red-50/30" : ""}`}>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-surface-900 text-sm">{item.name}</p>
                          <p className="text-xs text-surface-400">{item.unit}</p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className={`font-bold text-sm ${isLow ? "text-red-600" : "text-surface-900"}`}>
                              {item.stockQuantity} {item.unit}
                            </span>
                            <div className="w-24 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isLow ? "bg-red-500" : pct > 60 ? "bg-green-500" : "bg-amber-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right hidden md:table-cell">
                          <span className="text-sm text-surface-600">{item.lowStockThreshold} {item.unit}</span>
                        </td>
                        <td className="px-5 py-3 text-right hidden lg:table-cell">
                          <span className="text-sm text-surface-600">₹{item.costPerUnit}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                            {isLow ? "⚠️ Low" : "✓ OK"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => { setRestockItem(item); setRestockQty(""); }}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                            >
                              + Restock
                            </button>
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 text-sm"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-surface-500 hover:text-red-500 text-sm"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {displayed.length === 0 && (
                <div className="text-center py-12 text-surface-400">
                  <p>No ingredients found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-5 border-b border-surface-100 flex items-center justify-between">
              <h2 className="font-display font-bold">{editItem ? "Edit Ingredient" : "Add Ingredient"}</h2>
              <button onClick={() => setShowForm(false)} className="text-surface-400 hover:text-surface-700">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Coffee Beans" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input-field">
                    {["grams", "kg", "ml", "litre", "pcs", "dozen"].map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Stock Qty</label>
                  <input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Low Alert At</label>
                  <input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Cost/Unit (₹)</label>
                  <input type="number" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} className="input-field" />
                </div>
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1">{editItem ? "Save" : "Add"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
            <div className="p-5 border-b border-surface-100">
              <h2 className="font-display font-bold">Restock: {restockItem.name}</h2>
              <p className="text-sm text-surface-500">Current: {restockItem.stockQuantity} {restockItem.unit}</p>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-surface-700 mb-1">Add Quantity ({restockItem.unit})</label>
              <input
                type="number"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="input-field text-xl font-bold"
                placeholder="500"
                autoFocus
              />
              {restockQty && (
                <p className="text-sm text-green-600 mt-1 font-medium">
                  New stock: {restockItem.stockQuantity + parseFloat(restockQty)} {restockItem.unit}
                </p>
              )}
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setRestockItem(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleRestock} className="btn-primary flex-1">✓ Restock</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 animate-slide-up font-medium text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
