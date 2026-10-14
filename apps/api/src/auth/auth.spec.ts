import { describe, expect, it } from "vitest";
import { authEmailPassword } from "./auth.config";

describe("auth hardening (runtime config)", () => {
  it("disables public email/password sign-up", () => {
    expect(authEmailPassword.disableSignUp).toBe(true);
    expect(authEmailPassword.enabled).toBe(true);
  });

  it("requires min password length of 12", () => {
    expect(authEmailPassword.minPasswordLength).toBe(12);
  });
});
