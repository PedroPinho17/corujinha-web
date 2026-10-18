import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchGooglePlaceDetails,
  formatRatingPt,
  formatReviewCountLabel,
  normalizePlaceId,
  summaryFromEnvFallback,
} from "./google-places";

describe("google-places helpers", () => {
  it("normalizes place ids and formats Portuguese labels", () => {
    expect(normalizePlaceId("places/ChIJabc")).toBe("ChIJabc");
    expect(normalizePlaceId(" ChIJabc ")).toBe("ChIJabc");
    expect(formatRatingPt(5)).toBe("5,0");
    expect(formatRatingPt(4.9)).toBe("4,9");
    expect(formatReviewCountLabel(1)).toBe("1 avaliação");
    expect(formatReviewCountLabel(18)).toBe("18 avaliações");
  });
});

describe("fetchGooglePlaceDetails", () => {
  it("calls Places API (New) with required headers on success", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        rating: 5,
        userRatingCount: 18,
        googleMapsUri: "https://maps.google.com/?cid=1",
      }),
    });

    const summary = await fetchGooglePlaceDetails("places/ChIJtest", "test-key", fetchImpl);

    expect(summary).toEqual({
      rating: 5,
      userRatingCount: 18,
      googleMapsUri: "https://maps.google.com/?cid=1",
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://places.googleapis.com/v1/places/ChIJtest",
      expect.objectContaining({
        method: "GET",
        headers: {
          "X-Goog-Api-Key": "test-key",
          "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri",
        },
      }),
    );
  });

  it("throws when place id or api key are empty", async () => {
    await expect(fetchGooglePlaceDetails(" ", "key")).rejects.toThrow(/obrigatórios/);
    await expect(fetchGooglePlaceDetails("ChIJ", " ")).rejects.toThrow(/obrigatórios/);
  });

  it("throws when the API responds with an error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "PERMISSION_DENIED",
    });

    await expect(fetchGooglePlaceDetails("ChIJtest", "bad-key", fetchImpl)).rejects.toThrow(
      /Google Places API 403/,
    );
  });

  it("throws when the response is missing required fields", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rating: 5 }),
    });

    await expect(fetchGooglePlaceDetails("ChIJtest", "test-key", fetchImpl)).rejects.toThrow(
      /incompleta/,
    );
  });
});

describe("summaryFromEnvFallback", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_RATING;
    delete process.env.NEXT_PUBLIC_GOOGLE_REVIEW_COUNT;
    delete process.env.NEXT_PUBLIC_GOOGLE_PLACE_URL;
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("returns null when rating/count env vars are missing", () => {
    expect(summaryFromEnvFallback()).toBeNull();
    expect(summaryFromEnvFallback({ fallbackRating: "5.0" })).toBeNull();
  });

  it("parses NEXT_PUBLIC_GOOGLE_* fallbacks", () => {
    expect(
      summaryFromEnvFallback({
        fallbackRating: "5.0",
        fallbackCount: "18",
        fallbackMapsUri: "https://maps.example/place",
      }),
    ).toEqual({
      rating: 5,
      userRatingCount: 18,
      googleMapsUri: "https://maps.example/place",
    });
  });
});
