import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormationsController } from "./formations.controller";
import { mockPrisma, mockRedis } from "../test/mocks";

describe("FormationsController", () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: FormationsController;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = mockPrisma();
    redis = mockRedis();
    controller = new FormationsController(prisma as never, redis as never);
  });

  it("covers public + admin CRUD", async () => {
    redis.getJson.mockResolvedValueOnce([{ id: "c" }]);
    expect(await controller.publicList()).toEqual([{ id: "c" }]);
    redis.getJson.mockResolvedValueOnce(null);
    prisma.formation.findMany.mockResolvedValue([{ id: "1" }]);
    expect(await controller.publicList()).toEqual([{ id: "1" }]);

    expect(await controller.adminList()).toEqual([{ id: "1" }]);
    await controller.create({ name: "F", entityId: "" });
    await controller.update("1", { name: "F2", entityId: "e1" });
    prisma.formation.findUniqueOrThrow.mockResolvedValue({ id: "1", active: true });
    prisma.formation.update.mockResolvedValue({ id: "1", active: false });
    await controller.toggle("1");
    expect(await controller.reorder({ ids: ["1", "2"] })).toEqual({ success: true });
    expect(await controller.remove("1")).toEqual({ success: true });
  });
});
