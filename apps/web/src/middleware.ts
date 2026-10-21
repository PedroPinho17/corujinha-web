import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";

/** Header consumed by the API rate limiter — never taken from client X-Forwarded-For alone. */
export const CLIENT_IP_HEADER = "x-corujinha-client-ip";

/**
 * Prefer Traefik/Coolify `X-Real-IP` (set by the reverse proxy from the TCP peer).
 * Fall back to the rightmost X-Forwarded-For hop (appended by the trusted proxy).
 * Never use the leftmost XFF value — browsers can spoof it.
 */
export function resolveClientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.split(",")[0]!.trim();

  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1]!;
  }

  const fromNext = (request as NextRequest & { ip?: string }).ip;
  if (fromNext) return fromNext;

  return "unknown";
}

function indexingEnabled() {
  return process.env.ALLOW_SEARCH_INDEXING === "true";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API proxy: stamp real client IP for rate limits (no HTML CSP)
  if (pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(CLIENT_IP_HEADER, resolveClientIp(request));
    requestHeaders.delete("x-forwarded-for");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Plain-text robots — no CSP HTML policy
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return NextResponse.next();
  }

  // Edge-safe nonce (no Node Buffer).
  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads CSP from the *request* to apply nonces to scripts during SSR.
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );

  if (!indexingEnabled()) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, nosnippet, noarchive");
  }

  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
