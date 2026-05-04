"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const T = {
  emerald: "#0F3D2E",
  emeraldMid: "#1A5340",
  emeraldLight: "#2D7A5F",
  emeraldDeep: "#0A2C20",
  gold: "#D4A574",
  goldLight: "#E8C895",
  goldDark: "#B08550",
  cream: "#FAF6F0",
  ivory: "#FFFBF5",
  textMuted: "#7A9E8E",
  textDim: "#5C7868",
  border: "#1F4A38",
};

const NAV_ITEMS = [
  { href: "/pos", label: "POS", icon: "🖥️", exact: true },
  { href: "/pos/tables", label: "Tables", icon: "🪑" },
  { href: "/pos/orders", label: "Orders", icon: "📋" },
  { href: "/pos/menu", label: "Menu", icon: "📖" },
  { href: "/pos/promotions", label: "Promos", icon: "🎁" },
  { href: "/pos/inventory", label: "Stock", icon: "📦" },
  { href: "/pos/dues", label: "Dues", icon: "📒" },
  { href: "/pos/requests", label: "Requests", icon: "🔔" },
  { href: "/pos/feedback", label: "Feedback", icon: "⭐" },
  { href: "/pos/crm", label: "CRM", icon: "👥" },
  { href: "/pos/analytics", label: "Reports", icon: "📊" },
  { href: "/kds", label: "Kitchen", icon: "👨‍🍳" },
  { href: "/pos/cancellation-logs", icon: "🚫", label: "Cancelled" },
{ href: "/pos/settings", icon: "⚙️", label: "Settings" },
{ href: "/pos/waiter-performance", icon: "👥", label: "Waiters" },
{ href: "/pos/aggregator", icon: "🛵", label: "Swiggy/Zomato" },
];

export default function POSSidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: "64px", background: T.emeraldDeep,
      display: "flex", flexDirection: "column",
      position: "fixed", top: 0, left: 0, height: "100vh",
      zIndex: 40, borderRight: `1px solid ${T.border}`,
      boxShadow: "4px 0 20px rgba(15,61,46,0.3)",
    }}>
      <div style={{ padding: "12px 0", display: "flex", justifyContent: "center", borderBottom: `1px solid ${T.border}` }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "12px",
          overflow: "hidden",
          boxShadow: `0 4px 12px rgba(212,165,116,0.3)`,
          background: T.emerald,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Image
            src="/logo-small.png"
            alt="Golden Beans"
            width={48}
            height={48}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 6px", display: "flex", flexDirection: "column", gap: "3px" }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "8px 4px", borderRadius: "10px", gap: "3px",
                background: isActive ? `rgba(212,165,116,0.18)` : "transparent",
                border: `1.5px solid ${isActive ? T.gold : "transparent"}`,
                transition: "all 0.2s ease", cursor: "pointer",
                boxShadow: isActive ? `0 4px 12px rgba(212,165,116,0.2)` : "none",
              }}>
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                <span style={{ fontSize: "8px", fontWeight: 800, color: isActive ? T.gold : T.textDim, letterSpacing: "0.3px" }}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "10px 8px", borderTop: `1px solid ${T.border}`, textAlign: "center" }}>
        <p style={{ fontSize: "8px", color: T.textDim, fontWeight: 700, margin: 0 }}>
          {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </p>
      </div>
    </aside>
  );
}
