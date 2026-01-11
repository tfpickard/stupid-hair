import { NextResponse } from "next/server";
import { getMediaIndex } from "@/lib/media/registry";
import { buildRss } from "@/lib/rss";

export const runtime = "nodejs";

export async function GET() {
  const items = await getMediaIndex();
  const xml = buildRss(items);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
