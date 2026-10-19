"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/about", label: "Sobre" },
  { href: "/#services", label: "Serviços" },
  { href: "/galeria", label: "Galeria" },
  { href: "/equipa", label: "Equipa" },
  { href: "/noticias", label: "Novidades" },
  { href: "/#contact", label: "Contacto" },
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
        <Link href="/" className="flex shrink-0 items-center" aria-label={brand}>
          <Image
            src="/logo.webp"
            alt={brand}
            width={160}
            height={72}
            priority
            className="h-11 w-auto object-contain sm:h-12"
          />
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
          className="rounded-lg p-2 text-ink hover:text-pink lg:hidden"
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
