import { cn } from "@/lib/utils";

export function PromptBlock({
  prompt,
  className,
}: {
  prompt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80",
        className
      )}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-200">
        Prompt
      </p>
      <p className="whitespace-pre-wrap">{prompt}</p>
    </div>
  );
}
