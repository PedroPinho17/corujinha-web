import { beforeEach, describe, expect, it, vi } from "vitest";
import { GalleryController } from "./gallery.controller";
import { mockPrisma, mockRedis } from "../test/mocks";

describe("GalleryController", () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: GalleryController;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = mockPrisma();
    redis = mockRedis();
    controller = new GalleryController(prisma as never, redis as never);
  });

  it("publicList cache hit and miss", async () => {
    redis.getJson.mockResolvedValueOnce([{ id: "c" }]);
    expect(await controller.publicList()).toEqual([{ id: "c" }]);
    redis.getJson.mockResolvedValueOnce(null);
    prisma.galleryImage.findMany.mockResolvedValue([{ id: "1" }]);
    expect(await controller.publicList()).toEqual([{ id: "1" }]);
  });

  it("admin CRUD", async () => {
    expect(await controller.adminList()).toEqual([]);
    await controller.create({ imageKey: "k" });
    await controller.update("1", { imageKey: "k2", alt: "a" });
    expect(await controller.reorder({ ids: ["1"] })).toEqual({ success: true });
    expect(await controller.remove("1")).toEqual({ success: true });
    expect(redis.del).toHaveBeenCalled();
  });
});
