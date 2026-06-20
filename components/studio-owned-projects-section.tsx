"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { projectStudioPath } from "@/lib/project-nurture-links";

/**
 * ログイン中オーナーの Supabase 作品 → 正本 /projects/[id]/studio へ誘導
 */
export function StudioOwnedProjectsSection({
  title = "あなたの作品 — 改善ループ",
  description = "ここから開くと「次に直すこと」カードが表示されます（実データ Studio）。",
}: {
  title?: string;
  description?: string;
}) {
  const { user, hydrated } = useAuth();
  const { getOwnedProjects, dataReady } = useGames();

  const ownedGames = useMemo(
    () => (user ? getOwnedProjects(user.id) : []),
    [getOwnedProjects, user],
  );

  if (!hydrated || !dataReady || !user || ownedGames.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-orange-200">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">{description}</p>
      <ul className="mt-4 space-y-2">
        {ownedGames.map((game) => (
          <li key={game.id}>
            <Link
              href={projectStudioPath(game.id)}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-3 transition-colors hover:border-orange-500/40 hover:bg-zinc-900/80"
            >
              <span className="font-medium text-zinc-100">{game.title}</span>
              <span className="font-mono text-xs text-zinc-500">
                /projects/{game.id}/studio
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
