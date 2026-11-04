import Image from "next/image";
import type { Metadata } from "next";
import { PageHeading } from "@/components/site/page-heading";
import { fetchPublicList } from "@/lib/public-api";
import { mediaUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Equipa",
  description: "Profissionais dedicados ao acompanhamento de cada criança na Corujinha.",
};

export default async function EquipaPage() {
  const team = await fetchPublicList<{
    id: string;
    name: string;
    description?: string;
    imageKey?: string;
  }>("/api/public/team", ["team"]);

  return (
    <div className="hero-wash min-h-screen">
      <div className="page-container py-16">
        <PageHeading
          title="A Nossa"
          accent="Equipa"
          subtitle="Profissionais dedicados ao acompanhamento de cada criança."
        />
        {team.length === 0 && (
          <p className="mt-12 text-center text-muted">A equipa será apresentada aqui em breve.</p>
        )}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {team.map((m) => (
            <article key={m.id} className="rounded-3xl bg-white p-6 text-center shadow-xl">
              {mediaUrl(m.imageKey) && (
                <Image
                  src={mediaUrl(m.imageKey)!}
                  alt={m.name}
                  width={176}
                  height={176}
                  className="mx-auto mb-4 h-44 w-44 rounded-full object-cover ring-4 ring-pink/20"
                />
              )}
              <h2 className="text-2xl font-bold">{m.name}</h2>
              {m.description && <p className="mt-2 text-muted">{m.description}</p>}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
