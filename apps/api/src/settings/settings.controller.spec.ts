import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsController } from "./settings.controller";
import { mockPrisma, mockRedis } from "../test/mocks";

describe("SettingsController", () => {
  let prisma: ReturnType<typeof mockPrisma>;
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
    prisma = mockPrisma();
    redis = mockRedis();
    controller = new SettingsController(prisma as never, redis as never);
    prisma.siteSettings.findFirst.mockResolvedValue(row);
    prisma.siteSettings.update.mockResolvedValue(row);
  });

  it("publicSettings returns cache with merged content", async () => {
    redis.getJson.mockResolvedValue({ ...row, content: {} });
    const res = await controller.publicSettings();
    expect(res.content).toBeTruthy();
  });

  it("publicSettings creates defaults when missing", async () => {
    redis.getJson.mockResolvedValue(null);
    prisma.siteSettings.findFirst.mockResolvedValueOnce(null);
    prisma.siteSettings.create.mockResolvedValue(row);
    const res = await controller.publicSettings();
    expect(redis.setJson).toHaveBeenCalled();
    expect(res.brandingName).toBe("Corujinha");
  });

  it("fills empty content and admin get/update", async () => {
    prisma.siteSettings.findFirst.mockResolvedValue({ ...row, content: null });
    prisma.siteSettings.update.mockResolvedValue(row);
    expect(await controller.adminGet()).toMatchObject({ id: "s1" });

    const updated = await controller.adminUpdate({
      brandingName: "Novo",
      content: { hero: { title: "X" } },
    });
    expect(updated.content).toBeTruthy();
    expect(redis.del).toHaveBeenCalledWith("public:settings", "public:home");
  });
});
