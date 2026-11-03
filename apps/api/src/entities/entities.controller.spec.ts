import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntitiesController } from "./entities.controller";
import { mockRedis, mockRepo } from "../test/mocks";

describe("EntitiesController", () => {
  let entities: ReturnType<typeof mockRepo>;
  let formations: ReturnType<typeof mockRepo>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: EntitiesController;

  beforeEach(() => {
    vi.clearAllMocks();
    entities = mockRepo();
    formations = mockRepo();
    redis = mockRedis();
    controller = new EntitiesController(entities as never, formations as never, redis as never);
  });

  it("public and admin flows", async () => {
    redis.getJson.mockResolvedValueOnce(null);
    entities.createQueryBuilder().getMany.mockResolvedValue([{ id: "1", formations: [] }]);
    expect(await controller.publicList()).toEqual([{ id: "1", formations: [] }]);

    entities.find.mockResolvedValue([{ id: "1" }]);
    formations.count.mockResolvedValue(0);
    expect(await controller.adminList()).toEqual([{ id: "1", _count: { formations: 0 } }]);
    await controller.create({ name: "E" });
    await controller.update("1", { name: "E2" });
    entities.findOneByOrFail.mockResolvedValue({ id: "1", published: true });
    entities.save.mockResolvedValue({ id: "1", published: false });
    await controller.toggle("1");
    expect(await controller.reorder({ ids: ["1"] })).toEqual({ success: true });
    expect(await controller.remove("1")).toEqual({ success: true });
  });
});
