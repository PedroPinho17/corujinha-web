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
    on = vi.fn();
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

  it("treats Redis failures as cache misses instead of failing the request", async () => {
    const { RedisService } = await import("./redis.service");
    const svc = new RedisService();
    get.mockRejectedValue(new Error("down"));
    set.mockRejectedValue(new Error("down"));
    del.mockRejectedValue(new Error("down"));
    quit.mockRejectedValue(new Error("down"));
    await expect(svc.getJson("k")).resolves.toBeNull();
    await expect(svc.setJson("k", 1)).resolves.toBeUndefined();
    await expect(svc.del("k")).resolves.toBeUndefined();
    await expect(svc.onModuleDestroy()).resolves.toBeUndefined();
  });
});
