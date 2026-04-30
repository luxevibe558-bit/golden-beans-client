"use client";

// ════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// Place at: client-new/src/app/admin/dashboard/page.tsx
// ════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icons, Button, Pill, StatCard } from "@/components/PremiumUI";

const T = {
  emerald: "#0F3D2E",
  emeraldMid: "#1A5340",
  emeraldDeep: "#0A2C20",
  gold: "#D4A574",
  goldLight: "#E8C895",
  goldDark: "#B08550",
  cream: "#FAF6F0",
  creamDark: "#F0E8DA",
  ivory: "#FFFBF5",
  border: "#E5DCC9",
  text: "#1A1208",
  textMuted: "#7A6B54",
  textDim: "#A89B80",
  success: "#4A8B4A",
  danger: "#C0392B",
  info: "#4A7B9B",
  warning: "#D4A574",
};

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

type AdminTab = "overview" | "users" | "security" | "sessions" | "2fa";
type UserRole = "admin" | "manager" | "cashier";

interface AdminUser {
  _id: string;
  name: string;
  username: string;
  role: UserRole;
  permissions: Record<string, Record<string, boolean>>;
  isActive: boolean;
  lastLogin: string | null;
  sessionDuration: number;
  totpEnabled: boolean;
  pin: string;
}

interface SecuritySettings {
  allowedIPs: string[];
  cafeLatitude: number;
  cafeLongitude: number;
  geofenceRadius: number;
  ipWhitelistEnabled: boolean;
  geofenceEnabled: boolean;
  cafeName: string;
  cafeAddress: string;
  cafePhone: string;
  wifiName: string;
}

interface AdminSettings {
  requirePinForSettle: boolean;
  requirePinForDelete: boolean;
  requirePinForEdit: boolean;
  sessionTimeoutHours: number;
}

const ROLE_CONFIG = {
  admin: { label: "Admin", color: T.gold, bg: T.emerald },
  manager: { label: "Manager", color: T.info, bg: "#e8f1f7" },
  cashier: { label: "Cashier", color: T.success, bg: "#e8f4ed" },
};

const SECTIONS = ["menu", "orders", "tables", "inventory", "reports", "promotions", "dues", "admin"];
const ACTIONS: Record<string, string[]> = {
  menu: ["view", "edit", "delete"],
  orders: ["view", "edit", "settle"],
  tables: ["view", "edit", "delete"],
  inventory: ["view", "edit", "delete"],
  reports: ["view"],
  promotions: ["view", "edit", "delete"],
  dues: ["view", "edit", "settle"],
  admin: ["view", "edit"],
};

function authHeaders(token: string) {
  return { "Content-Type": "application/json", "x-admin-token": token };
}

// ─── Sidebar ───
function AdminSidebar({ activeTab, onTabChange, user, onLogout }: {
  activeTab: AdminTab;
  onTabChange: (t: AdminTab) => void;
  user: AdminUser | null;
  onLogout: () => void;
}) {
  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "sessions", label: "Sessions", icon: "⏱️" },
    { id: "2fa", label: "2FA Setup", icon: "🔐" },
  ];

  return (
    <div style={{
      width: "200px", background: T.emeraldDeep,
      display: "flex", flexDirection: "column",
      height: "100vh", position: "fixed", left: 0, top: 0,
      zIndex: 40, borderRight: `1px solid rgba(212,165,116,0.1)`,
      boxShadow: "4px 0 20px rgba(0,0,0,0.2)",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(212,165,116,0.1)", display: "flex", alignItems: "center", gap: "10px" }}>
        <img src="/logo-small.png" alt="GB" draggable={false} style={{ width: "36px", height: "36px", borderRadius: "8px", pointerEvents: "none" }} />
        <div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 800, color: T.gold, margin: 0 }}>Admin</p>
          <p style={{ fontSize: "9px", color: "rgba(212,165,116,0.6)", margin: 0, fontWeight: 600 }}>Golden Beans</p>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(212,165,116,0.08)" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.emerald, fontWeight: 800, fontSize: "14px",
            margin: "0 0 8px",
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <p style={{ fontWeight: 800, fontSize: "12px", color: T.gold, margin: "0 0 2px" }}>{user.name}</p>
          <div style={{
            display: "inline-block",
            background: ROLE_CONFIG[user.role].bg,
            color: ROLE_CONFIG[user.role].color,
            padding: "2px 8px", borderRadius: "99px",
            fontSize: "9px", fontWeight: 800, letterSpacing: "0.05em",
          }}>
            {ROLE_CONFIG[user.role].label.toUpperCase()}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              width: "100%", padding: "10px 12px",
              borderRadius: "10px", marginBottom: "3px",
              background: activeTab === tab.id ? "rgba(212,165,116,0.15)" : "transparent",
              border: `1.5px solid ${activeTab === tab.id ? "rgba(212,165,116,0.3)" : "transparent"}`,
              color: activeTab === tab.id ? T.gold : "rgba(212,165,116,0.55)",
              fontWeight: 700, fontSize: "12px", cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              display: "flex", alignItems: "center", gap: "10px",
              textAlign: "left",
              transition: "all 150ms ease",
            }}
          >
            <span style={{ fontSize: "16px" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(212,165,116,0.08)" }}>
        <button
          onClick={onLogout}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: "10px",
            background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.2)",
            color: "#f87171", fontWeight: 700, fontSize: "12px",
            cursor: "pointer", fontFamily: "'Inter', sans-serif",
            display: "flex", alignItems: "center", gap: "8px",
          }}
        >
          <Icons.Close size={12} /> Logout
        </button>
      </div>
    </div>
  );
}

// ─── User Card ───
function UserCard({ user, onEdit, onDelete, onToggle }: {
  user: AdminUser;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const config = ROLE_CONFIG[user.role];
  return (
    <div style={{
      background: T.ivory, borderRadius: "16px", padding: "16px",
      border: `1.5px solid ${user.isActive ? T.border : T.border}`,
      opacity: user.isActive ? 1 : 0.6,
      animation: "gb-fadeInUp 0.3s ease both",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "12px",
          background: `linear-gradient(135deg, ${config.bg === T.emerald ? T.emerald : config.color}, ${config.bg === T.emerald ? T.emeraldMid : config.color + "aa"})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: config.bg === T.emerald ? T.gold : "white",
          fontWeight: 800, fontSize: "18px",
          fontFamily: "'Playfair Display', serif",
          flexShrink: 0,
        }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 800, color: T.emerald, margin: "0 0 4px" }}>
            {user.name}
          </p>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 700 }}>@{user.username}</span>
            <div style={{ background: config.bg === T.emerald ? T.emerald : "#f0f0f0", color: config.bg === T.emerald ? T.gold : config.color, padding: "2px 8px", borderRadius: "99px", fontSize: "9px", fontWeight: 800, letterSpacing: "0.05em" }}>
              {config.label.toUpperCase()}
            </div>
          </div>
        </div>
        <Pill variant={user.isActive ? "success" : "danger"} size="sm">
          {user.isActive ? "Active" : "Disabled"}
        </Pill>
      </div>

      <div style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", marginBottom: "12px", border: `1px dashed ${T.creamDark}` }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600 }}>
            ⏱️ {user.sessionDuration}hr session
          </span>
          <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600 }}>
            🔐 2FA: {user.totpEnabled ? "✅" : "❌"}
          </span>
          <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600 }}>
            📅 {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("en-IN") : "Never"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px" }}>
        <Button size="sm" variant="primary" icon={<Icons.Edit size={11} />} onClick={onEdit} fullWidth>Edit</Button>
        <button onClick={onToggle} style={{
          padding: "8px 14px", borderRadius: "8px", border: `1px solid ${T.border}`,
          background: user.isActive ? T.cream : T.success, color: user.isActive ? T.textMuted : "white",
          fontWeight: 700, fontSize: "12px", cursor: "pointer", fontFamily: "'Inter', sans-serif",
        }}>
          {user.isActive ? "Disable" : "Enable"}
        </button>
        <button onClick={onDelete} style={{
          width: "36px", height: "36px", borderRadius: "8px",
          background: "white", border: `1px solid ${T.border}`,
          color: T.danger, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icons.Trash size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── User Modal ───
function UserModal({ user, isOpen, onClose, onSaved, token }: {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  token: string;
}) {
  const isNew = !user;
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(user?.role || "cashier");
  const [pin, setPin] = useState(user?.pin || "1234");
  const [sessionDuration, setSessionDuration] = useState(String(user?.sessionDuration || 8));
  const [permissions, setPermissions] = useState(user?.permissions || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(user?.name || "");
      setUsername(user?.username || "");
      setPassword("");
      setRole(user?.role || "cashier");
      setPin(user?.pin || "1234");
      setSessionDuration(String(user?.sessionDuration || 8));
      setPermissions(user?.permissions || {});
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim() || !username.trim()) { alert("Name and username required"); return; }
    if (isNew && !password.trim()) { alert("Password required for new user"); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { name, role, pin, sessionDuration: parseInt(sessionDuration), permissions };
      if (isNew) { payload.username = username; payload.password = password; }
      if (!isNew && password) payload.password = password;

      const url = isNew ? `${API}/admin-auth/users` : `${API}/admin-auth/users/${user!._id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally { setSaving(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,61,46,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(8px)" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.ivory, borderRadius: "20px", maxWidth: "520px", width: "100%",
        maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 32px 64px rgba(15,61,46,0.2)",
      }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})` }} />
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>
            {isNew ? "Create User" : "Edit User"}
          </h2>
          <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "50%", background: T.cream, border: `1px solid ${T.border}`, color: T.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.Close size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.cream, fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Username *</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" disabled={!isNew}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: isNew ? T.cream : T.creamDark, fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box", opacity: isNew ? 1 : 0.7 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Password {!isNew && "(leave blank to keep)"}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isNew ? "Required" : "New password..."}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.cream, fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>PIN (4 digits)</label>
              <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1234"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.cream, fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box", letterSpacing: "0.2em" }} />
            </div>
          </div>

          {/* Role */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {(["admin", "manager", "cashier"] as UserRole[]).map(r => (
                <button key={r} onClick={() => setRole(r)} style={{
                  padding: "10px", borderRadius: "10px",
                  background: role === r ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.cream,
                  color: role === r ? T.gold : T.text,
                  border: `2px solid ${role === r ? T.emerald : T.border}`,
                  fontWeight: 800, fontSize: "12px", cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {ROLE_CONFIG[r].label}
                </button>
              ))}
            </div>
          </div>

          {/* Session Duration */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Session Duration</label>
            <div style={{ display: "flex", gap: "6px" }}>
              {["2", "4", "8", "12", "24"].map(h => (
                <button key={h} onClick={() => setSessionDuration(h)} style={{
                  flex: 1, padding: "8px 4px",
                  background: sessionDuration === h ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.cream,
                  color: sessionDuration === h ? T.gold : T.textMuted,
                  border: `1.5px solid ${sessionDuration === h ? T.emerald : T.border}`,
                  borderRadius: "8px", fontWeight: 800, fontSize: "12px", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Matrix */}
          <div>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Permissions</label>
            <div style={{ background: T.cream, borderRadius: "12px", overflow: "hidden", border: `1px solid ${T.border}` }}>
              {SECTIONS.map((section, si) => (
                <div key={section} style={{
                  padding: "10px 14px",
                  borderBottom: si < SECTIONS.length - 1 ? `1px solid ${T.creamDark}` : "none",
                  display: "flex", alignItems: "center", gap: "10px",
                }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: T.text, minWidth: "80px", textTransform: "capitalize" }}>{section}</span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {ACTIONS[section].map(action => {
                      const isEnabled = permissions[section]?.[action] ?? false;
                      return (
                        <button
                          key={action}
                          onClick={() => setPermissions(prev => ({
                            ...prev,
                            [section]: { ...(prev[section] || {}), [action]: !isEnabled },
                          }))}
                          style={{
                            padding: "4px 10px", borderRadius: "6px",
                            background: isEnabled ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.ivory,
                            color: isEnabled ? T.gold : T.textDim,
                            border: `1px solid ${isEnabled ? T.emerald : T.border}`,
                            fontWeight: 700, fontSize: "10px", cursor: "pointer",
                            fontFamily: "'Inter', sans-serif", textTransform: "capitalize",
                          }}
                        >{action}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 20px 18px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
            <Button variant="primary" fullWidth onClick={handleSave} loading={saving}>
              {isNew ? "Create User" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───
export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totpData, setTotpData] = useState<{ secret: string; qrUrl: string; totpEnabled: boolean } | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState("");
  const [totpVerifying, setTotpVerifying] = useState(false);
  const [newIp, setNewIp] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("gb_admin_token");
    const u = localStorage.getItem("gb_admin_user");
    if (!t) { router.replace("/admin"); return; }
    setToken(t);
    if (u) { try { setCurrentUser(JSON.parse(u)); } catch { } }
    // Verify session
    fetch(`${API}/admin-auth/verify`, { headers: { "x-admin-token": t } })
      .then(r => r.json())
      .then(d => { if (!d.success) { router.replace("/admin"); } })
      .catch(() => router.replace("/admin"));
  }, [router]);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/admin-auth/users`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch { }
  }, [token]);

  const loadSecuritySettings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/security/settings`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success) setSecuritySettings(data.data);
    } catch { }
  }, [token]);

  const loadAdminSettings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/admin-auth/settings`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success) setAdminSettings(data.data);
    } catch { }
  }, [token]);

  const loadTotpData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/admin-auth/totp-secret`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success) setTotpData(data.data);
    } catch { }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadUsers();
    loadSecuritySettings();
    loadAdminSettings();
  }, [token, loadUsers, loadSecuritySettings, loadAdminSettings]);

  useEffect(() => {
    if (activeTab === "2fa" && token) loadTotpData();
  }, [activeTab, token, loadTotpData]);

  const handleLogout = async () => {
    await fetch(`${API}/admin-auth/logout`, { method: "POST", headers: authHeaders(token) });
    localStorage.removeItem("gb_admin_token");
    localStorage.removeItem("gb_admin_user");
    router.replace("/admin");
  };

  const handleToggleUser = async (user: AdminUser) => {
    try {
      await fetch(`${API}/admin-auth/users/${user._id}`, {
        method: "PATCH", headers: authHeaders(token),
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      loadUsers();
    } catch { }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Delete ${user.name}?`)) return;
    try {
      await fetch(`${API}/admin-auth/users/${user._id}`, { method: "DELETE", headers: authHeaders(token) });
      loadUsers();
    } catch { }
  };

  const handleSaveSecuritySettings = async () => {
    if (!securitySettings) return;
    setSaving(true);
    try {
      await fetch(`${API}/security/settings`, {
        method: "PATCH", headers: authHeaders(token),
        body: JSON.stringify(securitySettings),
      });
      alert("✅ Security settings saved!");
    } catch { alert("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleSaveAdminSettings = async () => {
    if (!adminSettings) return;
    setSaving(true);
    try {
      await fetch(`${API}/admin-auth/settings`, {
        method: "PATCH", headers: authHeaders(token),
        body: JSON.stringify(adminSettings),
      });
      alert("✅ Settings saved!");
    } catch { alert("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleEnable2FA = async () => {
    if (!totpVerifyCode || totpVerifyCode.length !== 6) {
      alert("Enter 6-digit code from Google Authenticator");
      return;
    }
    setTotpVerifying(true);
    try {
      const res = await fetch(`${API}/admin-auth/enable-2fa`, {
        method: "POST", headers: authHeaders(token),
        body: JSON.stringify({ totpToken: totpVerifyCode }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      alert("🎉 2FA enabled successfully!");
      setTotpVerifyCode("");
      loadTotpData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally { setTotpVerifying(false); }
  };

  const handleForceLogoutAll = async () => {
    if (!confirm("Force logout ALL admin sessions?")) return;
    try {
      await fetch(`${API}/admin-auth/logout-all`, { method: "POST", headers: authHeaders(token) });
      alert("✅ All sessions cleared!");
    } catch { }
  };

  const handleAddIp = () => {
    if (!newIp.trim() || !securitySettings) return;
    setSecuritySettings({ ...securitySettings, allowedIPs: [...securitySettings.allowedIPs, newIp.trim()] });
    setNewIp("");
  };

  const handleRemoveIp = (ip: string) => {
    if (!securitySettings) return;
    setSecuritySettings({ ...securitySettings, allowedIPs: securitySettings.allowedIPs.filter(i => i !== ip) });
  };

  return (
    <div style={{ minHeight: "100vh", background: T.cream, display: "flex" }}>
      <style>{`
        @keyframes gb-fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gb-scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        * { box-sizing: border-box; }
      `}</style>

      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} user={currentUser} onLogout={handleLogout} />

      <div style={{ flex: 1, marginLeft: "200px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <header style={{
          background: T.ivory, borderBottom: `1px solid ${T.border}`,
          padding: "16px 24px", boxShadow: "0 1px 2px rgba(15,61,46,0.04)",
        }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 800, color: T.emerald, margin: 0 }}>
            {activeTab === "overview" && "🏠 Overview"}
            {activeTab === "users" && "👥 User Management"}
            {activeTab === "security" && "🔒 Security Settings"}
            {activeTab === "sessions" && "⏱️ Session & PIN Settings"}
            {activeTab === "2fa" && "🔐 Two-Factor Authentication"}
          </h1>
        </header>

        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>

          {/* ─── OVERVIEW ─── */}
          {activeTab === "overview" && (
            <div style={{ animation: "gb-fadeInUp 0.3s ease both" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                <StatCard label="Total Users" value={users.length} icon={<Icons.Users size={18} />} variant="default" subtitle={`${users.filter(u => u.isActive).length} active`} />
                <StatCard label="Admin Users" value={users.filter(u => u.role === "admin").length} icon={<Icons.Sparkle size={18} />} variant="gold" />
                <StatCard label="2FA Enabled" value={users.filter(u => u.totpEnabled).length} icon={<Icons.Check size={18} />} variant="success" />
                <StatCard label="Security" value={securitySettings?.ipWhitelistEnabled && securitySettings?.geofenceEnabled ? "Full" : "Partial"} icon={<Icons.Location size={18} />} variant="info" subtitle="IP + GPS active" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ background: T.ivory, borderRadius: "16px", padding: "16px", border: `1px solid ${T.border}` }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: "0 0 12px" }}>Quick Security Status</h3>
                  {[
                    { label: "IP Whitelist", active: securitySettings?.ipWhitelistEnabled, detail: `${securitySettings?.allowedIPs?.length || 0} IPs` },
                    { label: "GPS Geofence", active: securitySettings?.geofenceEnabled, detail: `${securitySettings?.geofenceRadius || 0}m radius` },
                    { label: "Admin 2FA", active: users.some(u => u.role === "admin" && u.totpEnabled), detail: "Google Auth" },
                    { label: "PIN Protection", active: adminSettings?.requirePinForDelete, detail: "Delete protected" },
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px dashed ${T.creamDark}` }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: T.text }}>{item.label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: T.textMuted }}>{item.detail}</span>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.active ? T.success : T.danger }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: T.ivory, borderRadius: "16px", padding: "16px", border: `1px solid ${T.border}` }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: "0 0 12px" }}>Recent Users</h3>
                  {users.slice(0, 4).map(u => (
                    <div key={u._id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: `1px dashed ${T.creamDark}` }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", color: T.gold, fontWeight: 800, fontSize: "12px" }}>
                        {u.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 800, fontSize: "12px", color: T.text, margin: 0 }}>{u.name}</p>
                        <p style={{ fontSize: "10px", color: T.textMuted, margin: 0 }}>{ROLE_CONFIG[u.role].label}</p>
                      </div>
                      <Pill variant={u.isActive ? "success" : "danger"} size="sm">{u.isActive ? "Active" : "Off"}</Pill>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── USERS ─── */}
          {activeTab === "users" && (
            <div style={{ animation: "gb-fadeInUp 0.3s ease both" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <Button variant="primary" icon={<Icons.Plus size={14} />} onClick={() => setShowAddUser(true)}>
                  New User
                </Button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                {users.map(u => (
                  <UserCard key={u._id} user={u}
                    onEdit={() => setEditUser(u)}
                    onDelete={() => handleDeleteUser(u)}
                    onToggle={() => handleToggleUser(u)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── SECURITY ─── */}
          {activeTab === "security" && securitySettings && (
            <div style={{ animation: "gb-fadeInUp 0.3s ease both", maxWidth: "600px" }}>
              {/* IP Whitelist */}
              <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: 0 }}>
                    📡 IP Whitelist
                  </h3>
                  <button
                    onClick={() => setSecuritySettings({ ...securitySettings, ipWhitelistEnabled: !securitySettings.ipWhitelistEnabled })}
                    style={{
                      padding: "8px 16px", borderRadius: "99px", border: "none", cursor: "pointer",
                      background: securitySettings.ipWhitelistEnabled ? T.success : T.danger,
                      color: "white", fontWeight: 800, fontSize: "12px", fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {securitySettings.ipWhitelistEnabled ? "✅ Enabled" : "❌ Disabled"}
                  </button>
                </div>

                <div style={{ marginBottom: "10px" }}>
                  {securitySettings.allowedIPs.map(ip => (
                    <div key={ip} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: T.cream, borderRadius: "8px", marginBottom: "6px", border: `1px solid ${T.border}` }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 700, color: T.text }}>{ip}</span>
                      <button onClick={() => handleRemoveIp(ip)} style={{ background: "none", border: "none", color: T.danger, cursor: "pointer", fontSize: "16px" }}>✕</button>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text" placeholder="Add IP (e.g. 103.251.59.114)"
                    value={newIp} onChange={e => setNewIp(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddIp()}
                    style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.cream, fontSize: "14px", fontWeight: 600, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <Button size="sm" variant="primary" onClick={handleAddIp} icon={<Icons.Plus size={12} />}>Add</Button>
                </div>
              </div>

              {/* GPS Geofence */}
              <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: 0 }}>
                    📍 GPS Geofence
                  </h3>
                  <button
                    onClick={() => setSecuritySettings({ ...securitySettings, geofenceEnabled: !securitySettings.geofenceEnabled })}
                    style={{
                      padding: "8px 16px", borderRadius: "99px", border: "none", cursor: "pointer",
                      background: securitySettings.geofenceEnabled ? T.success : T.danger,
                      color: "white", fontWeight: 800, fontSize: "12px", fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {securitySettings.geofenceEnabled ? "✅ Enabled" : "❌ Disabled"}
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {[
                    { label: "Latitude", key: "cafeLatitude", val: securitySettings.cafeLatitude },
                    { label: "Longitude", key: "cafeLongitude", val: securitySettings.cafeLongitude },
                    { label: "Radius (meters)", key: "geofenceRadius", val: securitySettings.geofenceRadius },
                  ].map(field => (
                    <div key={field.key}>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{field.label}</label>
                      <input
                        type="number" value={field.val}
                        onChange={e => setSecuritySettings({ ...securitySettings, [field.key]: parseFloat(e.target.value) })}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.cream, fontSize: "13px", fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Cafe Info */}
              <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: "0 0 14px" }}>☕ Cafe Info</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { label: "WiFi Name", key: "wifiName" },
                    { label: "Cafe Name", key: "cafeName" },
                    { label: "Address", key: "cafeAddress" },
                    { label: "Phone", key: "cafePhone" },
                  ].map(field => (
                    <div key={field.key}>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{field.label}</label>
                      <input
                        type="text" value={(securitySettings as Record<string, unknown>)[field.key] as string}
                        onChange={e => setSecuritySettings({ ...securitySettings, [field.key]: e.target.value })}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.cream, fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="primary" fullWidth size="lg" onClick={handleSaveSecuritySettings} loading={saving}>
                💾 Save Security Settings
              </Button>
            </div>
          )}

          {/* ─── SESSIONS ─── */}
          {activeTab === "sessions" && adminSettings && (
            <div style={{ animation: "gb-fadeInUp 0.3s ease both", maxWidth: "500px" }}>
              <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: "0 0 14px" }}>⏱️ Session Settings</h3>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Default Session Timeout</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {[2, 4, 8, 12, 24].map(h => (
                      <button key={h} onClick={() => setAdminSettings({ ...adminSettings, sessionTimeoutHours: h })} style={{
                        flex: 1, padding: "10px 4px",
                        background: adminSettings.sessionTimeoutHours === h ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.cream,
                        color: adminSettings.sessionTimeoutHours === h ? T.gold : T.textMuted,
                        border: `1.5px solid ${adminSettings.sessionTimeoutHours === h ? T.emerald : T.border}`,
                        borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}>{h}h</button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: "0 0 14px" }}>🔑 PIN Protection</h3>

                {[
                  { label: "Require PIN for Settle Bill", key: "requirePinForSettle" },
                  { label: "Require PIN for Delete", key: "requirePinForDelete" },
                  { label: "Require PIN for Edit", key: "requirePinForEdit" },
                ].map(item => (
                  <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px dashed ${T.creamDark}` }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: T.text }}>{item.label}</span>
                    <button
                      onClick={() => setAdminSettings({ ...adminSettings, [item.key]: !(adminSettings as Record<string, unknown>)[item.key] })}
                      style={{
                        padding: "6px 14px", borderRadius: "99px", border: "none", cursor: "pointer",
                        background: (adminSettings as Record<string, unknown>)[item.key] ? T.success : T.creamDark,
                        color: (adminSettings as Record<string, unknown>)[item.key] ? "white" : T.textMuted,
                        fontWeight: 800, fontSize: "11px", fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {(adminSettings as Record<string, unknown>)[item.key] ? "ON" : "OFF"}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Button variant="primary" fullWidth onClick={handleSaveAdminSettings} loading={saving}>
                  💾 Save Settings
                </Button>
                <Button variant="danger" onClick={handleForceLogoutAll}>
                  🔴 Logout All
                </Button>
              </div>
            </div>
          )}

          {/* ─── 2FA ─── */}
          {activeTab === "2fa" && (
            <div style={{ animation: "gb-fadeInUp 0.3s ease both", maxWidth: "480px" }}>
              {totpData?.totpEnabled ? (
                <div style={{ background: `linear-gradient(135deg, ${T.success}, #2d6a2d)`, borderRadius: "16px", padding: "24px", textAlign: "center", boxShadow: "0 8px 24px rgba(74,139,74,0.25)" }}>
                  <p style={{ fontSize: "40px", margin: "0 0 12px" }}>🛡️</p>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 800, color: "white", margin: "0 0 8px" }}>
                    2FA is Active!
                  </h3>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", margin: 0, fontWeight: 600 }}>
                    Your account is protected with Google Authenticator.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: "0 0 14px" }}>
                      Step 1 — Scan QR Code
                    </h3>
                    <p style={{ fontSize: "12px", color: T.textMuted, margin: "0 0 14px", fontWeight: 600, lineHeight: 1.6 }}>
                      Open <strong>Google Authenticator</strong> app → Tap <strong>"+"</strong> → <strong>"Scan QR code"</strong>
                    </p>
                    {totpData && (
                      <div style={{ background: T.cream, borderRadius: "12px", padding: "16px", border: `1px solid ${T.border}`, textAlign: "center" }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpData.qrUrl)}`}
                          alt="TOTP QR"
                          style={{ borderRadius: "8px", width: "180px", height: "180px" }}
                        />
                        <p style={{ fontSize: "11px", color: T.textMuted, margin: "10px 0 0", fontWeight: 600 }}>
                          Or enter manually: <strong style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.1em" }}>{totpData.secret}</strong>
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", border: `1px solid ${T.border}` }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: "0 0 14px" }}>
                      Step 2 — Verify Code
                    </h3>
                    <p style={{ fontSize: "12px", color: T.textMuted, margin: "0 0 12px", fontWeight: 600 }}>
                      Enter the 6-digit code from Google Authenticator to confirm setup:
                    </p>
                    <input
                      type="number" placeholder="000000" value={totpVerifyCode}
                      onChange={e => setTotpVerifyCode(e.target.value.slice(0, 6))}
                      style={{
                        width: "100%", padding: "14px", borderRadius: "12px",
                        border: `2px solid ${T.border}`, background: T.cream,
                        fontSize: "28px", fontWeight: 900, color: T.emerald,
                        textAlign: "center", letterSpacing: "0.2em",
                        outline: "none", fontFamily: "'DM Sans', sans-serif",
                        boxSizing: "border-box", marginBottom: "12px",
                      }}
                    />
                    <Button variant="primary" fullWidth size="lg" onClick={handleEnable2FA} loading={totpVerifying}>
                      🔐 Enable 2FA
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      <UserModal
        user={editUser} isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        onSaved={() => { setEditUser(null); loadUsers(); }}
        token={token}
      />
      <UserModal
        user={null} isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSaved={() => { setShowAddUser(false); loadUsers(); }}
        token={token}
      />
    </div>
  );
}
