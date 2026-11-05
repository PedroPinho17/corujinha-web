import { describe, expect, it } from "vitest";
import { authCookieSecure, authEmailPassword, resolveWebAuthnRpId } from "./auth.config";

describe("auth hardening (runtime config)", () => {
  it("disables public email/password sign-up", () => {
    expect(authEmailPassword.disableSignUp).toBe(true);
    expect(authEmailPassword.enabled).toBe(true);
  });

  it("uses Secure cookies only in production over HTTPS", () => {
    expect(authCookieSecure(true, "https://corujinha.pt")).toBe(true);
    expect(authCookieSecure(true, "http://localhost:3000")).toBe(false);
    expect(authCookieSecure(false, "https://corujinha.pt")).toBe(false);
  });

  it("derives the WebAuthn RP ID from the site unless set explicitly", () => {
    expect(resolveWebAuthnRpId(undefined, "https://www.corujinha.pt/x")).toBe("www.corujinha.pt");
    expect(resolveWebAuthnRpId(" corujinha.pt ", "https://www.corujinha.pt")).toBe("corujinha.pt");
    expect(resolveWebAuthnRpId("", "not a url")).toBe("localhost");
  });

  it("requires min password length of 12", () => {
    expect(authEmailPassword.minPasswordLength).toBe(12);
  });
});
