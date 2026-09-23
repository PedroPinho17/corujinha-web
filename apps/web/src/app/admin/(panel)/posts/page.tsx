"use client";

import { CrudResourcePage } from "@/components/admin/crud-resource";

export default function AdminPostsPage() {
  return (
    <CrudResourcePage
      title="Notícias / Posts"
      endpoint="/api/admin/posts"
      nameField="title"
      bodyField="content"
      uploadFolder="posts"
      imageField="imageKey"
      extraFields={[
        { key: "link", label: "Link" },
        { key: "phone", label: "Telefone" },
        { key: "email", label: "Email" },
        { key: "featured", label: "Destaque", type: "checkbox" },
        { key: "imageKey", label: "Imagem", type: "image", folder: "posts" },
      ]}
    />
  );
}
