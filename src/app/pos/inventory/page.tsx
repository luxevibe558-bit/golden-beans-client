"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";
import { inventoryApi } from "@/lib/api";
import { Card, Pill, StatCard, EmptyState, Skeleton, Icons, Button, Input, Modal } from "@/components/PremiumUI";

const T = {
  emerald: "#0F3D2E",
  emeraldMid: "#1A5340",
  emeraldLight: "#2D7A5F",
  gold: "#D4A574",
  goldDark: "#B08550",
  cream: "#FAF6F0",
  ivory: "#FFFBF5",
  border: "#E5DCC9",
  text: "#1A1208",
  textMuted: "#7A6B54",
  textDim: "#A89B80",
  success: "#4A8B4A",
  danger: "#C0392B",
  warning: "#D4A574",
};

interface Ingredient {
  _id: string;
  name: string;
  unit: string;
  stockQuantity: number;
  currentStock: number; // alias
  lowStockThreshold: number;
  costPerUnit: number;
}

interface IngredientsResponse {
  data: { data: Ingredient[] };
}

const getStock = (ing: Ingredient) => ing.stockQuantity ?? ing.currentStock ?? 0;
function getStockStatus(current: number, threshold: number) {
  if (current === 0) return { label: "Out of Stock", color: T.danger, variant: "danger" as const };
  if (current < threshold) return { label: "Low Stock", color: T.warning, variant: "warning" as const };
  if (current < threshold * 2) return { label: "Adequate", color: T.success, variant: "success" as const };
  return { label: "Well Stocked", color: T.success, variant: "success" as const };
}

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [restockModal, setRestockModal] = useState<Ingredient | null>(null);
  const [restockAmount, setRestockAmount] = useState("");
  const [editModal, setEditModal] = useState<Ingredient | null>(null);
  const [editForm, setEditForm] = useState({ name: "", unit: "", currentStock: "", lowStockThreshold: "", costPerUnit: "" });
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", unit: "grams", currentStock: "", lowStockThreshold: "", costPerUnit: "" });

  const load = useCallback(async () => {
    try {
      const res = await (inventoryApi as { getAll: () => Promise<IngredientsResponse> }).getAll();
      setIngredients(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRestock = async () => {
    if (!restockModal || !restockAmount) return;
    try {
      const currentQty = getStock(restockModal);
      const newStock = currentQty + parseFloat(restockAmount);
      await (inventoryApi as { update: (id: string, data: { stockQuantity: number }) => Promise<unknown> }).update(restockModal._id, { stockQuantity: newStock });
      setRestockModal(null);
      setRestockAmount("");
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = async () => {
    if (!editModal) return;
    try {
      await (inventoryApi as { update: (id: string, data: Record<string, unknown>) => Promise<unknown> }).update(editModal._id, {
        name: editForm.name,
        unit: editForm.unit,
        stockQuantity: parseFloat(editForm.currentStock) || 0,
        lowStockThreshold: parseFloat(editForm.lowStockThreshold) || 0,
        costPerUnit: parseFloat(editForm.costPerUnit) || 0,
      });
      setEditModal(null);
      load();
    } catch (e) { console.error(e); }
  };

  const handleAdd = async () => {
    if (!addForm.name) return;
    try {
      await (inventoryApi as { create: (data: Record<string, unknown>) => Promise<unknown> }).create({
        name: addForm.name,
        unit: addForm.unit,
        stockQuantity: parseFloat(addForm.currentStock) || 0,
        lowStockThreshold: parseFloat(addForm.lowStockThreshold) || 0,
        costPerUnit: parseFloat(addForm.costPerUnit) || 0,
      });
      setAddModal(false);
      setAddForm({ name: "", unit: "grams", currentStock: "", lowStockThreshold: "", costPerUnit: "" });
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ingredient permanently?")) return;
    try {
      await (inventoryApi as { delete: (id: string) => Promise<unknown> }).delete(id);
      load();
    } catch (e) { console.error(e); }
  };

  const openEdit = (ing: Ingredient) => {
    setEditForm({
      name: ing.name,
      unit: ing.unit,
      currentStock: String(getStock(ing)),
      lowStockThreshold: String(ing.lowStockThreshold),
      costPerUnit: String(ing.costPerUnit),
    });
    setEditModal(ing);
  };

  const filtered = ingredients
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    .filter(i => {
      if (filter === "low") return getStock(i) < i.lowStockThreshold && getStock(i) > 0;
      if (filter === "out") return getStock(i) === 0;
      return true;
    });

  const total = ingredients.length;
  const lowCount = ingredients.filter(i => getStock(i) < i.lowStockThreshold && getStock(i) > 0).length;
  const outCount = ingredients.filter(i => getStock(i) === 0).length;
  const totalValue = ingredients.reduce((s, i) => s + getStock(i) * i.costPerUnit, 0);

  return (
    <div style={{ minHeight: "100vh", background: T.cream, display: "flex" }}>
      <POSSidebar />

      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column" }}>
        <header style={{
          background: T.ivory,
          borderBottom: `1px solid ${T.border}`,
          padding: "20px 24px",
          boxShadow: "0 1px 2px rgba(15,61,46,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "28px", fontWeight: 800,
                color: T.emerald, margin: "0 0 4px",
                letterSpacing: "-0.02em", lineHeight: 1.1,
              }}>
                Inventory
              </h1>
              <p style={{ fontSize: "12px", color: T.textMuted, margin: 0, fontWeight: 500 }}>
                Track ingredients, stock levels, and inventory value
              </p>
            </div>

            <Button variant="primary" icon={<Icons.Plus size={14} />} onClick={() => setAddModal(true)}>
              Add Ingredient
            </Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            <StatCard label="Total Items" value={total} icon={<Icons.Box size={18} />} variant="default" />
            <StatCard label="Low Stock" value={lowCount} icon={<Icons.Bell size={18} />} variant="gold" subtitle="Need reorder" />
            <StatCard label="Out of Stock" value={outCount} icon={<Icons.Close size={18} />} variant="danger" subtitle="Critical" />
            <StatCard label="Total Value" value={`₹${totalValue.toFixed(0)}`} icon={<Icons.Money size={18} />} variant="gold" subtitle="Stock worth" />
          </div>
        </header>

        <div style={{ padding: "16px 24px 0" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "240px" }}>
              <Input icon={<Icons.Search size={14} />} placeholder="Search ingredients..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "6px", background: T.ivory, padding: "4px", borderRadius: "12px", border: `1px solid ${T.border}` }}>
              {[
                { id: "all", label: "All", count: total },
                { id: "low", label: "Low", count: lowCount },
                { id: "out", label: "Out", count: outCount },
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id as typeof filter)}
                  style={{
                    padding: "8px 14px", borderRadius: "8px",
                    fontSize: "12px", fontWeight: 700,
                    background: filter === id ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "transparent",
                    color: filter === id ? T.gold : T.textMuted,
                    cursor: "pointer", transition: "all 150ms",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {label} <span style={{ opacity: 0.7, marginLeft: "3px", fontFamily: "'DM Sans', sans-serif" }}>{count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <main style={{ flex: 1, padding: "16px 24px 24px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height="68px" style={{ borderRadius: "12px" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icons.Box size={32} color={T.emerald} />}
              title={search ? "No ingredients found" : "Start tracking your inventory"}
              description={search ? "Try a different search term." : "Add your first ingredient to get started."}
              action={!search && (
                <Button variant="primary" icon={<Icons.Plus size={14} />} onClick={() => setAddModal(true)}>
                  Add First Ingredient
                </Button>
              )}
            />
          ) : (
            <Card padding="none">
              {/* Table Header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 2fr) 100px 100px 100px 110px 130px",
                gap: "12px",
                padding: "12px 18px",
                borderBottom: `1px solid ${T.border}`,
                background: T.cream,
                borderRadius: "16px 16px 0 0",
              }}>
                {["Ingredient", "Stock", "Low at", "Cost/Unit", "Status", "Actions"].map(h => (
                  <span key={h} style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {filtered.map((ing, idx) => {
                const status = getStockStatus(getStock(ing), ing.lowStockThreshold);
                return (
                  <div
                    key={ing._id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 2fr) 100px 100px 100px 110px 130px",
                      gap: "12px",
                      padding: "14px 18px",
                      borderBottom: idx === filtered.length - 1 ? "none" : `1px solid ${T.border}`,
                      alignItems: "center",
                      transition: "background 150ms",
                      animation: `gb-fadeInUp 0.3s ${idx * 0.03}s cubic-bezier(0.16, 1, 0.3, 1) both`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.cream; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ing.name}
                      </p>
                    </div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 700, color: T.text, fontVariantNumeric: "tabular-nums" }}>
                      {getStock(ing)} <span style={{ color: T.textDim, fontWeight: 600 }}>{ing.unit}</span>
                    </span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: T.textMuted, fontVariantNumeric: "tabular-nums" }}>
                      {ing.lowStockThreshold} {ing.unit}
                    </span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 700, color: T.emerald, fontVariantNumeric: "tabular-nums" }}>
                      ₹{ing.costPerUnit}
                    </span>
                    <Pill variant={status.variant} size="sm">
                      {status.label}
                    </Pill>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Button size="sm" variant="primary" onClick={() => setRestockModal(ing)} icon={<Icons.Plus size={11} />}>
                        Restock
                      </Button>
                      <button
                        onClick={() => openEdit(ing)}
                        style={{
                          width: "30px", height: "30px",
                          borderRadius: "8px",
                          background: T.cream, border: `1px solid ${T.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", color: T.emerald, transition: "all 150ms",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = T.emerald; e.currentTarget.style.color = T.gold; }}
                        onMouseLeave={e => { e.currentTarget.style.background = T.cream; e.currentTarget.style.color = T.emerald; }}
                      >
                        <Icons.Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(ing._id)}
                        style={{
                          width: "30px", height: "30px",
                          borderRadius: "8px",
                          background: T.cream, border: `1px solid ${T.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", color: T.danger, transition: "all 150ms",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#FCE8E6"; e.currentTarget.style.borderColor = T.danger; }}
                        onMouseLeave={e => { e.currentTarget.style.background = T.cream; e.currentTarget.style.borderColor = T.border; }}
                      >
                        <Icons.Trash size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </main>
      </div>

      {/* Restock Modal */}
      <Modal isOpen={!!restockModal} onClose={() => setRestockModal(null)} title="Restock Ingredient">
        {restockModal && (
          <>
            <div style={{ background: T.cream, borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: "11px", color: T.textMuted, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 4px" }}>Ingredient</p>
              <p style={{ fontSize: "16px", fontWeight: 700, color: T.text, margin: "0 0 8px" }}>{restockModal.name}</p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: T.textMuted }}>Current Stock:</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: T.text, fontVariantNumeric: "tabular-nums" }}>
                  {getStock(restockModal)} {restockModal.unit}
                </span>
              </div>
            </div>
            <Input
              label={`Add Quantity (${restockModal.unit})`}
              type="number"
              placeholder={`e.g. 500`}
              value={restockAmount}
              onChange={e => setRestockAmount(e.target.value)}
              autoFocus
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <Button variant="secondary" fullWidth onClick={() => setRestockModal(null)}>Cancel</Button>
              <Button variant="primary" fullWidth onClick={handleRestock} disabled={!restockAmount}>
                Confirm Restock
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit Ingredient">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Input label="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label="Unit" value={editForm.unit} onChange={e => setEditForm({ ...editForm, unit: e.target.value })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input label="Current Stock" type="number" value={editForm.currentStock} onChange={e => setEditForm({ ...editForm, currentStock: e.target.value })} />
            <Input label="Low Threshold" type="number" value={editForm.lowStockThreshold} onChange={e => setEditForm({ ...editForm, lowStockThreshold: e.target.value })} />
          </div>
          <Input label="Cost Per Unit (₹)" type="number" value={editForm.costPerUnit} onChange={e => setEditForm({ ...editForm, costPerUnit: e.target.value })} />
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <Button variant="secondary" fullWidth onClick={() => setEditModal(null)}>Cancel</Button>
            <Button variant="primary" fullWidth onClick={handleEdit}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add New Ingredient">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Input label="Name" placeholder="e.g. Coffee Beans" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} autoFocus />
          <div>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "6px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Unit</label>
            <select
              value={addForm.unit}
              onChange={e => setAddForm({ ...addForm, unit: e.target.value })}
              style={{
                width: "100%", padding: "11px 14px", borderRadius: "10px",
                border: `1.5px solid ${T.border}`, background: T.ivory,
                color: T.text, fontSize: "14px", fontWeight: 500,
                outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif",
              }}
            >
              {["grams", "kg", "ml", "liters", "pcs", "boxes"].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input label="Initial Stock" type="number" placeholder="0" value={addForm.currentStock} onChange={e => setAddForm({ ...addForm, currentStock: e.target.value })} />
            <Input label="Low Threshold" type="number" placeholder="0" value={addForm.lowStockThreshold} onChange={e => setAddForm({ ...addForm, lowStockThreshold: e.target.value })} />
          </div>
          <Input label="Cost Per Unit (₹)" type="number" placeholder="0" value={addForm.costPerUnit} onChange={e => setAddForm({ ...addForm, costPerUnit: e.target.value })} />
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <Button variant="secondary" fullWidth onClick={() => setAddModal(false)}>Cancel</Button>
            <Button variant="primary" fullWidth onClick={handleAdd} disabled={!addForm.name}>Add Ingredient</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
