import { expect, test } from "@playwright/test";

/**
 * Responsive guards — the rest of the suite runs at a single desktop size, so
 * layout regressions on phones and tablets would otherwise go unnoticed.
 */
const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";

const PAGES = ["/", "/about", "/galeria", "/equipa", "/noticias", "/privacidade", "/admin/login"];
const WIDTHS = [320, 390, 768, 1024, 1440];

test.describe("Responsive layout", () => {
  for (const width of WIDTHS) {
    for (const path of PAGES) {
      test(`${path} has no horizontal scroll at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      });
    }
  }

  test("mobile menu reaches its last link on a phone in landscape", async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Abrir menu" }).click();
    const cta = page.locator("#mobile-nav a").last();
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeInViewport({ ratio: 1 });
  });

  test("form fields do not trigger iOS zoom (font-size >= 16px on phones)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/#contact`, { waitUntil: "domcontentloaded" });
    const sizes = await page
      .locator("#contact form")
      .locator("input:not([type=checkbox]):not([tabindex='-1']), select, textarea")
      .evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
    expect(sizes.length).toBeGreaterThan(0);
    for (const size of sizes) expect(size).toBeGreaterThanOrEqual(16);
  });

  for (const width of [390, 1280]) {
    test(`Contacto link from another page lands on the contact section at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`${base}/noticias`, { waitUntil: "networkidle" });
      if (width < 1024) await page.getByRole("button", { name: "Abrir menu" }).click();
      await page.locator('header a[href="/#contact"]:visible', { hasText: "Contacto" }).click();
      await expect(page).toHaveURL(/\/#contact$/);
      await expect(page.locator("#contact h2")).toBeInViewport();
    });
  }

  test("anchored sections are not hidden by the sticky header", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/#services`, { waitUntil: "networkidle" });
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const header = document.querySelector("header")!.getBoundingClientRect();
          const heading = document.querySelector("#services h2")!.getBoundingClientRect();
          return heading.top - header.bottom;
        }),
      )
      .toBeGreaterThanOrEqual(0);
  });
});
