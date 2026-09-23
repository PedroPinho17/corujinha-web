import { AdminPluginStyles } from "@/components/admin/admin-plugin-styles";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminPluginStyles />
      {children}
    </>
  );
}
