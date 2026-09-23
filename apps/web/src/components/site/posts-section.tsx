import Link from "next/link";
import { ArrowRight, Mail, Megaphone, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, mediaUrl } from "@/lib/utils";

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

function PostImage({ post, className }: { post: PostItem; className?: string }) {
  const src = mediaUrl(post.imageKey);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={post.title}
        className={cn(
          "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-100 via-orange-50 to-blue-100",
        className,
      )}
    >
      <Megaphone className="h-12 w-12 text-pink/40" />
    </div>
  );
}

function FeaturedPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute right-3 top-3 z-10 rounded-full bg-pink px-3 py-1 text-[11px] font-bold tracking-wide text-white shadow-md",
        className,
      )}
    >
      DESTAQUE
    </span>
  );
}

function PostMeta({ post }: { post: PostItem }) {
  if (!post.phone && !post.email) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {post.phone && (
        <a
          href={`tel:${post.phone}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-pink/10 hover:text-pink"
        >
          <Phone className="h-3.5 w-3.5" />
          {post.phone}
        </a>
      )}
      {post.email && (
        <a
          href={`mailto:${post.email}`}
          className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-pink/10 hover:text-pink"
        >
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{post.email}</span>
        </a>
      )}
    </div>
  );
}

function LearnMore({ href }: { href: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group/link inline-flex items-center gap-1.5 text-sm font-semibold text-pink transition hover:text-pink-dark"
    >
      Saber Mais
      <ArrowRight className="h-4 w-4 transition group-hover/link:translate-x-0.5" />
    </Link>
  );
}

/** Card vertical — grelha (2+ posts) */
export function PostCard({
  post,
  className,
}: {
  post: PostItem;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "group flex h-full flex-col border-0 bg-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-sm ring-1 ring-black/[0.04] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(219,39,119,0.12)]",
        post.featured && "ring-2 ring-pink/30",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <PostImage post={post} />
        {post.featured && <FeaturedPill />}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col p-5 md:p-6">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-ink md:text-xl">
          {post.title}
        </h3>
        {post.content && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
            {post.content}
          </p>
        )}
        <div className="mt-5 border-t border-slate-100 pt-4">
          {post.link && <LearnMore href={post.link} />}
          <PostMeta post={post} />
        </div>
      </div>
    </Card>
  );
}

/** Card horizontal — 1 post na home ou página /noticias */
export function PostCardFeatured({
  post,
  className,
}: {
  post: PostItem;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "group overflow-hidden border-0 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] transition duration-300 hover:shadow-[0_24px_50px_rgba(219,39,119,0.14)]",
        post.featured && "ring-2 ring-pink/25",
        className,
      )}
    >
      <div className="grid md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 md:aspect-auto md:min-h-[280px]">
          <PostImage post={post} />
          {post.featured && <FeaturedPill />}
        </div>
        <div className="flex flex-col justify-center p-6 md:p-8 lg:p-10">
          {post.featured && (
            <Badge variant="pink" className="mb-3 w-fit px-3 py-1 text-xs">
              Em destaque
            </Badge>
          )}
          <h3 className="text-2xl font-bold leading-tight text-ink md:text-3xl">{post.title}</h3>
          {post.content && (
            <p className="mt-3 line-clamp-4 text-base leading-relaxed text-muted">{post.content}</p>
          )}
          <div className="mt-6 space-y-3">
            {post.link && <LearnMore href={post.link} />}
            <PostMeta post={post} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function gridCols(count: number) {
  if (count === 2) return "sm:grid-cols-2 max-w-4xl";
  if (count === 3) return "sm:grid-cols-2 lg:grid-cols-3 max-w-6xl";
  if (count === 4) return "sm:grid-cols-2 lg:grid-cols-4 max-w-7xl";
  return "sm:grid-cols-2 lg:grid-cols-3 max-w-6xl";
}

export function PostsSection({
  posts,
  showViewAll = true,
}: {
  posts: PostItem[];
  showViewAll?: boolean;
}) {
  if (!posts.length) return null;

  const count = posts.length;
  const single = count === 1;

  return (
    <section className="relative overflow-hidden py-20 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/80 via-pink-50/50 to-orange-50/80" />
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-pink/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-blue/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4">
        <SectionHeaderBlock />

        {single ? (
          <div className="mx-auto mb-12 max-w-4xl">
            <PostCardFeatured post={posts[0]} />
          </div>
        ) : (
          <div className={cn("mx-auto mb-12 grid grid-cols-1 gap-6 md:gap-8", gridCols(count))}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {showViewAll && (
          <div className="text-center">
            <Link
              href="/noticias"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue via-pink to-pink px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-pink/20 transition hover:scale-[1.03] hover:shadow-xl hover:shadow-pink/30"
            >
              Ver Todas as Novidades
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function PostsPageSection({ posts }: { posts: PostItem[] }) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/80 via-pink-50/50 to-orange-50/80" />
      <div className="relative mx-auto max-w-5xl px-4">
        <SectionHeaderBlock large />

        {posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 py-16 text-center">
            <Megaphone className="mx-auto mb-3 h-10 w-10 text-pink/30" />
            <p className="text-lg text-muted">Nenhuma novidade disponível no momento.</p>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {posts.map((post) => (
              <PostCardFeatured key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SectionHeaderBlock({ large }: { large?: boolean }) {
  return (
    <div className="mb-12 text-center md:mb-14">
      <Badge variant="blue" className="mb-5 shadow-sm">
        <Megaphone className="h-4 w-4" />
        Novidades e Anúncios
      </Badge>
      <h2
        className={cn(
          "font-bold tracking-tight text-ink",
          large ? "mb-5 text-4xl sm:text-5xl md:text-6xl" : "mb-4 text-3xl sm:text-4xl md:text-5xl",
        )}
      >
        {large ? (
          <>
            Conheça as Nossas <span className="text-pink">Últimas Notícias</span>
          </>
        ) : (
          <>
            Fique Atualizado com as <span className="text-pink">Últimas Notícias</span>
          </>
        )}
      </h2>
      <p className="mx-auto max-w-2xl text-base text-muted sm:text-lg md:text-xl">
        {large
          ? "Fique atualizado sobre formações, parcerias, oportunidades e muito mais"
          : "Conheça as nossas formações, parcerias e oportunidades"}
      </p>
    </div>
  );
}
