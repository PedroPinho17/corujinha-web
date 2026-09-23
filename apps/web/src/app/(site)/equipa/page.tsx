import { mediaUrl } from "@/lib/utils";

const api = process.env.INTERNAL_API_URL ?? "http://localhost:3001";

async function getTeam() {
  try {
    const res = await fetch(`${api}/api/public/team`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function EquipaPage() {
  const team = await getTeam();
  return (
    <div className="hero-wash min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-center text-4xl font-bold md:text-5xl">
          A Nossa <span className="text-pink">Equipa</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-xl text-muted">
          Profissionais dedicados ao acompanhamento de cada criança.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {team.map((m: { id: string; name: string; description?: string; imageKey?: string }) => (
            <article key={m.id} className="rounded-3xl bg-white p-6 text-center shadow-xl">
              {m.imageKey && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(m.imageKey) ?? undefined}
                  alt={m.name}
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
