import { expect, test } from "@playwright/test";

/**
 * Smoke e2e — run with the stack up (`pnpm dev` or compose-smoke).
 * Also runs in CI after compose-smoke brings the stack up (`pnpm test:e2e`).
 */
const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("Corujinha public smoke", () => {
  test("home loads with brand and contact form", async ({ page }) => {
    await page.goto(base);
    await expect(page.locator("body")).toContainText(/Corujinha/i);
    await expect(page.locator("header, [role='banner']").first()).toBeVisible();
    await page.goto(`${base}/#contact`);
    await expect(page.locator("#contact form, form").first()).toBeVisible({ timeout: 15_000 });
  });

  test("robots and sitemap are public", async ({ request }) => {
    const robots = await request.get(`${base}/robots.txt`);
    expect(robots.ok()).toBeTruthy();
    const robotsText = await robots.text();
    expect(robotsText).toMatch(/Disallow:\s*\/admin/i);

    const sitemap = await request.get(`${base}/sitemap.xml`);
    expect(sitemap.ok()).toBeTruthy();
    const xml = await sitemap.text();
    expect(xml).toContain("/noticias");
  });

  test("admin is present but not for indexing cues", async ({ page }) => {
    await page.goto(`${base}/admin/login`);
    await expect(page.locator("body")).toContainText(/password|entrar|login/i);
  });
});
