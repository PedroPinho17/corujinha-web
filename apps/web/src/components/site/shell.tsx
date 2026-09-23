"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/about", label: "Sobre" },
  { href: "/#services", label: "Serviços" },
  { href: "/galeria", label: "Galeria" },
  { href: "/equipa", label: "Equipa" },
  { href: "/noticias", label: "Notícias" },
];

export function SiteHeader({ brand = "Corujinha" }: { brand?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-pink/10 bg-white/95 shadow-sm backdrop-blur">
      <a
        href="#main"
        className="absolute left-4 top-0 z-[60] -translate-y-full rounded-lg bg-pink px-4 py-2 text-sm font-medium text-white focus:translate-y-4"
      >
        Saltar para o conteúdo
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo.webp"
            alt=""
            width={48}
            height={48}
            className="h-10 w-10 object-contain sm:h-12 sm:w-12"
          />
          <span className="font-display text-xl font-bold text-pink sm:text-2xl">{brand}</span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Principal">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap text-sm font-medium text-ink/80 hover:text-pink"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/#contact"
            className="rounded-full bg-pink px-5 py-2 text-sm font-medium text-white hover:bg-pink-dark"
          >
            Pedir inscrição
          </Link>
        </nav>

        <button
          type="button"
          className="lg:hidden rounded-lg p-2 text-ink hover:text-pink"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-6 bg-current" />
          <span className="mt-1.5 block h-0.5 w-6 bg-current" />
          <span className="mt-1.5 block h-0.5 w-6 bg-current" />
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="flex flex-col gap-2 border-t border-ink/10 px-4 py-4 lg:hidden"
          aria-label="Principal"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="py-2 font-medium text-ink/80 hover:text-pink"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/#contact"
            className="rounded-full bg-pink px-5 py-2 text-center font-medium text-white"
            onClick={() => setOpen(false)}
          >
            Pedir inscrição
          </Link>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter({
  brand = "Corujinha",
  tagline = "Centro de Apoio Escolar — educação com carinho e dedicação.",
  phone,
  email,
  links: footerLinks,
}: {
  brand?: string;
  tagline?: string;
  phone?: string | null;
  email?: string | null;
  links?: { label: string; href: string }[];
}) {
  const items = footerLinks ?? [
    { label: "Sobre", href: "/about" },
    { label: "Galeria", href: "/galeria" },
    { label: "Equipa", href: "/equipa" },
    { label: "Notícias", href: "/noticias" },
    { label: "Contacto", href: "/#contact" },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Image src="/logo.webp" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            <p className="font-display text-xl font-bold text-pink-300">{brand}</p>
          </div>
          <p className="mt-3 text-sm text-white/70">{tagline}</p>
        </div>
        <div>
          <p className="font-semibold">Links rápidos</p>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {items.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-pink-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">Contacto</p>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {phone && (
              <li>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-pink-300">
                  {phone}
                </a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`} className="hover:text-pink-300">
                  {email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {brand}
      </div>
    </footer>
  );
}
