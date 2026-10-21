import { Injectable, OnModuleDestroy } from "@nestjs/common";
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
  readonly client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds = PUBLIC_CACHE_TTL_SECONDS,
  ): Promise<void> {
    await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length) await this.client.del(...keys);
    void this.notifyNextRevalidate(keys);
  }

  /** Fire-and-forget: ask Next to drop Data Cache tags after Redis bust. */
  private async notifyNextRevalidate(keys: string[]): Promise<void> {
    const secret = process.env.REVALIDATE_SECRET?.trim();
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "").replace(
      /\/$/,
      "",
    );
    if (!secret || !appUrl) return;

    const tags = new Set<string>();
    for (const key of keys) {
      for (const tag of NEXT_TAGS_BY_KEY[key] ?? []) tags.add(tag);
    }
    if (tags.size === 0) return;

    try {
      await fetch(`${appUrl}/api/revalidate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-revalidate-secret": secret,
        },
        body: JSON.stringify({ tags: [...tags] }),
        signal: AbortSignal.timeout(3_000),
      });
    } catch {
      // Next may be down in local/API-only runs — Redis bust still applies.
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
