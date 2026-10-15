import { describe, expect, it } from "vitest";
import { SlidingWindowRateLimiter, clientIp } from "./rate-limit";

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
});

describe("clientIp", () => {
  it("prefers req.ip then socket", () => {
    expect(clientIp({ ip: "1.2.3.4" })).toBe("1.2.3.4");
    expect(clientIp({ socket: { remoteAddress: "5.6.7.8" } })).toBe("5.6.7.8");
    expect(clientIp({})).toBe("unknown");
  });
});
