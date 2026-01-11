import Link from "next/link";
import { notFound } from "next/navigation";
import { getMediaEntry, getMediaIndex } from "@/lib/media/registry";

export const revalidate = 60;

export async function generateStaticParams() {
  const items = await getMediaIndex();
  return items.filter((item) => item.type === "game").map((item) => ({
    slug: item.slug,
  }));
}

export default async function GameDetailPage({
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

  const { item } = entry;
  if (item.type !== "game") {
    notFound();
  }

  return (
    <div className="space-y-8">
      <Link
        href="/games"
        className="text-xs uppercase tracking-[0.2em] text-white/50 hover:text-lime-200"
      >
        ← Back to games
      </Link>
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
          Game stub
        </p>
        <h1 className="text-3xl font-semibold text-white md:text-4xl">
          {item.title}
        </h1>
        {item.description ? (
          <p className="text-base text-white/70">{item.description}</p>
        ) : null}
      </header>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        <p>
          This is a placeholder for the playable build. When the game goes live,
          this page will host an iframe or full-screen scene.
        </p>
      </div>
    </div>
  );
}
