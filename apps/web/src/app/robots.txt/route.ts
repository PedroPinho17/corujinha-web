export const dynamic = "force-dynamic";

/**
 * Plain-text robots.txt (never HTML / never redirect to `/`).
 * Default: Disallow everything. Go-live: ALLOW_SEARCH_INDEXING=true.
 */
export function GET() {
  const indexing = process.env.ALLOW_SEARCH_INDEXING === "true";
  const site = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const body = indexing
    ? [
        "User-Agent: *",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /admin/",
        "",
        `Sitemap: ${site}/sitemap.xml`,
        "",
      ].join("\n")
    : ["User-Agent: *", "Disallow: /", ""].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      // Extra signal for crawlers that hit this URL
      "X-Robots-Tag": indexing ? "all" : "noindex, nofollow",
    },
  });
}
