import { beforeEach, describe, expect, it, vi } from "vitest";
import { CentersController } from "./centers.controller";
import { mockPrisma, mockRedis } from "../test/mocks";

describe("CentersController", () => {
  const prisma = mockPrisma();
  const redis = mockRedis();
  let ctrl: CentersController;

  beforeEach(() => {
    vi.clearAllMocks();
    ctrl = new CentersController(prisma as never, redis as never);
  });

  it("publicList uses cache when present", async () => {
    redis.getJson.mockResolvedValue([{ id: "c1", slug: "lobao" }]);
    await expect(ctrl.publicList()).resolves.toEqual([{ id: "c1", slug: "lobao" }]);
    expect(prisma.center.findMany).not.toHaveBeenCalled();
  });

  it("publicList queries DB and caches", async () => {
    redis.getJson.mockResolvedValue(null);
    prisma.center.findMany.mockResolvedValue([{ id: "c1", slug: "lobao" }]);
    await expect(ctrl.publicList()).resolves.toEqual([{ id: "c1", slug: "lobao" }]);
    expect(prisma.center.findMany).toHaveBeenCalledWith({
      where: { published: true },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    });
    expect(redis.setJson).toHaveBeenCalledWith("public:centers", [{ id: "c1", slug: "lobao" }]);
  });

  it("create clears other primary when isPrimary", async () => {
    prisma.center.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
    prisma.center.create.mockResolvedValue({ id: "c2", slug: "sanguedo", isPrimary: true });
    await ctrl.create({
      slug: "sanguedo",
      name: "Centro Sanguedo",
      isPrimary: true,
    } as never);
    expect(prisma.center.updateMany).toHaveBeenCalledWith({ data: { isPrimary: false } });
    expect(prisma.center.create).toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalled();
  });

  it("update demotes other primaries", async () => {
    prisma.center.update.mockResolvedValue({ id: "c1", isPrimary: true });
    await ctrl.update("c1", {
      slug: "lobao",
      name: "Centro Lobão",
      isPrimary: true,
    } as never);
    expect(prisma.center.updateMany).toHaveBeenCalledWith({
      where: { id: { not: "c1" } },
      data: { isPrimary: false },
    });
  });

  it("toggle flips published", async () => {
    prisma.center.findUniqueOrThrow.mockResolvedValue({ id: "c1", published: true });
    prisma.center.update.mockResolvedValue({ id: "c1", published: false });
    await expect(ctrl.toggle("c1")).resolves.toEqual({ id: "c1", published: false });
  });

  it("remove deletes and busts cache", async () => {
    prisma.center.delete.mockResolvedValue({ id: "c1" });
    await expect(ctrl.remove("c1")).resolves.toEqual({ success: true });
    expect(redis.del).toHaveBeenCalled();
  });
});
