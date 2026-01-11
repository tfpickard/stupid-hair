import { NextResponse } from "next/server";
import { getFeedPage } from "@/lib/feed";
import type { MediaType } from "@/lib/media/types";

export const runtime = "nodejs";

const MAX_LIMIT = 24;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limitRaw = searchParams.get("limit");
  const query = searchParams.get("q") ?? undefined;
  const type = (searchParams.get("type") as MediaType | null) ?? undefined;
  const tagsParam = searchParams.get("tags") ?? "";

  const limit = Math.min(
    Number(limitRaw) || 12,
    MAX_LIMIT
  );
  const tags = tagsParam
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const { items, nextCursor } = await getFeedPage({
    cursor,
    limit,
    filters: {
      query,
      type,
      tags,
    },
  });

  return NextResponse.json({
    items,
    nextCursor,
  });
}
