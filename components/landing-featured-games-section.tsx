import Image from "next/image";
import Link from "next/link";
import { Clock, MessageSquare } from "lucide-react";
import { DiscoveryGameThumbnail } from "@/components/discovery-game-thumbnail";
import type { LandingFeaturedGame } from "@/lib/landing-featured-games";

export function LandingFeaturedGamesSection({
  games,
  useMockContent,
}: {
  games: LandingFeaturedGame[];
  useMockContent: boolean;
}) {
  if (games.length === 0 && !useMockContent) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[1320px] px-6 py-12 sm:px-8 sm:py-14">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">注目の開発中ゲーム</h2>
        <Link
          href="/search"
          className="flex items-center gap-1.5 text-sm font-medium text-violet-300 transition-colors hover:text-violet-200"
        >
          すべて見る
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {games.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-500">
          公開中の作品が増えると、ここに表示されます。
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
          {games.map((game) => (
            <Link
              key={game.id}
              href={game.href}
              className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 transition-colors hover:border-violet-500/40"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {game.image ? (
                  <Image
                    src={game.image}
                    alt={game.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                ) : (
                  <DiscoveryGameThumbnail
                    id={game.id}
                    title={game.title}
                    genre={game.genre}
                    version={game.version}
                    className="h-full w-full rounded-none"
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white">{game.title}</h3>
                <p className="mt-1.5 line-clamp-1 text-sm text-zinc-500">{game.description}</p>
                {(game.feedback > 0 || game.updated) && (
                  <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                    {game.feedback > 0 && (
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="size-3.5 text-violet-400" aria-hidden="true" />
                        {game.feedback}
                      </span>
                    )}
                    {game.updated && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {game.updated}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
