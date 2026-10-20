import type { NextConfig } from "next";

const apiOrigin = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
const enableStandalone =
  process.env.NEXT_STANDALONE === "true" || process.platform !== "win32";
const isProd = process.env.NODE_ENV === "production";
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Next.js requires unsafe-inline/eval in App Router without nonces.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  `connect-src 'self' https:${isProd ? "" : " http://localhost:* http://127.0.0.1:*"}`,
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

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
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9012" },
      { protocol: "http", hostname: "corujinha-media.web.garage.localhost", port: "3902" },
      { protocol: "http", hostname: "127.0.0.1", port: "3902" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
