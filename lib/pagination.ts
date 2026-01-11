import type { MediaItem } from "./media/types";

export interface FeedCursor {
  createdAt: string;
  slug: string;
}

export function encodeCursor(cursor: FeedCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(cursor: string | null): FeedCursor | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as FeedCursor;
    if (!parsed?.createdAt || !parsed?.slug) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function paginateMedia(
  items: MediaItem[],
  cursor: string | null,
  limit: number
) {
  const decoded = decodeCursor(cursor);
  let startIndex = 0;

  if (decoded) {
    const matchIndex = items.findIndex(
      (item) =>
        item.slug === decoded.slug &&
        new Date(item.createdAt).toISOString() ===
          new Date(decoded.createdAt).toISOString()
    );
    startIndex = matchIndex === -1 ? 0 : matchIndex + 1;
  }

  const sliced = items.slice(startIndex, startIndex + limit);
  const lastItem = sliced[sliced.length - 1];
  const nextCursor =
    sliced.length + startIndex < items.length && lastItem
      ? encodeCursor({ createdAt: lastItem.createdAt, slug: lastItem.slug })
      : null;

  return {
    items: sliced,
    nextCursor,
  };
}
