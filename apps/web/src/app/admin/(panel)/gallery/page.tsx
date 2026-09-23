"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KrajeeFileInput } from "@/components/admin/krajee-file-input";
import { adminFetch } from "@/lib/admin-api";
import { mediaUrl } from "@/lib/utils";

type Item = {
  id: string;
  imageKey: string;
  alt?: string | null;
  album?: string | null;
  published?: boolean;
};

const ALBUMS = [
  { value: "caldas", label: "Lobão" },
  { value: "sao-joao", label: "São João de Ver" },
  { value: "activities", label: "Atividades" },
  { value: "homepage", label: "Geral" },
];

export default function AdminGalleryPage() {
  const [rows, setRows] = useState<Item[]>([]);
  const [imageKey, setImageKey] = useState("");
  const [alt, setAlt] = useState("");
  const [album, setAlbum] = useState("homepage");
  const [formKey, setFormKey] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function load() {
    setError("");
    try {
      setRows(await adminFetch<Item[]>("/api/admin/gallery"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await adminFetch("/api/admin/gallery", {
        method: "POST",
        body: JSON.stringify({ imageKey, alt, album }),
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
            <Label>Álbum (filtro no site)</Label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
            >
              {ALBUMS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
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
              const albumLabel = ALBUMS.find((a) => a.value === r.album)?.label ?? r.album;
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
                      {albumLabel && (
                        <p className="mt-0.5 text-[11px] font-medium text-violet-600">{albumLabel}</p>
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
