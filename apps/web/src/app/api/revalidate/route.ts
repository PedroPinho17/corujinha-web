import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * On-demand cache bust called by the Nest API after Redis del()/bust().
 * Header: x-revalidate-secret = REVALIDATE_SECRET
 * Body: { tags: string[] }
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET?.trim();
  if (!expected || secret !== expected) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let tags: string[] = [];
  try {
    const body = (await req.json()) as { tags?: unknown };
    if (Array.isArray(body.tags)) {
      tags = body.tags.filter((t): t is string => typeof t === "string" && t.length > 0);
    }
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  for (const tag of tags) {
    revalidateTag(tag);
  }

  return NextResponse.json({ revalidated: true, tags });
}
