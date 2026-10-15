import { beforeEach, describe, expect, it, vi } from "vitest";
import { TranslateController } from "./translate.controller";

describe("TranslateController", () => {
  const translate = { translate: vi.fn() };
  let controller: TranslateController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new TranslateController(translate as never);
  });

  it("delegates to TranslateService", async () => {
    translate.translate.mockResolvedValue({ success: true, translations: {} });
    await controller.translateText({ text: "Olá", targets: ["en"], source_code: "pt" });
    expect(translate.translate).toHaveBeenCalledWith("Olá", ["en"], "pt");
  });
});
