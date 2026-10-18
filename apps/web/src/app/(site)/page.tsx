import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookOpen,
  Briefcase,
  Clock,
  GraduationCap,
  Heart,
  Mail,
  MapPin,
  Megaphone,
  Newspaper,
  Palette,
  Phone,
  Star,
  Sun,
  Users,
} from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { mediaUrl } from "@/lib/utils";
import { mergeSiteContent, type SiteContent } from "@/lib/site-content";

const api = process.env.INTERNAL_API_URL ?? "http://localhost:3001";

async function getHome() {
  try {
    const res = await fetch(`${api}/api/public/home`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getSettings() {
  try {
    const res = await fetch(`${api}/api/public/settings`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

type BrandTone = "pink" | "orange" | "purple";

function brandTone(raw: "pink" | "orange" | "blue"): BrandTone {
  if (raw === "orange") return "orange";
  if (raw === "blue") return "purple";
  return "pink";
}

const toneSoft: Record<BrandTone, string> = {
  pink: "bg-pink-100 text-pink",
  orange: "bg-orange-100 text-orange",
  purple: "bg-purple-100 text-purple",
};

const toneDot: Record<BrandTone, string> = {
  pink: "bg-pink",
  orange: "bg-orange",
  purple: "bg-purple",
};

const checkTone: Record<BrandTone, string> = {
  pink: "text-pink",
  orange: "text-orange",
  purple: "text-purple",
};

const featureIcons = [BookOpen, Sun, Heart] as const;
const serviceIcons = [GraduationCap, Palette, Briefcase] as const;
const galleryPastels = [
  "from-pink-100 to-rose-200",
  "from-orange-100 to-amber-200",
  "from-purple-100 to-fuchsia-200",
  "from-rose-100 to-pink-200",
  "from-amber-100 to-orange-200",
  "from-violet-100 to-purple-200",
] as const;

type GalleryItem = { id: string; imageKey: string; alt?: string | null; album?: string | null };
type TeamItem = { id: string; name: string; imageKey?: string | null };
type PostItem = {
  id: string;
  title: string;
  content?: string | null;
  imageKey?: string | null;
  publishedAt?: string | Date | null;
  createdAt?: string | Date | null;
};
type FormationItem = {
  id: string;
  name: string;
  description?: string | null;
  duration?: string | null;
  entity?: { name: string } | null;
};

type NewsItem = {
  id: string;
  kind: "Notícia" | "Formação" | "Parceria";
  title: string;
  summary?: string | null;
  imageKey?: string | null;
  href?: string | null;
  date: Date | null;
};

function asDate(value?: string | Date | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function telHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `tel:+${digits.startsWith("351") ? digits : `351${digits}`}`;
}

function phoneLabel(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("351") ? digits.slice(3) : digits;
  if (local.length === 9) return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  return phone.replace(/^\+351\s?/, "");
}

function GradientWord({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-pink to-orange bg-clip-text text-transparent">{children}</span>
  );
}

export default async function HomePage() {
  const [data, settings] = await Promise.all([getHome(), getSettings()]);
  const content = mergeSiteContent(settings?.content as SiteContent | null);
  const team = (data?.team ?? []) as TeamItem[];
  const posts = (data?.posts ?? []) as PostItem[];
  const gallery = (data?.gallery ?? []) as GalleryItem[];
  const formations = (data?.formations ?? []) as FormationItem[];
  const hero = content.hero;
  const services = content.services;
  const about = content.about;
  const partner = content.partner;
  const contact = content.contact;
  const social = content.social;
  const faqPreview = social.faq.slice(0, 5);
  const phone = settings?.contactPhone ?? contact.phone;

  const googlePlaceUrl =
    process.env.NEXT_PUBLIC_GOOGLE_PLACE_URL ??
    "https://www.google.com/maps/place/Corujinha/@40.9678744,-8.4903562,17z/data=!3m1!4b1!4m6!3m5!1s0xd247f83484b6231:0x9c3013157ecde0bd!8m2!3d40.9678744!4d-8.4903562!16s%2Fg%2F11kc28q8g1";
  const googleRating = process.env.NEXT_PUBLIC_GOOGLE_RATING?.trim() || null;
  const googleReviewCount = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_COUNT?.trim() || null;

  // Hero = 1.ª foto; pré-visualização começa na 2.ª para não repetir a mesma imagem
  const heroItem = gallery[0] ?? null;
  const heroPhoto = heroItem ? mediaUrl(heroItem.imageKey) : null;
  const galleryPreview = gallery.length > 1 ? gallery.slice(1, 7) : gallery.slice(0, 6);

  const newsItems: NewsItem[] = [
    ...posts.map((p) => ({
      id: `post-${p.id}`,
      kind: "Notícia" as const,
      title: p.title,
      summary: p.content,
      imageKey: p.imageKey,
      href: "/noticias",
      date: asDate(p.publishedAt) ?? asDate(p.createdAt),
    })),
    ...formations.map((f) => ({
      id: `formation-${f.id}`,
      kind: "Formação" as const,
      title: f.name,
      summary:
        f.description ??
        (f.entity?.name ? `${f.entity.name}${f.duration ? ` · ${f.duration}` : ""}` : f.duration),
      imageKey: null,
      href: "/noticias",
      date: null,
    })),
    {
      id: "partner-labirintologico",
      kind: "Parceria" as const,
      title: partner.name,
      summary: partner.tagline || partner.body,
      imageKey: null,
      href: partner.website ?? "/noticias",
      date: null,
    },
  ].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const featuredNews = newsItems[0];
  let compactNews = newsItems.slice(1, 3);
  if (compactNews.length < 2 && partner.services.length) {
    compactNews = [
      ...compactNews,
      ...partner.services.slice(0, 2 - compactNews.length).map((s, i) => ({
        id: `partner-svc-${i}`,
        kind: "Parceria" as const,
        title: s,
        summary: partner.tagline,
        imageKey: null,
        href: partner.website ?? "/noticias",
        date: null,
      })),
    ];
  }

  return (
    <>
      {/* Hero + cartões flutuantes */}
      <section id="home" className="relative bg-gradient-to-b from-pink-50 via-white to-white">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 md:pb-14 md:pt-16">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
            <div className="space-y-6 animate-rise">
              <h1 className="font-display text-4xl font-bold leading-[1.15] text-ink md:text-5xl lg:text-6xl">
                {hero.titleBefore}{" "}
                <GradientWord>
                  {hero.titlePink} {hero.titleMid} {hero.titleOrange}
                </GradientWord>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted md:text-lg">{hero.subtitle}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/#contact"
                  className="rounded-full bg-pink px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-pink/25 transition hover:bg-pink-dark"
                >
                  {hero.ctaPrimary || "Pedir inscrição"}
                </Link>
                <a
                  href={telHref(phone)}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-pink bg-white px-7 py-3 text-sm font-semibold text-pink transition hover:bg-pink-50"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  Ligar {phoneLabel(phone)}
                </a>
              </div>
            </div>

            <div className="relative animate-rise-delay">
              <div className="overflow-hidden rounded-[2rem] border-2 border-dashed border-pink/50 bg-white p-3 shadow-[0_20px_60px_rgba(219,39,119,0.12)]">
                {heroPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroPhoto}
                    alt={heroItem?.alt || "Centro Corujinha — espaço e atividades"}
                    className="aspect-[4/3] w-full rounded-[1.5rem] object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-gradient-to-br from-pink-50 via-white to-orange-50 px-6 text-center">
                    <Image
                      src={hero.logoPath || "/logo1.webp"}
                      alt="Logótipo Corujinha"
                      width={280}
                      height={280}
                      className="h-auto w-full max-w-[220px] object-contain"
                      priority
                    />
                    <p className="text-sm font-medium text-muted">Educação com carinho</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cartões a flutuar sob o hero */}
          <div className="relative z-10 mt-10 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-5">
            {hero.features.map((f, i) => {
              const Icon = featureIcons[i] ?? BookOpen;
              const tone = brandTone(f.tone);
              return (
                <article
                  key={f.title}
                  className="rounded-2xl bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] ring-1 ring-ink/[0.04] transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${toneSoft[tone]}`}
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-ink">{f.title}</h3>
                      <p className="mt-1 text-sm leading-snug text-muted">{f.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="services" className="bg-white pb-16 pt-16 md:pb-20 md:pt-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl font-bold md:text-5xl">
              {services.title} <GradientWord>{services.titleAccent}</GradientWord>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">{services.subtitle}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {services.cards.map((card, i) => {
              const Icon = serviceIcons[i] ?? GraduationCap;
              const tone = brandTone(card.tone);
              return (
                <article
                  key={card.title}
                  className="rounded-3xl bg-white p-7 shadow-[0_12px_40px_rgba(0,0,0,0.06)] ring-1 ring-ink/[0.04] transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md ${toneDot[tone]}`}
                    aria-hidden
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-ink">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{card.description}</p>
                  <ul className="mt-5 space-y-2.5">
                    {card.items.slice(0, 3).map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-ink/80">
                        <span className={`mt-0.5 ${checkTone[tone]}`} aria-hidden>
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sobre — foto à esquerda (como mockup) */}
      <section id="about" className="bg-purple-50/60 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
            <div className="relative mx-auto w-full max-w-md md:mx-0">
              <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-pink-300/40 to-purple-300/40 blur-sm" />
              <Image
                src={about.founderImagePath || "/Vera.webp"}
                alt={`Fotografia de ${about.founderName}, fundadora da Corujinha`}
                width={480}
                height={600}
                className="relative aspect-[4/5] w-full rounded-[1.75rem] object-cover shadow-2xl"
              />
            </div>
            <div>
              <h2 className="font-display text-4xl font-bold md:text-5xl">
                {about.sectionTitle} <GradientWord>{about.sectionAccent}</GradientWord>
              </h2>
              <p className="mt-3 text-xl font-semibold text-pink">{about.founderName}</p>
              <p className="text-sm font-medium text-muted">{about.founderRole}</p>
              <p className="mt-5 text-base leading-relaxed text-muted">{about.founderBio}</p>
              <blockquote className="mt-6 rounded-2xl bg-white/80 p-5 text-sm italic leading-relaxed text-ink/80 shadow-sm ring-1 ring-purple-100">
                “{about.quote}”
              </blockquote>
              <Link
                href="/about"
                className="mt-6 inline-flex rounded-full border-2 border-pink bg-white px-6 py-2.5 text-sm font-semibold text-pink transition hover:bg-pink-50"
              >
                Saiba mais
              </Link>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <div className="flex -space-x-2" aria-hidden>
                  {(team.length
                    ? team
                    : [
                        { id: "a", name: "" },
                        { id: "b", name: "" },
                        { id: "c", name: "" },
                      ]
                  )
                    .slice(0, 3)
                    .map((m) => {
                      const src = m.imageKey ? mediaUrl(m.imageKey) : null;
                      return src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={m.id}
                          src={src}
                          alt=""
                          className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm"
                        />
                      ) : (
                        <span
                          key={m.id}
                          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-pink-100 text-xs font-bold text-pink shadow-sm"
                        >
                          {m.name ? m.name.charAt(0) : <Users className="h-4 w-4" />}
                        </span>
                      );
                    })}
                </div>
                <p className="max-w-sm text-sm text-muted">
                  A Dra. Vera conta com uma equipa de professores dedicados.{" "}
                  <Link href="/equipa" className="font-semibold text-pink hover:underline">
                    Conheça a equipa →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Galeria */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <h2 className="font-display text-4xl font-bold md:text-5xl">
              Galeria de <GradientWord>Momentos</GradientWord>
            </h2>
          </div>
          {/* 1 grande + 5: no desktop preenche 3 colunas sem buraco na última fila */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {(galleryPreview.length
              ? galleryPreview
              : Array.from({ length: 6 }, (_, i) => ({
                  id: `ph-${i}`,
                  imageKey: "",
                  alt: null,
                  album: ["Sala", "Atividades", "Estudo", "Férias", "Equipa", "Espaço"][i],
                }))
            ).map((g, i) => {
              const src = g.imageKey ? mediaUrl(g.imageKey) : null;
              const featured = i === 0;
              return (
                <div
                  key={g.id}
                  className={`group relative overflow-hidden rounded-2xl shadow-md ${
                    featured
                      ? "aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[280px]"
                      : "aspect-[4/3]"
                  }`}
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={g.alt || `Fotografia da galeria Corujinha${g.album ? ` — ${g.album}` : ""}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className={`flex h-full min-h-[120px] flex-col items-center justify-center bg-gradient-to-br p-4 text-center ${galleryPastels[i % galleryPastels.length]}`}
                    >
                      <Sun className="mb-2 h-6 w-6 text-ink/30" aria-hidden />
                      <p className="text-xs font-semibold text-ink/50">{g.album || "Momento"}</p>
                    </div>
                  )}
                  {g.album && src && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-pink backdrop-blur-sm">
                      {g.album}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/galeria"
              className="inline-flex rounded-full border-2 border-pink bg-white px-7 py-2.5 text-sm font-semibold text-pink transition hover:bg-pink-50"
            >
              Ver galeria
            </Link>
          </div>
        </div>
      </section>

      {/* Novidades */}
      {featuredNews && (
        <section id="novidades" className="bg-gradient-to-b from-orange-50/90 via-[#fff7ed] to-pink-50/50 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-pink">Novidades</p>
              <h2 className="font-display text-4xl font-bold md:text-5xl">
                Fique a par do que <GradientWord>acontece</GradientWord>
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
              <article className="overflow-hidden rounded-3xl bg-white shadow-[0_16px_50px_rgba(0,0,0,0.07)] lg:col-span-3">
                <div className="relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-orange-100">
                  {featuredNews.imageKey && mediaUrl(featuredNews.imageKey) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(featuredNews.imageKey)!}
                      alt={featuredNews.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Megaphone className="h-16 w-16 text-pink/35" aria-hidden />
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-pink px-3 py-1 text-[11px] font-bold text-white shadow">
                    {featuredNews.kind}
                  </span>
                </div>
                <div className="p-6 md:p-8">
                  <h3 className="font-display text-2xl font-bold text-ink md:text-3xl">{featuredNews.title}</h3>
                  {featuredNews.summary && (
                    <p className="mt-3 line-clamp-3 text-muted">{featuredNews.summary}</p>
                  )}
                </div>
              </article>

              <div className="flex flex-col gap-4 lg:col-span-2">
                {compactNews.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-1 gap-4 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink"
                      aria-hidden
                    >
                      {item.kind === "Formação" ? (
                        <GraduationCap className="h-5 w-5" />
                      ) : item.kind === "Parceria" ? (
                        <Heart className="h-5 w-5" />
                      ) : (
                        <Newspaper className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-orange">{item.kind}</p>
                      <h3 className="mt-1 font-display text-lg font-bold leading-snug text-ink">{item.title}</h3>
                      {item.summary && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{item.summary}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/noticias"
                className="inline-flex rounded-full border-2 border-pink bg-white px-8 py-2.5 text-sm font-semibold text-pink transition hover:bg-pink-50"
              >
                Ver todas
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testemunhos */}
      {social.testimonials.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                {social.testimonialsTitle} <GradientWord>as famílias</GradientWord>
              </h2>
              {googleRating && googleReviewCount ? (
                <p className="mt-3 flex items-center justify-center gap-2 text-muted">
                  <Star className="h-4 w-4 fill-orange text-orange" aria-hidden />
                  <span className="font-semibold text-ink">{googleRating}</span>
                  no Google · {googleReviewCount} avaliações
                </p>
              ) : social.testimonialsSubtitle ? (
                <p className="mx-auto mt-3 max-w-2xl text-muted">{social.testimonialsSubtitle}</p>
              ) : null}
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {social.testimonials.slice(0, 3).map((t) => (
                <blockquote
                  key={`${t.author}-${t.quote.slice(0, 24)}`}
                  className="rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] ring-1 ring-ink/[0.04]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink to-orange text-sm font-bold text-white"
                      aria-hidden
                    >
                      {t.author
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div>
                      <cite className="not-italic font-semibold text-ink">{t.author}</cite>
                      <p className="text-xs text-muted">{t.role || "no Google"}</p>
                    </div>
                  </div>
                  <div className="mb-3 flex gap-0.5 text-orange" aria-label="5 estrelas">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-ink/80">&ldquo;{t.quote}&rdquo;</p>
                </blockquote>
              ))}
            </div>
            <div className="mt-8 text-center">
              <a
                href={googlePlaceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full bg-pink px-7 py-2.5 text-sm font-semibold text-white shadow-md shadow-pink/20 transition hover:bg-pink-dark"
              >
                Ver todas no Google
              </a>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="faq" className="bg-pink-50/70 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              {social.faqTitle} <GradientWord>frequentes</GradientWord>
            </h2>
          </div>
          <div className="space-y-3">
            {faqPreview.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.04] open:shadow-md"
              >
                <summary className="cursor-pointer list-none font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.question}
                    <span className="text-lg text-pink transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contact" className="bg-gradient-to-b from-white to-pink-50/50 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl font-bold md:text-5xl">
              {contact.title} <GradientWord>{contact.titleAccent}</GradientWord>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">{contact.subtitle}</p>
          </div>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink text-white" aria-hidden>
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-ink">Telefone</h4>
                  <a href={telHref(phone)} className="text-muted hover:text-pink">
                    {phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange text-white" aria-hidden>
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-ink">{contact.addressMainLabel}</h4>
                  {contact.addressMainLines.map((l) => (
                    <p key={l} className="text-muted">
                      {l}
                    </p>
                  ))}
                  <h4 className="mt-3 font-bold text-ink">{contact.addressSecondaryLabel}</h4>
                  {contact.addressSecondaryLines.map((l) => (
                    <p key={l} className="text-muted">
                      {l}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple text-white" aria-hidden>
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-ink">Horário</h4>
                  {contact.hoursLines.map((l) => (
                    <p key={l} className="text-muted">
                      {l}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-dark text-white" aria-hidden>
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-ink">Email</h4>
                  <a href={`mailto:${contact.emailPrimary}`} className="block text-muted hover:text-pink">
                    {contact.emailPrimary}
                  </a>
                  <a href={`mailto:${contact.emailSecondary}`} className="block text-muted hover:text-pink">
                    {contact.emailSecondary}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-[0_20px_60px_rgba(219,39,119,0.1)] ring-1 ring-pink/10 md:p-9">
              <h3 className="mb-1 font-display text-2xl font-bold">Pedir inscrição</h3>
              <p className="mb-6 text-sm text-muted">Disciplina, ano e polo — respondemos com horário.</p>
              <ContactForm contact={contact} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
