import type { Metadata } from "next";
import { AdminPluginStyles } from "@/components/admin/admin-plugin-styles";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: "Backoffice",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminPluginStyles />
      {children}
    </>
  );
}
