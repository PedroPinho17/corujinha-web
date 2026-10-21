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
  });
});
