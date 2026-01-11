import { notFound } from "next/navigation";
import Link from "next/link";
import { renderMdx } from "@/lib/mdx";
import {
  getMediaEntry,
  getMediaIndex,
  getMediaSlugs,
} from "@/lib/media/registry";
import { MediaRenderer } from "@/components/media/MediaRenderer";
import { TagList } from "@/components/media/TagList";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getMediaSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const entry = await getMediaEntry(slug);
    const item = entry.item;
    return {
      title: `${item.title} · stupid.hair`,
      description: item.description,
      openGraph: {
        title: item.title,
        description: item.description,
        images: item.assets.poster ? [item.assets.poster] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: item.title,
        description: item.description,
        images: item.assets.poster ? [item.assets.poster] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function MediaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let entry;
  try {
    entry = await getMediaEntry(slug);
  } catch {
    notFound();
  }

  const { item, content } = entry;
  const rendered = await renderMdx(content);
  const allItems = await getMediaIndex();
  const currentIndex = allItems.findIndex((media) => media.slug === slug);
  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < allItems.length - 1
      ? allItems[currentIndex + 1]
      : null;

  return (
    <article className="space-y-10">
      <Link
        href="/"
        className="text-xs uppercase tracking-[0.2em] text-white/50 hover:text-lime-200"
      >
        ← Back to feed
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/50">
          <span>{item.type}</span>
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          {item.sora?.username ? <span>@{item.sora.username}</span> : null}
        </div>
        <h1 className="text-3xl font-semibold text-white md:text-4xl">
          {item.title}
        </h1>
        {item.description ? (
          <p className="text-base text-white/70">{item.description}</p>
        ) : null}
        <TagList tags={item.tags} />
      </header>

      <MediaRenderer item={item} />

      <section className="space-y-4 text-sm leading-relaxed text-white/80">
        {rendered}
      </section>

      <nav className="flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
        {prevItem ? (
          <Link href={`/m/${prevItem.slug}`} className="hover:text-lime-200">
            ← {prevItem.title}
          </Link>
        ) : (
          <span />
        )}
        {nextItem ? (
          <Link href={`/m/${nextItem.slug}`} className="hover:text-lime-200">
            {nextItem.title} →
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
