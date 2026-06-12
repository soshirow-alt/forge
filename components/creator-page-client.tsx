"use client";

import Link from "next/link";
import { CreatorFollowButton } from "@/components/creator-follow-button";
import { ForgeHeader } from "@/components/forge-header";
import { GameTags } from "@/components/game-tags";
import { GameThumbnail } from "@/components/game-thumbnail";
import { useGames } from "@/components/games-provider";
import { getCreatorById } from "@/lib/creators";

function CreatorGameCard({
  id,
  title,
  genre,
  status,
  thumbnailUrl,
  tags,
}: {
  id: string;
  title: string;
  genre: string;
  status: string;
  thumbnailUrl?: string;
  tags: string[];
}) {
  return (
    <Link
      href={`/games/${id}`}
      className="group block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10"
    >
      <GameThumbnail thumbnailUrl={thumbnailUrl} status={status} />
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
  const creator = getCreatorById(id);
  const { getGamesByCreator } = useGames();
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
          <CreatorFollowButton creatorId={creator.id} />
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
