"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Trash2, Loader2, RefreshCw, FileText } from "lucide-react";
import { uploadImage } from "@/lib/admin-api";
import { Label } from "@/components/ui/label";
import { cn, mediaUrl } from "@/lib/utils";

type Props = {
  label?: string;
  folder?: string;
  value?: string;
  onChange: (key: string) => void;
  resetKey?: string;
  optional?: boolean;
  hint?: string;
  className?: string;
};

/**
 * Upload com preview (substitui Krajee jQuery — estável em Next.js/React).
 * Mantém a API de props usada no admin (value string, onChange string).
 */
export function KrajeeFileInput({
  label = "Imagem",
  folder = "uploads",
  value = "",
  onChange,
  resetKey = "default",
  optional = true,
  hint,
  className,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [remoteBroken, setRemoteBroken] = useState(false);

  const allowPdf = folder === "protocols";
  const isPdf =
    Boolean(value?.toLowerCase().endsWith(".pdf")) ||
    Boolean(previewName?.toLowerCase().endsWith(".pdf"));
  const displayUrl =
    localPreview || (!remoteBroken && value && !isPdf ? mediaUrl(value) : null);
  const meta = previewName ?? (value ? value.split("/").pop() : null);

  useEffect(() => {
    setRemoteBroken(false);
    setPreviewName(null);
    setPreviewSize(null);
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    if (inputRef.current) inputRef.current.value = "";
    // reset when parent remounts form row
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, value]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function onFile(file: File | undefined) {
    setRemoteBroken(false);
    if (!file) return;
    setError("");
    setPreviewName(file.name);
    setPreviewSize(`${(file.size / 1024).toFixed(1)} KB`);
    if (localPreview) URL.revokeObjectURL(localPreview);
    const objectUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null;
    if (objectUrl) setLocalPreview(objectUrl);
    else setLocalPreview(null);
    setUploading(true);
    try {
      const { key } = await uploadImage(file, folder);
      onChange(key);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Falha no upload");
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
      setPreviewName(null);
      setPreviewSize(null);
      onChange("");
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setPreviewName(null);
    setPreviewSize(null);
    setError("");
    setRemoteBroken(false);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const accept = allowPdf
    ? "image/jpeg,image/png,image/webp,application/pdf"
    : "image/jpeg,image/png,image/webp";

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId} className="text-sm text-slate-700">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-slate-400">opcional</span>
        ) : null}
      </Label>

      {!displayUrl && !isPdf ? (
        <label
          htmlFor={inputId}
          className="group flex min-h-[7.5rem] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50/50 px-4 py-10 text-center transition hover:border-pink-400 hover:bg-pink-50/40"
        >
          <ImagePlus className="h-7 w-7 text-slate-400 transition group-hover:text-pink-600" />
          <span className="text-sm text-slate-600">
            {allowPdf ? "Escolher ficheiro" : "Escolher imagem"}
          </span>
          <span className="text-[11px] text-slate-400">
            {allowPdf ? "JPG · PNG · WEBP · PDF" : "JPG · PNG · WEBP"}
          </span>
        </label>
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="relative flex min-h-[7.5rem] w-full items-center justify-center bg-slate-50">
            {isPdf || (!displayUrl && value) ? (
              <div className="flex flex-col items-center gap-2 p-6 text-slate-600">
                <FileText className="h-10 w-10 text-slate-400" />
                <p className="max-w-full truncate px-2 text-xs">{meta ?? "Documento"}</p>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayUrl!}
                alt={previewName ?? "Preview"}
                className="max-h-44 max-w-full object-contain p-3"
                onError={() => {
                  if (!localPreview) setRemoteBroken(true);
                }}
              />
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 px-2.5 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-slate-600">{meta}</p>
              {previewSize ? (
                <p className="text-[11px] text-slate-400">{previewSize}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded px-2 text-xs text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Trocar
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              onClick={clear}
              disabled={uploading}
              aria-label="Remover"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={uploading}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      {hint ? <p className="text-[11px] leading-relaxed text-slate-400">{hint}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
