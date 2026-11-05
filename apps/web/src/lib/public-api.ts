const api = process.env.INTERNAL_API_URL ?? "http://localhost:3001";

/** Align with Nest PUBLIC_CACHE_TTL; Redis bust + revalidateTag keep data fresher. */
export const PUBLIC_REVALIDATE_SECONDS = 15 * 60; // 15 minutes

export async function fetchPublicJson<T>(
  path: string,
  tags: string[],
  revalidateSeconds = PUBLIC_REVALIDATE_SECONDS,
): Promise<T | null> {
  try {
    const res = await fetch(`${api}${path}`, {
      next: { revalidate: revalidateSeconds, tags },
    });
    if (!res.ok) {
      console.error(`Public API ${path} returned ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    // Pages fall back to default content, so the outage must at least reach the logs.
    console.error(`Public API ${path} failed:`, err);
    return null;
  }
}

export async function fetchPublicList<T>(
  path: string,
  tags: string[],
  revalidateSeconds = PUBLIC_REVALIDATE_SECONDS,
): Promise<T[]> {
  const data = await fetchPublicJson<T[]>(path, tags, revalidateSeconds);
  return Array.isArray(data) ? data : [];
}
