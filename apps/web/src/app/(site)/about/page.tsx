import Image from "next/image";
import type { Metadata } from "next";
import { PageHeading } from "@/components/site/page-heading";
import { fetchPublicJson } from "@/lib/public-api";
import { mergeSiteContent, type SiteContent } from "@/lib/site-content";
import { mediaUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sobre nós",
  description:
    "Conheça a história, a fundadora e a missão do Centro de Apoio Escolar Corujinha.",
};

async function getSettings() {
  return fetchPublicJson<{ content?: unknown }>("/api/public/settings", ["settings"]);
}

const toneCard = {
  pink: "from-pink-50 to-pink-100",
  orange: "from-orange-50 to-orange-100",
  blue: "from-purple-50 to-purple-100",
} as const;

const toneDot = {
  pink: "bg-pink",
  orange: "bg-orange",
  blue: "bg-purple",
} as const;

/** Items still blank in the backoffice are not shown; a section with none disappears. */
export default async function AboutPage() {
  const settings = await getSettings();
  const about = mergeSiteContent(settings?.content as SiteContent | null).about;
  const experienceCards = about.experienceCards.filter((c) => c.title.trim() || c.body.trim());
  const timeline = about.timeline.filter((t) => t.title.trim() || t.description.trim());

  return (
    <div className="bg-white pb-20">
      <section className="hero-wash py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <PageHeading
            title={about.sectionTitle}
            accent={about.sectionAccent}
            subtitle={about.sectionSubtitle}
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-blush to-peach p-5 shadow-xl sm:p-8 md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold">Conheça a Fundadora</h2>
              <p className="mt-2 text-2xl font-semibold text-pink">{about.founderName}</p>
              <p className="text-muted">{about.founderRole}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted">{about.founderBio}</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 rotate-3 rounded-2xl bg-gradient-to-br from-pink-400 to-orange-400" />
              <Image
                src={mediaUrl(about.founderImagePath) || "/Vera.webp"}
                alt={about.founderName}
                width={480}
                height={560}
                className="relative aspect-[6/7] w-full rounded-2xl object-cover shadow-2xl"
              />
            </div>
          </div>
          <div className="mt-8 rounded-2xl bg-white p-6">
            <p className="leading-relaxed text-ink/80">{about.storyHtml}</p>
            <blockquote className="mt-6 border-l-4 border-pink pl-4 italic text-muted">
              “{about.quote}”
            </blockquote>
          </div>
        </div>
      </section>

      {experienceCards.length > 0 && (
      <section className="page-container py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold">{about.experienceTitle}</h2>
          <p className="mt-2 text-muted">{about.experienceSubtitle}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {experienceCards.map((c, i) => (
            <article key={i} className={`rounded-2xl bg-gradient-to-br p-6 ${toneCard[c.tone]}`}>
              <h3 className="text-lg font-bold">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/80">{c.body}</p>
            </article>
          ))}
        </div>
      </section>
      )}

      {timeline.length > 0 && (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="mb-10 text-center text-3xl font-bold">A Nossa História</h2>
        <ol className="relative space-y-8 border-l-2 border-pink/30 pl-8">
          {timeline.map((t, i) => (
            <li key={i} className="relative">
              <span className={`absolute -left-[41px] top-1 h-4 w-4 rounded-full ring-4 ring-white ${toneDot[t.tone]}`} />
              <h3 className="text-xl font-bold">{t.title}</h3>
              <p className="mt-1 text-muted">{t.description}</p>
            </li>
          ))}
        </ol>
      </section>
      )}
    </div>
  );
}
