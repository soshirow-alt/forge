"use client";

import Image from "next/image";
import Link from "next/link";
import { useGames } from "@/components/games-provider";
import type { FollowedDeveloperSummary } from "@/lib/developer-follows";

function FollowingDeveloperCard({ developer }: { developer: FollowedDeveloperSummary }) {
  return (
    <li>
      <Link
        href={`/creators/${encodeURIComponent(developer.routeId)}`}
        className="flex items-center gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700"
      >
        <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-zinc-800">
          <Image src={developer.avatar} alt="" fill className="object-cover" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{developer.name}</p>
          <p className="mt-1 text-sm text-zinc-500">
            公開作品 {developer.publicGameCount}件
          </p>
        </div>
      </Link>
    </li>
  );
}

export function FollowingDevelopersPanel() {
  const { getFollowedDevelopers } = useGames();
  const developers = getFollowedDevelopers();

  return (
    <div className="mt-8">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          フォロー中の開発者
        </h1>
        <span className="rounded-full bg-violet-500/20 px-3 py-1 text-sm font-medium text-violet-300">
          {developers.length}人
        </span>
      </header>

      {developers.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          フォロー中の開発者はいません。気になる開発者のプロフィールからフォローできます。
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {developers.map((developer) => (
            <FollowingDeveloperCard key={developer.userId} developer={developer} />
          ))}
        </ul>
      )}
    </div>
  );
}
