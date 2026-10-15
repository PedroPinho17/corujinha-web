import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, set, del, quit } = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  quit: vi.fn(),
}));

vi.mock("ioredis", () => ({
  default: class {
    get = get;
    set = set;
    del = del;
    quit = quit;
  },
}));

describe("RedisService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("getJson/setJson/del/onModuleDestroy", async () => {
    const { RedisService } = await import("./redis.service");
    const svc = new RedisService();
    get.mockResolvedValue(null);
    expect(await svc.getJson("k")).toBeNull();
    get.mockResolvedValue(JSON.stringify({ a: 1 }));
    expect(await svc.getJson("k")).toEqual({ a: 1 });
    await svc.setJson("k", { a: 1 }, 60);
    expect(set).toHaveBeenCalledWith("k", JSON.stringify({ a: 1 }), "EX", 60);
    await svc.del();
    await svc.del("a", "b");
    expect(del).toHaveBeenCalledWith("a", "b");
    await svc.onModuleDestroy();
    expect(quit).toHaveBeenCalled();
  });
});
