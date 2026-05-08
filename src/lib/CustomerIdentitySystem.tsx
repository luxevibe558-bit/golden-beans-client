// ═══════════════════════════════════════════════════
// CUSTOMER IDENTITY + LOYALTY — CLIENT SIDE
// Replaces: localStorage-based customer storage
// New: Phone-based, server-synced, session-only device storage
// ═══════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  "https://golden-beans-server.onrender.com/api";

// ── Customer data type ──
export interface CustomerProfile {
  _id:         string;
  name:        string;
  phone:       string;
  totalPoints: number;
  totalOrders: number;
  totalSpent:  number;
  tier:        "bronze" | "silver" | "gold" | "platinum";
  visits:      number;
  lastVisit:   string;
  isNewCustomer?: boolean;
  welcomeBonus?:  number;
}

// ── Tier config ──
export const TIER_CONFIG = {
  bronze:   { label:"Bronze",   color:"#CD7F32", min:0,    icon:"🥉", perks:"1 point per ₹10"      },
  silver:   { label:"Silver",   color:"#C0C0C0", min:500,  icon:"🥈", perks:"1.2x points + priority"},
  gold:     { label:"Gold",     color:"#C8922A", min:1000, icon:"🥇", perks:"1.5x points + freebies"},
  platinum: { label:"Platinum", color:"#E5E4E2", min:2000, icon:"💎", perks:"2x points + vip perks" },
};

// ── Session storage key (cleared when tab closes) ──
const SESSION_KEY = "gb_customer_session";

// ── Get current session customer ──
export function getSessionCustomer(): CustomerProfile | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Save to session (not localStorage!) ──
export function setSessionCustomer(c: CustomerProfile) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(c));
}

// ── Clear session (on bill settle / logout) ──
export function clearSessionCustomer() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ── Register / Login by phone ──
export async function registerCustomer(
  name: string,
  phone: string,
  tableId: string
): Promise<CustomerProfile | null> {
  try {
    const res = await fetch(`${API_URL}/customers/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, phone, tableId }),
    });
    const data = await res.json();
    if (data.success) {
      setSessionCustomer(data.data);
      return data.data;
    }
    return null;
  } catch { return null; }
}

// ── Lookup by phone (background check) ──
export async function lookupCustomer(phone: string): Promise<CustomerProfile | null> {
  try {
    const clean = phone.replace(/\D/g, "").slice(-10);
    const res   = await fetch(`${API_URL}/customers/lookup/${clean}`);
    const data  = await res.json();
    if (data.success && data.found) {
      setSessionCustomer(data.data);
      return data.data;
    }
    return null;
  } catch { return null; }
}

// ── Earn points after order ──
export async function earnPoints(
  customerId: string,
  orderId:    string,
  orderAmount: number
): Promise<{ pointsEarned: number; newBalance: number; newTier: string } | null> {
  try {
    const res = await fetch(`${API_URL}/customers/${customerId}/earn`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ orderId, orderAmount }),
    });
    const data = await res.json();
    if (data.success) {
      // Update session with new balance
      const session = getSessionCustomer();
      if (session) {
        setSessionCustomer({
          ...session,
          totalPoints: data.newBalance,
          tier:        data.newTier,
        });
      }
      return {
        pointsEarned: data.pointsEarned,
        newBalance:   data.newBalance,
        newTier:      data.newTier,
      };
    }
    return null;
  } catch { return null; }
}

// ── Redeem points ──
export async function redeemPoints(
  customerId:     string,
  pointsToRedeem: number
): Promise<{ discountAmount: number; newBalance: number } | null> {
  try {
    const res = await fetch(`${API_URL}/customers/${customerId}/redeem`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ pointsToRedeem }),
    });
    const data = await res.json();
    if (data.success) {
      const session = getSessionCustomer();
      if (session) {
        setSessionCustomer({ ...session, totalPoints: data.newBalance });
      }
      return { discountAmount: data.discountAmount, newBalance: data.newBalance };
    }
    return null;
  } catch { return null; }
}

// ── Get full profile + history ──
export async function getCustomerProfile(customerId: string) {
  try {
    const res  = await fetch(`${API_URL}/customers/${customerId}/profile`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

// ── Get favorites from server ──
export async function getFavorites(customerId: string): Promise<string[]> {
  try {
    const res  = await fetch(`${API_URL}/customers/${customerId}/favorites`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch { return []; }
}

// ── Save favorites to server ──
export async function saveFavorites(customerId: string, favorites: string[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/customers/${customerId}/favorites`, {
      method:  "PUT",
      headers: { "Content-Type":"application/json" },
      body:    JSON.stringify({ favorites }),
    });
    const data = await res.json();
    return data.success;
  } catch { return false; }
}

// ── Points display helpers ──
export const pointsToRs = (p: number) => Math.floor(p / 10);
export const rsToPoints = (r: number) => r * 10;

export const formatPoints = (p: number) =>
  p >= 1000 ? `${(p/1000).toFixed(1)}K` : String(p);

export const getNextTier = (tier: string, points: number) => {
  const tiers = ["bronze","silver","gold","platinum"];
  const idx   = tiers.indexOf(tier);
  if (idx === 3) return null; // already platinum
  const next  = tiers[idx + 1] as keyof typeof TIER_CONFIG;
  const needed = TIER_CONFIG[next].min - points;
  return { tier: next, pointsNeeded: needed, ...TIER_CONFIG[next] };
};
