"use client";

import { CrudResourcePage } from "@/components/admin/crud-resource";

export default function AdminProtocolsPage() {
  return (
    <CrudResourcePage
      title="Protocolos escolares"
      endpoint="/api/admin/protocols"
      nameField="schoolName"
      extraFields={[
        { key: "link", label: "Link (URL)" },
        { key: "documentKey", label: "Documento PDF", type: "image", folder: "protocols" },
        { key: "active", label: "Ativo", type: "checkbox" },
      ]}
    />
  );
}
