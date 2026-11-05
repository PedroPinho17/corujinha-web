import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

/** Default public-cache TTL. Writes already call del() / bust(), so longer is safe. */
export const PUBLIC_CACHE_TTL_SECONDS = 30 * 60; // 30 minutes

/** Nest Redis keys → Next.js cache tags (revalidateTag). */
const NEXT_TAGS_BY_KEY: Record<string, string[]> = {
  "public:home": ["home"],
  "public:posts": ["posts", "home"],
  "public:posts:featured": ["posts", "home"],
  "public:gallery": ["gallery", "home"],
  "public:team": ["team", "home"],
  "public:centers": ["centers", "home"],
  "public:settings": ["settings", "home"],
  "public:formations": ["formations", "home"],
  "public:entities": ["entities", "home"],
  "public:protocols": ["protocols", "home"],
};

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private reportedOutage = false;
  readonly client: Redis;

  constructor() {
    // Fail fast while Redis is down: queued commands would leave requests hanging and the
    // callers' fallbacks (database, in-memory rate limit) would never run.
    this.client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.client.on("error", (err: Error) => {
      if (this.reportedOutage) return;
      this.reportedOutage = true;
      this.logger.error(`Redis unavailable: ${err.message}`);
    });
    this.client.on("ready", () => {
      if (this.reportedOutage) this.logger.log("Redis connection restored");
      this.reportedOutage = false;
    });
  }

  /** A cache failure is treated as a miss: content then comes from the database. */
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds = PUBLIC_CACHE_TTL_SECONDS,
  ): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // Not cached this time; the next read goes to the database again.
    }
  }

  async del(...keys: string[]): Promise<void> {
    try {
      if (keys.length) await this.client.del(...keys);
    } catch (err) {
      this.logger.warn(`Could not clear cache keys (${keys.join(", ")}): ${String(err)}`);
    }
    void this.notifyNextRevalidate(keys);
  }

  /** Fire-and-forget: ask Next to drop Data Cache tags after Redis bust. */
  private async notifyNextRevalidate(keys: string[]): Promise<void> {
    const secret = process.env.REVALIDATE_SECRET?.trim();
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "").replace(
      /\/$/,
      "",
    );
    if (!secret || !appUrl) {
      console.warn("REVALIDATE_SECRET or NEXT_PUBLIC_APP_URL missing: the site will show old content until its cache expires.");
      return;
    }

    const tags = new Set<string>();
    for (const key of keys) {
      for (const tag of NEXT_TAGS_BY_KEY[key] ?? []) tags.add(tag);
    }
    if (tags.size === 0) return;

    try {
      const res = await fetch(`${appUrl}/api/revalidate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-revalidate-secret": secret,
        },
        body: JSON.stringify({ tags: [...tags] }),
        signal: AbortSignal.timeout(3_000),
      });
      if (!res.ok) {
        console.warn(`Site cache not refreshed: /api/revalidate returned ${res.status}. Check REVALIDATE_SECRET in web and api.`);
      }
    } catch {
      // Next may be down in local/API-only runs — Redis bust still applies.
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      // Already disconnected.
    }
  }
}
