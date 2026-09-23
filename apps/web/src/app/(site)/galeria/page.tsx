import { GalleryClient } from "@/components/site/gallery-client";

const api = process.env.INTERNAL_API_URL ?? "http://localhost:3001";

async function getGallery() {
  try {
    const res = await fetch(`${api}/api/public/gallery`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function GaleriaPage() {
  const items = await getGallery();
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-4xl font-bold">
        Galeria de <span className="text-pink">Momentos</span>
      </h1>
      <p className="mt-2 text-muted">Centros, atividades e o dia a dia da Corujinha.</p>
      <div className="mt-10">
        <GalleryClient items={items} />
      </div>
    </div>
  );
}
