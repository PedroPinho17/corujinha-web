"use client";

import { useEffect, useState } from "react";
import { CrudResourcePage } from "@/components/admin/crud-resource";
import { adminFetch } from "@/lib/admin-api";

export default function AdminFormationsPage() {
  const [entityOptions, setEntityOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    adminFetch<{ id: string; name: string }[]>("/api/admin/entities")
      .then((rows) =>
        setEntityOptions(
          (Array.isArray(rows) ? rows : []).map((e) => ({ value: e.id, label: e.name })),
        ),
      )
      .catch(() => setEntityOptions([]));
  }, []);

  return (
    <CrudResourcePage
      title="Formações"
      endpoint="/api/admin/formations"
      extraFields={[
        { key: "duration", label: "Duração" },
        { key: "location", label: "Local" },
        {
          key: "entityId",
          label: "Entidade",
          type: "select",
          options: entityOptions,
        },
        { key: "active", label: "Ativa", type: "checkbox" },
      ]}
    />
  );
}
