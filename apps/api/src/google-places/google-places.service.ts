import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";
import {
  fetchGooglePlaceDetails,
  summaryFromEnvFallback,
  type GooglePlaceSummary,
} from "./google-places";

const CACHE_KEY = "google:place:summary";
const LAST_GOOD_KEY = "google:place:summary:last";
/** Fresh Places payload — at most one live request per day. */
const CACHE_TTL_SECONDS = 86_400;
/** Keep a stale copy longer so outages still show the last known rating. */
const LAST_GOOD_TTL_SECONDS = 86_400 * 30;

@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);

  constructor(private readonly redis: RedisService) {}

  async getSummary(
    fetchImpl: typeof fetch = fetch,
  ): Promise<GooglePlaceSummary | null> {
    const cached = await this.redis.getJson<GooglePlaceSummary>(CACHE_KEY);
    if (cached && this.isValidSummary(cached)) return cached;

    const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
    const placeId = process.env.GOOGLE_PLACE_ID?.trim();

    if (apiKey && placeId) {
      try {
        const fresh = await fetchGooglePlaceDetails(placeId, apiKey, fetchImpl);
        await this.redis.setJson(CACHE_KEY, fresh, CACHE_TTL_SECONDS);
        await this.redis.setJson(LAST_GOOD_KEY, fresh, LAST_GOOD_TTL_SECONDS);
        return fresh;
      } catch (err) {
        this.logger.warn(
          `Google Places falhou: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const lastGood = await this.redis.getJson<GooglePlaceSummary>(LAST_GOOD_KEY);
    if (lastGood && this.isValidSummary(lastGood)) return lastGood;

    return summaryFromEnvFallback();
  }

  private isValidSummary(value: GooglePlaceSummary): boolean {
    return (
      typeof value.rating === "number" &&
      typeof value.userRatingCount === "number" &&
      typeof value.googleMapsUri === "string" &&
      Number.isFinite(value.rating) &&
      Number.isFinite(value.userRatingCount)
    );
  }
}
