import Link from "next/link";
import { FeedClient } from "@/components/feed/FeedClient";
import { getFeedPage } from "@/lib/feed";
import { siteConfig } from "@/lib/site";

export const revalidate = 60;

export default async function HomePage() {
  const { items, nextCursor } = await getFeedPage({
    limit: 12,
  });

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
            Creator portfolio
          </p>
          <h1 className="text-4xl font-semibold text-white md:text-5xl">
            {siteConfig.name}
          </h1>
          <p className="text-base text-white/70 md:text-lg">
            {siteConfig.tagline}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/50">
            <span>{siteConfig.handle}</span>
            <span className="text-lime-200">Sora feed</span>
            <Link href="/about" className="hover:text-lime-200">
              Roadmap
            </Link>
          </div>
        </div>
      </section>

      <FeedClient
        initialItems={items}
        initialCursor={nextCursor}
        initialFilters={{}}
      />
    </div>
  );
}
