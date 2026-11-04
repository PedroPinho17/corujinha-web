import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

// Next only reads apps/web/.env*; the monorepo keeps its config in the root .env.
// Without this, REVALIDATE_SECRET is missing locally and the site never hears about CMS edits.
// loadEnvFile does not override variables that are already set (Docker, CI).
const rootEnv = resolve(process.cwd(), "../../.env");
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const apiOrigin = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
const enableStandalone =
  process.env.NEXT_STANDALONE === "true" || process.platform !== "win32";
const isProd = process.env.NODE_ENV === "production";

/** Public media host (R2 / Garage website). Empty → only same-origin images. */
function mediaHosts(): { https: string[]; http: string[] } {
  const https = new Set<string>();
  const http = new Set<string>();
  for (const raw of [
    process.env.NEXT_PUBLIC_S3_PUBLIC_URL,
    process.env.S3_PUBLIC_URL,
  ]) {
    if (!raw?.trim()) continue;
    try {
      const u = new URL(raw);
      if (u.protocol === "https:") https.add(u.host);
      else if (u.protocol === "http:") http.add(u.host);
    } catch {
      /* ignore bad URLs */
    }
  }
  if (!isProd) {
    http.add("localhost:3902");
    http.add("127.0.0.1:3902");
    http.add("corujinha-media.web.garage.localhost:3902");
    http.add("localhost:9012");
  }
  return { https: [...https], http: [...http] };
}

function remotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const media = mediaHosts();
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
  for (const host of media.https) {
    const [hostname, port] = host.split(":");
    patterns.push({
      protocol: "https",
      hostname: hostname!,
      ...(port ? { port } : {}),
    });
  }
  if (!isProd) {
    for (const host of media.http) {
      const [hostname, port] = host.split(":");
      patterns.push({
        protocol: "http",
        hostname: hostname!,
        ...(port ? { port } : {}),
      });
    }
  }
  return patterns;
}

/**
 * Node cannot resolve *.localhost (the local Garage website host), so the image optimizer could
 * not fetch from it. Local development serves the originals; real media domains are optimized.
 */
function mediaOnLocalhost(): boolean {
  const raw = process.env.NEXT_PUBLIC_S3_PUBLIC_URL?.trim() || "http://corujinha-media.web.garage.localhost:3902";
  try {
    return new URL(raw).hostname.endsWith(".localhost");
  } catch {
    return false;
  }
}

const nextConfig: NextConfig = {
  ...(enableStandalone ? { output: "standalone" as const } : {}),
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  async headers() {
    // CSP (with per-request nonce) is set in middleware — do not duplicate here.
    return [
      {
        source: "/robots.txt",
        headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
      },
    ];
  },
  images: {
    remotePatterns: remotePatterns(),
    unoptimized: mediaOnLocalhost(),
  },
};

export default nextConfig;
