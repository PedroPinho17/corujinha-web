import { beforeEach, describe, expect, it, vi } from "vitest";
import { CentersController } from "./centers.controller";
import { mockRedis, mockRepo } from "../test/mocks";

describe("CentersController", () => {
  const centers = mockRepo();
  const redis = mockRedis();
  let ctrl: CentersController;

  beforeEach(() => {
    vi.clearAllMocks();
    ctrl = new CentersController(centers as never, redis as never);
  });

  it("publicList uses cache when present", async () => {
    redis.getJson.mockResolvedValue([{ id: "c1", slug: "lobao" }]);
    await expect(ctrl.publicList()).resolves.toEqual([{ id: "c1", slug: "lobao" }]);
    expect(centers.find).not.toHaveBeenCalled();
  });

  it("publicList queries DB and caches", async () => {
    redis.getJson.mockResolvedValue(null);
    centers.find.mockResolvedValue([{ id: "c1", slug: "lobao" }]);
    await expect(ctrl.publicList()).resolves.toEqual([{ id: "c1", slug: "lobao" }]);
    expect(centers.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true },
        order: { isPrimary: "DESC", sortOrder: "ASC" },
        select: expect.any(Object),
      }),
    );
    expect(redis.setJson).toHaveBeenCalledWith("public:centers", [{ id: "c1", slug: "lobao" }]);
  });

  it("create clears other primary when isPrimary", async () => {
    centers.createQueryBuilder().getRawOne.mockResolvedValue({ max: 2 });
    centers.save.mockResolvedValue({ id: "c2", slug: "sanguedo", isPrimary: true });
    await ctrl.create({
      slug: "sanguedo",
      name: "Centro Sanguedo",
      isPrimary: true,
    } as never);
    expect(centers.update).toHaveBeenCalledWith({}, { isPrimary: false });
    expect(centers.save).toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalled();
  });

  it("update demotes other primaries", async () => {
    centers.save.mockResolvedValue({ id: "c1", isPrimary: true });
    await ctrl.update("c1", {
      slug: "lobao",
      name: "Centro Lobão",
      isPrimary: true,
    } as never);
    expect(centers.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.anything() }),
      { isPrimary: false },
    );
  });

  it("toggle flips published", async () => {
    centers.findOneByOrFail.mockResolvedValue({ id: "c1", published: true });
    centers.save.mockResolvedValue({ id: "c1", published: false });
    await expect(ctrl.toggle("c1")).resolves.toEqual({ id: "c1", published: false });
  });

  it("remove deletes and busts cache", async () => {
    await expect(ctrl.remove("c1")).resolves.toEqual({ success: true });
    expect(centers.delete).toHaveBeenCalledWith({ id: "c1" });
    expect(redis.del).toHaveBeenCalled();
  });
});
