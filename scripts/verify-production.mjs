#!/usr/bin/env node
/**
 * Pós-deploy checks (OVH / Coolify).
 *
 * Usage:
 *   node scripts/verify-production.mjs https://SEU_DOMINIO
 *   VERIFY_HOST=vps.example.com node scripts/verify-production.mjs https://SEU_DOMINIO
 *
 * Checks:
 * 1) Site responds on HTTPS
 * 2) /robots.txt + X-Robots-Tag reflect ALLOW_SEARCH_INDEXING
 * 3) CSP has nonce and no unsafe-eval
 * 4) Optional: host ports 3000/3001 closed (needs VERIFY_HOST + nmap/curl from outside)
 */

const site = (process.argv[2] || process.env.VERIFY_SITE_URL || "").replace(/\/$/, "");
const host = process.env.VERIFY_HOST || "";

if (!site) {
  console.error("Usage: node scripts/verify-production.mjs https://SEU_DOMINIO");
  process.exit(1);
}

let failed = 0;
function ok(msg) {
  console.log(`✓ ${msg}`);
}
function bad(msg) {
  console.error(`✗ ${msg}`);
  failed += 1;
}

async function main() {
  console.log(`\nVerifying ${site}\n`);

  // 1. HTTPS home
  const home = await fetch(site, { redirect: "follow" });
  if (home.ok) ok(`GET / → ${home.status}`);
  else bad(`GET / → ${home.status}`);

  const csp = home.headers.get("content-security-policy") || "";
  if (/nonce-/.test(csp) && /strict-dynamic/.test(csp)) ok("CSP has nonce + strict-dynamic");
  else bad("CSP missing nonce/strict-dynamic");
  if (/script-src[^;]*'unsafe-inline'/.test(csp)) bad("CSP still allows script unsafe-inline");
  else ok("CSP script-src has no unsafe-inline");
  if (/'unsafe-eval'/.test(csp)) bad("CSP still allows unsafe-eval");
  else ok("CSP has no unsafe-eval");

  const robotsTag = home.headers.get("x-robots-tag") || "";
  const indexingOn = !/noindex/i.test(robotsTag);

  // 2. robots.txt
  const robotsRes = await fetch(`${site}/robots.txt`);
  const robotsText = await robotsRes.text();
  const ct = robotsRes.headers.get("content-type") || "";
  if (/text\/plain/i.test(ct)) ok("robots.txt Content-Type text/plain");
  else bad(`robots.txt Content-Type: ${ct}`);
  if (/<html/i.test(robotsText)) bad("robots.txt returned HTML (redirect bug?)");
  else ok("robots.txt is not HTML");

  if (indexingOn) {
    if (/^Allow:\s*\//m.test(robotsText) && /Disallow:\s*\/admin/m.test(robotsText)) {
      ok("Indexing ON: Allow: / + Disallow: /admin");
    } else bad("Indexing seems ON (no X-Robots noindex) but robots.txt unexpected");
  } else {
    if (/^Disallow:\s*\/\s*$/m.test(robotsText) && !/^Allow:/m.test(robotsText)) {
      ok("Indexing OFF: Disallow: /");
    } else bad("Indexing OFF expected Disallow: / only");
  }

  // 3. sitemap
  const sm = await fetch(`${site}/sitemap.xml`);
  const smText = await sm.text();
  if (indexingOn) {
    if (smText.includes("/noticias") || smText.includes("/about")) ok("Sitemap lists public pages");
    else bad("Indexing ON but sitemap looks empty");
  } else {
    if (!smText.includes("/noticias")) ok("Sitemap empty while indexing OFF");
    else bad("Indexing OFF but sitemap still lists pages");
  }

  // 4. Ports (best-effort from this machine)
  if (host) {
    for (const port of [3000, 3001]) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 2500);
      try {
        await fetch(`http://${host}:${port}/`, { signal: controller.signal });
        bad(`Port ${port} on ${host} appears OPEN — must not be published`);
      } catch {
        ok(`Port ${port} on ${host} not reachable (good)`);
      } finally {
        clearTimeout(t);
      }
    }
  } else {
    console.log("· Skip port check (set VERIFY_HOST=vps.ip to probe 3000/3001)");
  }

  console.log(`\nRate-limit IP: after a failed login, check API logs for the visitor IP`);
  console.log(`  (x-corujinha-client-ip), not the Traefik/container address.\n`);

  console.log("Google Search Console (uma vez, com o domínio live):");
  console.log(`  1. curl -sI ${site}/ | grep -i x-robots-tag   # não deve ter noindex`);
  console.log(`  2. curl -s ${site}/robots.txt                 # Allow: / + Sitemap`);
  console.log(`  3. Search Console → Sitemaps → adicionar ${site}/sitemap.xml\n`);

  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
