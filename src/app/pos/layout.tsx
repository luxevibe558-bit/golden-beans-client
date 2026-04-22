import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Golden Beans — POS",
  description: "Point of Sale Dashboard",
};

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface-50">{children}</div>;
}
