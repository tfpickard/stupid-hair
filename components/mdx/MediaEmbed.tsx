import Image from "next/image";
import type { MediaAssetSource } from "@/lib/media/types";

export function MediaEmbed({
  title,
  type = "video",
  poster,
  src,
  sources,
  width = 1200,
  height = 720,
}: {
  title?: string;
  type?: "video" | "image";
  poster?: string;
  src?: string;
  sources?: MediaAssetSource[];
  width?: number;
  height?: number;
}) {
  if (type === "image" && src) {
    return (
      <figure className="space-y-2">
        <Image
          src={src}
          alt={title ?? "Embedded image"}
          width={width}
          height={height}
          className="h-auto w-full rounded-2xl border border-white/10"
        />
        {title ? (
          <figcaption className="text-xs uppercase tracking-[0.2em] text-white/50">
            {title}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (src || sources?.length) {
    return (
      <figure className="space-y-2">
        <video
          className="w-full rounded-2xl border border-white/10"
          controls
          preload="metadata"
          poster={poster}
        >
          {sources?.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
          {src ? <source src={src} /> : null}
        </video>
        {title ? (
          <figcaption className="text-xs uppercase tracking-[0.2em] text-white/50">
            {title}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return null;
}
