"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_ITEMS } from "@/lib/navItems";
import { getAdminSession, hasPermission, type AdminSession } from "@/lib/adminAuth";

const T = {
  emerald: "#0F3D2E", emeraldMid: "#1A5340", emeraldLight: "#2D7A5F",
  emeraldDeep: "#0A2C20", gold: "#D4A574", goldLight: "#E8C895",
  goldDark: "#B08550", cream: "#FAF6F0", ivory: "#FFFBF5",
  textMuted: "#7A9E8E", textDim: "#5C7868", border: "#1F4A38",
};

export default function POSSidebar() {
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    const s = getAdminSession();
    setSession(s);
    // Refresh session every 30s
    const iv = setInterval(() => setSession(getAdminSession()), 30000);
    return () => clearInterval(iv);
  }, []);

  const visibleItems = NAV_ITEMS.filter(item => {
    // No session = show all (backward compat)
    if (!session) return true;
    // Admin sees everything
    if (session.role === "admin") return true;
    // adminOnly items hidden for non-admin
    if (item.adminOnly) return false;
    // Permission check
    if (item.permission && item.permissionAction) {
      return hasPermission(session, item.permission, item.permissionAction);
    }
    return true;
  });

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
          overflow: "hidden", boxShadow: "0 4px 12px rgba(212,165,116,0.3)",
          background: T.emerald, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Image src="/logo-small.png" alt="Golden Beans" width={48} height={48} style={{ objectFit: "contain" }} priority />
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 6px", display: "flex", flexDirection: "column", gap: "3px" }}>
        {visibleItems.map(item => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "8px 4px", borderRadius: "10px", gap: "3px",
                background: isActive ? "rgba(212,165,116,0.18)" : "transparent",
                border: `1.5px solid ${isActive ? T.gold : "transparent"}`,
                transition: "all 0.2s ease", cursor: "pointer",
                boxShadow: isActive ? "0 4px 12px rgba(212,165,116,0.2)" : "none",
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

      {/* Session info */}
      <div style={{ padding: "8px 6px", borderTop: `1px solid ${T.border}` }}>
        {session && (
          <div style={{ textAlign: "center", marginBottom: "4px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 3px", fontSize: "12px", fontWeight: 900, color: T.emerald }}>
              {session.name.charAt(0)}
            </div>
            <p style={{ fontSize: "7px", color: T.textDim, fontWeight: 800, margin: 0, textTransform: "uppercase" }}>{session.role}</p>
          </div>
        )}
        <p style={{ fontSize: "8px", color: T.textDim, fontWeight: 700, margin: 0, textAlign: "center" }}>
          {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </p>
      </div>
    </aside>
  );
}