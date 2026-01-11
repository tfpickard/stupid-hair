import { cn } from "@/lib/utils";

export function TagList({
  tags,
  className,
}: {
  tags: string[];
  className?: string;
}) {
  if (!tags?.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full border border-white/15 px-2 py-0.5 text-xs uppercase tracking-wide text-white/70"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
