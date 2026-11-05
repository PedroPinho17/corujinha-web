import { describe, expect, it, vi } from "vitest";
import {
  SlidingWindowRateLimiter,
  RedisRateLimiter,
  RATE_LIMIT_ALLOW_SCRIPT,
  RATE_LIMIT_HIT_SCRIPT,
  RATE_LIMIT_RELEASE_SCRIPT,
  clientIp,
  isTrustedPeer,
  CLIENT_IP_HEADER,
} from "./rate-limit";

describe("SlidingWindowRateLimiter", () => {
  it("allows up to the limit then blocks", () => {
    const limiter = new SlidingWindowRateLimiter(3, 60_000);
    expect(limiter.allow("ip1")).toBe(true);
    expect(limiter.allow("ip1")).toBe(true);
    expect(limiter.allow("ip1")).toBe(true);
    expect(limiter.allow("ip1")).toBe(false);
  });

  it("tracks keys independently", () => {
    const limiter = new SlidingWindowRateLimiter(1, 60_000);
    expect(limiter.allow("a")).toBe(true);
    expect(limiter.allow("b")).toBe(true);
    expect(limiter.allow("a")).toBe(false);
  });

  it("forgets keys whose window has passed", () => {
    vi.useFakeTimers();
    try {
      const limiter = new SlidingWindowRateLimiter(1, 1_000);
      limiter.hit("old");
      vi.advanceTimersByTime(2_000);
      expect(limiter.check("old")).toBe(true);
      expect((limiter as unknown as { hits: Map<string, number[]> }).hits.has("old")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("check does not record; hit does", () => {
    const limiter = new SlidingWindowRateLimiter(1, 60_000);
    expect(limiter.check("x")).toBe(true);
    expect(limiter.check("x")).toBe(true);
    limiter.hit("x");
    expect(limiter.check("x")).toBe(false);
  });
});

describe("isTrustedPeer", () => {
  it("recognises loopback and private ranges", () => {
    expect(isTrustedPeer("127.0.0.1")).toBe(true);
    expect(isTrustedPeer("::1")).toBe(true);
    expect(isTrustedPeer("::ffff:10.0.0.5")).toBe(true);
    expect(isTrustedPeer("192.168.1.1")).toBe(true);
    expect(isTrustedPeer("172.18.0.3")).toBe(true);
    expect(isTrustedPeer("8.8.8.8")).toBe(false);
  });
});

describe("clientIp", () => {
  it("uses socket when no trusted header", () => {
    expect(clientIp({ socket: { remoteAddress: "5.6.7.8" } })).toBe("5.6.7.8");
    expect(clientIp({})).toBe("unknown");
  });

  it("ignores spoofed X-Forwarded-For and req.ip", () => {
    expect(
      clientIp({
        ip: "9.9.9.9",
        headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
        socket: { remoteAddress: "8.8.8.8" },
      }),
    ).toBe("8.8.8.8");
  });

  it("accepts custom header only from a private peer (Next)", () => {
    expect(
      clientIp({
        headers: {
          [CLIENT_IP_HEADER]: "203.0.113.10",
          "x-forwarded-for": "1.1.1.1",
        },
        socket: { remoteAddress: "172.18.0.4" },
      }),
    ).toBe("203.0.113.10");

    // Public peer claiming the header must not be trusted
    expect(
      clientIp({
        headers: { [CLIENT_IP_HEADER]: "203.0.113.10" },
        socket: { remoteAddress: "8.8.8.8" },
      }),
    ).toBe("8.8.8.8");
  });

  it("rotating X-Forwarded-For does not change the key when peer is Next", () => {
    const base = {
      headers: { [CLIENT_IP_HEADER]: "198.51.100.20" },
      socket: { remoteAddress: "127.0.0.1" },
    };
    expect(clientIp({ ...base, headers: { ...base.headers, "x-forwarded-for": "1.1.1.1" } })).toBe(
      "198.51.100.20",
    );
    expect(clientIp({ ...base, headers: { ...base.headers, "x-forwarded-for": "9.9.9.9" } })).toBe(
      "198.51.100.20",
    );
  });
});

describe("RedisRateLimiter", () => {
  it("falls back to memory when redis is null", async () => {
    const limiter = new RedisRateLimiter(null, 2, 60_000, "rl:test");
    expect(await limiter.allow("a")).toBe(true);
    expect(await limiter.allow("a")).toBe(true);
    expect(await limiter.allow("a")).toBe(false);
  });

  function fakeRedis() {
    const store = new Map<string, number>();
    return {
      get: vi.fn(async (k: string) => (store.has(k) ? String(store.get(k)) : null)),
      eval: vi.fn(async (script: string, _keys: number, key: string, _ttl?: number, limit?: number) => {
        const count = store.get(key) ?? 0;
        if (script === RATE_LIMIT_HIT_SCRIPT) {
          store.set(key, count + 1);
          return count + 1;
        }
        if (script === RATE_LIMIT_ALLOW_SCRIPT) {
          if (count >= Number(limit)) return 0;
          store.set(key, count + 1);
          return 1;
        }
        if (script === RATE_LIMIT_RELEASE_SCRIPT && count > 0) store.set(key, count - 1);
        return 1;
      }),
    };
  }

  it("check/hit use the atomic script with the window as TTL", async () => {
    const redis = fakeRedis();
    const limiter = new RedisRateLimiter(redis as never, 2, 60_000, "rl:auth");
    expect(await limiter.check("ip")).toBe(true);
    await limiter.hit("ip");
    await limiter.hit("ip");
    expect(await limiter.check("ip")).toBe(false);
    expect(redis.eval).toHaveBeenCalledWith(RATE_LIMIT_HIT_SCRIPT, 1, "rl:auth:ip", 60_000);
  });

  it("allow never lets concurrent requests past the limit", async () => {
    const limiter = new RedisRateLimiter(fakeRedis() as never, 5, 60_000, "rl:auth");
    const results = await Promise.all(Array.from({ length: 20 }, () => limiter.allow("ip")));
    expect(results.filter(Boolean)).toHaveLength(5);
  });

  it("release gives back a hit, in redis and in the memory fallback", async () => {
    for (const client of [fakeRedis(), null]) {
      const limiter = new RedisRateLimiter(client as never, 1, 60_000, "rl:auth");
      expect(await limiter.allow("ip")).toBe(true);
      expect(await limiter.allow("ip")).toBe(false);
      await limiter.release("ip");
      expect(await limiter.allow("ip")).toBe(true);
    }
  });

  it("falls back to memory when redis fails", async () => {
    const redis = { eval: vi.fn().mockRejectedValue(new Error("down")) };
    const limiter = new RedisRateLimiter(redis as never, 1, 60_000, "rl:auth");
    expect(await limiter.allow("ip")).toBe(true);
    expect(await limiter.allow("ip")).toBe(false);
  });
});
