import Image from "next/image";
import Link from "next/link";
import { PostsSection } from "@/components/site/posts-section";
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

const toneCard = {
  pink: "from-pink-50 to-pink-100",
  orange: "from-orange-50 to-orange-100",
  blue: "from-blue-50 to-blue-100",
} as const;

const toneIcon = {
  pink: "bg-pink",
  orange: "bg-orange",
  blue: "bg-blue",
} as const;

const toneBg = {
  pink: "bg-pink-100 text-pink",
  orange: "bg-orange-100 text-orange",
  blue: "bg-blue-100 text-blue",
} as const;

const checkTone = {
  pink: "text-pink",
  orange: "text-orange",
  blue: "text-blue",
} as const;

export default async function HomePage() {
  const [data, settings] = await Promise.all([getHome(), getSettings()]);
  const content = mergeSiteContent(settings?.content as SiteContent | null);
  const team = data?.team ?? [];
  const posts = data?.posts ?? [];
  const gallery = data?.gallery ?? [];
  const formations = data?.formations ?? [];
  const hero = content.hero;
  const services = content.services;
  const about = content.about;
  const partner = content.partner;
  const contact = content.contact;
  const social = content.social;
  const faqPreview = social.faq.slice(0, 4);

  return (
    <>
      {/* Hero — estilo Laravel */}
      <section id="home" className="bg-gradient-to-br from-pink-50 via-white to-orange-50">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6 animate-rise">
              <h1 className="font-display text-4xl font-bold leading-tight text-ink md:text-6xl">
                {hero.titleBefore}{" "}
                <span className="text-pink">{hero.titlePink}</span> {hero.titleMid}{" "}
                <span className="text-orange">{hero.titleOrange}</span>
              </h1>
              <p className="text-lg leading-relaxed text-muted md:text-xl">{hero.subtitle}</p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/#contact"
                  className="rounded-full bg-pink px-8 py-3 font-medium text-white shadow-lg transition hover:scale-105 hover:bg-pink-dark"
                >
                  {hero.ctaPrimary}
                </Link>
                <Link
                  href="/about"
                  className="rounded-full border-2 border-pink px-8 py-3 font-medium text-pink transition hover:bg-pink-50"
                >
                  {hero.ctaSecondary}
                </Link>
              </div>
            </div>
            <div className="relative animate-rise-delay">
              <div className="rounded-3xl bg-gradient-to-br from-pink-400 to-orange-400 p-8 shadow-2xl transition hover:rotate-1">
                <Image
                  src={hero.logoPath || "/logo1.webp"}
                  alt="Corujinha"
                  width={520}
                  height={520}
                  className="h-auto w-full"
                  priority
                />
              </div>
              <div className="absolute -bottom-6 -left-4 rounded-2xl bg-white p-4 shadow-xl sm:-left-6">
                <p className="text-lg font-bold text-ink">{hero.badgeValue}</p>
                <p className="text-sm text-muted">{hero.badgeLabel}</p>
              </div>
            </div>
          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-3">
            {hero.features.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl bg-white p-8 shadow-lg transition hover:-translate-y-2 hover:shadow-xl"
              >
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-xl ${toneBg[f.tone]}`}
                  aria-hidden
                >
                  <span className="text-2xl font-bold">·</span>
                </div>
                <h3 className="text-xl font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-muted">{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* About — card story + foto rotate-3 */}
      <section id="about" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            {about.sectionTitle} <span className="text-pink">{about.sectionAccent}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-xl text-muted">{about.sectionSubtitle}</p>
          <div className="mx-auto mt-12 max-w-4xl rounded-3xl bg-gradient-to-br from-pink-50 to-orange-50 p-8 shadow-xl md:p-12">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div className="text-left">
                <h3 className="font-display text-3xl font-bold">Conheça a Fundadora</h3>
                <p className="mt-2 text-2xl font-semibold text-pink">{about.founderName}</p>
                <p className="text-muted">{about.founderRole}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted">{about.founderBio}</p>
                <blockquote className="mt-4 border-l-4 border-pink-400 pl-4 text-sm italic text-ink/80">
                  {about.quote}
                </blockquote>
                <Link
                  href="/about"
                  className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-pink to-orange px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-105"
                >
                  História completa →
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-0 rotate-3 rounded-2xl bg-gradient-to-br from-pink-400 to-orange-400" />
                <Image
                  src={about.founderImagePath || "/Vera.webp"}
                  alt={about.founderName}
                  width={480}
                  height={560}
                  className="relative w-full rounded-2xl object-cover shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços — cards tintados + banner CTA */}
      <section id="services" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <h2 className="font-display text-4xl font-bold md:text-5xl">
              {services.title} <span className="text-pink">{services.titleAccent}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-xl text-muted">{services.subtitle}</p>
          </div>
          <div className="mb-12 grid gap-8 md:grid-cols-3">
            {services.cards.map((card) => (
              <article
                key={card.title}
                className={`rounded-3xl bg-gradient-to-br p-8 transition hover:-translate-y-2 hover:shadow-2xl ${toneCard[card.tone]}`}
              >
                <div
                  className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg ${toneIcon[card.tone]}`}
                  aria-hidden
                >
                  ★
                </div>
                <h3 className="font-display text-2xl font-bold">{card.title}</h3>
                <p className="mt-4 leading-relaxed text-ink/80">{card.description}</p>
                <ul className="mt-6 space-y-2">
                  {card.items.map((item) => (
                    <li key={item} className={`flex gap-2 text-ink/80`}>
                      <span className={checkTone[card.tone]} aria-hidden>
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="rounded-3xl bg-gradient-to-r from-pink to-orange p-8 text-center text-white shadow-xl md:p-12">
            <h3 className="font-display text-2xl font-bold md:text-3xl">Pronto para começar?</h3>
            <p className="mx-auto mt-3 max-w-xl text-white/90">
              Lobão e São João de Ver · {contact.hoursLines[0] ?? "Horários personalizados"}
            </p>
            <Link
              href="/#contact"
              className="mt-6 inline-flex rounded-full bg-white px-8 py-3 font-semibold text-pink shadow-lg transition hover:scale-105"
            >
              Pedir inscrição
            </Link>
          </div>
        </div>
      </section>

      {/* Galeria — só se houver imagens */}
      {gallery.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 text-center">
              <span className="mb-3 inline-flex rounded-full bg-pink-100 px-4 py-2 text-sm font-semibold text-pink">
                Galeria
              </span>
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Momentos na <span className="text-pink">Corujinha</span>
              </h2>
            </div>
            <div className="mb-8 text-center">
              <Link
                href="/galeria"
                className="inline-flex rounded-xl bg-gradient-to-r from-pink to-orange px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-105"
              >
                Ver galeria completa
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {gallery.slice(0, 4).map((g: { id: string; imageKey: string; alt?: string; album?: string }) => (
                <div
                  key={g.id}
                  className="group relative overflow-hidden rounded-2xl shadow-lg transition hover:scale-105"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(g.imageKey) ?? undefined}
                    alt={g.alt ?? "Galeria"}
                    className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  {g.album && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-pink backdrop-blur-sm">
                      {g.album}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Equipa — preview curto */}
      {team.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 text-center">
              <span className="mb-3 inline-flex rounded-full bg-pink-100 px-4 py-2 text-sm font-semibold text-pink">
                Equipa
              </span>
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                A Nossa <span className="text-pink">Equipa</span>
              </h2>
              <Link href="/equipa" className="mt-3 inline-block text-sm font-semibold text-pink hover:underline">
                Ver equipa completa →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {team.slice(0, 3).map((m: { id: string; name: string; description?: string; imageKey?: string }) => (
                <article
                  key={m.id}
                  className="overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 to-orange-50 shadow-lg"
                >
                  {m.imageKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(m.imageKey) ?? undefined}
                      alt={m.name}
                      className="aspect-[3/4] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center bg-blush text-4xl text-pink">
                      {m.name.charAt(0)}
                    </div>
                  )}
                  <div className="p-6 text-center">
                    <h3 className="font-display text-xl font-bold">{m.name}</h3>
                    {m.description && <p className="mt-1 text-sm font-semibold text-pink">{m.description}</p>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Notícias */}
      {posts.length > 0 && <PostsSection posts={posts} />}

      {/* Formações — só se existirem (secção azul Laravel) */}
      {formations.length > 0 && (
        <section id="training" className="bg-gradient-to-br from-blue-50 to-green-50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                As Nossas <span className="text-blue">Formações</span>
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {formations.slice(0, 4).map(
                (f: {
                  id: string;
                  name: string;
                  description?: string;
                  duration?: string;
                  location?: string;
                  entity?: { name: string };
                }) => (
                  <article key={f.id} className="rounded-3xl bg-white p-8 shadow-xl">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md" aria-hidden>
                      ★
                    </div>
                    <h3 className="font-display text-xl font-bold">{f.name}</h3>
                    {f.entity?.name && <p className="mt-1 text-sm font-medium text-blue">{f.entity.name}</p>}
                    {f.duration && <p className="mt-2 text-sm text-pink">{f.duration}</p>}
                    {f.description && <p className="mt-3 text-sm text-muted">{f.description}</p>}
                  </article>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* Partner — split purple Laravel */}
      <section id="partner" className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <span className="inline-flex rounded-full bg-pink-100 px-4 py-2 text-sm font-semibold text-pink">
              {partner.badge}
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              {partner.title} <span className="text-pink">{partner.titleAccent}</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">{partner.subtitle}</p>
          </div>
          <div className="overflow-hidden rounded-3xl bg-white shadow-2xl md:grid md:grid-cols-2">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 text-white md:p-12">
              <h3 className="font-display text-3xl font-bold">{partner.name}</h3>
              <p className="mt-2 text-xl text-purple-100">{partner.tagline}</p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {partner.services.map((s) => (
                  <div key={s} className="rounded-2xl bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 md:p-12">
              <p className="leading-relaxed text-muted">{partner.body}</p>
              {partner.website && (
                <a
                  href={partner.website}
                  className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-105"
                  target="_blank"
                  rel="noreferrer"
                >
                  Visitar site →
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testemunhos — CMS */}
      {social.testimonials.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                {social.testimonialsTitle}{" "}
                <span className="text-orange">as famílias</span>
              </h2>
              {social.testimonialsSubtitle && (
                <p className="mx-auto mt-3 max-w-2xl text-muted">{social.testimonialsSubtitle}</p>
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {social.testimonials.slice(0, 3).map((t) => (
                <blockquote
                  key={`${t.author}-${t.quote.slice(0, 24)}`}
                  className="rounded-3xl bg-gradient-to-br from-pink-50 to-orange-50 p-6 shadow-md"
                >
                  <p className="leading-relaxed text-ink/80">&ldquo;{t.quote}&rdquo;</p>
                  <footer className="mt-4">
                    <cite className="not-italic font-semibold text-ink">{t.author}</cite>
                    <p className="text-sm text-muted">{t.role}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ compacto */}
      <section id="faq" className="bg-gradient-to-br from-pink-50 to-orange-50 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              {social.faqTitle} <span className="text-pink">frequentes</span>
            </h2>
          </div>
          <div className="space-y-3">
            {faqPreview.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl bg-white p-5 shadow-md ring-1 ring-ink/5 open:shadow-lg"
              >
                <summary className="cursor-pointer list-none font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.question}
                    <span className="text-pink transition group-open:rotate-45" aria-hidden>
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

      {/* Contacto — cards tintados + form gradient Laravel */}
      <section id="contact" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl font-bold md:text-5xl">
              {contact.title} <span className="text-pink">{contact.titleAccent}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-xl text-muted">{contact.subtitle}</p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <div className="flex items-start gap-4 rounded-2xl bg-pink-50 p-6 transition hover:shadow-lg">
                <div className="shrink-0 rounded-xl bg-pink p-3 text-white" aria-hidden>
                  ☎
                </div>
                <div>
                  <h4 className="font-bold">Telefone</h4>
                  <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="text-muted hover:text-pink">
                    {contact.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl bg-orange-50 p-6 transition hover:shadow-lg">
                <div className="shrink-0 rounded-xl bg-orange p-3 text-white" aria-hidden>
                  ⌖
                </div>
                <div>
                  <h4 className="font-bold">{contact.addressMainLabel}</h4>
                  {contact.addressMainLines.map((l) => (
                    <p key={l} className="text-muted">
                      {l}
                    </p>
                  ))}
                  <h4 className="mt-3 font-bold">{contact.addressSecondaryLabel}</h4>
                  {contact.addressSecondaryLines.map((l) => (
                    <p key={l} className="text-muted">
                      {l}
                    </p>
                  ))}
                  <p className="mt-3 text-sm text-muted">{contact.hoursLines.join(" · ")}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl bg-blue-50 p-6 transition hover:shadow-lg">
                <div className="shrink-0 rounded-xl bg-blue p-3 text-white" aria-hidden>
                  ✉
                </div>
                <div>
                  <h4 className="font-bold">Email</h4>
                  <a href={`mailto:${contact.emailPrimary}`} className="block text-muted hover:text-blue">
                    {contact.emailPrimary}
                  </a>
                  <a href={`mailto:${contact.emailSecondary}`} className="block text-muted hover:text-blue">
                    {contact.emailSecondary}
                  </a>
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-pink-100 to-orange-100 p-6">
                <h4 className="font-bold">Localizações</h4>
                <ul className="mt-2 space-y-1">
                  {contact.locations.map((l) => (
                    <li key={l} className="flex items-center gap-2 text-muted">
                      <span className="text-pink" aria-hidden>
                        ✓
                      </span>
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-pink-50 to-orange-50 p-8 shadow-xl">
              <h3 className="mb-2 font-display text-2xl font-bold">Pedir inscrição</h3>
              <p className="mb-6 text-sm text-muted">Disciplina, ano e polo — respondemos com horário.</p>
              <ContactForm contact={contact} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
