"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { adminFetch } from "@/lib/admin-api";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";

type NavItem = {
  href: string;
  label: string;
  color: string;
  glyph: string;
  adminOnly?: boolean;
  match?: (path: string) => boolean;
};

const contentNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", glyph: "▣", color: "bg-gradient-to-br from-indigo-400 to-indigo-600", match: (p) => p === "/admin" },
  { href: "/admin/teams", label: "Equipa", glyph: "◎", color: "bg-gradient-to-br from-amber-400 to-orange-500" },
  { href: "/admin/posts", label: "Notícias", glyph: "☰", color: "bg-gradient-to-br from-sky-400 to-cyan-500" },
  { href: "/admin/entities", label: "Entidades", glyph: "⌂", color: "bg-gradient-to-br from-rose-400 to-red-500" },
  { href: "/admin/formations", label: "Formações", glyph: "✦", color: "bg-gradient-to-br from-emerald-400 to-green-600" },
  { href: "/admin/protocols", label: "Protocolos", glyph: "▤", color: "bg-gradient-to-br from-cyan-400 to-blue-500" },
  { href: "/admin/gallery", label: "Galeria", glyph: "▣", color: "bg-gradient-to-br from-violet-400 to-purple-600" },
  { href: "/admin/site", label: "Conteúdo do Site", glyph: "✎", color: "bg-gradient-to-br from-pink-400 to-fuchsia-500" },
  { href: "/admin/contacts", label: "Contactos", glyph: "✉", color: "bg-gradient-to-br from-blue-400 to-indigo-500" },
];

const accountNav: NavItem[] = [
  { href: "/admin/users", label: "Utilizadores", glyph: "☺", color: "bg-gradient-to-br from-slate-400 to-slate-600", adminOnly: true },
  { href: "/admin/profile", label: "Perfil", glyph: "⚙", color: "bg-gradient-to-br from-green-400 to-emerald-600" },
  { href: "/admin/security", label: "Segurança", glyph: "◉", color: "bg-gradient-to-br from-orange-400 to-amber-500" },
];

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = item.match
    ? item.match(pathname)
    : pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium no-underline transition ${
        active
          ? "bg-slate-100 text-slate-900"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs text-white shadow-sm ${item.color}`}
      >
        {item.glyph}
      </span>
      <span className="nav-link-text">{item.label}</span>
    </Link>
  );
}

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mustChange, setMustChange] = useState<boolean | null>(null);
  const [role, setRole] = useState<"ADMIN" | "EDITOR" | null>(null);
  const isForcePassword = pathname === "/admin/change-password";

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      setMustChange(null);
      setRole(null);
      router.replace("/admin/login");
      return;
    }
    let cancelled = false;
    adminFetch<{ user: { mustChangePassword: boolean; role?: string } | null }>("/api/me")
      .then((res) => {
        if (cancelled) return;
        setMustChange(Boolean(res.user?.mustChangePassword));
        setRole(res.user?.role === "ADMIN" ? "ADMIN" : "EDITOR");
      })
      .catch(() => {
        if (cancelled) return;
        setMustChange(
          Boolean((session.user as { mustChangePassword?: boolean }).mustChangePassword),
        );
        setRole(
          (session.user as { role?: string }).role === "ADMIN" ? "ADMIN" : "EDITOR",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [session, isPending, router, pathname]);

  useEffect(() => {
    if (mustChange === null) return;
    if (mustChange && !isForcePassword) {
      router.replace("/admin/change-password");
    }
  }, [mustChange, isForcePassword, router]);

  useEffect(() => {
    if (role === "EDITOR" && pathname.startsWith("/admin/users")) {
      router.replace("/admin");
    }
  }, [role, pathname, router]);

  const visibleAccount = useMemo(
    () => accountNav.filter((n) => !n.adminOnly || role === "ADMIN"),
    [role],
  );

  const allNav = useMemo(() => [...contentNav, ...visibleAccount], [visibleAccount]);

  if (isPending || !session || mustChange === null || role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] text-slate-500">
        A carregar backoffice…
      </div>
    );
  }

  if (mustChange && isForcePassword) {
    return <div className="min-h-screen bg-[#f6f7fb]">{children}</div>;
  }

  if (mustChange) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] text-slate-500">
        A redirecionar…
      </div>
    );
  }

  const title =
    allNav.find((n) =>
      n.match ? n.match(pathname) : pathname === n.href || pathname.startsWith(n.href + "/"),
    )?.label ?? "Backoffice";

  return (
    <div className="admin-backoffice min-h-screen bg-[#f6f7fb] text-slate-800">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-slate-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center gap-2 px-4 py-6">
          <Link href="/admin" className="flex flex-col items-center gap-2 no-underline">
            <Image src="/logo1.webp" alt="Corujinha" width={72} height={72} className="h-14 w-14 object-contain" />
            <span className="text-sm font-bold text-pink-600">Backoffice</span>
          </Link>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {role === "ADMIN" ? "Admin" : "Editor"}
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Conteúdo
          </p>
          {contentNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
          <hr className="my-3 border-slate-100" />
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Conta
          </p>
          {visibleAccount.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        <div className="space-y-2 border-t border-slate-100 p-4">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl bg-pink-50 px-3 py-2 text-center text-xs font-bold text-pink-700 hover:bg-pink-100"
          >
            Ver site público ↗
          </a>
          <button
            type="button"
            className="w-full rounded-xl bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
            onClick={() => authClient.signOut().then(() => router.push("/admin/login"))}
          >
            Terminar sessão
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-[#f6f7fb]/90 px-4 py-4 backdrop-blur md:px-6 lg:px-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg p-2 text-slate-600 hover:bg-white lg:hidden"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Abrir menu"
              >
                ☰
              </button>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
              </div>
            </div>
            <AdminUserMenu name={session.user.name || session.user.email || "Utilizador"} />
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
