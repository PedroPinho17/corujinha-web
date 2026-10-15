import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamsController } from "./teams.controller";
import { mockPrisma, mockRedis } from "../test/mocks";

describe("TeamsController", () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: TeamsController;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = mockPrisma();
    redis = mockRedis();
    controller = new TeamsController(prisma as never, redis as never);
  });

  it("publicList uses cache", async () => {
    redis.getJson.mockResolvedValue([{ id: "1" }]);
    expect(await controller.publicList()).toEqual([{ id: "1" }]);
  });

  it("publicList loads and caches", async () => {
    prisma.teamMember.findMany.mockResolvedValue([{ id: "1" }]);
    expect(await controller.publicList()).toEqual([{ id: "1" }]);
    expect(redis.setJson).toHaveBeenCalledWith("public:team", [{ id: "1" }]);
  });

  it("admin CRUD + toggle + reorder + remove", async () => {
    expect(await controller.adminList()).toEqual([]);
    prisma.teamMember.create.mockResolvedValue({ id: "1", name: "A" });
    await controller.create({ name: "A" });
    expect(redis.del).toHaveBeenCalled();

    await controller.update("1", { name: "B" });
    prisma.teamMember.findUniqueOrThrow.mockResolvedValue({ id: "1", published: true });
    prisma.teamMember.update.mockResolvedValue({ id: "1", published: false });
    expect(await controller.toggle("1")).toEqual({ id: "1", published: false });

    expect(await controller.reorder({ ids: ["a", "b"] })).toEqual({ success: true });
    expect(await controller.remove("1")).toEqual({ success: true });
  });
});
