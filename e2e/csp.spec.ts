import { expect, test } from "@playwright/test";

const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("CSP", () => {
  test("home CSP uses nonce and has no unsafe-eval / unsafe-inline on scripts", async ({
    request,
  }) => {
    const res = await request.get(base);
    expect(res.ok()).toBeTruthy();
    const csp = res.headers()["content-security-policy"] ?? "";
    expect(csp).toMatch(/script-src[^;]*'nonce-/);
    expect(csp).toMatch(/strict-dynamic/);
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).not.toMatch(/'unsafe-eval'/);
    // next/image (and similar) use style="" — allowed via style-src-attr, not script-src.
    expect(csp).toMatch(/style-src-attr[^;]*'unsafe-inline'/);
  });

  test("home loads without CSP console violations", async ({ page }) => {
    const cspErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (/content security policy|csp/i.test(text)) cspErrors.push(text);
    });
    page.on("pageerror", (err) => {
      if (/content security policy|csp/i.test(err.message)) cspErrors.push(err.message);
    });

    await page.goto(base, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible();
    expect(cspErrors, cspErrors.join("\n")).toEqual([]);
  });
});
