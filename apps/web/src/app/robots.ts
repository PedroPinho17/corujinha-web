import type { MetadataRoute } from "next";

/** Runtime env — flip without rebuild (Coolify). */
export const dynamic = "force-dynamic";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Por omissão o site não é indexado (Disallow: /).
 * No go-live: ALLOW_SEARCH_INDEXING=true → permite / e bloqueia só /admin.
 */
function indexingEnabled() {
  return process.env.ALLOW_SEARCH_INDEXING === "true";
}

export default function robots(): MetadataRoute.Robots {
  if (!indexingEnabled()) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
