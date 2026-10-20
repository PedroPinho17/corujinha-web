import { expect, test } from "@playwright/test";

/**
 * Smoke e2e — run with the stack up (`pnpm dev` or compose).
 * Not part of the default CI job (see docs/RUNBOOK.md / package.json test:e2e).
 */
const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("Corujinha public smoke", () => {
  test("home loads with brand and contact form", async ({ page }) => {
    await page.goto(base);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.locator("body")).toContainText(/Corujinha/i);
    await page.goto(`${base}/#contact`);
    await expect(page.locator('form, [id="contact"]').first()).toBeVisible({ timeout: 15_000 });
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
