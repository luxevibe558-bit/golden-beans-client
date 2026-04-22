"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { menuApi } from "@/lib/api";
import type { MenuItem, Category } from "@/types";

interface ItemFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime: string;
  tags: string;
}

const EMPTY_FORM: ItemFormData = {
  name: "", description: "", price: "", category: "",
  isVeg: true, isAvailable: true, preparationTime: "10", tags: "",
};

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<ItemFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const load = useCallback(async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        menuApi.getItems(),
        menuApi.getCategories(),
      ]);
      setItems(itemsRes.data.data);
      setCategories(catsRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, category: categories[0]?._id || "" });
    setShowForm(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    const catId = typeof item.category === "object" ? item.category._id : item.category;
    setForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: catId,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime.toString(),
      tags: item.tags.join(", "),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) return alert("Fill required fields");
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        preparationTime: parseInt(form.preparationTime),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (editItem) {
        await menuApi.updateItem(editItem._id, payload);
        showToast("✅ Item updated");
      } else {
        await menuApi.createItem(payload);
        showToast("✅ Item created");
      }
      setShowForm(false);
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      showToast(`❌ ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: MenuItem) => {
    try {
      await menuApi.toggleItem(item._id);
      showToast(`${!item.isAvailable ? "✅ Enabled" : "⏸ Disabled"}: ${item.name}`);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await menuApi.deleteItem(item._id);
      showToast("🗑 Item deleted");
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = items.filter((item) => {
    const catId = typeof item.category === "object" ? item.category._id : item.category;
    const matchCat = activeCat === "all" || catId === activeCat;
    const matchSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <POSSidebar />
      <div className="flex-1 ml-16 lg:ml-56 overflow-hidden flex flex-col">
        <header className="bg-white border-b border-surface-200 px-6 py-4 flex-shrink-0 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-surface-900 text-xl">Menu Management</h1>
            <p className="text-surface-400 text-xs">{items.length} total items</p>
          </div>
          <button onClick={openCreate} className="btn-primary text-sm">
            + Add Item
          </button>
        </header>

        {/* Filters */}
        <div className="bg-white border-b border-surface-100 px-6 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveCat("all")}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCat === "all" ? "bg-surface-950 text-white" : "bg-surface-100 text-surface-600"
              }`}
            >
              All ({items.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setActiveCat(cat._id)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCat === cat._id ? "bg-surface-950 text-white" : "bg-surface-100 text-surface-600"
                }`}
              >
                <span>{cat.icon}</span>{cat.name}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-52 flex-shrink-0">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-8 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Items table */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden shadow-card">
              <table className="w-full">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Item</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Price</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide hidden lg:table-cell">Prep</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {filtered.map((item) => {
                    const catName = typeof item.category === "object" ? item.category.name : "";
                    const catIcon = typeof item.category === "object" ? item.category.icon : "";
                    return (
                      <tr key={item._id} className="hover:bg-surface-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-surface-900 text-sm">{item.name}</p>
                              <p className="text-xs text-surface-400 line-clamp-1 hidden sm:block">{item.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-surface-600">{catIcon} {catName}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-surface-900">₹{item.price}</span>
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          <span className="text-xs text-surface-500">{item.preparationTime}m</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggle(item)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                              item.isAvailable
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}
                          >
                            {item.isAvailable ? "Available" : "Off"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-900 transition-colors text-sm"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-surface-500 hover:text-red-500 transition-colors text-sm"
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
              {filtered.length === 0 && (
                <div className="text-center py-12 text-surface-400">
                  <p className="font-medium">No items found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-5 border-b border-surface-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-display font-bold text-surface-900">
                {editItem ? "Edit Item" : "Add Menu Item"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-surface-400 hover:text-surface-700">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Cappuccino" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" placeholder="180" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Prep Time (min)</label>
                  <input type="number" value={form.preparationTime} onChange={(e) => setForm({ ...form, preparationTime: e.target.value })} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-surface-700 mb-1">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                    <option value="">Select category...</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field resize-none" rows={2} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-surface-700 mb-1">Tags (comma separated)</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="bestseller, popular, spicy" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setForm({ ...form, isVeg: !form.isVeg })}
                      className={`w-10 h-6 rounded-full transition-colors ${form.isVeg ? "bg-green-500" : "bg-red-400"}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${form.isVeg ? "translate-x-4.5 ml-0.5" : "ml-0.5"}`} />
                    </div>
                    <span className="text-sm font-medium text-surface-700">{form.isVeg ? "🟢 Veg" : "🔴 Non-Veg"}</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}
                      className={`w-10 h-6 rounded-full transition-colors ${form.isAvailable ? "bg-brand-500" : "bg-surface-300"}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${form.isAvailable ? "translate-x-4.5 ml-0.5" : "ml-0.5"}`} />
                    </div>
                    <span className="text-sm font-medium text-surface-700">{form.isAvailable ? "Available" : "Unavailable"}</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? "Saving..." : editItem ? "Save Changes" : "Add Item"}
              </button>
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
