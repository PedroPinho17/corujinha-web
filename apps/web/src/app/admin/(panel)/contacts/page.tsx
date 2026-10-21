"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  kind: string;
  subject?: string | null;
  schoolYear?: string | null;
  location?: string | null;
  status: string;
  readAt?: string | null;
  adminNotes?: string | null;
  createdAt: string;
};

const statusLabel: Record<string, string> = {
  NEW: "Email pendente",
  SENT: "Email enviado",
  FAILED: "Email falhou",
};

const PAGE_SIZE = 50;

export default function AdminContactsPage() {
  const [rows, setRows] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function load(nextPage = page) {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch<{
        items: Contact[];
        total: number;
        page: number;
        pageSize: number;
      }>(`/api/admin/contacts?page=${nextPage}&pageSize=${PAGE_SIZE}`);
      setRows(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? nextPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar contactos");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [selected]);

  function open(c: Contact) {
    setSelected(c);
    setNotes(c.adminNotes ?? "");
  }

  async function markRead(id: string, read: boolean) {
    setSaving(true);
    try {
      const updated = await adminFetch<Contact>(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ read }),
      });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      setSelected((s) => (s?.id === id ? { ...s, ...updated } : s));
      setToast(read ? "Marcado como lido" : "Marcado como não lido");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await adminFetch<Contact>(`/api/admin/contacts/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ adminNotes: notes }),
      });
      setRows((prev) => prev.map((r) => (r.id === selected.id ? { ...r, ...updated } : r)));
      setSelected({ ...selected, ...updated });
      setToast("Notas guardadas");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao guardar notas");
    } finally {
      setSaving(false);
    }
  }

  async function exportGdpr(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/contacts/${id}/gdpr-export`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gdpr-export-contact-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setToast("Exportação RGPD descarregada");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro na exportação RGPD");
    } finally {
      setSaving(false);
    }
  }

  async function eraseGdpr(id: string) {
    if (!window.confirm("Apagar dados pessoais deste contacto (RGPD)? Esta acção não se desfaz.")) {
      return;
    }
    setSaving(true);
    try {
      await adminFetch(`/api/admin/contacts/${id}/gdpr-erase`, {
        method: "POST",
        body: JSON.stringify({ confirm: true }),
      });
      setSelected(null);
      setToast("Dados apagados (RGPD)");
      await load(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao apagar (RGPD)");
    } finally {
      setSaving(false);
    }
  }

  const unread = rows.filter((r) => !r.readAt).length;

  return (
    <div className="space-y-4">
      {toast && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700" role="status">
          {toast}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_20px_27px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Contactos</h2>
            <p className="text-xs text-slate-400">
              {total} registo(s) · {unread} por ler nesta página
            </p>
          </div>
          <button
            type="button"
            onClick={() => load(page)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Atualizar
          </button>
        </div>

        {loading && <p className="px-5 py-10 text-center text-sm text-slate-500">A carregar…</p>}
        {!loading && error && (
          <p className="px-5 py-10 text-center text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-semibold text-slate-700">Ainda não há mensagens</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Pedidos de inscrição e mensagens do site aparecem aqui.
            </p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <>
            <ul className="divide-y divide-slate-100 md:hidden">
              {rows.map((c) => (
                <li key={c.id} className={`space-y-2 px-4 py-4 ${!c.readAt ? "bg-amber-50/40" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">
                        {!c.readAt && <span className="mr-1 text-amber-500">●</span>}
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-600">
                        {c.kind === "ENROLLMENT" ? "Inscrição" : "Mensagem"} ·{" "}
                        {statusLabel[c.status] ?? c.status}
                      </p>
                    </div>
                    <time className="shrink-0 text-[11px] text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString("pt-PT")}
                    </time>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-600"
                      onClick={() => open(c)}
                    >
                      Abrir
                    </button>
                    <a
                      href={`mailto:${c.email}`}
                      className="flex-1 rounded-lg border border-pink-100 bg-pink-50 px-2.5 py-1.5 text-center text-xs font-bold text-pink-700"
                    >
                      Responder
                    </a>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-bold">Data</th>
                    <th className="px-4 py-3 font-bold">Tipo</th>
                    <th className="px-4 py-3 font-bold">Nome</th>
                    <th className="px-4 py-3 font-bold">Pedido</th>
                    <th className="px-4 py-3 font-bold">Estado</th>
                    <th className="px-4 py-3 text-right font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-b border-slate-50 align-top hover:bg-slate-50/80 ${
                        !c.readAt ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {new Date(c.createdAt).toLocaleString("pt-PT")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            c.kind === "ENROLLMENT"
                              ? "bg-pink-50 text-pink-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {c.kind === "ENROLLMENT" ? "Inscrição" : "Mensagem"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">
                          {!c.readAt && <span className="mr-1 text-amber-500">●</span>}
                          {c.name}
                        </p>
                        <p className="text-xs text-slate-500">{c.email}</p>
                      </td>
                      <td className="max-w-xs px-4 py-3 text-sm text-slate-700">
                        {c.kind === "ENROLLMENT" ? (
                          <span>
                            {[c.subject, c.schoolYear, c.location].filter(Boolean).join(" · ") ||
                              c.message.slice(0, 100)}
                          </span>
                        ) : (
                          c.message.slice(0, 100)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            c.status === "NEW"
                              ? "bg-amber-50 text-amber-700"
                              : c.status === "FAILED"
                                ? "bg-rose-50 text-rose-600"
                                : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {statusLabel[c.status] ?? c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-row items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                            onClick={() => open(c)}
                          >
                            Abrir
                          </button>
                          <a
                            href={`mailto:${c.email}?subject=${encodeURIComponent(
                              c.kind === "ENROLLMENT"
                                ? "Re: Pedido de inscrição — Corujinha"
                                : "Re: Contacto — Corujinha",
                            )}`}
                            className="rounded-lg border border-pink-100 bg-pink-50 px-2.5 py-1 text-center text-xs font-bold text-pink-700 hover:bg-pink-100"
                          >
                            Responder
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
                <p className="text-xs text-slate-500">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => load(page - 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => load(page + 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Seguinte
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-detail-title"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="contact-detail-title" className="text-lg font-bold text-slate-800">
                  {selected.name}
                </h3>
                <p className="text-sm text-slate-500">{selected.email}</p>
                {selected.phone && <p className="text-sm text-slate-500">{selected.phone}</p>}
              </div>
              <button
                type="button"
                className="text-sm text-slate-400 hover:text-slate-700"
                onClick={() => setSelected(null)}
              >
                Fechar
              </button>
            </div>

            {selected.kind === "ENROLLMENT" && (
              <dl className="mt-4 grid gap-2 rounded-xl bg-pink-50/80 p-3 text-sm">
                {selected.subject && (
                  <div>
                    <dt className="text-xs font-bold uppercase text-pink-700">Disciplina</dt>
                    <dd>{selected.subject}</dd>
                  </div>
                )}
                {selected.schoolYear && (
                  <div>
                    <dt className="text-xs font-bold uppercase text-pink-700">Ano</dt>
                    <dd>{selected.schoolYear}</dd>
                  </div>
                )}
                {selected.location && (
                  <div>
                    <dt className="text-xs font-bold uppercase text-pink-700">Polo</dt>
                    <dd>{selected.location}</dd>
                  </div>
                )}
              </dl>
            )}

            <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{selected.message}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`mailto:${selected.email}?subject=${encodeURIComponent(
                  selected.kind === "ENROLLMENT"
                    ? "Re: Pedido de inscrição — Corujinha"
                    : "Re: Contacto — Corujinha",
                )}`}
              >
                <Button type="button" size="sm">
                  Responder por email
                </Button>
              </a>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => markRead(selected.id, !selected.readAt)}
              >
                {selected.readAt ? "Marcar não lido" : "Marcar como lido"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => exportGdpr(selected.id)}
              >
                Exportar RGPD
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving}
                className="text-rose-600"
                onClick={() => eraseGdpr(selected.id)}
              >
                Apagar RGPD
              </Button>
            </div>

            <div className="mt-4">
              <label className="text-xs font-bold uppercase text-slate-400" htmlFor="admin-notes">
                Notas internas
              </label>
              <Textarea
                id="admin-notes"
                className="mt-1"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Follow-up, horário combinado…"
              />
              <Button type="button" className="mt-2" size="sm" disabled={saving} onClick={saveNotes}>
                Guardar notas
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
