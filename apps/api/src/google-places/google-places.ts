export type GooglePlaceSummary = {
  rating: number;
  userRatingCount: number;
  googleMapsUri: string;
};

export type GooglePlaceEnv = {
  apiKey?: string | null;
  placeId?: string | null;
  fallbackRating?: string | null;
  fallbackCount?: string | null;
  fallbackMapsUri?: string | null;
};

const PLACES_URL = "https://places.googleapis.com/v1/places";
const FIELD_MASK = "rating,userRatingCount,googleMapsUri";

export function normalizePlaceId(placeId: string): string {
  return placeId.trim().replace(/^places\//, "");
}

export function formatRatingPt(rating: number): string {
  return rating.toFixed(1).replace(".", ",");
}

export function formatReviewCountLabel(count: number): string {
  return count === 1 ? "1 avaliação" : `${count} avaliações`;
}

/** Parse NEXT_PUBLIC_GOOGLE_* (or equivalents) into a summary, or null. */
export function summaryFromEnvFallback(env: GooglePlaceEnv = {}): GooglePlaceSummary | null {
  const ratingRaw = (env.fallbackRating ?? process.env.NEXT_PUBLIC_GOOGLE_RATING)?.trim();
  const countRaw = (env.fallbackCount ?? process.env.NEXT_PUBLIC_GOOGLE_REVIEW_COUNT)?.trim();
  if (!ratingRaw || !countRaw) return null;

  const rating = Number(ratingRaw);
  const userRatingCount = Number(countRaw);
  if (!Number.isFinite(rating) || !Number.isFinite(userRatingCount)) return null;
  if (rating < 1 || rating > 5 || userRatingCount < 0) return null;

  const googleMapsUri =
    (env.fallbackMapsUri ?? process.env.NEXT_PUBLIC_GOOGLE_PLACE_URL)?.trim() ||
    "";

  return { rating, userRatingCount, googleMapsUri };
}

export async function fetchGooglePlaceDetails(
  placeId: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GooglePlaceSummary> {
  const id = normalizePlaceId(placeId);
  if (!id || !apiKey.trim()) {
    throw new Error("GOOGLE_PLACE_ID e GOOGLE_PLACES_API_KEY são obrigatórios");
  }

  const res = await fetchImpl(`${PLACES_URL}/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey.trim(),
      "X-Goog-FieldMask": FIELD_MASK,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google Places API ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`);
  }

  const data = (await res.json()) as {
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
  };

  if (
    typeof data.rating !== "number" ||
    typeof data.userRatingCount !== "number" ||
    typeof data.googleMapsUri !== "string" ||
    !data.googleMapsUri
  ) {
    throw new Error("Resposta Google Places incompleta (rating/userRatingCount/googleMapsUri)");
  }

  return {
    rating: data.rating,
    userRatingCount: data.userRatingCount,
    googleMapsUri: data.googleMapsUri,
  };
}
