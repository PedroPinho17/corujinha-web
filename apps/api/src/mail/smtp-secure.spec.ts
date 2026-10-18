import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { smtpSecure } from "./smtp-secure";

describe("smtpSecure", () => {
  beforeEach(() => {
    delete process.env.SMTP_SECURE;
  });

  afterEach(() => {
    delete process.env.SMTP_SECURE;
  });

  it("defaults to true on port 465", () => {
    expect(smtpSecure(465)).toBe(true);
  });

  it("defaults to false on other ports", () => {
    expect(smtpSecure(587)).toBe(false);
    expect(smtpSecure(1025)).toBe(false);
  });

  it("respects SMTP_SECURE override", () => {
    process.env.SMTP_SECURE = "true";
    expect(smtpSecure(587)).toBe(true);
    process.env.SMTP_SECURE = "0";
    expect(smtpSecure(465)).toBe(false);
  });
});
