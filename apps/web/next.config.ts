import type { NextConfig } from "next";

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

const media = mediaHosts();
const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  ...media.https.map((h) => `https://${h}`),
  ...(isProd ? [] : media.http.map((h) => `http://${h}`)),
].join(" ");

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `img-src ${imgSrc}`,
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // App Router without nonces still needs these; tighten later with nonces.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  `connect-src 'self' https:${isProd ? "" : " http://localhost:* http://127.0.0.1:*"}`,
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

function remotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
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
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: remotePatterns(),
  },
};

export default nextConfig;
