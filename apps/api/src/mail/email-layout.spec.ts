import { afterEach, describe, expect, it } from "vitest";
import { emailLogoUrl, renderEmailHtml } from "./email-layout";

describe("email-layout", () => {
  const prevApp = process.env.NEXT_PUBLIC_APP_URL;
  const prevAuth = process.env.BETTER_AUTH_URL;

  afterEach(() => {
    if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevApp;
    if (prevAuth === undefined) delete process.env.BETTER_AUTH_URL;
    else process.env.BETTER_AUTH_URL = prevAuth;
  });

  it("builds absolute logo URL from NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://corujinha.example/";
    expect(emailLogoUrl()).toBe("https://corujinha.example/logo-email.png");
  });

  it("falls back to BETTER_AUTH_URL then localhost", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.BETTER_AUTH_URL = "https://auth.example";
    expect(emailLogoUrl()).toBe("https://auth.example/logo-email.png");

    delete process.env.BETTER_AUTH_URL;
    expect(emailLogoUrl()).toBe("http://localhost:3000/logo-email.png");
  });

  it("renders branded shell with logo, title, CTA and footer", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://corujinha.example";
    const html = renderEmailHtml({
      title: "Recuperar password",
      preheader: "Link válido 1 hora",
      bodyHtml: "<p>Olá Pedro,</p><p>Clique no botão abaixo.</p>",
      cta: { label: "Definir nova password", href: "https://corujinha.example/reset" },
    });
    expect(html).toContain("https://corujinha.example/logo-email.png");
    expect(html).toContain("Recuperar password");
    expect(html).toContain("Definir nova password");
    expect(html).toContain("https://corujinha.example/reset");
    expect(html).toContain("Centro de Apoio Escolar Corujinha");
    expect(html).toContain("Lobão · São João de Ver · Sanguedo");
    expect(html).toContain("/privacidade");
    expect(html).toContain('alt="Corujinha"');
    expect(html).toContain("Link válido 1 hora");
    expect(html).toContain("font-family:Arial");
  });

  it("omits CTA and preheader when not provided", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://corujinha.example";
    const html = renderEmailHtml({
      title: "Aviso",
      bodyHtml: "<p>Só texto.</p>",
    });
    expect(html).not.toContain("Definir nova password");
    expect(html).not.toContain("display:none;max-height:0");
    expect(html).toContain("Só texto.");
    expect(html).toContain("Centro de Apoio Escolar Corujinha");
  });

  it("escapes title, CTA and logo URL special chars", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://corujinha.example";
    const html = renderEmailHtml({
      title: `Alerta <script>alert(1)</script>`,
      bodyHtml: "<p>ok</p>",
      cta: { label: `Clica "aqui"`, href: "https://x.example/?a=1&b=2" },
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Clica &quot;aqui&quot;");
    expect(html).toContain("https://x.example/?a=1&amp;b=2");
  });
});
