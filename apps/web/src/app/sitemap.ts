import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Empty while indexing is off — avoids advertising URLs before go-live. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.ALLOW_SEARCH_INDEXING !== "true") {
    return [];
  }

  const paths = ["", "/about", "/galeria", "/equipa", "/noticias", "/privacidade"];
  const lastModified = new Date();
  return paths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
