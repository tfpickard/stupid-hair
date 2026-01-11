import type { MediaItem, MediaType } from "./media/types";
import { getMediaIndex } from "./media/registry";
import { paginateMedia } from "./pagination";

export interface FeedFilters {
  query?: string;
  type?: MediaType;
  tags?: string[];
}

export interface FeedPage {
  items: MediaItem[];
  nextCursor: string | null;
  total: number;
}

function matchesFilters(item: MediaItem, filters: FeedFilters) {
  if (filters.type && item.type !== filters.type) {
    return false;
  }

  if (filters.query) {
    const query = filters.query.toLowerCase();
    const haystack = `${item.title} ${item.description ?? ""}`.toLowerCase();
    if (!haystack.includes(query)) {
      return false;
    }
  }

  if (filters.tags && filters.tags.length > 0) {
    const tagSet = new Set(item.tags.map((tag) => tag.toLowerCase()));
    const hasAll = filters.tags.every((tag) => tagSet.has(tag.toLowerCase()));
    if (!hasAll) {
      return false;
    }
  }

  return item.visibility !== "unlisted";
}

export async function getFeedPage({
  cursor,
  limit = 12,
  filters = {},
}: {
  cursor?: string | null;
  limit?: number;
  filters?: FeedFilters;
}): Promise<FeedPage> {
  const items = await getMediaIndex();
  const filtered = items.filter((item) => matchesFilters(item, filters));
  const { items: pagedItems, nextCursor } = paginateMedia(
    filtered,
    cursor ?? null,
    limit
  );

  return {
    items: pagedItems,
    nextCursor,
    total: filtered.length,
  };
}
