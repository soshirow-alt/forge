"use client";

import Link from "next/link";
import { CreatorFollowButton } from "@/components/creator-follow-button";
import { ForgeHeader } from "@/components/forge-header";
import { GameTags } from "@/components/game-tags";
import { GameThumbnail } from "@/components/game-thumbnail";
import { useGames } from "@/components/games-provider";

function CreatorGameCard({
  id,
  title,
  genre,
  status,
  phase,
  thumbnailUrl,
  tags,
}: {
  id: string;
  title: string;
  genre: string;
  status: string;
  phase: string;
  thumbnailUrl?: string;
  tags: string[];
}) {
  return (
    <Link
      href={`/games/${id}`}
      className="group block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10"
    >
      <GameThumbnail
        thumbnailUrl={thumbnailUrl}
        status={status}
        projectId={id}
        title={title}
        genre={genre}
        phase={phase}
      />
      <div className="p-4">
        <h3 className="font-semibold text-zinc-100 transition-colors group-hover:text-orange-400">
          {title}
        </h3>
        <p className="mt-1 text-sm text-zinc-500">{genre}</p>
        <GameTags tags={tags} />
      </div>
    </Link>
  );
}

export function CreatorPageClient({ id }: { id: string }) {
  const { getGamesByCreator, resolveCreatorById } = useGames();
  const creator = resolveCreatorById(id);
  const games = getGamesByCreator(creator.name);

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <ForgeHeader />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
        >
          ← 作品一覧に戻る
        </Link>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8">
          <h1 className="text-3xl font-bold tracking-tight">{creator.name}</h1>
          <p className="mt-4 leading-relaxed text-zinc-300">{creator.profile}</p>
          {(creator.xAccount || creator.website) && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {creator.xAccount && (
                <a
                  href={
                    creator.xAccount.startsWith("http")
                      ? creator.xAccount
                      : `https://x.com/${creator.xAccount.replace(/^@/, "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 transition-colors hover:text-orange-300"
                >
                  X: {creator.xAccount}
                </a>
              )}
              {creator.website && (
                <a
                  href={creator.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 transition-colors hover:text-orange-300"
                >
                  Webサイト
                </a>
              )}
            </div>
          )}
          <CreatorFollowButton creatorRouteKey={creator.id} />
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">作者の作品</h2>
          {games.length === 0 ? (
            <p className="mt-4 text-zinc-500">まだ作品がありません。</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((game) => (
                <CreatorGameCard key={game.id} {...game} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
