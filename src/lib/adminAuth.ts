export interface AdminPermissions {
  menu: { view: boolean; edit: boolean; delete: boolean };
  orders: { view: boolean; edit: boolean; settle: boolean };
  tables: { view: boolean; edit: boolean; delete: boolean };
  inventory: { view: boolean; edit: boolean; delete: boolean };
  reports: { view: boolean };
  promotions: { view: boolean; edit: boolean; delete: boolean };
  dues: { view: boolean; edit: boolean; settle: boolean };
  admin: { view: boolean; edit: boolean };
}

export interface AdminSession {
  token: string;
  name: string;
  username: string;
  role: "admin" | "manager" | "cashier";
  permissions: AdminPermissions;
  expiresAt: number;
  totpVerifiedAt: number;
  sessionDuration: number;
}

const SESSION_KEY = "gb_admin_session";

export function getAdminSession(): AdminSession | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch { return null; }
}

export function saveAdminSession(session: AdminSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Also keep old keys for backward compat
  localStorage.setItem("gb_admin_token", session.token);
  localStorage.setItem("gb_admin_user", JSON.stringify({
    name: session.name,
    username: session.username,
    role: session.role,
    permissions: session.permissions,
    sessionDuration: session.sessionDuration,
    expiresAt: session.expiresAt,
  }));
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("gb_admin_token");
  localStorage.removeItem("gb_admin_user");
}

export function hasPermission(
  session: AdminSession | null,
  permission: keyof AdminPermissions,
  action: string
): boolean {
  if (!session) return true; // no session = show all (backward compat)
  if (session.role === "admin") return true;
  const perm = session.permissions?.[permission] as any;
  if (!perm) return false;
  return !!perm[action];
}

export function needsTOTPReVerify(session: AdminSession | null): boolean {
  if (!session) return false;
  if (!session.totpVerifiedAt) return false;
  const shiftMs = (session.sessionDuration || 8) * 60 * 60 * 1000;
  return Date.now() > session.totpVerifiedAt + shiftMs;
}
