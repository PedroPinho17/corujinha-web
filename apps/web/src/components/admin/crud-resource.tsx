"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { adminFetch } from "@/lib/admin-api";
import { DeepLTranslateButton } from "@/components/admin/deepl-button";
import { KrajeeFileInput } from "@/components/admin/krajee-file-input";
import { AdminToggle } from "@/components/admin/admin-toggle";
import { AdminDataTable, type DataTableColumn } from "@/components/admin/admin-data-table";
import { mediaUrl } from "@/lib/utils";

type Row = Record<string, unknown> & { id: string };

export function CrudResourcePage({
  title,
  endpoint,
  nameField = "name",
  bodyField = "description",
  extraFields = [],
  imageField,
  uploadFolder = "uploads",
}: {
  title: string;
  endpoint: string;
  nameField?: "name" | "title" | "schoolName";
  bodyField?: "description" | "content";
  extraFields?: {
    key: string;
    label: string;
    type?: "text" | "checkbox" | "image" | "select";
    folder?: string;
    options?: { value: string; label: string }[];
  }[];
  imageField?: string;
  uploadFolder?: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3500);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch<Row[]>(endpoint);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [endpoint]);

  function startCreate() {
    setEditing(null);
    const base: Record<string, string | boolean> = { [nameField]: "", [bodyField]: "" };
    for (const f of extraFields) base[f.key] = f.type === "checkbox" ? false : "";
    setForm(base);
    setTranslations({});
    setShowTranslate(false);
    setShowForm(true);
  }

  function startEdit(row: Row) {
    setEditing(row);
    const base: Record<string, string | boolean> = {
      [nameField]: String(row[nameField] ?? ""),
      [bodyField]: String(row[bodyField] ?? ""),
    };
    for (const f of extraFields) {
      base[f.key] = f.type === "checkbox" ? Boolean(row[f.key]) : String(row[f.key] ?? "");
    }
    setForm(base);
    setTranslations({});
    setShowTranslate(false);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditing(null);
    setForm({});
    setTranslations({});
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload: Record<string, unknown> = { ...form };
    if (Object.keys(translations).length) {
      const t: Record<string, Record<string, string>> = {};
      for (const [code, text] of Object.entries(translations)) {
        t[code] = { [bodyField]: text };
      }
      payload.translations = t;
    }
    try {
      if (editing) {
        await adminFetch(`${endpoint}/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        flash("Registo atualizado");
      } else {
        await adminFetch(endpoint, { method: "POST", body: JSON.stringify(payload) });
        flash("Registo criado");
      }
      cancelForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao guardar");
    }
  }

  async function toggleRow(id: string) {
    setTogglingId(id);
    try {
      await adminFetch(`${endpoint}/${id}/toggle`, { method: "PATCH" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alternar estado");
    } finally {
      setTogglingId(null);
    }
  }

  async function move(id: string, direction: -1 | 1) {
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const swap = idx + direction;
    if (swap < 0 || swap >= rows.length) return;
    const next = [...rows];
    const tmp = next[idx];
    next[idx] = next[swap];
    next[swap] = tmp;
    setRows(next);
    try {
      await adminFetch(`${endpoint}/reorder`, {
        method: "POST",
        body: JSON.stringify({ ids: next.map((r) => r.id) }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reordenar");
      await load();
    }
  }

  async function confirmRemove() {
    if (!pendingDelete) return;
    const id = pendingDelete;
    setPendingDelete(null);
    try {
      await adminFetch(`${endpoint}/${id}`, { method: "DELETE" });
      flash("Registo eliminado");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao eliminar");
    }
  }

  const columns = useMemo<DataTableColumn<Row>[]>(() => {
    const cols: DataTableColumn<Row>[] = [
      {
        id: "order",
        header: "Ordem",
        headerClassName: "w-[100px]",
        sortable: false,
        cell: (r) => (
          <div className="flex gap-1">
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-xs text-slate-600 hover:bg-slate-50"
              onClick={() => move(r.id, -1)}
              aria-label="Mover para cima"
            >
              ↑
            </button>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-xs text-slate-600 hover:bg-slate-50"
              onClick={() => move(r.id, 1)}
              aria-label="Mover para baixo"
            >
              ↓
            </button>
          </div>
        ),
      },
    ];

    if (imageField) {
      cols.push({
        id: "image",
        header: "Imagem",
        headerClassName: "w-[100px] text-center",
        className: "text-center",
        sortable: false,
        cell: (r) => {
          const imgKey = String(r[imageField] ?? "");
          const imgSrc = imgKey ? mediaUrl(imgKey) : null;
          if (!imgSrc) return <span className="text-xs text-slate-300">—</span>;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgSrc} alt="" className="mx-auto h-12 w-12 rounded border border-slate-200 object-cover" />
          );
        },
      });
    }

    cols.push(
      {
        id: "name",
        header: "Nome",
        sortable: true,
        searchValue: (r) =>
          [
            r[nameField],
            r.title,
            r.name,
            r.schoolName,
            r[bodyField],
            r.description,
            r.content,
          ]
            .filter(Boolean)
            .map(String)
            .join(" "),
        sortValue: (r) => String(r[nameField] || r.title || r.name || r.schoolName || ""),
        cell: (r) => (
          <span className="font-semibold text-slate-800">
            {String(r[nameField] || r.title || r.name || r.schoolName || r.id)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Estado",
        headerClassName: "w-[120px] text-center",
        className: "text-center",
        sortable: true,
        sortValue: (r) => ((r.published ?? r.active ?? true) ? 1 : 0),
        searchValue: (r) => ((r.published ?? r.active ?? true) ? "ativo" : "inativo"),
        cell: (r) => {
          const on = (r.published ?? r.active ?? true) as boolean;
          return (
            <AdminToggle
              checked={on}
              disabled={togglingId === r.id}
              onChange={async () => toggleRow(r.id)}
            />
          );
        },
      },
      {
        id: "actions",
        header: "Ações",
        headerClassName: "text-center",
        className: "text-center",
        sortable: false,
        cell: (r) => (
          <div className="flex justify-center gap-1">
            <button
              type="button"
              className="inline-flex h-8 items-center rounded border border-slate-300 bg-sky-50 px-2.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
              onClick={() => startEdit(r)}
            >
              Editar
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded border border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              onClick={() => setPendingDelete(r.id)}
            >
              Eliminar
            </button>
          </div>
        ),
      },
    );

    return cols;
  }, [imageField, nameField, bodyField, togglingId]);

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100"
          role="status"
        >
          {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100" role="alert">
          {error}
        </div>
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 id="delete-title" className="text-lg font-bold text-slate-800">
              Eliminar registo?
            </h3>
            <p className="mt-2 text-sm text-slate-500">Esta ação não pode ser anulada.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
                Cancelar
              </Button>
              <Button type="button" className="bg-rose-500 hover:bg-rose-600" onClick={confirmRemove}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={save}
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <p className="mb-4 text-sm font-bold text-slate-700">
            {editing ? "Editar registo" : "Novo registo"}
          </p>
          <div className="max-w-xl space-y-3">
            <div>
              <Label>Título / Nome (PT)</Label>
              <Input
                value={String(form[nameField] ?? "")}
                onChange={(e) => setForm({ ...form, [nameField]: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Descrição (PT)</Label>
              <Textarea
                value={String(form[bodyField] ?? "")}
                onChange={(e) => setForm({ ...form, [bodyField]: e.target.value })}
              />
            </div>
            {extraFields.map((f) => {
              if (f.type === "checkbox") {
                return (
                  <label key={f.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(form[f.key])}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                    />
                    {f.label}
                  </label>
                );
              }
              if (f.type === "image") {
                return (
                  <KrajeeFileInput
                    key={`${f.key}-${editing?.id ?? "new"}`}
                    label={f.label}
                    value={String(form[f.key] ?? "")}
                    folder={f.folder ?? uploadFolder}
                    resetKey={`${f.key}-${editing?.id ?? "new"}`}
                    onChange={(key) => setForm({ ...form, [f.key]: key })}
                  />
                );
              }
              if (f.type === "select") {
                return (
                  <div key={f.key}>
                    <Label>{f.label}</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    >
                      <option value="">— Nenhuma —</option>
                      {(f.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              return (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <Input
                    value={String(form[f.key] ?? "")}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              );
            })}

            <div className="rounded-lg border border-dashed border-slate-200 p-3">
              <button
                type="button"
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                onClick={() => setShowTranslate((v) => !v)}
                aria-expanded={showTranslate}
              >
                {showTranslate ? "▾" : "▸"} Traduções opcionais (não publicadas no site)
              </button>
              {showTranslate && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-slate-400">
                    O site público está apenas em português. DeepL guarda traduções no CMS para uso futuro.
                  </p>
                  <DeepLTranslateButton
                    getSourceText={() => String(form[bodyField] || form[nameField] || "")}
                    onTranslated={(t) => setTranslations(t)}
                  />
                  {Object.keys(translations).length > 0 && (
                    <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
                      {Object.entries(translations).map(([code, text]) => (
                        <p key={code}>
                          <strong>{code.toUpperCase()}:</strong> {text}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit">{editing ? "Atualizar" : "Criar"}</Button>
              <Button type="button" variant="outline" onClick={cancelForm}>
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      )}

      <AdminDataTable
        title={title}
        rows={rows}
        columns={columns}
        loading={loading}
        defaultPageSize={25}
        emptyMessage="Nenhum registo encontrado."
        toolbar={
          <Button type="button" onClick={startCreate}>
            + Novo
          </Button>
        }
      />
    </div>
  );
}
