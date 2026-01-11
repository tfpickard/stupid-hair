import Image from "next/image";
import Link from "next/link";
import type { MediaItem } from "@/lib/media/types";
import { cn } from "@/lib/utils";
import { TagList } from "./TagList";

function getCardImage(item: MediaItem) {
  if (item.assets.poster) return item.assets.poster;
  if (item.type === "image" && item.assets.src) return item.assets.src;
  return "/media/stupid-hair-poster.svg";
}

export function MediaCard({ item }: { item: MediaItem }) {
  const imageSrc = getCardImage(item);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-lime-200/60">
      <Link href={`/m/${item.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={imageSrc}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50">
            <span>{item.type}</span>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-lime-200">
            {item.title}
          </h3>
          {item.description ? (
            <p className="text-sm text-white/70">{item.description}</p>
          ) : null}
          <TagList tags={item.tags} className={cn("mt-auto")} />
        </div>
      </Link>
    </article>
  );
}
