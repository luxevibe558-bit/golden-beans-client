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
  { href: "/pos",           icon: "🖥️", label: "POS",       exact: true },
  { href: "/pos/requests",  icon: "🔔", label: "Requests" },
  { href: "/pos/aggregator",icon: "🛵", label: "Aggregator", permission: "orders", permissionAction: "view" },
  { href: "/kds",           icon: "👨‍🍳", label: "Kitchen" },
];