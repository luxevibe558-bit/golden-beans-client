"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BRAND = {
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  goldDark: "#A07830",
  coffee: "#1A0E06",
  coffeeMid: "#2C1A0E",
  coffeeLight: "#4A2C1A",
  coffeeBorder: "#3D2410",
  surface: "#231508",
  text: "#E8D5B0",
  textMuted: "#9A7A5A",
  textDim: "#6A4A2A",
};

const NAV_ITEMS = [
  { href: "/pos", label: "POS", icon: "🖥️", exact: true },
  { href: "/pos/tables", label: "Tables", icon: "🪑" },
  { href: "/pos/orders", label: "Orders", icon: "📋" },
  { href: "/pos/menu", label: "Menu", icon: "📖" },
  { href: "/pos/inventory", label: "Stock", icon: "📦" },
  { href: "/pos/analytics", label: "Reports", icon: "📊" },
  { href: "/kds", label: "Kitchen", icon: "👨‍🍳" },
];

export default function POSSidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: "64px",
      background: BRAND.coffeeMid,
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      top: 0, left: 0,
      height: "100vh",
      zIndex: 40,
      borderRight: `1px solid ${BRAND.coffeeBorder}`,
      boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
    }}>
      {/* Logo */}
      <div style={{ padding: "16px 0", display: "flex", justifyContent: "center", borderBottom: `1px solid ${BRAND.coffeeBorder}` }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "14px",
          background: `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px", boxShadow: `0 4px 12px rgba(201,168,76,0.4)`,
        }}>☕</div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "10px 4px", borderRadius: "14px", gap: "4px",
                background: isActive ? `rgba(201,168,76,0.2)` : "transparent",
                border: `1.5px solid ${isActive ? BRAND.gold : "transparent"}`,
                transition: "all 0.2s ease",
                cursor: "pointer",
                boxShadow: isActive ? `0 4px 12px rgba(201,168,76,0.2)` : "none",
              }}>
                <span style={{ fontSize: "20px" }}>{item.icon}</span>
                <span style={{ fontSize: "9px", fontWeight: 800, color: isActive ? BRAND.gold : BRAND.textDim, letterSpacing: "0.3px", fontFamily: "'Nunito', sans-serif" }}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 8px", borderTop: `1px solid ${BRAND.coffeeBorder}`, textAlign: "center" }}>
        <p style={{ fontSize: "8px", color: BRAND.textDim, fontWeight: 700, margin: 0, letterSpacing: "0.5px" }}>
          {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </p>
      </div>
    </aside>
  );
}
