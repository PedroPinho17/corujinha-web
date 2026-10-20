import type Redis from "ioredis";

export const CLIENT_IP_HEADER = "x-corujinha-client-ip";

/** In-memory sliding-window rate limiter (per process) — fallback when Redis is down. */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  private recent(key: string, now = Date.now()): number[] {
    const cutoff = now - this.windowMs;
    const prev = this.hits.get(key) ?? [];
    const kept = prev.filter((t) => t > cutoff);
    this.hits.set(key, kept);
    return kept;
  }

  /** True if under the limit (does not record a hit). */
  check(key: string): boolean {
    return this.recent(key).length < this.limit;
  }

  /** Record one hit. */
  hit(key: string): void {
    const now = Date.now();
    const recent = this.recent(key, now);
    recent.push(now);
    this.hits.set(key, recent);
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
    const redisKey = this.redisKey(key);
    try {
      const count = await this.redis.incr(redisKey);
      if (count === 1) {
        await this.redis.pexpire(redisKey, this.windowMs);
      }
    } catch {
      this.memory.hit(key);
    }
  }

  /** Returns true if allowed (records a hit when allowed). */
  async allow(key: string): Promise<boolean> {
    if (!(await this.check(key))) return false;
    await this.hit(key);
    return true;
  }
}
