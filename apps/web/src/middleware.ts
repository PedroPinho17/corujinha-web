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

  // NextRequest.ip is set behind trusted proxies in some runtimes.
  const fromNext = (request as NextRequest & { ip?: string }).ip;
  if (fromNext) return fromNext;

  return "unknown";
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CLIENT_IP_HEADER, resolveClientIp(request));
  // Prevent the API (trust proxy) from seeing a client-spoofed chain as the sole source of truth.
  requestHeaders.delete("x-forwarded-for");

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/api/:path*"],
};
