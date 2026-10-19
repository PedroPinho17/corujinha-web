"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KrajeeFileInput } from "@/components/admin/krajee-file-input";
import { adminFetch } from "@/lib/admin-api";
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
  alt?: string | null;
  album?: string | null;
  centerId?: string | null;
  center?: Center | null;
  published?: boolean;
};

const THEME_ALBUMS = [
  { value: "activities", label: "Atividades" },
  { value: "homepage", label: "Geral" },
];

export default function AdminGalleryPage() {
  const [rows, setRows] = useState<Item[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [imageKey, setImageKey] = useState("");
  const [alt, setAlt] = useState("");
  const [album, setAlbum] = useState("homepage");
  const [formKey, setFormKey] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const albumOptions = useMemo(() => {
    const fromCenters = centers.map((c) => ({
      value: c.slug,
      label: c.shortName || c.name,
      centerId: c.id,
    }));
    return [...fromCenters, ...THEME_ALBUMS.map((a) => ({ ...a, centerId: null as string | null }))];
  }, [centers]);

  async function load() {
    setError("");
    try {
      const [gallery, ctrs] = await Promise.all([
        adminFetch<Item[]>("/api/admin/gallery"),
        adminFetch<Center[]>("/api/admin/centers"),
      ]);
      setRows(gallery);
      setCenters(ctrs.filter((c) => true));
      if (ctrs[0] && album === "homepage") {
        // keep homepage default for new uploads
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const opt = albumOptions.find((a) => a.value === album);
      await adminFetch("/api/admin/gallery", {
        method: "POST",
        body: JSON.stringify({
          imageKey,
          alt,
          album,
          centerId: opt?.centerId ?? null,
        }),
      });
      setImageKey("");
      setAlt("");
      setAlbum("homepage");
      setFormKey((k) => k + 1);
      setToast("Imagem adicionada");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar");
    }
  }

  async function confirmRemove() {
    if (!pendingDelete) return;
    const id = pendingDelete;
    setPendingDelete(null);
    try {
      await adminFetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      setToast("Imagem apagada");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao apagar");
    }
  }

  function albumLabel(item: Item) {
    if (item.center?.shortName || item.center?.name) {
      return item.center.shortName || item.center.name;
    }
    return albumOptions.find((a) => a.value === item.album)?.label ?? item.album;
  }

  return (
    <div className="space-y-4">
      {toast && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700" role="status">
          {toast}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold">Apagar imagem?</h3>
            <p className="mt-2 text-sm text-slate-500">Esta ação não pode ser anulada.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
                Cancelar
              </Button>
              <Button type="button" className="bg-rose-500 hover:bg-rose-600" onClick={confirmRemove}>
                Apagar
              </Button>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={create}
        className="rounded-2xl bg-white p-5 shadow-[0_20px_27px_rgba(0,0,0,0.05)]"
      >
        <p className="mb-4 text-sm font-bold text-slate-700">Nova imagem</p>
        <div className="max-w-xl space-y-3">
          <KrajeeFileInput
            key={formKey}
            label="Imagem"
            value={imageKey}
            folder="gallery"
            resetKey={String(formKey)}
            onChange={setImageKey}
          />
          <div>
            <Label>Alt / descrição</Label>
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Descrição da imagem" />
          </div>
          <div>
            <Label>Álbum / centro (filtro no site)</Label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
            >
              <optgroup label="Centros">
                {centers.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.shortName || c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Temas">
                {THEME_ALBUMS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </optgroup>
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Os centros vêm de <strong>Centros</strong> no menu (Lobão, São João de Ver, Sanguedo…).
            </p>
          </div>
          <Button type="submit" disabled={!imageKey}>
            Adicionar à galeria
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_20px_27px_rgba(0,0,0,0.05)]">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-800">Galeria</h2>
          <p className="text-xs text-slate-400">{rows.length} imagem(ns)</p>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Nenhuma imagem na galeria.</p>
        ) : (
          <ul className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => {
              const src = mediaUrl(r.imageKey);
              const label = albumLabel(r);
              return (
                <li
                  key={r.id}
                  className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50"
                >
                  <div className="aspect-[4/3] bg-slate-100">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={r.alt || r.imageKey}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        Sem imagem
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {r.alt || "Sem descrição"}
                      </p>
                      {label && (
                        <p className="mt-0.5 text-[11px] font-medium text-pink-600">{label}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setPendingDelete(r.id)}>
                      Apagar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
