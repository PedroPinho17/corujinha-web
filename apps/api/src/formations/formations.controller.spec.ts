import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormationsController } from "./formations.controller";
import { mockRedis, mockRepo } from "../test/mocks";

describe("FormationsController", () => {
  let formations: ReturnType<typeof mockRepo>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: FormationsController;

  beforeEach(() => {
    vi.clearAllMocks();
    formations = mockRepo();
    redis = mockRedis();
    controller = new FormationsController(formations as never, redis as never);
  });

  it("covers public + admin CRUD", async () => {
    redis.getJson.mockResolvedValueOnce([{ id: "c" }]);
    expect(await controller.publicList()).toEqual([{ id: "c" }]);
    redis.getJson.mockResolvedValueOnce(null);
    formations.find.mockResolvedValue([{ id: "1", entity: null }]);
    expect(await controller.publicList()).toEqual([
      {
        id: "1",
        name: undefined,
        description: undefined,
        duration: undefined,
        location: undefined,
        entityId: undefined,
        entity: null,
      },
    ]);

    expect(await controller.adminList()).toEqual([{ id: "1", entity: null }]);
    await controller.create({ name: "F", entityId: "" });
    await controller.update("1", { name: "F2", entityId: "e1" });
    formations.findOneByOrFail.mockResolvedValue({ id: "1", active: true });
    formations.save.mockResolvedValue({ id: "1", active: false });
    await controller.toggle("1");
    expect(await controller.reorder({ ids: ["1", "2"] })).toEqual({ success: true });
    expect(await controller.remove("1")).toEqual({ success: true });
  });
});
