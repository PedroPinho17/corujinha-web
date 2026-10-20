import { afterEach, describe, expect, it } from "vitest";
import { buildResetPasswordMail } from "./reset-password-mail";

describe("buildResetPasswordMail", () => {
  const prev = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prev;
  });

  it("uses formal você and includes CTA link", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://corujinha.example";
    const mail = buildResetPasswordMail("Vera", "https://corujinha.example/reset?token=abc");
    expect(mail.subject).toContain("Recuperar password");
    expect(mail.text).toContain("Abra este link");
    expect(mail.text).toContain("Se não pediu");
    expect(mail.text).toContain("ignore este email");
    expect(mail.text).not.toMatch(/\bAbre\b/);
    expect(mail.text).not.toMatch(/pediste/);
    expect(mail.html).toContain("pode ignorar");
    expect(mail.html).toContain("https://corujinha.example/reset?token=abc");
    expect(mail.html).toContain("logo-email.png");
  });
});
