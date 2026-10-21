import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "";

/** Relative luminance (sRGB) for WCAG contrast. */
function luminance(r: number, g: number, b: number): number {
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

function parseRgb(input: string): [number, number, number] | null {
  const m = input.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function contrastRatio(fg: string, bg: string): number | null {
  const a = parseRgb(fg);
  const b = parseRgb(bg);
  if (!a || !b) return null;
  const L1 = luminance(...a);
  const L2 = luminance(...b);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function expectNoSeriousViolations(page: import("@playwright/test").Page, path: string) {
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  // color-contrast is on. Hero CTAs with soft shadows are mis-sampled by axe (oklab + shadow);
  // those two links are asserted via getComputedStyle in the dedicated contrast test below.
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .exclude('a.bg-pink.text-white')
    .exclude('a.border-pink.text-pink')
    .analyze();

  const serious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  if (serious.length) {
    const summary = serious
      .map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} node(s)`)
      .join("\n");
    expect(serious, `Axe serious/critical on ${path}:\n${summary}`).toEqual([]);
  }
}

test.describe("Accessibility (axe)", () => {
  test("home has no serious/critical violations", async ({ page }) => {
    await expectNoSeriousViolations(page, "/");
  });

  test("about has no serious/critical violations", async ({ page }) => {
    await expectNoSeriousViolations(page, "/about");
  });

  test("galeria has no serious/critical violations", async ({ page }) => {
    await expectNoSeriousViolations(page, "/galeria");
  });

  test("equipa has no serious/critical violations", async ({ page }) => {
    await expectNoSeriousViolations(page, "/equipa");
  });

  test("noticias has no serious/critical violations", async ({ page }) => {
    await expectNoSeriousViolations(page, "/noticias");
  });

  test("privacidade has no serious/critical violations", async ({ page }) => {
    await expectNoSeriousViolations(page, "/privacidade");
  });

  test("admin login has no serious/critical violations", async ({ page }) => {
    await expectNoSeriousViolations(page, "/admin/login");
  });

  test("admin panel after login has no serious/critical violations", async ({ page }) => {
    // In CI, credentials are required (compose-smoke sets E2E_ADMIN_* after change-password → CiComposeAdmin99!).
    if (process.env.CI) {
      expect(adminEmail, "CI must set E2E_ADMIN_EMAIL").toBeTruthy();
      expect(adminPassword, "CI must set E2E_ADMIN_PASSWORD").toBeTruthy();
    } else {
      test.skip(!adminEmail || !adminPassword, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (or ADMIN_*)");
    }

    await page.goto(`${base}/admin/login`, { waitUntil: "domcontentloaded" });
    await page.locator("#email").fill(adminEmail);
    await page.locator("#password").fill(adminPassword);
    await page.locator('button[type="submit"]').click();
    try {
      // Do not match /admin/login — /\/admin(\/|$)/ resolved immediately on the login URL.
      await page.waitForURL(
        (url) => {
          const p = url.pathname.replace(/\/+$/, "") || "/";
          return p === "/admin" || p.startsWith("/admin/change-password");
        },
        { timeout: 30_000 },
      );
    } catch (err) {
      const errText = await page.locator("p.text-red-600").textContent().catch(() => null);
      throw new Error(
        `Admin login did not leave /admin/login${errText ? `: ${errText}` : ""} (${String(err)})`,
      );
    }

    // After media-smoke change-password, mustChangePassword is false → dashboard.
    // Fresh seed without that step still lands on change-password — axe that screen.
    const path = new URL(page.url()).pathname;
    if (path.includes("change-password")) {
      await expectNoSeriousViolations(page, "/admin/change-password");
      return;
    }

    await expectNoSeriousViolations(page, "/admin");
  });

  test("home CTAs meet WCAG AA contrast (computed styles)", async ({ page }) => {
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    const samples = await page.evaluate(() => {
      const primary = document.querySelector<HTMLElement>("a.bg-pink.text-white");
      const outline = document.querySelector<HTMLElement>("a.border-pink.text-pink");
      const cs = (el: HTMLElement | null) =>
        el
          ? {
              color: getComputedStyle(el).color,
              backgroundColor: getComputedStyle(el).backgroundColor,
            }
          : null;
      return { primary: cs(primary), outline: cs(outline) };
    });

    expect(samples.primary, "primary CTA present").toBeTruthy();
    expect(samples.outline, "outline CTA present").toBeTruthy();

    const primaryRatio = contrastRatio(samples.primary!.color, samples.primary!.backgroundColor);
    expect(primaryRatio, `primary CTA contrast (${samples.primary!.color} on ${samples.primary!.backgroundColor})`).toBeGreaterThanOrEqual(4.5);

    // Outline: pink text on white (button bg)
    const outlineBg = samples.outline!.backgroundColor.includes("0, 0, 0, 0")
      ? "rgb(255, 255, 255)"
      : samples.outline!.backgroundColor;
    const outlineRatio = contrastRatio(samples.outline!.color, outlineBg);
    expect(outlineRatio, `outline CTA contrast (${samples.outline!.color} on ${outlineBg})`).toBeGreaterThanOrEqual(4.5);
  });
});
