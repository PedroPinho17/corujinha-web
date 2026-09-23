"use client";

import { CrudResourcePage } from "@/components/admin/crud-resource";

export default function AdminTeamsPage() {
  return (
    <CrudResourcePage
      title="Equipa"
      endpoint="/api/admin/teams"
      uploadFolder="teams"
      imageField="imageKey"
      extraFields={[{ key: "imageKey", label: "Imagem", type: "image", folder: "teams" }]}
    />
  );
}
