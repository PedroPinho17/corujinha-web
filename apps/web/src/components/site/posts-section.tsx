import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, ExternalLink, Mail, Megaphone, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/site/page-heading";
import { mediaUrl } from "@/lib/utils";

export type PostItem = {
  id: string;
  title: string;
  content?: string | null;
  imageKey?: string | null;
  link?: string | null;
  phone?: string | null;
  email?: string | null;
  featured?: boolean;
  publishedAt?: string | Date | null;
};

function formatDate(value?: string | Date | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    iso: date.toISOString(),
    label: new Intl.DateTimeFormat("pt-PT", {
      dateStyle: "long",
      timeZone: "Europe/Lisbon",
    }).format(date),
  };
}

function PostDate({ value }: { value?: string | Date | null }) {
  const date = formatDate(value);
  if (!date) return null;
  return (
    <time dateTime={date.iso} className="inline-flex items-center gap-1.5 text-sm text-muted">
      <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
      {date.label}
    </time>
  );
}

/** Posters carry text, so they are always shown whole, at their natural proportions. */
function PostImage({ post }: { post: PostItem }) {
  const src = mediaUrl(post.imageKey);
  if (src) {
    return (
      <Image
        src={src}
        alt={post.title}
        width={1000}
        height={1000}
        sizes="(min-width: 1024px) 510px, 100vw"
        className="block h-auto w-full"
      />
    );
  }
  return (
    <div className="flex aspect-[4/3] h-full w-full items-center justify-center bg-gradient-to-br from-pink-100 via-orange-50 to-purple-100">
      <Megaphone className="h-14 w-14 text-pink/40" aria-hidden />
    </div>
  );
}

function ContactRows({ post }: { post: PostItem }) {
  if (!post.phone && !post.email) return null;
  return (
    <div className="border-t border-ink/10 pt-5">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Mais informações</p>
      <ul className="mt-2">
        {post.phone && (
          <li>
            <a
              href={`tel:${post.phone.replace(/\s/g, "")}`}
              className="group inline-flex min-h-11 items-center gap-3 font-medium text-ink hover:text-pink"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush text-pink">
                <Phone className="h-4 w-4" aria-hidden />
              </span>
              {post.phone}
            </a>
          </li>
        )}
        {post.email && (
          <li>
            <a
              href={`mailto:${post.email}`}
              className="group inline-flex min-h-11 max-w-full items-center gap-3 font-medium text-ink hover:text-pink"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush text-pink">
                <Mail className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 [overflow-wrap:anywhere]">{post.email}</span>
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}

function LearnMore({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-pink px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-pink-dark"
    >
      Saber mais
      <ExternalLink className="h-4 w-4" aria-hidden />
      <span className="sr-only">(abre noutra janela)</span>
    </a>
  );
}

/** Most recent or highlighted post: image beside the full text. */
function LeadPost({ post }: { post: PostItem }) {
  return (
    <article className="grid overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(219,39,119,0.1)] ring-1 ring-pink/10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="bg-peach">
        <PostImage post={post} />
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-5 p-6 sm:p-8 lg:p-12">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {post.featured && (
            <Badge variant="pink" className="px-3 py-1 text-xs">
              Em destaque
            </Badge>
          )}
          <PostDate value={post.publishedAt} />
        </div>
        <h2 className="font-display text-3xl font-bold leading-tight text-ink lg:text-4xl">
          {post.title}
        </h2>
        {post.content && (
          <p className="whitespace-pre-line text-lg leading-relaxed text-muted">{post.content}</p>
        )}
        {post.link && <LearnMore href={post.link} />}
        <ContactRows post={post} />
      </div>
    </article>
  );
}

function PostCard({ post }: { post: PostItem }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.06)] ring-1 ring-ink/[0.04]">
      <div className="bg-peach">
        <PostImage post={post} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6 md:p-7">
        <PostDate value={post.publishedAt} />
        <h2 className="font-display text-2xl font-bold leading-snug text-ink">{post.title}</h2>
        {post.content && (
          <p className="whitespace-pre-line leading-relaxed text-muted">{post.content}</p>
        )}
        {post.link && <LearnMore href={post.link} />}
        <ContactRows post={post} />
      </div>
    </article>
  );
}

function ContactBanner() {
  return (
    <aside className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-gradient-to-r from-pink to-pink-dark p-6 text-white sm:flex-row sm:items-center sm:p-8">
      <div>
        <h2 className="font-display text-2xl font-bold">Tem dúvidas sobre uma formação?</h2>
        <p className="mt-1 text-white/90">Fale connosco: ajudamos a escolher a melhor opção.</p>
      </div>
      <Link
        href="/#contact"
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-pink-dark transition hover:bg-blush"
      >
        Falar connosco
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </aside>
  );
}

export function PostsPageSection({ posts }: { posts: PostItem[] }) {
  const [lead, ...others] = posts;

  return (
    <section className="hero-wash py-12 md:py-16">
      <div className="page-container">
        <div className="mb-10 md:mb-12">
          <PageHeading
            title="As Nossas"
            accent="Novidades"
            subtitle="Formações, parcerias, oportunidades e muito mais."
          />
        </div>

        {lead ? (
          <div className="space-y-6 md:space-y-8">
            <LeadPost post={lead} />
            {others.length > 0 && (
              <div className="grid items-start gap-6 md:grid-cols-2 md:gap-8">
                {others.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
            <ContactBanner />
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-ink/15 bg-white/60 px-4 py-16 text-center">
            <Megaphone className="mx-auto mb-3 h-10 w-10 text-pink/30" aria-hidden />
            <p className="text-lg text-muted">Nenhuma novidade disponível no momento.</p>
            <Link href="/#contact" className="mt-3 inline-block py-2 font-semibold text-pink hover:underline">
              Fale connosco
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
