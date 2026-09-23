"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { adminFetch } from "@/lib/admin-api";
import { ensureAdminPlugins, getJQuery } from "@/lib/admin-plugins";
import { mediaUrl } from "@/lib/utils";

type Props = {
  label?: string;
  value?: string;
  onChange: (key: string) => void;
  folder?: string;
  resetKey?: string;
};

function isRemoveControl(el: HTMLElement | null): boolean {
  if (!el) return false;
  const btn = el.closest("button");
  if (!btn) return false;

  const title = (btn.getAttribute("title") || "").toLowerCase();
  const cls = btn.className || "";

  return (
    btn.classList.contains("fileinput-remove") ||
    btn.classList.contains("fileinput-remove-button") ||
    btn.classList.contains("kv-file-remove") ||
    btn.classList.contains("btn-kv-clear") ||
    cls.includes("fileinput-remove") ||
    title.includes("remov")
  );
}

export function KrajeeFileInput({
  label = "Imagem",
  value = "",
  onChange,
  folder = "uploads",
  resetKey = "default",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const inputId = useId().replace(/:/g, "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    let $input: ReturnType<NonNullable<typeof window.jQuery>> | null = null;
    let removeHandler: ((e: Event) => void) | null = null;

    function previewFor(key: string) {
      const url = key ? mediaUrl(key) : "";
      return url ? [url] : [];
    }

    let clearing = false;

    function clearAll() {
      if (clearing) return;
      clearing = true;
      onChangeRef.current("");
      valueRef.current = "";
      setError("");

      const $ = getJQuery();
      if (!$ || !inputRef.current) {
        clearing = false;
        return;
      }

      const $el = $(inputRef.current);
      try {
        $el.fileinput("clear");
      } catch {
        /* ignore */
      }

      setTimeout(() => {
        try {
          $el.fileinput("refresh", {
            initialPreview: [],
            initialPreviewConfig: [],
            initialPreviewAsData: false,
            overwriteInitial: true,
          });
        } catch {
          /* ignore */
        }
        clearing = false;
      }, 50);
    }

    function refreshPreview(key: string) {
      const $ = getJQuery();
      if (!$ || !inputRef.current) return;
      const $el = $(inputRef.current);
      const urls = previewFor(key);
      try {
        $el.fileinput("refresh", {
          initialPreview: urls,
          initialPreviewConfig: urls.length ? [{ key: 1, showRemove: true }] : [],
          initialPreviewAsData: false,
          overwriteInitial: true,
        });
      } catch {
        /* not ready */
      }
    }

    async function init() {
      await ensureAdminPlugins();
      if (cancelled || !inputRef.current) return;

      const $ = getJQuery();
      if (!$) return;

      $input = $(inputRef.current);
      const startKey = valueRef.current;
      const previewUrl = startKey ? mediaUrl(startKey) : "";

      try {
        $input.fileinput("destroy");
      } catch {
        /* first init */
      }

      $input.fileinput({
        theme: "bs5",
        language: "pt",
        showUpload: false,
        showRemove: true,
        showCaption: false,
        browseOnZoneClick: true,
        browseIcon: '<i class="bi bi-image"></i> ',
        previewFileIcon: '<i class="bi bi-image"></i>',
        removeClass: "btn btn-default btn-outline-secondary",
        allowedFileExtensions: ["jpg", "jpeg", "png", "gif", "webp"],
        maxFileSize: 4096,
        initialPreview: previewUrl ? [previewUrl] : [],
        initialPreviewAsData: false,
        initialPreviewConfig: previewUrl ? [{ key: 1, showRemove: true }] : [],
        initialPreviewShowDelete: true,
        overwriteInitial: true,
        fileActionSettings: {
          showZoom: true,
          showDrag: false,
          showRemove: true,
          showUpload: false,
          removeIcon: '<i class="bi bi-trash"></i>',
          removeTitle: "Remover ficheiro",
          zoomIcon: '<i class="bi bi-zoom-in"></i>',
        },
        layoutTemplates: {
          main2: '{preview}\n<div class="input-group {class}">\n{remove}\n{browse}\n</div>',
        },
      });

      // Mesmo padrão do Laravel fileinput-init.js — botão "Remover" da toolbar + preview
      removeHandler = (e: Event) => {
        const target = e.target as HTMLElement | null;
        if (!target || !inputRef.current || !isRemoveControl(target)) return;

        const inputWrap = inputRef.current.closest(".file-input");
        const btnWrap = target.closest(".file-input, .file-preview, .file-preview-frame");
        if (!inputWrap || !btnWrap || !inputWrap.contains(btnWrap)) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        clearAll();
        return false;
      };

      document.addEventListener("click", removeHandler, true);

      // Garantir que o botão da toolbar fica clicável quando há preview inicial
      setTimeout(() => {
        if (!inputRef.current) return;
        const wrap = inputRef.current.closest(".file-input");
        if (!wrap) return;
        wrap.querySelectorAll<HTMLButtonElement>(
          ".fileinput-remove-button, .btn-kv-clear, .fileinput-remove, .kv-file-remove",
        ).forEach((btn) => {
          btn.disabled = false;
          btn.style.pointerEvents = "auto";
          btn.style.opacity = "1";
        });
      }, 200);

      $input
        .off("change.krajeeUpload filecleared.krajee fileclear.krajee filepredelete.krajee")
        .on("change.krajeeUpload", async function (this: HTMLInputElement) {
          const file = this.files?.[0];
          if (!file) return;

          setUploading(true);
          setError("");
          try {
            const presign = await adminFetch<{ key: string; uploadUrl: string }>(
              "/api/admin/media/presign",
              {
                method: "POST",
                body: JSON.stringify({ contentType: file.type, folder }),
              },
            );
            const res = await fetch(presign.uploadUrl, {
              method: "PUT",
              body: file,
              headers: { "Content-Type": file.type },
            });
            if (!res.ok) throw new Error("Upload falhou");

            valueRef.current = presign.key;
            onChangeRef.current(presign.key);
            refreshPreview(presign.key);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Erro no upload");
            clearAll();
          } finally {
            setUploading(false);
          }
        })
        .on("filepredelete.krajee", () => {
          clearAll();
        })
        .on("fileclear.krajee filecleared.krajee", () => {
          clearAll();
        });
    }

    init().catch((err) => setError(String(err)));

    return () => {
      cancelled = true;
      if (removeHandler) {
        document.removeEventListener("click", removeHandler, true);
      }
      try {
        $input?.off("change.krajeeUpload filecleared.krajee fileclear.krajee filepredelete.krajee");
        $input?.fileinput("destroy");
      } catch {
        /* ignore */
      }
    };
  }, [resetKey, folder]);

  return (
    <div className="fileinput-stacked admin-krajee">
      <Label htmlFor={inputId}>{label}</Label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="file fileinput-auto"
        accept="image/*"
        data-browse-on-zone-click="true"
      />
      {uploading && <p className="mt-1 text-xs text-slate-400">A enviar imagem…</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {value && !uploading && (
        <p className="mt-1 truncate text-[11px] text-slate-400">{value}</p>
      )}
    </div>
  );
}
