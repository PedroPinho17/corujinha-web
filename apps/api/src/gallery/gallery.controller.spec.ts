import { beforeEach, describe, expect, it, vi } from "vitest";
import { GalleryController } from "./gallery.controller";
import { mockRedis, mockRepo } from "../test/mocks";

describe("GalleryController", () => {
  let gallery: ReturnType<typeof mockRepo>;
  let centers: ReturnType<typeof mockRepo>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: GalleryController;

  beforeEach(() => {
    vi.clearAllMocks();
    gallery = mockRepo();
    centers = mockRepo();
    redis = mockRedis();
    controller = new GalleryController(gallery as never, centers as never, redis as never);
  });

  it("publicList cache hit and miss", async () => {
    redis.getJson.mockResolvedValueOnce([{ id: "c" }]);
    expect(await controller.publicList()).toEqual([{ id: "c" }]);
    redis.getJson.mockResolvedValueOnce(null);
    gallery.find.mockResolvedValue([{ id: "1" }]);
    expect(await controller.publicList()).toEqual([{ id: "1", center: null }]);
  });

  it("admin CRUD", async () => {
    gallery.findAndCount.mockResolvedValue([[], 0]);
    expect(await controller.adminList()).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 50,
    });
    gallery.findOneOrFail.mockResolvedValue({ id: "1", center: null });
    await controller.create({ imageKey: "k" });
    await controller.update("1", { imageKey: "k2", alt: "a" });
    expect(await controller.reorder({ ids: ["1"] })).toEqual({ success: true });
    expect(await controller.remove("1")).toEqual({ success: true });
    expect(redis.del).toHaveBeenCalled();
  });
});
