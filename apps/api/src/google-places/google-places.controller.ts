import { Controller, Get } from "@nestjs/common";
import {
  formatRatingPt,
  formatReviewCountLabel,
} from "./google-places";
import { GooglePlacesService } from "./google-places.service";

@Controller()
export class GooglePlacesController {
  constructor(private readonly googlePlaces: GooglePlacesService) {}

  @Get("api/public/google-place")
  async publicSummary() {
    const summary = await this.googlePlaces.getSummary();
    if (!summary) return { rating: null, userRatingCount: null, googleMapsUri: null };

    return {
      rating: summary.rating,
      userRatingCount: summary.userRatingCount,
      googleMapsUri: summary.googleMapsUri,
      ratingLabel: formatRatingPt(summary.rating),
      reviewCountLabel: formatReviewCountLabel(summary.userRatingCount),
      attribution: "Avaliações do Google",
    };
  }
}
