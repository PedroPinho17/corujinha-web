"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { mediaUrl } from "@/lib/utils";

type Center = {
  id: string;
  slug: string;
  name: string;
  shortName?: string | null;
};

type Item = {
  id: string;
  imageKey: string;
  alt?: string;
  album?: string;
  center?: Center | null;
};

const THEME_FILTERS = [
  { id: "activities", label: "Atividades" },
  { id: "homepage", label: "Geral" },
];

const LEGACY_ALBUM: Record<string, string> = {
  caldas: "lobao",
  lobão: "lobao",
  "sao-joao": "sao-joao-de-ver",
};

function itemFilterKey(item: Item) {
  if (item.center?.slug) return item.center.slug;
  const album = (item.album || "").toLowerCase();
  return LEGACY_ALBUM[album] ?? album;
}

export function GalleryClient({
  items,
  centers = [],
}: {
  items: Item[];
  centers?: Center[];
}) {
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState<Item | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const dialogTitleId = useId();

  const filters = useMemo(() => {
    const fromCenters = centers.map((c) => ({
      id: c.slug,
      label: c.shortName || c.name,
    }));
    // Fallback if API empty (legacy hard-coded trio)
    const centerFilters =
      fromCenters.length > 0
        ? fromCenters
        : [
            { id: "lobao", label: "Lobão" },
            { id: "sao-joao-de-ver", label: "São João de Ver" },
            { id: "sanguedo", label: "Sanguedo" },
          ];
    return [{ id: "all", label: "Todas" }, ...centerFilters, ...THEME_FILTERS];
  }, [centers]);

  const visible =
    filter === "all" ? items : items.filter((i) => itemFilterKey(i) === filter);

  useEffect(() => {
    if (!active) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      lastFocus.current?.focus();
    };
  }, [active]);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar galeria">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === f.id ? "bg-pink text-white" : "bg-blush text-ink hover:bg-pink/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {visible.length === 0 && <p className="text-muted">Sem imagens neste filtro.</p>}
        {visible.map((g) => (
          <button
            key={g.id}
            type="button"
            className="overflow-hidden rounded-2xl shadow-md ring-1 ring-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
            onClick={() => setActive(g)}
            aria-label={`Ampliar: ${g.alt || "imagem da galeria"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(g.imageKey) ?? undefined}
              alt={g.alt ?? "Galeria"}
              className="aspect-[4/3] w-full object-cover transition hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
        >
          <p id={dialogTitleId} className="sr-only">
            {active.alt || "Imagem ampliada da galeria"}
          </p>
          <button
            ref={closeRef}
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
            onClick={() => setActive(null)}
          >
            Fechar
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl(active.imageKey) ?? undefined}
            alt={active.alt ?? "Galeria"}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
