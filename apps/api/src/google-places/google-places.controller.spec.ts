import { describe, expect, it, vi } from "vitest";
import { GooglePlacesController } from "./google-places.controller";
import type { GooglePlacesService } from "./google-places.service";

describe("GooglePlacesController", () => {
  it("returns null fields when there is no summary", async () => {
    const googlePlaces = {
      getSummary: vi.fn().mockResolvedValue(null),
    };
    const ctrl = new GooglePlacesController(googlePlaces as unknown as GooglePlacesService);
    await expect(ctrl.publicSummary()).resolves.toEqual({
      rating: null,
      userRatingCount: null,
      googleMapsUri: null,
    });
  });

  it("returns formatted labels and Google attribution", async () => {
    const googlePlaces = {
      getSummary: vi.fn().mockResolvedValue({
        rating: 5,
        userRatingCount: 18,
        googleMapsUri: "https://maps.google.com/?cid=1",
      }),
    };
    const ctrl = new GooglePlacesController(googlePlaces as unknown as GooglePlacesService);
    await expect(ctrl.publicSummary()).resolves.toEqual({
      rating: 5,
      userRatingCount: 18,
      googleMapsUri: "https://maps.google.com/?cid=1",
      ratingLabel: "5,0",
      reviewCountLabel: "18 avaliações",
      attribution: "Avaliações do Google",
    });
  });
});
