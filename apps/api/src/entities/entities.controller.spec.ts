import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntitiesController } from "./entities.controller";
import { mockPrisma, mockRedis } from "../test/mocks";

describe("EntitiesController", () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: EntitiesController;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = mockPrisma();
    redis = mockRedis();
    controller = new EntitiesController(prisma as never, redis as never);
  });

  it("public and admin flows", async () => {
    redis.getJson.mockResolvedValueOnce(null);
    prisma.entity.findMany.mockResolvedValue([{ id: "1" }]);
    expect(await controller.publicList()).toEqual([{ id: "1" }]);

    expect(await controller.adminList()).toEqual([{ id: "1" }]);
    await controller.create({ name: "E" });
    await controller.update("1", { name: "E2" });
    prisma.entity.findUniqueOrThrow.mockResolvedValue({ id: "1", published: true });
    prisma.entity.update.mockResolvedValue({ id: "1", published: false });
    await controller.toggle("1");
    expect(await controller.reorder({ ids: ["1"] })).toEqual({ success: true });
    expect(await controller.remove("1")).toEqual({ success: true });
  });
});
