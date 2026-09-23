"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Props = {
  name: string;
};

export function AdminUserMenu({ name }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [avatarOk, setAvatarOk] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = (name || "?").slice(0, 1).toUpperCase();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  async function logout() {
    setOpen(false);
    await authClient.signOut();
    router.push("/admin/login");
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {avatarOk ? (
          <Image
            src="/img/perfil.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
            onError={() => setAvatarOk(false)}
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-orange-400 text-xs font-bold text-white">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-700 sm:inline">
          {name}
        </span>
        <svg
          className={`hidden h-4 w-4 shrink-0 text-slate-400 transition sm:block ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 min-w-[210px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-md"
          role="menu"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-bold text-slate-800">{name}</p>
            <p className="text-xs text-slate-400">Conta</p>
          </div>
          <Link
            href="/admin/profile"
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <span className="text-emerald-500">👤</span>
            Perfil
          </Link>
          <Link
            href="/admin/security"
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <span className="text-orange-500">🔑</span>
            Segurança
          </Link>
          <hr className="my-1 border-slate-100" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
            onClick={() => logout()}
          >
            Terminar sessão
          </button>
        </div>
      )}
    </div>
  );
}
