import type { Metadata } from "next";
import { GalleryClient } from "@/components/site/gallery-client";
import { PageHeading } from "@/components/site/page-heading";
import { fetchPublicList } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Galeria",
  description: "Momentos e atividades nos centros Corujinha em Lobão, São João de Ver e Sanguedo.",
};

type GalleryCenter = {
  id: string;
  slug: string;
  name: string;
  shortName?: string | null;
};

type GalleryItem = {
  id: string;
  imageKey: string;
  alt?: string;
  album?: string;
  center?: GalleryCenter | null;
};

export default async function GaleriaPage() {
  const [items, centers] = await Promise.all([
    fetchPublicList<GalleryItem>("/api/public/gallery", ["gallery"]),
    fetchPublicList<GalleryCenter>("/api/public/centers", ["centers"]),
  ]);
  return (
    <div className="page-container py-16">
      <PageHeading
        title="Galeria de"
        accent="Momentos"
        subtitle="Lobão, São João de Ver, Sanguedo — atividades e o dia a dia da Corujinha."
      />
      <div className="mt-10">
        <GalleryClient items={items} centers={centers} />
      </div>
    </div>
  );
}
