import type { NextConfig } from "next";

const apiOrigin = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
const enableStandalone =
  process.env.NEXT_STANDALONE === "true" || process.platform !== "win32";

const nextConfig: NextConfig = {
  ...(enableStandalone ? { output: "standalone" as const } : {}),
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9012" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
