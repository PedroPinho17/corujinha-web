import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamsController } from "./teams.controller";
import { mockRedis, mockRepo } from "../test/mocks";

describe("TeamsController", () => {
  let teamMembers: ReturnType<typeof mockRepo>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: TeamsController;

  beforeEach(() => {
    vi.clearAllMocks();
    teamMembers = mockRepo();
    redis = mockRedis();
    controller = new TeamsController(teamMembers as never, redis as never);
  });

  it("publicList uses cache", async () => {
    redis.getJson.mockResolvedValue([{ id: "1" }]);
    expect(await controller.publicList()).toEqual([{ id: "1" }]);
  });

  it("publicList loads and caches", async () => {
    teamMembers.find.mockResolvedValue([{ id: "1" }]);
    expect(await controller.publicList()).toEqual([{ id: "1" }]);
    expect(redis.setJson).toHaveBeenCalledWith("public:team", [{ id: "1" }]);
  });

  it("admin CRUD + toggle + reorder + remove", async () => {
    expect(await controller.adminList()).toEqual([]);
    teamMembers.save.mockResolvedValue({ id: "1", name: "A" });
    await controller.create({ name: "A" });
    expect(redis.del).toHaveBeenCalled();

    await controller.update("1", { name: "B" });
    teamMembers.findOneByOrFail.mockResolvedValue({ id: "1", published: true });
    teamMembers.save.mockResolvedValue({ id: "1", published: false });
    expect(await controller.toggle("1")).toEqual({ id: "1", published: false });

    expect(await controller.reorder({ ids: ["a", "b"] })).toEqual({ success: true });
    expect(await controller.remove("1")).toEqual({ success: true });
  });
});
