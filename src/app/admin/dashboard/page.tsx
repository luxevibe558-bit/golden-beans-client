"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icons, Button, Pill, StatCard } from "@/components/PremiumUI";
import { getAdminSession, needsTOTPReVerify, saveAdminSession } from "@/lib/adminAuth";

const T = {
  emerald: "#0F3D2E", emeraldMid: "#1A5340", emeraldDeep: "#0A2C20",
  gold: "#D4A574", goldLight: "#E8C895", goldDark: "#B08550",
  cream: "#FAF6F0", creamDark: "#F0E8DA", ivory: "#FFFBF5",
  border: "#E5DCC9", text: "#1A1208", textMuted: "#7A6B54", textDim: "#A89B80",
  success: "#4A8B4A", danger: "#C0392B", info: "#4A7B9B", warning: "#D4A574",
};

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

type AdminTab = "overview" | "users" | "security" | "sessions" | "2fa" | "waiters" | "orders" | "menu" | "inventory" | "analytics" | "promotions" | "crm" | "feedback" | "dues" | "cancellations" | "waiter_perf" | "settings";
type UserRole = "admin" | "manager" | "cashier";

interface AdminUser {
  _id: string; name: string; username: string; role: UserRole;
  permissions: Record<string, Record<string, boolean>>;
  isActive: boolean; lastLogin: string | null;
  sessionDuration: number; totpEnabled: boolean; pin: string;
}

interface SecuritySettings {
  allowedIPs: string[]; cafeLatitude: number; cafeLongitude: number;
  geofenceRadius: number; ipWhitelistEnabled: boolean; geofenceEnabled: boolean;
  cafeName: string; cafeAddress: string; cafePhone: string; wifiName: string;
}

interface AdminSettings {
  requirePinForSettle: boolean; requirePinForDelete: boolean;
  requirePinForEdit: boolean; sessionTimeoutHours: number;
}

const ROLE_CONFIG = {
  admin: { label: "Admin", color: T.gold, bg: T.emerald },
  manager: { label: "Manager", color: T.info, bg: "#e8f1f7" },
  cashier: { label: "Cashier", color: T.success, bg: "#e8f4ed" },
};

const SECTIONS = ["menu", "orders", "tables", "inventory", "reports", "promotions", "dues", "admin"];
const ACTIONS: Record<string, string[]> = {
  menu: ["view", "edit", "delete"], orders: ["view", "edit", "settle"],
  tables: ["view", "edit", "delete"], inventory: ["view", "edit", "delete"],
  reports: ["view"], promotions: ["view", "edit", "delete"],
  dues: ["view", "edit", "settle"], admin: ["view", "edit"],
};

function authHeaders(token: string) {
  return { "Content-Type": "application/json", "x-admin-token": token };
}

// ── TOTP Re-verify Screen ──
function TOTPReVerifyScreen({ onVerified, onLogout }: { onVerified: () => void; onLogout: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) { setError("6-digit code required"); return; }
    setLoading(true);
    setError("");
    try {
      const session = getAdminSession();
      if (!session) { onLogout(); return; }
      const res = await fetch(`${API}/admin-auth/verify-totp`, {
        method: "POST",
        headers: authHeaders(session.token),
        body: JSON.stringify({ totpToken: code }),
      }).then(r => r.json());

      if (res.success) {
        saveAdminSession({ ...session, totpVerifiedAt: Date.now() });
        onVerified();
      } else {
        setError("Invalid code — try again");
      }
    } catch {
      setError("Connection failed");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${T.emerald} 0%, ${T.emeraldMid} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: T.ivory, borderRadius: "24px", padding: "36px", width: "100%", maxWidth: "360px", boxShadow: "0 32px 64px rgba(0,0,0,0.4)", textAlign: "center" }}>
        <div style={{ height: "4px", background: `linear-gradient(90deg, ${T.gold}, ${T.goldLight}, ${T.gold})`, borderRadius: "4px 4px 0 0", margin: "-36px -36px 28px" }} />
        <p style={{ fontSize: "52px", margin: "0 0 16px" }}>🔐</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 800, color: T.emerald, margin: "0 0 8px" }}>
          Shift Ended
        </h2>
        <p style={{ fontSize: "13px", color: T.textMuted, margin: "0 0 24px", fontWeight: 600, lineHeight: 1.6 }}>
          Your session duration has ended.<br />Enter TOTP code to continue.
        </p>

        <input
          value={code}
          onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          placeholder="000000"
          maxLength={6}
          onKeyDown={e => e.key === "Enter" && handleVerify()}
          style={{
            width: "100%", padding: "16px", borderRadius: "14px",
            border: `2px solid ${error ? T.danger : T.border}`,
            background: T.cream, fontSize: "28px", fontWeight: 900,
            color: T.emerald, textAlign: "center", letterSpacing: "10px",
            outline: "none", boxSizing: "border-box", marginBottom: "12px",
            fontFamily: "'DM Sans', sans-serif",
          }}
        />

        {error && (
          <p style={{ fontSize: "12px", color: T.danger, fontWeight: 700, margin: "0 0 12px" }}>⚠ {error}</p>
        )}

        <button onClick={handleVerify} disabled={loading || code.length !== 6}
          style={{
            width: "100%", padding: "14px", borderRadius: "14px", border: "none",
            background: code.length === 6 ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.creamDark,
            color: code.length === 6 ? T.gold : T.textDim,
            fontWeight: 900, fontSize: "15px", cursor: code.length === 6 ? "pointer" : "not-allowed",
            boxShadow: code.length === 6 ? "0 8px 24px rgba(15,61,46,0.3)" : "none",
            marginBottom: "12px", fontFamily: "inherit",
          }}>
          {loading ? "Verifying..." : "✓ Verify & Continue"}
        </button>

        <button onClick={onLogout}
          style={{ background: "none", border: "none", color: T.textMuted, fontSize: "12px", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit", fontWeight: 600 }}>
          Sign out instead
        </button>
      </div>
    </div>
  );
}

// ── Admin Sidebar ──
function AdminSidebar({ activeTab, onTabChange, user, onLogout }: {
  activeTab: AdminTab; onTabChange: (t: AdminTab) => void;
  user: AdminUser | null; onLogout: () => void;
}) {
  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "sessions", label: "Sessions", icon: "⏱️" },
    { id: "2fa", label: "2FA Setup", icon: "🔐" },
    { id: "waiters", label: "Waiters", icon: "🧑‍🍳" },
    { id: "orders", label: "Orders", icon: "📋" },
    { id: "menu", label: "Menu", icon: "📖" },
    { id: "inventory", label: "Inventory", icon: "📦" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "promotions", label: "Promos", icon: "🎁" },
    { id: "crm", label: "CRM", icon: "👥" },
    { id: "feedback", label: "Feedback", icon: "⭐" },
    { id: "dues", label: "Dues", icon: "📒" },
    { id: "cancellations", label: "Cancelled", icon: "🚫" },
    { id: "waiter_perf", label: "Performance", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div style={{ width: "200px", background: T.emeraldDeep, display: "flex", flexDirection: "column", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 40, borderRight: "1px solid rgba(212,165,116,0.1)", boxShadow: "4px 0 20px rgba(0,0,0,0.2)" }}>
      <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(212,165,116,0.1)", display: "flex", alignItems: "center", gap: "10px" }}>
        <img src="/logo-small.png" alt="GB" draggable={false} style={{ width: "36px", height: "36px", borderRadius: "8px", pointerEvents: "none" }} />
        <div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 800, color: T.gold, margin: 0 }}>Admin</p>
          <p style={{ fontSize: "9px", color: "rgba(212,165,116,0.6)", margin: 0, fontWeight: 600 }}>Golden Beans</p>
        </div>
      </div>

      {user && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(212,165,116,0.08)" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald, fontWeight: 800, fontSize: "14px", margin: "0 0 8px" }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <p style={{ fontWeight: 800, fontSize: "12px", color: T.gold, margin: "0 0 2px" }}>{user.name}</p>
          <div style={{ display: "inline-block", background: ROLE_CONFIG[user.role].bg, color: ROLE_CONFIG[user.role].color, padding: "2px 8px", borderRadius: "99px", fontSize: "9px", fontWeight: 800, letterSpacing: "0.05em" }}>
            {ROLE_CONFIG[user.role].label.toUpperCase()}
          </div>
        </div>
      )}

      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{
            width: "100%", padding: "10px 12px", borderRadius: "10px", marginBottom: "3px",
            background: activeTab === tab.id ? "rgba(212,165,116,0.15)" : "transparent",
            border: `1.5px solid ${activeTab === tab.id ? "rgba(212,165,116,0.3)" : "transparent"}`,
            color: activeTab === tab.id ? T.gold : "rgba(212,165,116,0.55)",
            fontWeight: 700, fontSize: "12px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "10px", textAlign: "left", transition: "all 150ms ease",
          }}>
            <span style={{ fontSize: "16px" }}>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(212,165,116,0.08)" }}>
        <button onClick={onLogout} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.2)", color: "#f87171", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <Icons.Close size={12} /> Logout
        </button>
      </div>
    </div>
  );
}

// ── User Card ──
function UserCard({ user, onEdit, onDelete, onToggle }: { user: AdminUser; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  const config = ROLE_CONFIG[user.role];
  return (
    <div style={{ background: T.ivory, borderRadius: "16px", padding: "16px", border: `1.5px solid ${T.border}`, opacity: user.isActive ? 1 : 0.6 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `linear-gradient(135deg, ${config.bg === T.emerald ? T.emerald : config.color}, ${config.bg === T.emerald ? T.emeraldMid : config.color + "aa"})`, display: "flex", alignItems: "center", justifyContent: "center", color: config.bg === T.emerald ? T.gold : "white", fontWeight: 800, fontSize: "18px", flexShrink: 0 }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 800, color: T.emerald, margin: "0 0 4px" }}>{user.name}</p>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 700 }}>@{user.username}</span>
            <div style={{ background: config.bg === T.emerald ? T.emerald : "#f0f0f0", color: config.bg === T.emerald ? T.gold : config.color, padding: "2px 8px", borderRadius: "99px", fontSize: "9px", fontWeight: 800 }}>
              {config.label.toUpperCase()}
            </div>
          </div>
        </div>
        <Pill variant={user.isActive ? "success" : "danger"} size="sm">{user.isActive ? "Active" : "Disabled"}</Pill>
      </div>

      <div style={{ background: T.cream, borderRadius: "10px", padding: "10px 12px", marginBottom: "12px", border: `1px dashed ${T.creamDark}` }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600 }}>⏱️ {user.sessionDuration}hr session</span>
          <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600 }}>🔐 2FA: {user.totpEnabled ? "✅" : "❌"}</span>
          <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600 }}>📅 {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("en-IN") : "Never"}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px" }}>
        <Button size="sm" variant="primary" icon={<Icons.Edit size={11} />} onClick={onEdit} fullWidth>Edit</Button>
        <button onClick={onToggle} style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${T.border}`, background: user.isActive ? T.cream : T.success, color: user.isActive ? T.textMuted : "white", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>
          {user.isActive ? "Disable" : "Enable"}
        </button>
        <button onClick={onDelete} style={{ width: "36px", height: "36px", borderRadius: "8px", background: "white", border: `1px solid ${T.border}`, color: T.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icons.Trash size={13} />
        </button>
      </div>
    </div>
  );
}

// ── User Modal ──
function UserModal({ user, isOpen, onClose, onSaved, token }: { user: AdminUser | null; isOpen: boolean; onClose: () => void; onSaved: () => void; token: string }) {
  const isNew = !user;
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("cashier");
  const [pin, setPin] = useState("1234");
  const [sessionDuration, setSessionDuration] = useState("8");
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
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
      // Show TOTP QR if new user
      if (isNew && data.totpSetup) {
        const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.totpSetup.qrUrl)}`;
        alert(`✅ User created!\n\n🔐 TOTP Setup Required:\nSecret: ${data.totpSetup.secret}\n\nQR Code: ${qr}\n\nShare this with ${name} to setup Google Authenticator.`);
      }
      onSaved();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,61,46,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(8px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.ivory, borderRadius: "20px", maxWidth: "520px", width: "100%", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 64px rgba(15,61,46,0.2)" }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})` }} />
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>{isNew ? "Create User" : "Edit User"}</h2>
          <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "50%", background: T.cream, border: `1px solid ${T.border}`, color: T.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Close size={14} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            {[
              { label: "Name *", value: name, setter: setName, placeholder: "Full Name", disabled: false },
              { label: "Username *", value: username, setter: setUsername, placeholder: "username", disabled: !isNew },
              { label: `Password${!isNew ? " (blank = keep)" : " *"}`, value: password, setter: setPassword, placeholder: isNew ? "Required" : "New password...", disabled: false },
              { label: "PIN (4 digits)", value: pin, setter: setPin, placeholder: "1234", disabled: false },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</label>
                <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} disabled={f.disabled} type={f.label.includes("Password") ? "password" : "text"}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: f.disabled ? T.creamDark : T.cream, fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box", opacity: f.disabled ? 0.7 : 1 }} />
              </div>
            ))}
          </div>

          {/* Role */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {(["admin", "manager", "cashier"] as UserRole[]).map(r => (
                <button key={r} onClick={() => setRole(r)} style={{ padding: "10px", borderRadius: "10px", background: role === r ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.cream, color: role === r ? T.gold : T.text, border: `2px solid ${role === r ? T.emerald : T.border}`, fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
                  {ROLE_CONFIG[r].label}
                </button>
              ))}
            </div>
          </div>

          {/* Session Duration */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Session Duration (TOTP re-verify after this)</label>
            <div style={{ display: "flex", gap: "6px" }}>
              {["2", "4", "8", "12", "24"].map(h => (
                <button key={h} onClick={() => setSessionDuration(h)} style={{ flex: 1, padding: "8px 4px", background: sessionDuration === h ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.cream, color: sessionDuration === h ? T.gold : T.textMuted, border: `1.5px solid ${sessionDuration === h ? T.emerald : T.border}`, borderRadius: "8px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Permissions</label>
            <div style={{ background: T.cream, borderRadius: "12px", overflow: "hidden", border: `1px solid ${T.border}` }}>
              {SECTIONS.map((section, si) => (
                <div key={section} style={{ padding: "10px 14px", borderBottom: si < SECTIONS.length - 1 ? `1px solid ${T.creamDark}` : "none", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: T.text, minWidth: "80px", textTransform: "capitalize" }}>{section}</span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {ACTIONS[section].map(action => {
                      const isEnabled = permissions[section]?.[action] ?? false;
                      return (
                        <button key={action} onClick={() => setPermissions(prev => ({ ...prev, [section]: { ...(prev[section] || {}), [action]: !isEnabled } }))}
                          style={{ padding: "4px 10px", borderRadius: "6px", background: isEnabled ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.ivory, color: isEnabled ? T.gold : T.textDim, border: `1px solid ${isEnabled ? T.emerald : T.border}`, fontWeight: 700, fontSize: "10px", cursor: "pointer", textTransform: "capitalize" }}>
                          {action}
                        </button>
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
            <Button variant="primary" fullWidth onClick={handleSave} loading={saving}>{isNew ? "Create User" : "Save Changes"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ──
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
  const [needsReVerify, setNeedsReVerify] = useState(false);

  // ── TOTP Re-verify check ──
  useEffect(() => {
    const session = getAdminSession();
    if (session && needsTOTPReVerify(session)) {
      setNeedsReVerify(true);
    }
  }, []);

  // ── Auto-logout after 5 min inactivity ──
  useEffect(() => {
    const TIMEOUT = 5 * 60 * 1000;
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("gb_admin_token");
        localStorage.removeItem("gb_admin_user");
        localStorage.removeItem("gb_admin_session");
        router.replace("/admin");
      }, TIMEOUT);
    };
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, resetTimer)); };
  }, [router]);

  useEffect(() => {
    const t = localStorage.getItem("gb_admin_token");
    const u = localStorage.getItem("gb_admin_user");
    if (!t) { router.replace("/admin"); return; }
    setToken(t);
    if (u) { try { setCurrentUser(JSON.parse(u)); } catch { } }
    fetch(`${API}/admin-auth/verify`, { headers: { "x-admin-token": t } })
      .then(r => r.json())
      .then(d => { if (!d.success) router.replace("/admin"); })
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
    loadUsers(); loadSecuritySettings(); loadAdminSettings();
  }, [token, loadUsers, loadSecuritySettings, loadAdminSettings]);

  useEffect(() => {
    if (activeTab === "2fa" && token) loadTotpData();
  }, [activeTab, token, loadTotpData]);

  const handleLogout = async () => {
    await fetch(`${API}/admin-auth/logout`, { method: "POST", headers: authHeaders(token) });
    localStorage.removeItem("gb_admin_token");
    localStorage.removeItem("gb_admin_user");
    localStorage.removeItem("gb_admin_session");
    router.replace("/admin");
  };

  const handleToggleUser = async (user: AdminUser) => {
    try {
      await fetch(`${API}/admin-auth/users/${user._id}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ isActive: !user.isActive }) });
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
      await fetch(`${API}/security/settings`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(securitySettings) });
      alert("✅ Security settings saved!");
    } catch { alert("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleSaveAdminSettings = async () => {
    if (!adminSettings) return;
    setSaving(true);
    try {
      await fetch(`${API}/admin-auth/settings`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(adminSettings) });
      alert("✅ Settings saved!");
    } catch { alert("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleEnable2FA = async () => {
    if (!totpVerifyCode || totpVerifyCode.length !== 6) { alert("Enter 6-digit code"); return; }
    setTotpVerifying(true);
    try {
      const res = await fetch(`${API}/admin-auth/enable-2fa`, { method: "POST", headers: authHeaders(token), body: JSON.stringify({ totpToken: totpVerifyCode }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      alert("🎉 2FA enabled!");
      setTotpVerifyCode("");
      loadTotpData();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setTotpVerifying(false); }
  };

  const handleForceLogoutAll = async () => {
    if (!confirm("Force logout ALL admin sessions?")) return;
    try { await fetch(`${API}/admin-auth/logout-all`, { method: "POST", headers: authHeaders(token) }); alert("✅ All sessions cleared!"); } catch { }
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

  // ── TOTP Re-verify Screen ──
  if (needsReVerify) {
    return <TOTPReVerifyScreen onVerified={() => setNeedsReVerify(false)} onLogout={handleLogout} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: T.cream, display: "flex" }}>
      <style>{`
        @keyframes gb-fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} user={currentUser} onLogout={handleLogout} />

      <div style={{ flex: 1, marginLeft: "200px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: "16px 24px", boxShadow: "0 1px 2px rgba(15,61,46,0.04)" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 800, color: T.emerald, margin: 0 }}>
            {activeTab === "overview" && "🏠 Overview"}
            {activeTab === "users" && "👥 User Management"}
            {activeTab === "security" && "🔒 Security Settings"}
            {activeTab === "sessions" && "⏱️ Session & PIN Settings"}
            {activeTab === "2fa" && "🔐 Two-Factor Authentication"}
            {activeTab === "waiters" && "🧑‍🍳 Waiter Management"}
          </h1>
        </header>

        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ animation: "gb-fadeInUp 0.3s ease both" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                <StatCard label="Total Users" value={users.length} icon={<Icons.Users size={18} />} variant="default" subtitle={`${users.filter(u => u.isActive).length} active`} />
                <StatCard label="Admin Users" value={users.filter(u => u.role === "admin").length} icon={<Icons.Sparkle size={18} />} variant="gold" />
                <StatCard label="2FA Enabled" value={users.filter(u => u.totpEnabled).length} icon={<Icons.Check size={18} />} variant="success" />
                <StatCard label="Security" value={securitySettings?.ipWhitelistEnabled && securitySettings?.geofenceEnabled ? "Full" : "Partial"} icon={<Icons.Location size={18} />} variant="info" subtitle="IP + GPS" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ background: T.ivory, borderRadius: "16px", padding: "16px", border: `1px solid ${T.border}` }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: "0 0 12px" }}>Security Status</h3>
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
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", color: T.gold, fontWeight: 800, fontSize: "12px" }}>{u.name.charAt(0)}</div>
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

          {/* USERS */}
          {activeTab === "users" && (
            <div style={{ animation: "gb-fadeInUp 0.3s ease both" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <Button variant="primary" icon={<Icons.Plus size={14} />} onClick={() => setShowAddUser(true)}>New User</Button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                {users.map(u => (
                  <UserCard key={u._id} user={u} onEdit={() => setEditUser(u)} onDelete={() => handleDeleteUser(u)} onToggle={() => handleToggleUser(u)} />
                ))}
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === "security" && securitySettings && (
            <div style={{ animation: "gb-fadeInUp 0.3s ease both", maxWidth: "600px" }}>
              <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: 0 }}>📡 IP Whitelist</h3>
                  <button onClick={() => setSecuritySettings({ ...securitySettings, ipWhitelistEnabled: !securitySettings.ipWhitelistEnabled })}
                    style={{ padding: "8px 16px", borderRadius: "99px", border: "none", cursor: "pointer", background: securitySettings.ipWhitelistEnabled ? T.success : T.danger, color: "white", fontWeight: 800, fontSize: "12px" }}>
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
                  <input type="text" placeholder="Add IP (e.g. 103.251.59.114)" value={newIp} onChange={e => setNewIp(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddIp()}
                    style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.cream, fontSize: "14px", fontWeight: 600, outline: "none" }} />
                  <Button size="sm" variant="primary" onClick={handleAddIp} icon={<Icons.Plus size={12} />}>Add</Button>
                </div>
              </div>

              <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: 0 }}>📍 GPS Geofence</h3>
                  <button onClick={() => setSecuritySettings({ ...securitySettings, geofenceEnabled: !securitySettings.geofenceEnabled })}
                    style={{ padding: "8px 16px", borderRadius: "99px", border: "none", cursor: "pointer", background: securitySettings.geofenceEnabled ? T.success : T.danger, color: "white", fontWeight: 800, fontSize: "12px" }}>
                    {securitySettings.geofenceEnabled ? "✅ Enabled" : "❌ Disabled"}
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {[
                    { label: "Latitude", key: "cafeLatitude", val: securitySettings.cafeLatitude },
                    { label: "Longitude", key: "cafeLongitude", val: securitySettings.cafeLongitude },
                    { label: "Radius (m)", key: "geofenceRadius", val: securitySettings.geofenceRadius },
                  ].map(field => (
                    <div key={field.key}>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "5px", textTransform: "uppercase" }}>{field.label}</label>
                      <input type="number" value={field.val} onChange={e => setSecuritySettings({ ...securitySettings, [field.key]: parseFloat(e.target.value) })}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.cream, fontSize: "13px", fontWeight: 700, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: "0 0 14px" }}>☕ Cafe Info</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[{ label: "WiFi Name", key: "wifiName" }, { label: "Cafe Name", key: "cafeName" }, { label: "Address", key: "cafeAddress" }, { label: "Phone", key: "cafePhone" }].map(field => (
                    <div key={field.key}>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "5px", textTransform: "uppercase" }}>{field.label}</label>
                      <input type="text" value={(securitySettings as unknown as Record<string, string>)[field.key]} onChange={e => setSecuritySettings({ ...securitySettings, [field.key]: e.target.value })}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.cream, fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
              </div>
              <Button variant="primary" fullWidth size="lg" onClick={handleSaveSecuritySettings} loading={saving}>💾 Save Security Settings</Button>
            </div>
          )}

          {/* SESSIONS */}
          {activeTab === "sessions" && adminSettings && (
            <div style={{ animation: "gb-fadeInUp 0.3s ease both", maxWidth: "500px" }}>
              <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: "0 0 14px" }}>⏱️ Session Settings</h3>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "8px", textTransform: "uppercase" }}>Default Session Timeout</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {[2, 4, 8, 12, 24].map(h => (
                      <button key={h} onClick={() => setAdminSettings({ ...adminSettings, sessionTimeoutHours: h })}
                        style={{ flex: 1, padding: "10px 4px", background: adminSettings.sessionTimeoutHours === h ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.cream, color: adminSettings.sessionTimeoutHours === h ? T.gold : T.textMuted, border: `1.5px solid ${adminSettings.sessionTimeoutHours === h ? T.emerald : T.border}`, borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
                        {h}h
                      </button>
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
                    <button onClick={() => setAdminSettings({ ...adminSettings, [item.key]: !(adminSettings as unknown as Record<string, unknown>)[item.key] })}
                      style={{ padding: "6px 14px", borderRadius: "99px", border: "none", cursor: "pointer", background: (adminSettings as unknown as Record<string, unknown>)[item.key] ? T.success : T.creamDark, color: (adminSettings as unknown as Record<string, unknown>)[item.key] ? "white" : T.textMuted, fontWeight: 800, fontSize: "11px" }}>
                      {(adminSettings as unknown as Record<string, unknown>)[item.key] ? "ON" : "OFF"}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Button variant="primary" fullWidth onClick={handleSaveAdminSettings} loading={saving}>💾 Save Settings</Button>
                <Button variant="danger" onClick={handleForceLogoutAll}>🔴 Logout All</Button>
              </div>
            </div>
          )}

          {/* 2FA */}
          {activeTab === "2fa" && (
            <div style={{ animation: "gb-fadeInUp 0.3s ease both", maxWidth: "480px" }}>
              {totpData?.totpEnabled ? (
                <div style={{ background: `linear-gradient(135deg, ${T.success}, #2d6a2d)`, borderRadius: "16px", padding: "24px", textAlign: "center", boxShadow: "0 8px 24px rgba(74,139,74,0.25)" }}>
                  <p style={{ fontSize: "40px", margin: "0 0 12px" }}>🛡️</p>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 800, color: "white", margin: "0 0 8px" }}>2FA is Active!</h3>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", margin: 0, fontWeight: 600 }}>Your account is protected with Google Authenticator.</p>
                </div>
              ) : (
                <>
                  <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: "0 0 14px" }}>Step 1 — Scan QR Code</h3>
                    <p style={{ fontSize: "12px", color: T.textMuted, margin: "0 0 14px", fontWeight: 600, lineHeight: 1.6 }}>Open <strong>Google Authenticator</strong> → Tap <strong>"+"</strong> → <strong>"Scan QR code"</strong></p>
                    {totpData && (
                      <div style={{ background: T.cream, borderRadius: "12px", padding: "16px", border: `1px solid ${T.border}`, textAlign: "center" }}>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpData.qrUrl)}`} alt="TOTP QR" style={{ borderRadius: "8px", width: "180px", height: "180px" }} />
                        <p style={{ fontSize: "11px", color: T.textMuted, margin: "10px 0 0", fontWeight: 600 }}>Manual: <strong style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.1em" }}>{totpData.secret}</strong></p>
                      </div>
                    )}
                  </div>
                  <div style={{ background: T.ivory, borderRadius: "16px", padding: "20px", border: `1px solid ${T.border}` }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: T.emerald, margin: "0 0 14px" }}>Step 2 — Verify Code</h3>
                    <input type="number" placeholder="000000" value={totpVerifyCode} onChange={e => setTotpVerifyCode(e.target.value.slice(0, 6))}
                      style={{ width: "100%", padding: "14px", borderRadius: "12px", border: `2px solid ${T.border}`, background: T.cream, fontSize: "28px", fontWeight: 900, color: T.emerald, textAlign: "center", letterSpacing: "0.2em", outline: "none", boxSizing: "border-box", marginBottom: "12px", fontFamily: "'DM Sans', sans-serif" }} />
                    <Button variant="primary" fullWidth size="lg" onClick={handleEnable2FA} loading={totpVerifying}>🔐 Enable 2FA</Button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "waiters" && <WaitersTab token={token} />}
          {activeTab === "orders" && (
  <iframe src="/pos/orders?embed=true" style={{ width: "100%", height: "calc(100vh - 100px)", border: "none", borderRadius: "12px" }} />
)}
{activeTab === "menu" && (
  <iframe src="/pos/menu?embed=true" style={{ width: "100%", height: "calc(100vh - 100px)", border: "none", borderRadius: "12px" }} />
)}
{activeTab === "inventory" && (
  <iframe src="/pos/inventory?embed=true" style={{ width: "100%", height: "calc(100vh - 100px)", border: "none", borderRadius: "12px" }} />
)}
{activeTab === "analytics" && (
  <div style={{ marginLeft: "-24px", marginRight: "-24px", marginTop: "-24px", height: "calc(100vh - 65px)", overflow: "hidden" }}>
    <iframe src="/pos/analytics?embed=true" style={{ width: "100%", height: "100%", border: "none" }} />
  </div>
)}
{activeTab === "promotions" && (
  <iframe src="/pos/promotions?embed=true" style={{ width: "100%", height: "calc(100vh - 100px)", border: "none", borderRadius: "12px" }} />
)}
{activeTab === "crm" && (
  <iframe src="/pos/crm?embed=true" style={{ width: "100%", height: "calc(100vh - 100px)", border: "none", borderRadius: "12px" }} />
)}
{activeTab === "feedback" && (
  <iframe src="/pos/feedback?embed=true" style={{ width: "100%", height: "calc(100vh - 100px)", border: "none", borderRadius: "12px" }} />
)}
{activeTab === "dues" && (
  <iframe src="/pos/dues?embed=true" style={{ width: "100%", height: "calc(100vh - 100px)", border: "none", borderRadius: "12px" }} />
)}
{activeTab === "cancellations" && (
  <iframe src="/pos/cancellation-logs?embed=true" style={{ width: "100%", height: "calc(100vh - 100px)", border: "none", borderRadius: "12px" }} />
)}
{activeTab === "waiter_perf" && (
  <iframe src="/pos/waiter-performance?embed=true" style={{ width: "100%", height: "calc(100vh - 100px)", border: "none", borderRadius: "12px" }} />
)}
{activeTab === "settings" && (
  <iframe src="/pos/settings?embed=true" style={{ width: "100%", height: "calc(100vh - 100px)", border: "none", borderRadius: "12px" }} />
)}
        </main>
      </div>

      <UserModal user={editUser} isOpen={!!editUser} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); loadUsers(); }} token={token} />
      <UserModal user={null} isOpen={showAddUser} onClose={() => setShowAddUser(false)} onSaved={() => { setShowAddUser(false); loadUsers(); }} token={token} />
    </div>
  );
}

// ── Waiters Tab ──
function WaitersTab({ token: _token }: { token: string }) {
  const [waiters, setWaiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editWaiter, setEditWaiter] = useState<any | null>(null);
  const [rushMode, setRushMode] = useState(false);
  const [rushWaiterId, setRushWaiterId] = useState("");
  const [rushLoading, setRushLoading] = useState(false);

  const loadWaiters = useCallback(async () => {
    try {
      const res = await fetch(`${API}/waiter/list`);
      const data = await res.json();
      if (data.waiters) setWaiters(data.waiters);
    } catch { } finally { setLoading(false); }
  }, []);

  const loadRushMode = useCallback(async () => {
    try {
      const res = await fetch(`${API}/waiter/rush-mode`);
      const data = await res.json();
      if (data.rush) { setRushMode(data.rush.isActive); setRushWaiterId(data.rush.assignedWaiterId || ""); }
    } catch { }
  }, []);

  useEffect(() => { loadWaiters(); loadRushMode(); }, [loadWaiters, loadRushMode]);

  const toggleRushMode = async () => {
    setRushLoading(true);
    try {
      await fetch(`${API}/waiter/rush-mode`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !rushMode, waiterId: rushWaiterId || null }) });
      setRushMode(!rushMode);
    } catch { }
    setRushLoading(false);
  };

  const toggleShift = async (id: string, current: boolean) => {
    try { await fetch(`${API}/waiter/update/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentShift: !current }) }); loadWaiters(); } catch { }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try { await fetch(`${API}/waiter/update/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !current }) }); loadWaiters(); } catch { }
  };

  return (
    <div style={{ animation: "gb-fadeInUp 0.3s ease both", maxWidth: "800px" }}>
      {/* Rush Mode */}
      <div style={{ background: rushMode ? `linear-gradient(135deg, ${T.danger}, #a93226)` : T.ivory, borderRadius: "16px", padding: "20px", marginBottom: "20px", border: `1px solid ${rushMode ? T.danger : T.border}`, boxShadow: rushMode ? "0 8px 24px rgba(192,57,43,0.25)" : "none", transition: "all 0.3s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: rushMode ? "white" : T.emerald, margin: "0 0 4px" }}>🚨 Rush Mode</h3>
            <p style={{ fontSize: "12px", color: rushMode ? "rgba(255,255,255,0.8)" : T.textMuted, margin: 0, fontWeight: 600 }}>{rushMode ? "All requests → one waiter" : "Distribute by assignment rules"}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {!rushMode && waiters.filter(w => w.isActive && w.currentShift).length > 0 && (
              <select value={rushWaiterId} onChange={e => setRushWaiterId(e.target.value)} style={{ padding: "8px 12px", borderRadius: "10px", border: `1px solid ${T.border}`, background: T.cream, fontSize: "13px", fontWeight: 700, outline: "none" }}>
                <option value="">Select Waiter</option>
                {waiters.filter(w => w.isActive && w.currentShift).map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            )}
            <button onClick={toggleRushMode} disabled={rushLoading} style={{ padding: "10px 20px", borderRadius: "12px", border: "none", background: rushMode ? "rgba(255,255,255,0.2)" : `linear-gradient(135deg, ${T.danger}, #a93226)`, color: "white", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>
              {rushLoading ? "..." : rushMode ? "✕ Disable" : "🚨 Enable"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>Waiter Profiles</h3>
        <button onClick={() => setShowAdd(true)} style={{ padding: "10px 18px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, fontSize: "13px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(15,61,46,0.25)" }}>
          + Add Waiter
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: T.textMuted, padding: "40px", fontWeight: 700 }}>Loading...</p>
      ) : waiters.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", background: T.ivory, borderRadius: "16px", border: `1px solid ${T.border}` }}>
          <p style={{ fontSize: "40px", margin: "0 0 12px" }}>🧑‍🍳</p>
          <p style={{ fontSize: "16px", fontWeight: 800, color: T.emerald, margin: "0 0 6px", fontFamily: "'Playfair Display', serif" }}>No Waiters Yet</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {waiters.map(w => (
            <div key={w._id} style={{ background: T.ivory, borderRadius: "16px", padding: "18px", border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(15,61,46,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>🧑‍🍳</div>
                  <div>
                    <p style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: T.text }}>{w.name}</p>
                    <p style={{ margin: "3px 0 0", fontSize: "12px", color: T.textMuted, fontWeight: 600 }}>@{w.username} · {w.role === "senior_waiter" ? "⭐ Senior" : "Waiter"}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button onClick={() => toggleShift(w._id, w.currentShift)} style={{ padding: "5px 12px", borderRadius: "8px", border: `1px solid ${w.currentShift ? "#BBF7D0" : T.border}`, background: w.currentShift ? "#E8F5E9" : T.cream, color: w.currentShift ? T.success : T.textMuted, fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>
                    {w.currentShift ? "🟢 On Shift" : "⚪ Off Shift"}
                  </button>
                  <button onClick={() => toggleActive(w._id, w.isActive)} style={{ padding: "5px 12px", borderRadius: "8px", border: `1px solid ${w.isActive ? "#BFDBFE" : "#FECACA"}`, background: w.isActive ? "#EFF6FF" : "#FEF2F2", color: w.isActive ? "#3B82F6" : T.danger, fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>
                    {w.isActive ? "✓ Active" : "✕ Inactive"}
                  </button>
                  <button onClick={() => setEditWaiter(w)} style={{ padding: "5px 12px", borderRadius: "8px", border: `1px solid ${T.border}`, background: T.cream, color: T.emerald, fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>✏️ Edit</button>
                </div>
              </div>
              <div style={{ marginTop: "12px", padding: "10px 12px", background: T.cream, borderRadius: "10px", border: `1px solid ${T.creamDark}`, display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", alignSelf: "center" }}>Rules:</span>
                {w.assignmentRules?.tableRange?.enabled && <span style={{ background: T.ivory, border: `1px solid ${T.border}`, borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: 700, color: T.emerald }}>🪑 {w.assignmentRules.tableRange.from}–{w.assignmentRules.tableRange.to}</span>}
                {w.assignmentRules?.timeSlot?.enabled && <span style={{ background: T.ivory, border: `1px solid ${T.border}`, borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: 700, color: T.emerald }}>⏰ {w.assignmentRules.timeSlot.startHour}:00–{w.assignmentRules.timeSlot.endHour}:00</span>}
                {!w.assignmentRules?.tableRange?.enabled && !w.assignmentRules?.timeSlot?.enabled && <span style={{ fontSize: "11px", color: T.textDim, fontWeight: 600 }}>No rules — default assignment</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {(showAdd || editWaiter) && (
        <WaiterModal waiter={editWaiter} onClose={() => { setShowAdd(false); setEditWaiter(null); }} onSaved={() => { setShowAdd(false); setEditWaiter(null); loadWaiters(); }} API={API} />
      )}
    </div>
  );
}

// ── Waiter Modal ──
function WaiterModal({ waiter, onClose, onSaved, API: waiterAPI }: { waiter: any; onClose: () => void; onSaved: () => void; API: string }) {
  const isEdit = !!waiter;
  const [name, setName] = useState(waiter?.name || "");
  const [username, setUsername] = useState(waiter?.username || "");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState(waiter?.role || "waiter");
  const [tableRangeEnabled, setTableRangeEnabled] = useState(waiter?.assignmentRules?.tableRange?.enabled || false);
  const [tableFrom, setTableFrom] = useState(waiter?.assignmentRules?.tableRange?.from || "");
  const [tableTo, setTableTo] = useState(waiter?.assignmentRules?.tableRange?.to || "");
  const [timeSlotEnabled, setTimeSlotEnabled] = useState(waiter?.assignmentRules?.timeSlot?.enabled || false);
  const [startHour, setStartHour] = useState(waiter?.assignmentRules?.timeSlot?.startHour || 9);
  const [endHour, setEndHour] = useState(waiter?.assignmentRules?.timeSlot?.endHour || 17);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totpData, setTotpData] = useState<{ totpUri: string; totpSecret: string } | null>(null);

  const handleSave = async () => {
    if (!name || !username) return setError("Name and Username required");
    if (!isEdit && (!pin || pin.length !== 4)) return setError("4-digit PIN required");
    setLoading(true); setError("");
    try {
      const assignmentRules = {
        tableRange: { enabled: tableRangeEnabled, from: tableFrom, to: tableTo },
        timeSlot: { enabled: timeSlotEnabled, startHour: Number(startHour), endHour: Number(endHour) },
      };
      if (isEdit) {
        await fetch(`${waiterAPI}/waiter/update/${waiter._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, role, assignmentRules }) });
        onSaved();
      } else {
        const res = await fetch(`${waiterAPI}/waiter/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, username, pin, role }) });
        const data = await res.json();
        if (data.success) {
          setTotpData({ totpUri: data.totpUri, totpSecret: data.totpSecret });
          await fetch(`${waiterAPI}/waiter/update/${data.waiter.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignmentRules }) });
        } else { setError(data.error || "Error"); }
      }
    } catch { setError("Server error"); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: T.ivory, borderRadius: "24px", padding: "28px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
        {totpData ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "48px", margin: "0 0 12px" }}>🎉</p>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 800, color: T.emerald, margin: "0 0 6px" }}>Waiter Created!</h3>
            <p style={{ fontSize: "13px", color: T.textMuted, margin: "0 0 24px", fontWeight: 600 }}>Scan in Google Authenticator</p>
            <div style={{ background: T.cream, borderRadius: "16px", padding: "20px", marginBottom: "20px", border: `1px solid ${T.border}`, textAlign: "center" }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpData.totpUri)}`} alt="TOTP QR" style={{ borderRadius: "8px", width: "180px", height: "180px" }} />
              <p style={{ fontSize: "11px", color: T.textMuted, margin: "12px 0 0", fontWeight: 600 }}>Key: <strong style={{ letterSpacing: "0.1em", color: T.emerald }}>{totpData.totpSecret}</strong></p>
            </div>
            <button onClick={onSaved} style={{ width: "100%", padding: "14px", borderRadius: "14px", border: "none", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, fontSize: "15px", fontWeight: 800, cursor: "pointer" }}>Done ✓</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>{isEdit ? "Edit Waiter" : "Add New Waiter"}</h3>
              <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "8px", border: `1px solid ${T.border}`, background: T.cream, cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              {[
                { label: "Full Name", value: name, setter: setName, placeholder: "Rahul Patel", disabled: false },
                { label: "Username", value: username, setter: setUsername, placeholder: "rahul", disabled: isEdit },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: "11px", color: T.textMuted, fontWeight: 700, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</label>
                  <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} disabled={f.disabled}
                    style={{ width: "100%", padding: "11px 13px", borderRadius: "11px", border: `1px solid ${T.border}`, background: f.disabled ? T.creamDark : T.cream, fontSize: "14px", fontWeight: 700, color: T.text, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              {!isEdit && (
                <div>
                  <label style={{ fontSize: "11px", color: T.textMuted, fontWeight: 700, display: "block", marginBottom: "6px", textTransform: "uppercase" }}>4-Digit PIN</label>
                  <input value={pin} onChange={e => setPin(e.target.value.slice(0, 4))} placeholder="••••" type="password" inputMode="numeric"
                    style={{ width: "100%", padding: "11px 13px", borderRadius: "11px", border: `1px solid ${T.border}`, background: T.cream, fontSize: "20px", fontWeight: 900, color: T.emerald, outline: "none", boxSizing: "border-box", letterSpacing: "8px" }} />
                </div>
              )}
              <div>
                <label style={{ fontSize: "11px", color: T.textMuted, fontWeight: 700, display: "block", marginBottom: "6px", textTransform: "uppercase" }}>Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} style={{ width: "100%", padding: "11px 13px", borderRadius: "11px", border: `1px solid ${T.border}`, background: T.cream, fontSize: "14px", fontWeight: 700, color: T.text, outline: "none", boxSizing: "border-box" }}>
                  <option value="waiter">Waiter</option>
                  <option value="senior_waiter">Senior Waiter</option>
                </select>
              </div>
            </div>

            <div style={{ background: T.cream, borderRadius: "14px", padding: "16px", border: `1px solid ${T.border}`, marginBottom: "20px" }}>
              <p style={{ fontSize: "12px", fontWeight: 800, color: T.emerald, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Assignment Rules</p>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: tableRangeEnabled ? "10px" : 0 }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: T.text }}>🪑 Table Range</span>
                  <button onClick={() => setTableRangeEnabled(!tableRangeEnabled)} style={{ padding: "4px 12px", borderRadius: "8px", border: "none", background: tableRangeEnabled ? T.emerald : T.creamDark, color: tableRangeEnabled ? T.gold : T.textMuted, fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>
                    {tableRangeEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                {tableRangeEnabled && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input value={tableFrom} onChange={e => setTableFrom(e.target.value)} placeholder="T01" style={{ flex: 1, padding: "9px", borderRadius: "9px", border: `1px solid ${T.border}`, background: T.ivory, fontSize: "13px", fontWeight: 700, outline: "none", textAlign: "center" }} />
                    <span style={{ alignSelf: "center", color: T.textMuted, fontWeight: 700 }}>to</span>
                    <input value={tableTo} onChange={e => setTableTo(e.target.value)} placeholder="T06" style={{ flex: 1, padding: "9px", borderRadius: "9px", border: `1px solid ${T.border}`, background: T.ivory, fontSize: "13px", fontWeight: 700, outline: "none", textAlign: "center" }} />
                  </div>
                )}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: timeSlotEnabled ? "10px" : 0 }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: T.text }}>⏰ Time Slot</span>
                  <button onClick={() => setTimeSlotEnabled(!timeSlotEnabled)} style={{ padding: "4px 12px", borderRadius: "8px", border: "none", background: timeSlotEnabled ? T.emerald : T.creamDark, color: timeSlotEnabled ? T.gold : T.textMuted, fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>
                    {timeSlotEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                {timeSlotEnabled && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input type="number" value={startHour} onChange={e => setStartHour(Number(e.target.value))} min={0} max={23} style={{ flex: 1, padding: "9px", borderRadius: "9px", border: `1px solid ${T.border}`, background: T.ivory, fontSize: "13px", fontWeight: 700, outline: "none", textAlign: "center" }} />
                    <span style={{ color: T.textMuted, fontWeight: 700 }}>:00 to</span>
                    <input type="number" value={endHour} onChange={e => setEndHour(Number(e.target.value))} min={0} max={23} style={{ flex: 1, padding: "9px", borderRadius: "9px", border: `1px solid ${T.border}`, background: T.ivory, fontSize: "13px", fontWeight: 700, outline: "none", textAlign: "center" }} />
                    <span style={{ color: T.textMuted, fontWeight: 700 }}>:00</span>
                  </div>
                )}
              </div>
            </div>

            {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: T.danger, fontWeight: 700 }}>⚠️ {error}</div>}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={onClose} style={{ flex: 1, padding: "13px", borderRadius: "13px", border: `1px solid ${T.border}`, background: T.cream, color: T.textMuted, fontSize: "14px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={loading} style={{ flex: 2, padding: "13px", borderRadius: "13px", border: "none", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, fontSize: "14px", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 6px 16px rgba(15,61,46,0.25)" }}>
                {loading ? "Saving..." : isEdit ? "✓ Save Changes" : "+ Create Waiter"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
