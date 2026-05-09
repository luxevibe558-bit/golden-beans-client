export interface NavItem {
  href: string;
  icon: string;
  label: string;
  exact?: boolean;
  permission?: "menu" | "orders" | "tables" | "inventory" | "reports" | "promotions" | "dues" | "admin";
  permissionAction?: string;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/pos",                    icon: "🖥️",  label: "POS",         exact: true },
  { href: "/pos/orders",             icon: "📋",  label: "Orders",      permission: "orders",     permissionAction: "view" },
  { href: "/pos/menu",               icon: "📖",  label: "Menu",        permission: "menu",       permissionAction: "view" },
  { href: "/pos/promotions",         icon: "🎁",  label: "Promos",      permission: "promotions", permissionAction: "view" },
  { href: "/pos/marketing",          icon: "📣",  label: "Marketing",   adminOnly: true },
  { href: "/pos/home-texts",         icon: "✏️",  label: "Home Texts",  adminOnly: true },
  { href: "/pos/loyalty-settings",   icon: "🫘",  label: "Loyalty",     adminOnly: true },
  { href: "/pos/inventory",          icon: "📦",  label: "Stock",       permission: "inventory",  permissionAction: "view" },
  { href: "/pos/dues",               icon: "📒",  label: "Dues",        permission: "dues",       permissionAction: "view" },
  { href: "/pos/crm",                icon: "👥",  label: "CRM",         permission: "reports",    permissionAction: "view" },
  { href: "/pos/analytics",          icon: "📊",  label: "Reports",     permission: "reports",    permissionAction: "view" },
  { href: "/pos/requests",           icon: "🔔",  label: "Requests" },
  { href: "/pos/feedback",           icon: "⭐",  label: "Feedback",    permission: "reports",    permissionAction: "view" },
  { href: "/kds",                    icon: "👨‍🍳",  label: "Kitchen" },
  { href: "/pos/cancellation-logs",  icon: "🚫",  label: "Cancelled",   permission: "reports",    permissionAction: "view" },
  { href: "/pos/waiter-performance", icon: "👤",  label: "Waiters",     permission: "reports",    permissionAction: "view" },
  { href: "/pos/aggregator",         icon: "🛵",  label: "Aggregator",  permission: "orders",     permissionAction: "view" },
  { href: "/pos/settings",           icon: "⚙️",  label: "Settings",    adminOnly: true },
  { href: "/pos/admin",              icon: "🔐",  label: "Admin",       adminOnly: true },
];
