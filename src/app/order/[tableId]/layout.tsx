import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Golden Beans Cafe — Order",
  description: "Scan to order from your table",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
