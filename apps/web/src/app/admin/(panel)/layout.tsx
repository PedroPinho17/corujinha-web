"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Building2,
  Contact,
  FileText,
  GraduationCap,
  Images,
  KeyRound,
  LayoutDashboard,
  Newspaper,
  PanelTop,
  Settings,
  Users,
  UsersRound,
  type LucideProps,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { adminFetch } from "@/lib/admin-api";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<LucideProps>;
  adminOnly?: boolean;
  match?: (path: string) => boolean;
};

const contentNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, match: (p) => p === "/admin" },
  { href: "/admin/teams", label: "Equipa", icon: UsersRound },
  { href: "/admin/posts", label: "Notícias", icon: Newspaper },
  { href: "/admin/entities", label: "Entidades", icon: Building2 },
  { href: "/admin/formations", label: "Formações", icon: GraduationCap },
  { href: "/admin/protocols", label: "Protocolos", icon: FileText },
  { href: "/admin/gallery", label: "Galeria", icon: Images },
  { href: "/admin/site", label: "Conteúdo do Site", icon: PanelTop },
  { href: "/admin/contacts", label: "Contactos", icon: Contact },
];

const accountNav: NavItem[] = [
  { href: "/admin/users", label: "Utilizadores", icon: Users, adminOnly: true },
  { href: "/admin/profile", label: "Perfil", icon: Settings },
  { href: "/admin/security", label: "Segurança", icon: KeyRound },
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
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium no-underline transition ${
        active
          ? "bg-pink-50 text-pink-800 ring-1 ring-pink-100"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon
        className={`h-[18px] w-[18px] shrink-0 ${active ? "text-pink-600" : "text-slate-400"}`}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="nav-link-text leading-none">{item.label}</span>
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
        const needsChange = Boolean(res.user?.mustChangePassword);
        setMustChange(needsChange);
        setRole(res.user?.role === "ADMIN" ? "ADMIN" : "EDITOR");
        if (needsChange) {
          router.replace("/admin/change-password");
        }
      })
      .catch(() => {
        if (cancelled) return;
        const needsChange = Boolean(
          (session.user as { mustChangePassword?: boolean }).mustChangePassword,
        );
        setMustChange(needsChange);
        setRole(
          (session.user as { role?: string }).role === "ADMIN" ? "ADMIN" : "EDITOR",
        );
        if (needsChange) {
          router.replace("/admin/change-password");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session, isPending, router, pathname]);

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
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-slate-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="shrink-0 border-b border-slate-100 px-4 py-4">
          <Link href="/admin" className="flex items-center gap-3 no-underline">
            <Image
              src="/logo.webp"
              alt="Corujinha"
              width={120}
              height={54}
              className="h-11 w-auto object-contain"
              priority
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-pink-600">Backoffice</p>
              <span className="mt-0.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {role === "ADMIN" ? "Admin" : "Editor"}
              </span>
            </div>
          </Link>
        </div>

        <nav className="admin-sidebar-nav flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2.5 py-3">
          <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
          <hr className="my-2.5 border-slate-100" />
          <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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

        <div className="shrink-0 space-y-2 border-t border-slate-100 p-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl bg-pink-50 px-3 py-2.5 text-center text-xs font-bold text-pink-700 hover:bg-pink-100"
          >
            Ver site público ↗
          </a>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
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

      <div className="lg:pl-[248px]">
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
