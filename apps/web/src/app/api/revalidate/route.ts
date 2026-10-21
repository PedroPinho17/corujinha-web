import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

const MAX_TAGS = 32;
const MAX_TAG_LENGTH = 128;

/**
 * On-demand cache bust called by the Nest API after Redis del()/bust().
 * Header: x-revalidate-secret = REVALIDATE_SECRET
 * Body: { tags: string[] } — at most MAX_TAGS entries
 */
function secretsEqual(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Keep roughly constant work on length mismatch (avoid early return leak).
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET?.trim();
  if (!secretsEqual(secret, expected)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let tags: string[] = [];
  try {
    const body = (await req.json()) as { tags?: unknown };
    if (Array.isArray(body.tags)) {
      tags = body.tags.filter(
        (t): t is string => typeof t === "string" && t.length > 0 && t.length <= MAX_TAG_LENGTH,
      );
    }
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (tags.length > MAX_TAGS) {
    return NextResponse.json(
      { message: `At most ${MAX_TAGS} tags allowed` },
      { status: 400 },
    );
  }

  for (const tag of tags) {
    revalidateTag(tag);
  }

  return NextResponse.json({ revalidated: true, tags });
}
