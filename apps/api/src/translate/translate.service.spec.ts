import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException, ServiceUnavailableException } from "@nestjs/common";

const { translateText } = vi.hoisted(() => ({
  translateText: vi.fn(),
}));

vi.mock("deepl-node", () => ({
  Translator: class {
    translateText = translateText;
  },
}));

describe("TranslateService", () => {
  const prevKey = process.env.DEEPL_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.DEEPL_API_KEY;
  });

  afterEach(() => {
    if (prevKey === undefined) delete process.env.DEEPL_API_KEY;
    else process.env.DEEPL_API_KEY = prevKey;
  });

  it("validates input and missing key", async () => {
    const { TranslateService } = await import("./translate.service");
    const svc = new TranslateService();
    await expect(svc.translate(" ", ["en"])).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.translate("Olá", [])).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.translate("Olá", ["en"])).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it("translates to mapped target languages", async () => {
    process.env.DEEPL_API_KEY = "test-key";
    translateText.mockResolvedValue({ text: "Hello" });
    const { TranslateService } = await import("./translate.service");
    const svc = new TranslateService();
    const res = await svc.translate("Olá", ["en", "fr", "es", "de", "pt-br", "en-us"], "pt");
    expect(res.success).toBe(true);
    expect(res.translations.en.texto).toBe("Hello");
    expect(translateText).toHaveBeenCalled();
  });
});
