import Link from "next/link";
import { getMediaIndex } from "@/lib/media/registry";

export const revalidate = 60;

export default async function GamesPage() {
  const items = await getMediaIndex();
  const games = items.filter((item) => item.type === "game");

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
          Experiments
        </p>
        <h1 className="text-3xl font-semibold text-white md:text-4xl">Games</h1>
        <p className="text-base text-white/70">
          Prototype web games and playable nightmares. Some still chew on
          loading screens.
        </p>
      </header>

      <div className="space-y-4">
        {games.map((game) => (
          <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            className="block rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 transition hover:border-lime-200/60 hover:text-white"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              {new Date(game.createdAt).toLocaleDateString()}
            </p>
            <h2 className="text-lg font-semibold text-white">
              {game.title}
            </h2>
            {game.description ? <p>{game.description}</p> : null}
          </Link>
        ))}
        {games.length === 0 ? (
          <p className="text-sm text-white/60">
            No games yet. The monsters are still compiling.
          </p>
        ) : null}
      </div>
    </div>
  );
}
