import { FeedClient } from "@/components/feed/FeedClient";
import { getFeedPage } from "@/lib/feed";
import type { MediaType } from "@/lib/media/types";

export async function FeedPage({
  title,
  description,
  initialType,
}: {
  title: string;
  description: string;
  initialType?: MediaType;
}) {
  const { items, nextCursor } = await getFeedPage({
    limit: 12,
    filters: {
      type: initialType,
    },
  });

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
          {description}
        </p>
        <h1 className="text-3xl font-semibold text-white md:text-4xl">
          {title}
        </h1>
      </header>
      <FeedClient
        initialItems={items}
        initialCursor={nextCursor}
        initialFilters={{ type: initialType }}
      />
    </div>
  );
}
