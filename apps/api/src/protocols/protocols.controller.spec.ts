import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtocolsController } from "./protocols.controller";
import { mockPrisma, mockRedis } from "../test/mocks";

describe("ProtocolsController", () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: ProtocolsController;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = mockPrisma();
    redis = mockRedis();
    controller = new ProtocolsController(prisma as never, redis as never);
  });

  it("covers public + admin CRUD", async () => {
    redis.getJson.mockResolvedValueOnce(null);
    prisma.schoolProtocol.findMany.mockResolvedValue([{ id: "1" }]);
    expect(await controller.publicList()).toEqual([{ id: "1" }]);
    expect(await controller.adminList()).toEqual([{ id: "1" }]);
    await controller.create({ schoolName: "S" });
    await controller.update("1", { schoolName: "S2", active: false });
    prisma.schoolProtocol.findUniqueOrThrow.mockResolvedValue({ id: "1", active: true });
    prisma.schoolProtocol.update.mockResolvedValue({ id: "1", active: false });
    await controller.toggle("1");
    expect(await controller.reorder({ ids: ["1"] })).toEqual({ success: true });
    expect(await controller.remove("1")).toEqual({ success: true });
  });
});
