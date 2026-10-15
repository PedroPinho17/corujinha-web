import { afterEach, describe, expect, it } from "vitest";
import { assertProductionEnv, resolveAuthSecret } from "./env";

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

describe("assertProductionEnv", () => {
  const prev = { ...process.env };

  function setValidProdEnv() {
    process.env.NODE_ENV = "production";
    process.env.BETTER_AUTH_SECRET = "x".repeat(32);
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_FROM = "noreply@example.com";
    process.env.CONTACT_NOTIFY_TO = "ops@cliente.pt";
    process.env.S3_ENDPOINT = "https://s3.example.com";
    process.env.S3_PUBLIC_URL = "https://cdn.example.com";
    process.env.S3_ACCESS_KEY = "real-access-key";
    process.env.S3_SECRET_KEY = "real-secret-key-not-example";
    process.env.S3_BUCKET = "media";
    process.env.S3_CORS_ORIGINS = "https://app.example.com";
    delete process.env.GARAGE_RPC_SECRET;
    delete process.env.ALLOW_INSECURE_S3;
  }

  afterEach(() => {
    process.env = { ...prev };
  });

  it("no-ops outside production", () => {
    process.env.NODE_ENV = "test";
    expect(() => assertProductionEnv()).not.toThrow();
  });

  it("accepts a valid production env", () => {
    setValidProdEnv();
    expect(() => assertProductionEnv()).not.toThrow();
  });

  it("rejects missing keys, wildcard CORS, .local notify, http URL, and example creds", () => {
    setValidProdEnv();
    delete process.env.SMTP_HOST;
    expect(() => assertProductionEnv()).toThrow(/SMTP_HOST/);

    setValidProdEnv();
    process.env.S3_CORS_ORIGINS = "*";
    expect(() => assertProductionEnv()).toThrow(/S3_CORS_ORIGINS/);

    setValidProdEnv();
    process.env.CONTACT_NOTIFY_TO = "admin@corujinha.local";
    expect(() => assertProductionEnv()).toThrow(/CONTACT_NOTIFY_TO/);

    setValidProdEnv();
    process.env.S3_PUBLIC_URL = "http://cdn.example.com";
    expect(() => assertProductionEnv()).toThrow(/S3_PUBLIC_URL/);

    setValidProdEnv();
    process.env.S3_ACCESS_KEY = "minioadmin";
    expect(() => assertProductionEnv()).toThrow(/Credenciais S3/);

    setValidProdEnv();
    process.env.GARAGE_RPC_SECRET =
      "a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00";
    expect(() => assertProductionEnv()).toThrow(/GARAGE_RPC_SECRET/);
  });
});
