import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsController } from "./settings.controller";
import { mockRedis, mockRepo } from "../test/mocks";

describe("SettingsController", () => {
  let siteSettings: ReturnType<typeof mockRepo>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: SettingsController;

  const row = {
    id: "s1",
    brandingName: "Corujinha",
    brandingLogoKey: null,
    contactEmail: "a@b.com",
    contactPhone: "911",
    address: null,
    facebookUrl: null,
    instagramUrl: null,
    content: { hero: { title: "Olá" } },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    siteSettings = mockRepo();
    redis = mockRedis();
    controller = new SettingsController(siteSettings as never, redis as never);
    siteSettings.find.mockResolvedValue([row]);
    siteSettings.save.mockResolvedValue(row);
  });

  it("publicSettings returns cache with merged content", async () => {
    redis.getJson.mockResolvedValue({ ...row, content: {} });
    const res = await controller.publicSettings();
    expect(res.content).toBeTruthy();
  });

  it("publicSettings creates defaults when missing", async () => {
    redis.getJson.mockResolvedValue(null);
    siteSettings.find.mockResolvedValueOnce([]);
    siteSettings.save.mockResolvedValue(row);
    const res = await controller.publicSettings();
    expect(redis.setJson).toHaveBeenCalled();
    expect((res as { brandingName: string }).brandingName).toBe("Corujinha");
  });

  it("fills empty content and admin get/update", async () => {
    siteSettings.find.mockResolvedValue([{ ...row, content: null }]);
    siteSettings.save.mockResolvedValue(row);
    expect(await controller.adminGet()).toMatchObject({ id: "s1" });

    const updated = await controller.adminUpdate({
      brandingName: "Novo",
      content: { hero: { title: "X" } },
    });
    expect(updated.content).toBeTruthy();
    expect(redis.del).toHaveBeenCalledWith("public:settings", "public:home");
  });
});
