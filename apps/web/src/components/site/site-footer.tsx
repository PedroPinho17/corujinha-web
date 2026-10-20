import Image from "next/image";
import Link from "next/link";
import { MobileContactBar } from "@/components/site/mobile-contact-bar";

const DEFAULT_LINKS = [
  { label: "Sobre", href: "/about" },
  { label: "Galeria", href: "/galeria" },
  { label: "Equipa", href: "/equipa" },
  { label: "Novidades", href: "/noticias" },
  { label: "Contacto", href: "/#contact" },
  { label: "Privacidade", href: "/privacidade" },
];

type CenterLink = {
  name: string;
  shortName?: string | null;
  address?: string | null;
  city?: string | null;
};

const FALLBACK_CENTERS: CenterLink[] = [
  { name: "Lobão" },
  { name: "São João de Ver" },
  { name: "Sanguedo" },
];

export function SiteFooter({
  brand = "Corujinha",
  tagline = "Centro de Apoio Escolar — educação com carinho e dedicação.",
  phone,
  email,
  whatsapp,
  links: footerLinks,
  centers,
}: {
  brand?: string;
  tagline?: string;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  links?: { label: string; href: string }[];
  centers?: CenterLink[] | null;
}) {
  const base = footerLinks?.length ? footerLinks : DEFAULT_LINKS;
  const items = base.some((l) => l.href === "/privacidade")
    ? base
    : [...base, { label: "Privacidade", href: "/privacidade" }];
  const year = new Date().getFullYear();
  const centerList = centers?.length ? centers : FALLBACK_CENTERS;

  return (
    <>
      <footer className="border-t border-pink/15 bg-gradient-to-b from-blush via-white to-peach pb-24 md:pb-0">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4 md:gap-8">
          <div>
            <Image
              src="/logo.webp"
              alt={brand}
              width={160}
              height={72}
              className="h-12 w-auto object-contain"
            />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{tagline}</p>
          </div>
          <div>
            <p className="font-display text-sm font-bold text-ink">Links rápidos</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {items.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <Link href={l.href} className="transition hover:text-pink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-display text-sm font-bold text-ink">Centros</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {centerList.map((c) => (
                <li key={c.name}>
                  <span className="font-medium text-ink/80">{c.shortName || c.name}</span>
                  {c.city || c.address ? (
                    <span className="block text-xs text-muted">
                      {[c.address, c.city].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-display text-sm font-bold text-ink">Contacto</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {phone && (
                <li>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="transition hover:text-pink">
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="transition hover:text-pink">
                    {email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-pink/10 py-4 text-center text-xs text-muted/80">
          <span suppressHydrationWarning>
            © {year} {brand}
          </span>
        </div>
      </footer>
      {phone ? <MobileContactBar phone={phone} whatsapp={whatsapp} /> : null}
    </>
  );
}
