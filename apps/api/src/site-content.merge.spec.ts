import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_CONTENT, mergeSiteContent } from "@corujinha/shared";

describe("mergeSiteContent", () => {
  it("returns defaults when partial is empty", () => {
    const merged = mergeSiteContent(null);
    expect(merged.hero.logoPath).toBe("/logo.webp");
    expect(merged.hero.titlePink).toBe(DEFAULT_SITE_CONTENT.hero.titlePink);
    expect(merged.about.founderImagePath).toBe(DEFAULT_SITE_CONTENT.about.founderImagePath);
  });

  it("normalizes legacy logo1.webp paths to /logo.webp", () => {
    expect(mergeSiteContent({ hero: { logoPath: "/logo1.webp" } as never }).hero.logoPath).toBe(
      "/logo.webp",
    );
    expect(mergeSiteContent({ hero: { logoPath: "logo1.webp" } as never }).hero.logoPath).toBe(
      "/logo.webp",
    );
  });

  it("keeps custom uploaded or absolute logo paths", () => {
    expect(
      mergeSiteContent({ hero: { logoPath: "site/hero-custom.webp" } as never }).hero.logoPath,
    ).toBe("site/hero-custom.webp");
    expect(
      mergeSiteContent({ hero: { logoPath: "https://cdn.example/logo.png" } as never }).hero
        .logoPath,
    ).toBe("https://cdn.example/logo.png");
    expect(mergeSiteContent({ hero: { logoPath: "/logo.webp" } as never }).hero.logoPath).toBe(
      "/logo.webp",
    );
  });

  it("merges nested fields without dropping defaults", () => {
    const merged = mergeSiteContent({
      hero: { titlePink: "Afecto", logoPath: "/logo.webp" } as never,
      footer: { tagline: "Tagline custom" } as never,
    });
    expect(merged.hero.titlePink).toBe("Afecto");
    expect(merged.hero.titleBefore).toBe(DEFAULT_SITE_CONTENT.hero.titleBefore);
    expect(merged.footer.tagline).toBe("Tagline custom");
    expect(merged.footer.quickLinks.length).toBeGreaterThan(0);
    expect(merged.services.cards.length).toBe(DEFAULT_SITE_CONTENT.services.cards.length);
  });
});
