import { describe, expect, it, vi } from "vitest";
import {
  SlidingWindowRateLimiter,
  RedisRateLimiter,
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

  it("check/hit with mocked redis", async () => {
    const store = new Map<string, string>();
    const redis = {
      get: vi.fn(async (k: string) => store.get(k) ?? null),
      incr: vi.fn(async (k: string) => {
        const next = Number(store.get(k) ?? 0) + 1;
        store.set(k, String(next));
        return next;
      }),
      pexpire: vi.fn(async () => 1),
    };
    const limiter = new RedisRateLimiter(redis as never, 2, 60_000, "rl:auth");
    expect(await limiter.check("ip")).toBe(true);
    await limiter.hit("ip");
    await limiter.hit("ip");
    expect(await limiter.check("ip")).toBe(false);
    expect(redis.incr).toHaveBeenCalledTimes(2);
  });
});
