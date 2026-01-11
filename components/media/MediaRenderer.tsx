import Image from "next/image";
import Link from "next/link";
import type { MediaItem } from "@/lib/media/types";

export function MediaRenderer({ item }: { item: MediaItem }) {
  if (item.type === "image" && item.assets.src) {
    return (
      <Image
        src={item.assets.src}
        alt={item.title}
        width={item.assets.width ?? 1200}
        height={item.assets.height ?? 1200}
        className="h-auto w-full rounded-2xl border border-white/10"
        sizes="(max-width: 768px) 100vw, 75vw"
      />
    );
  }

  if (item.type === "video") {
    return (
      <video
        className="w-full rounded-2xl border border-white/10"
        controls
        preload="metadata"
        poster={item.assets.poster}
      >
        {item.assets.sources?.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
        {item.assets.src ? <source src={item.assets.src} /> : null}
        Your browser does not support the video tag.
      </video>
    );
  }

  if (item.type === "game") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/50">
          Game stub
        </p>
        <p className="mb-4">
          This is a playable experiment in progress. We keep it shipped, but the
          void may still swallow it.
        </p>
        <Link
          href={`/games/${item.slug}`}
          className="inline-flex items-center gap-2 text-lime-200 hover:text-lime-100"
        >
          Visit game page →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
      <p>Media preview unavailable. The file will arrive soon.</p>
    </div>
  );
}
