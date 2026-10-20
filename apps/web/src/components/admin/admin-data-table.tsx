"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  searchValue?: (row: T) => string;
  sortValue?: (row: T) => string | number;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
};

const PAGE_SIZES = [5, 10, 25, 50, 100, -1] as const;

type Props<T extends { id: string }> = {
  title?: string;
  rows: T[];
  columns: DataTableColumn<T>[];
  toolbar?: ReactNode;
  emptyMessage?: string;
  loading?: boolean;
  defaultPageSize?: number;
  /** Card title on small screens */
  mobileTitle?: (row: T) => ReactNode;
  /** Optional subtitle under the title on cards */
  mobileMeta?: (row: T) => ReactNode;
  /** Action buttons row on cards (defaults to actions column cell) */
  mobileActions?: (row: T) => ReactNode;
};

export function AdminDataTable<T extends { id: string }>({
  title,
  rows,
  columns,
  toolbar,
  emptyMessage = "Nenhum registo encontrado.",
  loading = false,
  defaultPageSize = 25,
  mobileTitle,
  mobileMeta,
  mobileActions,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [page, setPage] = useState(0);
  const [sortId, setSortId] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = rows.filter((row) =>
        columns.some((col) => {
          const v = col.searchValue?.(row);
          return v ? v.toLowerCase().includes(q) : false;
        }),
      );
    }

    if (sortId) {
      const col = columns.find((c) => c.id === sortId);
      if (col?.sortValue || col?.searchValue) {
        const get = col.sortValue ?? col.searchValue!;
        list = [...list].sort((a, b) => {
          const av = get(a);
          const bv = get(b);
          if (typeof av === "number" && typeof bv === "number") {
            return sortDir === "asc" ? av - bv : bv - av;
          }
          const as = String(av ?? "").toLowerCase();
          const bs = String(bv ?? "").toLowerCase();
          return sortDir === "asc" ? as.localeCompare(bs, "pt") : bs.localeCompare(as, "pt");
        });
      }
    }

    return list;
  }, [rows, columns, query, sortId, sortDir]);

  const total = filtered.length;
  const size = pageSize === -1 ? Math.max(total, 1) : pageSize;
  const pageCount = pageSize === -1 ? 1 : Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(page, pageCount - 1);
  const start = total === 0 ? 0 : safePage * size;
  const end = pageSize === -1 ? total : Math.min(start + size, total);
  const pageRows = filtered.slice(start, end);

  const titleCol = columns.find((c) => c.id === "name" || c.id === "title") ?? columns[0];
  const actionsCol = columns.find((c) => c.id === "actions");

  function toggleSort(col: DataTableColumn<T>) {
    if (col.sortable === false) return;
    if (!col.sortValue && !col.searchValue) return;
    if (sortId === col.id) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortId(col.id);
      setSortDir("asc");
    }
    setPage(0);
  }

  function cardTitle(row: T): ReactNode {
    if (mobileTitle) return mobileTitle(row);
    if (titleCol) return titleCol.cell(row);
    return row.id;
  }

  function cardActions(row: T): ReactNode {
    if (mobileActions) return mobileActions(row);
    if (actionsCol) return actionsCol.cell(row);
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      {(title || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 md:px-5">
          {title ? (
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              {title}{" "}
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {rows.length}
              </span>
            </h2>
          ) : (
            <span />
          )}
          {toolbar}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 md:px-5">
        <label className="flex items-center gap-2 text-sm text-slate-600" htmlFor="admin-table-page-size">
          <span>Mostrar</span>
          <select
            id="admin-table-page-size"
            className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-sm text-slate-700 shadow-sm outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n === -1 ? "Todos" : n}
              </option>
            ))}
          </select>
          <span>registos</span>
        </label>

        <label className="relative flex items-center text-sm text-slate-600" htmlFor="admin-table-search">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" aria-hidden />
          <input
            id="admin-table-search"
            aria-label="Procurar registos"
            className="h-9 w-[240px] rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-500 focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            value={query}
            placeholder="Procurar…"
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </label>
      </div>

      {loading ? (
        <p className="px-4 py-14 text-center text-sm text-slate-500">A carregar…</p>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {pageRows.length === 0 ? (
              <li className="px-4 py-12 text-center text-slate-500">{emptyMessage}</li>
            ) : (
              pageRows.map((row) => (
                <li key={row.id} className="space-y-3 px-4 py-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">{cardTitle(row)}</div>
                    {mobileMeta ? (
                      <div className="mt-1 text-xs text-slate-600">{mobileMeta(row)}</div>
                    ) : null}
                  </div>
                  <div>{cardActions(row)}</div>
                </li>
              ))
            )}
          </ul>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  {columns.map((col) => {
                    const canSort = col.sortable !== false && !!(col.sortValue || col.searchValue);
                    const active = sortId === col.id;
                    return (
                      <th
                        key={col.id}
                        className={cn(
                          "whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500",
                          canSort && "cursor-pointer select-none hover:text-slate-700",
                          col.headerClassName,
                        )}
                        onClick={() => canSort && toggleSort(col)}
                        aria-sort={
                          active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                        }
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {col.header}
                          {canSort &&
                            (active ? (
                              sortDir === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5 text-pink-600" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-pink-600" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                            ))}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-50 transition-colors last:border-0 hover:bg-pink-50/40"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          className={cn("px-4 py-3 align-middle text-slate-700", col.className)}
                        >
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/40 px-4 py-3 text-sm text-slate-600 md:px-5">
            <p>
              {total === 0 ? "Sem registos" : `${start + 1}–${end} de ${total}`}
              {query.trim() && total !== rows.length ? ` (filtrado de ${rows.length})` : ""}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 0}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Anterior
              </button>
              {Array.from({ length: pageCount }, (_, i) => i)
                .filter((i) => {
                  if (pageCount <= 7) return true;
                  if (i === 0 || i === pageCount - 1) return true;
                  return Math.abs(i - safePage) <= 1;
                })
                .reduce<(number | "…")[]>((acc, i, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === "number" && i - (arr[idx - 1] as number) > 1) {
                    acc.push("…");
                  }
                  acc.push(i);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "…" ? (
                    <span key={`e-${idx}`} className="px-1 text-slate-500">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={cn(
                        "min-w-9 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition",
                        item === safePage
                          ? "border-pink-600 bg-pink-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      )}
                      onClick={() => setPage(item)}
                    >
                      {item + 1}
                    </button>
                  ),
                )}
              <button
                type="button"
                disabled={safePage >= pageCount - 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                Seguinte
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
