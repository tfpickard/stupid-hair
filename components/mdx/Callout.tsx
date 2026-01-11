import { cn } from "@/lib/utils";

export function Callout({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80",
        className
      )}
    >
      {title ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-200">
          {title}
        </p>
      ) : null}
      <div className="space-y-2">{children}</div>
    </aside>
  );
}
