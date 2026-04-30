"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import POSSidebar from "@/components/POSSidebar";
import { menuApi } from "@/lib/api";
import { uploadImage, getThumbnailUrl } from "@/lib/cloudinary";
import { Card, Pill, StatCard, EmptyState, Skeleton, Icons, Button, Input, Modal } from "@/components/PremiumUI";
import type { MenuCategory, MenuItem } from "@/types";

const T = {
  emerald: "#0F3D2E",
  emeraldMid: "#1A5340",
  gold: "#D4A574",
  goldLight: "#E8C895",
  goldDark: "#B08550",
  cream: "#FAF6F0",
  ivory: "#FFFBF5",
  border: "#E5DCC9",
  text: "#1A1208",
  textMuted: "#7A6B54",
  textDim: "#A89B80",
  success: "#4A8B4A",
  danger: "#C0392B",
};

interface VariantOption {
  name: string;
  priceModifier: number;
  isDefault?: boolean;
}

interface VariantGroup {
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: VariantOption[];
}



export default function MenuManagerPage() {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await menuApi.getMenu();
      setMenu(res.data.data);
      if (res.data.data.length > 0 && !activeCategory) {
        setActiveCategory(res.data.data[0]._id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [activeCategory]);

  useEffect(() => { load(); }, [load]);

  const allItems = menu.flatMap(c => c.items as MenuItem[]);
  const totalItems = allItems.length;
  const availableCount = allItems.filter(i => i.isAvailable).length;
  const withPhotoCount = allItems.filter(i => i.imageUrl).length;
  const withVariantsCount = allItems.filter(i => i.variantGroups && i.variantGroups.length > 0).length;

  const activeItems = (menu.find(c => c._id === activeCategory)?.items as MenuItem[] || [])
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: "100vh", background: T.cream, display: "flex" }}>
      <POSSidebar />

      <div style={{ flex: 1, marginLeft: "64px", display: "flex", flexDirection: "column" }}>
        <header style={{
          background: T.ivory, borderBottom: `1px solid ${T.border}`,
          padding: "20px 24px", boxShadow: "0 1px 2px rgba(15,61,46,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "28px", fontWeight: 800,
                color: T.emerald, margin: "0 0 4px",
                letterSpacing: "-0.02em", lineHeight: 1.1,
              }}>Menu Management</h1>
              <p style={{ fontSize: "12px", color: T.textMuted, margin: 0, fontWeight: 500 }}>
                Manage items, photos, and variants
              </p>
            </div>
            <Button variant="primary" icon={<Icons.Plus size={14} />} onClick={() => setShowAdd(true)}>
              Add Item
            </Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            <StatCard label="Total Items" value={totalItems} icon={<Icons.Menu size={18} />} variant="default" />
            <StatCard label="Available" value={availableCount} icon={<Icons.Check size={18} />} variant="success" subtitle={`${totalItems ? Math.round(availableCount/totalItems*100) : 0}% live`} />
            <StatCard label="With Photos" value={withPhotoCount} icon={<Icons.Camera size={18} />} variant="gold" subtitle={`${totalItems ? Math.round(withPhotoCount/totalItems*100) : 0}% covered`} />
            <StatCard label="With Variants" value={withVariantsCount} icon={<Icons.Sparkle size={18} />} variant="info" subtitle="Customizable" />
          </div>
        </header>

        {/* Category Tabs */}
        {!loading && menu.length > 0 && (
          <div style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "12px 24px" }}>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto" }} className="scrollbar-hide">
              {menu.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  style={{
                    flexShrink: 0, padding: "8px 14px", borderRadius: "10px",
                    background: activeCategory === cat._id ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.cream,
                    color: activeCategory === cat._id ? T.gold : T.emerald,
                    border: `1.5px solid ${activeCategory === cat._id ? T.emerald : T.border}`,
                    cursor: "pointer", fontWeight: 700, fontSize: "12px",
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 150ms ease",
                    boxShadow: activeCategory === cat._id ? "0 4px 10px rgba(15,61,46,0.25)" : "none",
                    display: "flex", alignItems: "center", gap: "5px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span style={{ opacity: 0.7, fontSize: "10px", marginLeft: "2px" }}>({cat.items.length})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: "16px 24px 0" }}>
          <Input icon={<Icons.Search size={14} />} placeholder="Search menu items..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <main style={{ flex: 1, padding: "16px 24px 24px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height="160px" style={{ borderRadius: "16px" }} />
              ))}
            </div>
          ) : activeItems.length === 0 ? (
            <EmptyState
              icon={<Icons.Menu size={32} color={T.emerald} />}
              title={search ? "No items found" : "No items in this category"}
              description={search ? "Try a different search." : "Add your first item to get started."}
              action={!search && (
                <Button variant="primary" icon={<Icons.Plus size={14} />} onClick={() => setShowAdd(true)}>
                  Add Item
                </Button>
              )}
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {activeItems.map((item, idx) => (
                <div key={item._id} style={{ animation: `gb-fadeInUp 0.3s ${idx * 0.04}s ease both` }}>
                  <ItemCard item={item} onEdit={() => setEditItem(item)} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <ItemEditModal
          item={editItem}
          categories={menu}
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); load(); }}
        />
      )}

      {/* Add Modal */}
      {showAdd && (
        <ItemEditModal
          item={null}
          categories={menu}
          isOpen={showAdd}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}

// ─── ITEM CARD ───
function ItemCard({ item, onEdit }: { item: MenuItem; onEdit: () => void }) {
  return (
    <Card padding="none" hover>
      <div style={{ display: "flex", gap: "12px", padding: "12px" }}>
        <div style={{
          width: "80px", height: "80px",
          borderRadius: "12px", overflow: "hidden",
          background: item.imageUrl ? "transparent" : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          color: T.gold,
        }}>
          {item.imageUrl ? (
            <img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Icons.Camera size={28} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
            <p style={{ fontWeight: 800, fontSize: "14px", color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.name}
            </p>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 800, color: T.emerald, fontVariantNumeric: "tabular-nums" }}>
              ₹{item.price}
            </span>
          </div>

          <p style={{ fontSize: "11px", color: T.textMuted, margin: "0 0 8px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {item.description || "No description"}
          </p>

          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "8px" }}>
            <Pill variant={item.isAvailable ? "success" : "danger"} size="sm">
              {item.isAvailable ? "Live" : "Hidden"}
            </Pill>
            {item.variantGroups && item.variantGroups.length > 0 && (
              <Pill variant="info" size="sm" icon={<Icons.Sparkle size={9} />}>
                {item.variantGroups.length} variants
              </Pill>
            )}
            {item.imageUrl && <Pill variant="gold" size="sm" icon={<Icons.Camera size={9} />}>Photo</Pill>}
          </div>

          <Button size="sm" variant="secondary" fullWidth onClick={onEdit} icon={<Icons.Edit size={11} />}>
            Edit Item
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── EDIT/ADD MODAL ───
function ItemEditModal({ item, categories, isOpen, onClose, onSaved }: {
  item: MenuItem | null;
  categories: MenuCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !item;
  const [tab, setTab] = useState<"details" | "photo" | "variants" | "recipe">("details");
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(String(item?.price || ""));
  const [categoryId, setCategoryId] = useState(typeof item?.category === "object" ? item.category._id : (categories[0]?._id || ""));
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || "");
  const [imagePublicId, setImagePublicId] = useState(item?.imagePublicId || "");
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>(item?.variantGroups || []);
  const [tags, setTags] = useState<string[]>(item?.tags || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recipe, setRecipe] = useState<{ingredient: string; ingredientName: string; quantityUsed: number}[]>(
    (item?.recipe || []).map((r: any) => ({
      ingredient: typeof r.ingredient === 'object' ? r.ingredient._id : r.ingredient,
      ingredientName: typeof r.ingredient === 'object' ? r.ingredient.name : '',
      quantityUsed: r.quantityUsed,
    }))
  );
  const [ingredients, setIngredients] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://golden-beans-server.onrender.com/api'}/inventory`)
      .then(r => r.json())
      .then(d => setIngredients(d.data || []));
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(file);
      setImageUrl(result.secure_url);
      setImagePublicId(result.public_id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !price || !categoryId) {
      alert("Please fill name, price, and category");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description,
        price: parseFloat(price),
        category: categoryId,
        isAvailable,
        imageUrl,
        imagePublicId,
        variantGroups,
        tags,
        isVeg: true,
        recipe: recipe.filter(r => r.ingredient).map(r => ({
          ingredient: r.ingredient,
          quantityUsed: r.quantityUsed,
        })),
      };
      if (isNew) {
        await (menuApi as { createItem?: (data: typeof payload) => Promise<unknown> }).createItem?.(payload)
          ?? await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/items`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          });
      } else {
        await (menuApi as { updateItem?: (id: string, data: typeof payload) => Promise<unknown> }).updateItem?.(item!._id, payload)
          ?? await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/items/${item!._id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          });
      }
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/items/${item._id}`, { method: "DELETE" });
      onSaved();
    } catch (err) {
      alert("Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const addVariantGroup = () => {
    setVariantGroups([...variantGroups, { name: "Size", required: true, multiSelect: false, options: [{ name: "Small", priceModifier: 0, isDefault: true }] }]);
  };

  const updateVariantGroup = (idx: number, updates: Partial<VariantGroup>) => {
    setVariantGroups(prev => prev.map((g, i) => i === idx ? { ...g, ...updates } : g));
  };

  const deleteVariantGroup = (idx: number) => {
    setVariantGroups(prev => prev.filter((_, i) => i !== idx));
  };

  const addOption = (groupIdx: number) => {
    setVariantGroups(prev => prev.map((g, i) =>
      i === groupIdx ? { ...g, options: [...g.options, { name: "", priceModifier: 0 }] } : g
    ));
  };

  const updateOption = (groupIdx: number, optIdx: number, updates: Partial<VariantOption>) => {
    setVariantGroups(prev => prev.map((g, i) =>
      i === groupIdx ? { ...g, options: g.options.map((o, j) => j === optIdx ? { ...o, ...updates } : o) } : g
    ));
  };

  const deleteOption = (groupIdx: number, optIdx: number) => {
    setVariantGroups(prev => prev.map((g, i) =>
      i === groupIdx ? { ...g, options: g.options.filter((_, j) => j !== optIdx) } : g
    ));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isNew ? "Add New Item" : `Edit: ${item.name}`} maxWidth={560}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "5px", padding: "4px", background: T.cream, borderRadius: "10px", marginBottom: "16px" }}>
        {[
          { id: "details", label: "Details", icon: <Icons.Edit size={12} /> },
          { id: "photo", label: "Photo", icon: <Icons.Camera size={12} /> },
          { id: "variants", label: "Variants", icon: <Icons.Sparkle size={12} /> },
          { id: "recipe", label: "Recipe", icon: <Icons.Box size={12} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            style={{
              flex: 1, padding: "8px", borderRadius: "8px",
              background: tab === t.id ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "transparent",
              color: tab === t.id ? T.gold : T.textMuted,
              fontWeight: 700, fontSize: "12px",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
              fontFamily: "'Inter', sans-serif",
              transition: "all 150ms ease",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {tab === "details" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Input label="Name *" placeholder="e.g. Cappuccino" value={name} onChange={e => setName(e.target.value)} />
          <div>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Description</label>
            <textarea
              placeholder="A short description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              style={{
                width: "100%", padding: "11px 14px", borderRadius: "10px",
                border: `1.5px solid ${T.border}`, background: T.ivory,
                color: T.text, fontSize: "14px", fontWeight: 500,
                outline: "none", boxSizing: "border-box",
                fontFamily: "'Inter', sans-serif", resize: "vertical",
              }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input label="Price (₹) *" type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} />
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Category *</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: "10px",
                  border: `1.5px solid ${T.border}`, background: T.ivory,
                  color: T.text, fontSize: "14px", fontWeight: 500,
                  outline: "none", boxSizing: "border-box",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setIsAvailable(!isAvailable)}
              style={{
                flex: 1, padding: "12px 14px",
                background: isAvailable ? T.success : T.cream,
                color: isAvailable ? "white" : T.textMuted,
                border: `1.5px solid ${isAvailable ? T.success : T.border}`,
                borderRadius: "10px",
                cursor: "pointer", fontWeight: 700, fontSize: "12px",
                fontFamily: "'Inter', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              <Icons.Check size={12} /> {isAvailable ? "Available" : "Hidden"}
            </button>

            <button
              onClick={() => setTags(tags.includes("bestseller") ? tags.filter(t => t !== "bestseller") : [...tags, "bestseller"])}
              style={{
                flex: 1, padding: "12px 14px",
                background: tags.includes("bestseller") ? T.gold : T.cream,
                color: tags.includes("bestseller") ? T.emerald : T.textMuted,
                border: `1.5px solid ${tags.includes("bestseller") ? T.gold : T.border}`,
                borderRadius: "10px",
                cursor: "pointer", fontWeight: 700, fontSize: "12px",
                fontFamily: "'Inter', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              <Icons.Sparkle size={12} /> Bestseller
            </button>
          </div>
        </div>
      )}

      {/* Photo Tab */}
      {tab === "photo" && (
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
          
          <div style={{
            border: `2px dashed ${imageUrl ? T.gold : T.border}`,
            borderRadius: "16px",
            padding: "24px", textAlign: "center",
            background: T.cream,
            cursor: "pointer",
            transition: "all 200ms",
          }}
          onClick={() => fileInputRef.current?.click()}
          >
            {imageUrl ? (
              <>
                <img src={getThumbnailUrl(imageUrl)} alt="Preview" style={{ width: "180px", height: "180px", borderRadius: "16px", objectFit: "cover", marginBottom: "12px", boxShadow: "0 8px 20px rgba(15,61,46,0.15)" }} />
                <p style={{ fontSize: "12px", color: T.textMuted, fontWeight: 600, margin: "0 0 8px" }}>Click to replace photo</p>
              </>
            ) : (
              <>
                <div style={{ width: "60px", height: "60px", margin: "0 auto 12px", borderRadius: "16px", background: T.emerald, display: "flex", alignItems: "center", justifyContent: "center", color: T.gold }}>
                  <Icons.Camera size={28} />
                </div>
                <p style={{ fontWeight: 800, fontSize: "14px", color: T.emerald, margin: "0 0 4px" }}>Upload Photo</p>
                <p style={{ fontSize: "11px", color: T.textMuted, margin: 0, fontWeight: 500 }}>JPG/PNG, max 10MB. 4K recommended.</p>
              </>
            )}
            
            {uploading && (
              <div style={{ marginTop: "12px", fontSize: "12px", color: T.gold, fontWeight: 700 }}>
                Uploading... please wait
              </div>
            )}
          </div>

          {imageUrl && (
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <Button variant="secondary" fullWidth onClick={() => fileInputRef.current?.click()} icon={<Icons.Camera size={12} />}>
                Replace Photo
              </Button>
              <Button variant="danger" onClick={() => { setImageUrl(""); setImagePublicId(""); }} icon={<Icons.Trash size={12} />}>
                Remove
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Recipe Tab */}
      {tab === "recipe" && (
        <div>
          <p style={{ fontSize: "12px", color: T.textMuted, marginBottom: "12px", lineHeight: 1.5 }}>
            Recipe set કરો — order place થાય ત્યારે automatically inventory deduct થશે.
          </p>

          {recipe.map((r, idx) => (
            <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
              <select
                value={r.ingredient}
                onChange={e => {
                  const ing = ingredients.find((i: any) => i._id === e.target.value);
                  setRecipe(prev => prev.map((item, i) => i === idx ? { ...item, ingredient: e.target.value, ingredientName: ing?.name || '' } : item));
                }}
                style={{ flex: 2, padding: "9px 10px", borderRadius: "9px", border: `1px solid ${T.border}`, background: T.ivory, fontSize: "13px", outline: "none", fontFamily: "inherit", color: T.text }}
              >
                <option value="">Select Ingredient</option>
                {ingredients.map((ing: any) => (
                  <option key={ing._id} value={ing._id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Qty"
                value={r.quantityUsed}
                min={0}
                onChange={e => setRecipe(prev => prev.map((item, i) => i === idx ? { ...item, quantityUsed: parseFloat(e.target.value) || 0 } : item))}
                style={{ flex: 1, padding: "9px 10px", borderRadius: "9px", border: `1px solid ${T.border}`, background: T.ivory, fontSize: "13px", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
              />
              <button onClick={() => setRecipe(prev => prev.filter((_, i) => i !== idx))}
                style={{ width: "32px", height: "36px", borderRadius: "9px", background: "white", border: `1px solid ${T.border}`, color: T.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icons.Close size={12} />
              </button>
            </div>
          ))}

          <button onClick={() => setRecipe(prev => [...prev, { ingredient: '', ingredientName: '', quantityUsed: 1 }])}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1.5px dashed ${T.border}`, background: T.cream, color: T.textMuted, fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: "4px" }}>
            + Add Ingredient
          </button>

          {recipe.length > 0 && (
            <div style={{ marginTop: "12px", padding: "10px 12px", background: `${T.success}15`, borderRadius: "10px", border: `1px solid ${T.success}33` }}>
              <p style={{ fontSize: "11px", color: T.success, fontWeight: 700, margin: 0 }}>
                ✓ {recipe.filter(r => r.ingredient).length} ingredient(s) linked — inventory auto-deduct enabled
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Variants Tab */}
      {tab === "variants" && (
        <div>
          <p style={{ fontSize: "12px", color: T.textMuted, marginBottom: "12px", lineHeight: 1.5 }}>
            Add customization options like Size (Small/Medium/Large), Milk types, or Add-ons. Each option can have a price modifier.
          </p>

          {variantGroups.map((group, gIdx) => (
            <div key={gIdx} style={{ background: T.cream, borderRadius: "14px", padding: "12px", marginBottom: "10px", border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px", alignItems: "center" }}>
                <Input
                  fullWidth
                  placeholder="Group name (e.g. Size)"
                  value={group.name}
                  onChange={e => updateVariantGroup(gIdx, { name: e.target.value })}
                />
                <button onClick={() => deleteVariantGroup(gIdx)} style={{ width: "32px", height: "40px", borderRadius: "10px", background: "white", border: `1px solid ${T.border}`, color: T.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icons.Trash size={14} />
                </button>
              </div>

              <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
                <button
                  onClick={() => updateVariantGroup(gIdx, { required: !group.required })}
                  style={{
                    padding: "5px 10px", borderRadius: "7px",
                    background: group.required ? T.danger : "white",
                    color: group.required ? "white" : T.textMuted,
                    border: `1px solid ${group.required ? T.danger : T.border}`,
                    fontSize: "10px", fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {group.required ? "✓ Required" : "Optional"}
                </button>
                <button
                  onClick={() => updateVariantGroup(gIdx, { multiSelect: !group.multiSelect })}
                  style={{
                    padding: "5px 10px", borderRadius: "7px",
                    background: group.multiSelect ? T.emerald : "white",
                    color: group.multiSelect ? T.gold : T.textMuted,
                    border: `1px solid ${group.multiSelect ? T.emerald : T.border}`,
                    fontSize: "10px", fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {group.multiSelect ? "✓ Multi-select" : "Single only"}
                </button>
              </div>

              {group.options.map((opt, oIdx) => (
                <div key={oIdx} style={{ display: "flex", gap: "6px", marginBottom: "5px", alignItems: "center" }}>
                  <input
                    placeholder="Option name"
                    value={opt.name}
                    onChange={e => updateOption(gIdx, oIdx, { name: e.target.value })}
                    style={{ flex: 2, padding: "8px 10px", borderRadius: "8px", border: `1px solid ${T.border}`, background: "white", fontSize: "12px", outline: "none", fontFamily: "'Inter', sans-serif", boxSizing: "border-box" }}
                  />
                  <input
                    type="number"
                    placeholder="0"
                    value={opt.priceModifier}
                    onChange={e => updateOption(gIdx, oIdx, { priceModifier: parseFloat(e.target.value) || 0 })}
                    style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: `1px solid ${T.border}`, background: "white", fontSize: "12px", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
                  />
                  <button
                    onClick={() => updateOption(gIdx, oIdx, { isDefault: !opt.isDefault })}
                    style={{ width: "28px", height: "28px", borderRadius: "7px", background: opt.isDefault ? T.gold : "white", border: `1px solid ${opt.isDefault ? T.gold : T.border}`, color: opt.isDefault ? T.emerald : T.textMuted, cursor: "pointer", fontSize: "11px" }}
                    title="Default"
                  >
                    ★
                  </button>
                  <button onClick={() => deleteOption(gIdx, oIdx)} style={{ width: "28px", height: "28px", borderRadius: "7px", background: "white", border: `1px solid ${T.border}`, color: T.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icons.Close size={11} />
                  </button>
                </div>
              ))}

              <Button size="sm" variant="ghost" fullWidth onClick={() => addOption(gIdx)} icon={<Icons.Plus size={11} />}>
                Add Option
              </Button>
            </div>
          ))}

          <Button variant="secondary" fullWidth onClick={addVariantGroup} icon={<Icons.Plus size={12} />}>
            Add Variant Group
          </Button>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", gap: "8px", marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${T.border}` }}>
        {!isNew && (
          <Button variant="danger" onClick={handleDelete} icon={<Icons.Trash size={12} />}>
            Delete
          </Button>
        )}
        <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
        <Button variant="primary" fullWidth onClick={handleSave} loading={saving}>
          {isNew ? "Create Item" : "Save Changes"}
        </Button>
      </div>
    </Modal>
  );
}
