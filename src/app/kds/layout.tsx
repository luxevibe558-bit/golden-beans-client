import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Golden Beans — Kitchen Display",
  description: "Kitchen Display System",
};

export default function KDSLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface-950">{children}</div>;
}
