"use client";

import { CrudResourcePage } from "@/components/admin/crud-resource";

export default function AdminEntitiesPage() {
  return (
    <CrudResourcePage
      title="Entidades"
      endpoint="/api/admin/entities"
      extraFields={[
        { key: "location", label: "Localização" },
        { key: "website", label: "Website" },
      ]}
    />
  );
}
