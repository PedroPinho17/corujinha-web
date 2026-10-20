import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  // API proxy: stamp real client IP for rate limits
  if (pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(CLIENT_IP_HEADER, resolveClientIp(request));
    requestHeaders.delete("x-forwarded-for");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Until go-live: nothing should be indexed (pages + assets HTML responses)
  if (!indexingEnabled() && !pathname.startsWith("/robots.txt")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow, nosnippet, noarchive");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
