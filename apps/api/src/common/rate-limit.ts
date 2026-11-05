import type Redis from "ioredis";

export const CLIENT_IP_HEADER = "x-corujinha-client-ip";

/** In-memory sliding-window rate limiter (per process) — fallback when Redis is down. */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();
  private static readonly SWEEP_ABOVE_KEYS = 10_000;

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  private recent(key: string, now = Date.now()): number[] {
    const cutoff = now - this.windowMs;
    const prev = this.hits.get(key) ?? [];
    const kept = prev.filter((t) => t > cutoff);
    if (kept.length) this.hits.set(key, kept);
    else this.hits.delete(key);
    return kept;
  }

  /** Bounds memory: a key that is never queried again would otherwise stay forever. */
  private sweep(now: number) {
    if (this.hits.size <= SlidingWindowRateLimiter.SWEEP_ABOVE_KEYS) return;
    for (const key of [...this.hits.keys()]) this.recent(key, now);
  }

  /** True if under the limit (does not record a hit). */
  check(key: string): boolean {
    return this.recent(key).length < this.limit;
  }

  /** Record one hit. */
  hit(key: string): void {
    const now = Date.now();
    this.sweep(now);
    const recent = this.recent(key, now);
    recent.push(now);
    this.hits.set(key, recent);
  }

  /** Gives back the most recent hit. */
  release(key: string): void {
    const recent = this.recent(key);
    recent.pop();
    if (recent.length) this.hits.set(key, recent);
    else this.hits.delete(key);
  }

  /** Returns true if the request is allowed (records a hit when allowed). */
  allow(key: string): boolean {
    if (!this.check(key)) return false;
    this.hit(key);
    return true;
  }
}

function normalizeIp(ip: string): string {
  return ip.replace(/^::ffff:/i, "").trim();
}

/** Loopback / RFC1918 / link-local — typical Docker/Next peer addresses. */
export function isTrustedPeer(ip: string | undefined): boolean {
  if (!ip) return false;
  const n = normalizeIp(ip);
  if (n === "unknown") return false;
  if (n === "127.0.0.1" || n === "::1" || n === "localhost") return true;
  if (n.startsWith("10.")) return true;
  if (n.startsWith("192.168.")) return true;
  if (n.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(n)) return true;
  if (n.startsWith("fc") || n.startsWith("fd") || n.startsWith("fe80:")) return true;
  return false;
}

function headerValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

/**
 * IP for rate limits. Never trusts client-supplied X-Forwarded-For.
 * When the peer is a private hop (Next/Traefik internal), prefer
 * `x-corujinha-client-ip` set by the Next middleware.
 */
export function clientIp(req: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const peer = req.socket?.remoteAddress ? normalizeIp(req.socket.remoteAddress) : "";
  const fromNext = headerValue(req.headers, CLIENT_IP_HEADER);
  if (fromNext && isTrustedPeer(peer || "127.0.0.1")) {
    const cleaned = normalizeIp(fromNext.split(",")[0] ?? "");
    if (cleaned) return cleaned;
  }
  if (peer) return peer;
  return "unknown";
}

// Lua runs atomically in Redis: concurrent requests cannot slip past the limit, and a crash
// cannot leave a counter without expiry (which would block that key forever).
export const RATE_LIMIT_HIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 or redis.call('PTTL', KEYS[1]) < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return count`;

export const RATE_LIMIT_ALLOW_SCRIPT = `
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
if count >= tonumber(ARGV[2]) then
  return 0
end
count = redis.call('INCR', KEYS[1])
if count == 1 or redis.call('PTTL', KEYS[1]) < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return 1`;

export const RATE_LIMIT_RELEASE_SCRIPT = `
if tonumber(redis.call('GET', KEYS[1]) or '0') > 0 then
  redis.call('DECR', KEYS[1])
end
return 1`;

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

  private redisKey(key: string) {
    return `${this.prefix}:${key}`;
  }

  /** True if under the limit (does not record a hit). */
  async check(key: string): Promise<boolean> {
    if (!this.redis) return this.memory.check(key);
    try {
      const raw = await this.redis.get(this.redisKey(key));
      return Number(raw ?? 0) < this.limit;
    } catch {
      return this.memory.check(key);
    }
  }

  /** Record one hit (e.g. failed login). */
  async hit(key: string): Promise<void> {
    if (!this.redis) {
      this.memory.hit(key);
      return;
    }
    try {
      await this.redis.eval(RATE_LIMIT_HIT_SCRIPT, 1, this.redisKey(key), this.windowMs);
    } catch {
      this.memory.hit(key);
    }
  }

  /** Atomically checks the limit and records a hit when allowed. */
  async allow(key: string): Promise<boolean> {
    if (!this.redis) return this.memory.allow(key);
    try {
      const allowed = await this.redis.eval(
        RATE_LIMIT_ALLOW_SCRIPT,
        1,
        this.redisKey(key),
        this.windowMs,
        this.limit,
      );
      return allowed === 1;
    } catch {
      return this.memory.allow(key);
    }
  }

  /** Gives back a hit taken by allow(), e.g. when a login attempt succeeded. */
  async release(key: string): Promise<void> {
    if (!this.redis) {
      this.memory.release(key);
      return;
    }
    try {
      await this.redis.eval(RATE_LIMIT_RELEASE_SCRIPT, 1, this.redisKey(key));
    } catch {
      this.memory.release(key);
    }
  }
}
