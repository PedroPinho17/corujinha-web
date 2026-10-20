"use client";

import { CrudResourcePage } from "@/components/admin/crud-resource";

export default function AdminCentersPage() {
  return (
    <CrudResourcePage
      title="Centros"
      endpoint="/api/admin/centers"
      nameField="name"
      bodyField="address"
      extraFields={[
        { key: "slug", label: "Endereço curto (filtro / URL)", type: "text" },
        { key: "shortName", label: "Nome curto (ex.: Lobão)", type: "text" },
        { key: "city", label: "Localidade", type: "text" },
        { key: "postalCode", label: "Código postal", type: "text" },
        { key: "phone", label: "Telefone", type: "text" },
        { key: "email", label: "Email", type: "text" },
        { key: "isPrimary", label: "Centro principal", type: "checkbox" },
      ]}
    />
  );
}
