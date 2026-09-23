"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

type RecentContact = {
  id: string;
  name: string;
  email: string;
  kind: string;
  subject?: string | null;
  location?: string | null;
  readAt?: string | null;
  createdAt: string;
  message: string;
};

type Dashboard = {
  users: number;
  teams: number;
  posts: number;
  formations: number;
  protocols: number;
  contacts: number;
  unreadContacts: number;
  recentContacts: RecentContact[];
};

const cards = [
  { key: "unreadContacts", label: "Por ler", href: "/admin/contacts", gradient: "from-amber-400 to-orange-500" },
  { key: "contacts", label: "Email por enviar", href: "/admin/contacts", gradient: "from-emerald-400 to-green-500" },
  { key: "posts", label: "Notícias", href: "/admin/posts", gradient: "from-cyan-400 to-teal-500" },
  { key: "teams", label: "Equipa", href: "/admin/teams", gradient: "from-violet-400 to-purple-500" },
  { key: "formations", label: "Formações", href: "/admin/formations", gradient: "from-rose-400 to-pink-500" },
  { key: "users", label: "Utilizadores", href: "/admin/users", gradient: "from-sky-400 to-blue-500" },
] as const;

const shortcuts = [
  { href: "/admin/contacts", label: "Ver contactos" },
  { href: "/admin/site", label: "Editar conteúdo do site" },
  { href: "/admin/posts", label: "Nova notícia" },
  { href: "/admin/gallery", label: "Galeria" },
  { href: "/", label: "Ver site público", external: true },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminFetch<Dashboard>("/api/admin/dashboard")
      .then((data) => {
        setStats(data);
        setError("");
      })
      .catch((e) => {
        const raw = e instanceof Error ? e.message : "Erro ao carregar";
        try {
          const parsed = JSON.parse(raw) as { message?: string };
          setError(parsed.message || raw);
        } catch {
          setError(raw);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          <p className="font-semibold">Não foi possível carregar o dashboard</p>
          <p className="mt-1 text-rose-600/90">{error}</p>
          <p className="mt-2 text-xs text-rose-500">
            Confirma que a API está a correr e que as migrations estão aplicadas (`pnpm db:deploy`).
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {shortcuts.map((s) =>
          s.external ? (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-100 hover:text-pink-600"
            >
              {s.label} ↗
            </a>
          ) : (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-100 hover:text-pink-600"
            >
              {s.label}
            </Link>
          ),
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className="rounded-2xl border-0 bg-white p-4 shadow-[0_20px_27px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mb-0 text-sm font-bold capitalize text-slate-500">{c.label}</p>
                <p className="mt-1 text-xl font-bold text-slate-800">
                  {loading ? "…" : (stats?.[c.key] ?? "—")}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-lg text-white shadow-md ${c.gradient}`}
                aria-hidden
              >
                ●
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_20px_27px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Contactos recentes</h2>
            <p className="text-xs text-slate-400">{stats?.unreadContacts ?? 0} por ler</p>
          </div>
          <Link href="/admin/contacts" className="text-xs font-bold text-indigo-500 hover:underline">
            Ver todos
          </Link>
        </div>
        {loading && <p className="px-5 py-8 text-center text-sm text-slate-400">A carregar…</p>}
        {!loading && !error && stats && stats.recentContacts.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Ainda sem mensagens.</p>
        )}
        {!loading && stats && stats.recentContacts.length > 0 && (
          <ul className="divide-y divide-slate-50">
            {stats.recentContacts.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {c.name}
                    {!c.readAt && (
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        Novo
                      </span>
                    )}
                    {c.kind === "ENROLLMENT" && (
                      <span className="ml-2 rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-bold text-pink-700">
                        Inscrição
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {c.subject || c.location
                      ? [c.subject, c.location].filter(Boolean).join(" · ")
                      : c.message.slice(0, 80)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <time className="text-[11px] text-slate-400">
                    {new Date(c.createdAt).toLocaleString("pt-PT")}
                  </time>
                  <a
                    href={`mailto:${c.email}?subject=Re: Corujinha`}
                    className="text-xs font-bold text-indigo-500 hover:underline"
                  >
                    Responder
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
