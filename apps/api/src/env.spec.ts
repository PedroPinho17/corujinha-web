import { afterEach, describe, expect, it } from "vitest";
import { resolveAuthSecret } from "./env";

describe("resolveAuthSecret", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("uses BETTER_AUTH_SECRET in non-production", () => {
    process.env.NODE_ENV = "test";
    process.env.BETTER_AUTH_SECRET = "my-dev-secret-value";
    expect(resolveAuthSecret()).toBe("my-dev-secret-value");
  });

  it("falls back to placeholder outside production", () => {
    process.env.NODE_ENV = "development";
    delete process.env.BETTER_AUTH_SECRET;
    expect(resolveAuthSecret()).toBe("dev-secret-change-me");
  });

  it("rejects short secrets in production", () => {
    process.env.NODE_ENV = "production";
    process.env.BETTER_AUTH_SECRET = "short";
    expect(() => resolveAuthSecret()).toThrow(/BETTER_AUTH_SECRET/);
  });
});
