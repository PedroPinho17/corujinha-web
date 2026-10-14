import type Redis from "ioredis";

/** In-memory sliding-window rate limiter (per process) — fallback when Redis is down. */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Returns true if the request is allowed. */
  allow(key: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const prev = this.hits.get(key) ?? [];
    const recent = prev.filter((t) => t > cutoff);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}

/**
 * Prefer Express `req.ip` (respects `trust proxy`).
 * Do not trust client-supplied X-Forwarded-For for rate limits.
 */
export function clientIp(req: {
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/** Redis fixed-window counter; falls back to memory limiter on error. */
export class RedisRateLimiter {
  private readonly memory: SlidingWindowRateLimiter;

  constructor(
    private readonly redis: Redis | null,
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly prefix: string,
  ) {
    this.memory = new SlidingWindowRateLimiter(limit, windowMs);
  }

  async allow(key: string): Promise<boolean> {
    if (!this.redis) return this.memory.allow(key);
    const redisKey = `${this.prefix}:${key}`;
    try {
      const count = await this.redis.incr(redisKey);
      if (count === 1) {
        await this.redis.pexpire(redisKey, this.windowMs);
      }
      return count <= this.limit;
    } catch {
      return this.memory.allow(key);
    }
  }
}
