"use client";

import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void | Promise<void>;
  "aria-label"?: string;
};

export function AdminToggle({
  checked,
  disabled,
  onChange,
  "aria-label": ariaLabel = "Ativo / Inativo",
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => void onChange(!checked)}
      className={cn(
        "inline-flex h-11 min-w-24 items-center justify-between gap-2 rounded-full px-1.5 text-xs font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 disabled:opacity-50 sm:h-8",
        checked ? "flex-row-reverse bg-emerald-700" : "bg-slate-600",
      )}
    >
      <span className="h-6 w-6 shrink-0 rounded-full bg-white shadow sm:h-5 sm:w-5" aria-hidden />
      <span className="px-1">{checked ? "Ativo" : "Inativo"}</span>
    </button>
  );
}
