"use client";

import { useMemo, useState, type ReactNode } from "react";
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
};

export function AdminDataTable<T extends { id: string }>({
  title,
  rows,
  columns,
  toolbar,
  emptyMessage = "Nenhum registo encontrado.",
  loading = false,
  defaultPageSize = 25,
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

  return (
    <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
      {(title || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2.5">
          {title ? (
            <h2 className="text-sm font-semibold text-slate-800">
              {title}{" "}
              <span className="font-normal text-slate-500">({rows.length})</span>
            </h2>
          ) : (
            <span />
          )}
          {toolbar}
        </div>
      )}

      {/* Controlo estilo DataTables */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-3 py-2.5">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span>Mostrar</span>
          <select
            className="h-8 rounded border border-slate-300 bg-white px-2 text-sm shadow-sm"
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

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span>Procurar:</span>
          <input
            className="h-8 w-[220px] rounded border border-slate-300 bg-white px-2.5 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </label>
      </div>

      {loading ? (
        <p className="px-4 py-12 text-center text-sm text-slate-400">A carregar…</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-100">
                  {columns.map((col) => {
                    const canSort = col.sortable !== false && !!(col.sortValue || col.searchValue);
                    const active = sortId === col.id;
                    return (
                      <th
                        key={col.id}
                        className={cn(
                          "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-600",
                          canSort && "cursor-pointer select-none hover:text-slate-900",
                          col.headerClassName,
                        )}
                        onClick={() => canSort && toggleSort(col)}
                        aria-sort={
                          active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                        }
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.header}
                          {canSort && (
                            <span className="inline-flex flex-col text-[9px] leading-none text-slate-400">
                              <span className={cn(active && sortDir === "asc" && "text-slate-800")}>
                                ▲
                              </span>
                              <span className={cn(active && sortDir === "desc" && "text-slate-800")}>
                                ▼
                              </span>
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="border-b border-slate-200 px-3 py-10 text-center text-slate-500"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, i) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-slate-200",
                        i % 2 === 0 ? "bg-white" : "bg-slate-50",
                        "hover:bg-amber-50/60",
                      )}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          className={cn("px-3 py-2.5 align-middle text-slate-700", col.className)}
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-600">
            <p>
              {total === 0
                ? "Mostrando os registos 0 a 0 num total de 0"
                : `Mostrando os registos ${start + 1} a ${end} num total de ${total}`}
              {query.trim() && total !== rows.length ? ` (filtrado de ${rows.length})` : ""}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 0}
                className="rounded border border-slate-300 bg-white px-2.5 py-1 text-sm disabled:opacity-40"
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
                    <span key={`e-${idx}`} className="px-1">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={cn(
                        "min-w-8 rounded border px-2.5 py-1 text-sm",
                        item === safePage
                          ? "border-orange-500 bg-orange-500 font-semibold text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
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
                className="rounded border border-slate-300 bg-white px-2.5 py-1 text-sm disabled:opacity-40"
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
