/** Build Content-Security-Policy with a per-request nonce (no unsafe-inline / unsafe-eval on scripts). */

function mediaHosts(): { https: string[]; http: string[] } {
  const isProd = process.env.NODE_ENV === "production";
  const https = new Set<string>();
  const http = new Set<string>();
  for (const raw of [process.env.NEXT_PUBLIC_S3_PUBLIC_URL, process.env.S3_PUBLIC_URL]) {
    if (!raw?.trim()) continue;
    try {
      const u = new URL(raw);
      if (u.protocol === "https:") https.add(u.host);
      else if (u.protocol === "http:") http.add(u.host);
    } catch {
      /* ignore */
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

export function buildCsp(nonce: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const media = mediaHosts();
  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    ...media.https.map((h) => `https://${h}`),
    ...(isProd ? [] : media.http.map((h) => `http://${h}`)),
  ].join(" ");

  const connectSrc = [
    "'self'",
    ...media.https.map((h) => `https://${h}`),
    ...(isProd ? [] : ["http://localhost:*", "http://127.0.0.1:*", ...media.http.map((h) => `http://${h}`)]),
  ].join(" ");

  // script-src: nonce + strict-dynamic — Next applies the nonce to its scripts automatically.
  // No 'unsafe-inline' / 'unsafe-eval'.
  // style-src: nonce for Next-injected <style>; 'unsafe-inline' is ignored by browsers that
  // honour style nonces. style-src-attr keeps next/image (and similar) style="" attributes.
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `img-src ${imgSrc}`,
    "font-src 'self' data:",
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    "style-src-attr 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `connect-src ${connectSrc}`,
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ];

  return directives.join("; ").replace(/\s{2,}/g, " ").trim();
}
