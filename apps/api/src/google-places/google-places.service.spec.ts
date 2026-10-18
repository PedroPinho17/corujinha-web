import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GooglePlacesService } from "./google-places.service";
import type { RedisService } from "../redis/redis.service";

describe("GooglePlacesService", () => {
  const prev = { ...process.env };
  const redis = {
    getJson: vi.fn(),
    setJson: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GOOGLE_PLACES_API_KEY;
    delete process.env.GOOGLE_PLACE_ID;
    delete process.env.NEXT_PUBLIC_GOOGLE_RATING;
    delete process.env.NEXT_PUBLIC_GOOGLE_REVIEW_COUNT;
    delete process.env.NEXT_PUBLIC_GOOGLE_PLACE_URL;
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  function service() {
    return new GooglePlacesService(redis as unknown as RedisService);
  }

  it("returns cached summary without calling Places", async () => {
    const cached = {
      rating: 5,
      userRatingCount: 18,
      googleMapsUri: "https://maps.google.com/?cid=cached",
    };
    redis.getJson.mockResolvedValueOnce(cached);
    const fetchImpl = vi.fn();

    await expect(service().getSummary(fetchImpl)).resolves.toEqual(cached);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(redis.setJson).not.toHaveBeenCalled();
  });

  it("fetches Places API on cache miss and stores fresh + last-good", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key";
    process.env.GOOGLE_PLACE_ID = "ChIJabc";
    redis.getJson.mockResolvedValue(null);

    const fresh = {
      rating: 4.9,
      userRatingCount: 20,
      googleMapsUri: "https://maps.google.com/?cid=fresh",
    };
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fresh,
    });

    await expect(service().getSummary(fetchImpl)).resolves.toEqual(fresh);
    expect(fetchImpl).toHaveBeenCalled();
    expect(redis.setJson).toHaveBeenCalledWith("google:place:summary", fresh, 86_400);
    expect(redis.setJson).toHaveBeenCalledWith("google:place:summary:last", fresh, 86_400 * 30);
  });

  it("falls back to last-good when Places fails", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key";
    process.env.GOOGLE_PLACE_ID = "ChIJabc";
    const lastGood = {
      rating: 5,
      userRatingCount: 18,
      googleMapsUri: "https://maps.google.com/?cid=last",
    };
    redis.getJson
      .mockResolvedValueOnce(null) // cache
      .mockResolvedValueOnce(lastGood); // last-good

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "boom",
    });

    await expect(service().getSummary(fetchImpl)).resolves.toEqual(lastGood);
  });

  it("falls back to NEXT_PUBLIC_GOOGLE_* when keys are missing", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_RATING = "5.0";
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_COUNT = "18";
    process.env.NEXT_PUBLIC_GOOGLE_PLACE_URL = "https://maps.example/env";
    redis.getJson.mockResolvedValue(null);

    await expect(service().getSummary(vi.fn())).resolves.toEqual({
      rating: 5,
      userRatingCount: 18,
      googleMapsUri: "https://maps.example/env",
    });
  });

  it("returns null when nothing is available", async () => {
    redis.getJson.mockResolvedValue(null);
    await expect(service().getSummary(vi.fn())).resolves.toBeNull();
  });
});
