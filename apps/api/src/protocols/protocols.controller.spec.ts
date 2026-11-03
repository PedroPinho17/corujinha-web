import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtocolsController } from "./protocols.controller";
import { mockRedis, mockRepo } from "../test/mocks";

describe("ProtocolsController", () => {
  let protocols: ReturnType<typeof mockRepo>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: ProtocolsController;

  beforeEach(() => {
    vi.clearAllMocks();
    protocols = mockRepo();
    redis = mockRedis();
    controller = new ProtocolsController(protocols as never, redis as never);
  });

  it("covers public + admin CRUD", async () => {
    redis.getJson.mockResolvedValueOnce(null);
    protocols.find.mockResolvedValue([{ id: "1" }]);
    expect(await controller.publicList()).toEqual([{ id: "1" }]);
    expect(await controller.adminList()).toEqual([{ id: "1" }]);
    await controller.create({ schoolName: "S" });
    await controller.update("1", { schoolName: "S2", active: false });
    protocols.findOneByOrFail.mockResolvedValue({ id: "1", active: true });
    protocols.save.mockResolvedValue({ id: "1", active: false });
    await controller.toggle("1");
    expect(await controller.reorder({ ids: ["1"] })).toEqual({ success: true });
    expect(await controller.remove("1")).toEqual({ success: true });
  });
});
