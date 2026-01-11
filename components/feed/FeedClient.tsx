"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaItem, MediaType } from "@/lib/media/types";
import { MediaCard } from "@/components/media/MediaCard";

const PAGE_SIZE = 12;

interface FeedFilters {
  query?: string;
  type?: MediaType;
  tags?: string[];
}

function normalizeTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function fetchFeedPage({
  cursor,
  filters,
}: {
  cursor?: string | null;
  filters: FeedFilters;
}) {
  const params = new URLSearchParams();
  params.set("limit", PAGE_SIZE.toString());
  if (cursor) params.set("cursor", cursor);
  if (filters.query) params.set("q", filters.query);
  if (filters.type) params.set("type", filters.type);
  if (filters.tags && filters.tags.length > 0) {
    params.set("tags", filters.tags.join(","));
  }
  const response = await fetch(`/api/feed?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load feed");
  }
  return (await response.json()) as {
    items: MediaItem[];
    nextCursor: string | null;
  };
}

export function FeedClient({
  initialItems,
  initialCursor,
  initialFilters,
}: {
  initialItems: MediaItem[];
  initialCursor: string | null;
  initialFilters: FeedFilters;
}) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [status, setStatus] = useState<
    "idle" | "loading" | "loading-more" | "error"
  >("idle");

  const [pendingQuery, setPendingQuery] = useState(
    initialFilters.query ?? ""
  );
  const [pendingType, setPendingType] = useState<"" | MediaType>(
    initialFilters.type ?? ""
  );
  const [pendingTags, setPendingTags] = useState(
    initialFilters.tags?.join(", ") ?? ""
  );

  const [filters, setFilters] = useState<FeedFilters>(initialFilters);
  const initialLoad = useRef(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = Boolean(cursor);

  const activeFiltersLabel = useMemo(() => {
    const parts = [];
    if (filters.type) parts.push(filters.type);
    if (filters.query) parts.push(`“${filters.query}”`);
    if (filters.tags && filters.tags.length) {
      parts.push(filters.tags.join(", "));
    }
    return parts.length ? parts.join(" · ") : "Everything";
  }, [filters]);

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }

    let ignore = false;

    const load = async () => {
      setStatus("loading");
      try {
        const response = await fetchFeedPage({ cursor: null, filters });
        if (ignore) return;
        setItems(response.items);
        setCursor(response.nextCursor);
        setStatus("idle");
      } catch {
        if (ignore) return;
        setStatus("error");
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [filters]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!cursor || status !== "idle") return;

        setStatus("loading-more");
        fetchFeedPage({ cursor, filters })
          .then((response) => {
            setItems((prev) => [...prev, ...response.items]);
            setCursor(response.nextCursor);
            setStatus("idle");
          })
          .catch(() => {
            setStatus("error");
          });
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, filters, status]);

  const handleApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      query: pendingQuery.trim() || undefined,
      type: pendingType || undefined,
      tags: normalizeTags(pendingTags),
    });
  };

  return (
    <section className="space-y-6">
      <form
        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 lg:flex-row lg:items-end"
        onSubmit={handleApplyFilters}
      >
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">
            Search title
          </span>
          <input
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-lime-200"
            type="text"
            value={pendingQuery}
            onChange={(event) => setPendingQuery(event.target.value)}
            placeholder="Sora, melon, glitch"
          />
        </label>
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">
            Type
          </span>
          <select
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-lime-200"
            value={pendingType}
            onChange={(event) =>
              setPendingType(event.target.value as "" | MediaType)
            }
          >
            <option value="">All</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="game">Game</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">
            Tags
          </span>
          <input
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-lime-200"
            type="text"
            value={pendingTags}
            onChange={(event) => setPendingTags(event.target.value)}
            placeholder="body horror, citrus"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl border border-lime-200/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-100 transition hover:bg-lime-200/10"
        >
          Apply
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
        <span>Filter:</span>
        <span className="text-lime-200">{activeFiltersLabel}</span>
      </div>

      {status === "error" ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          The feed misbehaved. Refresh and try again.
        </div>
      ) : null}

      {items.length === 0 && status !== "loading" ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          Nothing matches those filters. Try fewer curses.
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
      </div>

      {status === "loading" ? (
        <p className="text-sm text-white/60">Loading the feed...</p>
      ) : null}

      {!hasMore && items.length > 0 ? (
        <p className="text-sm text-white/60">
          That is the end of the scroll spiral.
        </p>
      ) : null}

      <div ref={sentinelRef} className="h-6" />

      {status === "loading-more" ? (
        <p className="text-sm text-white/60">Fetching more artifacts...</p>
      ) : null}
    </section>
  );
}
