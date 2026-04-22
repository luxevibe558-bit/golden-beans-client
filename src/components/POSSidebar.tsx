"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/pos", label: "POS", icon: "🖥️", exact: true },
  { href: "/pos/tables", label: "Tables", icon: "🪑" },
  { href: "/pos/orders", label: "Orders", icon: "📋" },
  { href: "/pos/menu", label: "Menu", icon: "📖" },
  { href: "/pos/inventory", label: "Inventory", icon: "📦" },
  { href: "/pos/analytics", label: "Analytics", icon: "📊" },
  { href: "/kds", label: "KDS", icon: "👨‍🍳" },
];

export default function POSSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-16 lg:w-56 bg-surface-950 flex flex-col fixed top-0 left-0 h-screen z-40 shadow-2xl">
      {/* Logo */}
      <div className="px-3 lg:px-5 py-5 border-b border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            GB
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="text-white font-display font-semibold text-sm truncate">
              Golden Beans
            </p>
            <p className="text-surface-500 text-xs">POS System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                isActive
                  ? "bg-brand-500 text-white shadow-glow"
                  : "text-surface-400 hover:text-white hover:bg-surface-800"
              }`}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <span className="hidden lg:block text-sm font-medium truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-surface-800">
        <div className="hidden lg:block text-surface-600 text-xs text-center">
          {new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>
    </aside>
  );
}
