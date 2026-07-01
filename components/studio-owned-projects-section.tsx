"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { ProjectListCard } from "@/components/project-list-card";
import { useGames } from "@/components/games-provider";
import { useOwnedProjectVoiceSignals } from "@/hooks/use-owned-project-voice-signals";
import {
  buildProjectGrowthSnapshot,
  sortProjectsForGrowthHub,
} from "@/lib/project-growth-state";
import { resolveVoiceSignalForGame } from "@/lib/project-voice-nurture";
import { studioSubmitModalHref } from "@/lib/project-nurture-links";
import { shouldBypassStudioLoginOnPreview } from "@/lib/preview-v0";

function StudioOwnedProjectsLoadingSection() {
  return (
    <section
      className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 sm:p-6"
      aria-busy="true"
      aria-label="あなたの作品を読み込み中"
    >
      <div className="h-4 w-32 rounded bg-zinc-800/80" />
      <div className="mt-3 h-6 w-40 rounded bg-zinc-800/80" />
      <div className="mt-5 space-y-3">
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="h-20 rounded-xl border border-zinc-800/80 bg-zinc-900/40"
          />
        ))}
      </div>
    </section>
  );
}

/** Studio ホーム `/studio` 専用 — あなたの作品（最大3件 + すべて見る） */
export function StudioOwnedProjectsSection() {
  const { user, hydrated } = useAuth();
  const {
    getOwnedProjects,
    getSupportCount,
    getDevlogsByProject,
    dataReady,
  } = useGames();
  const { signals: voiceSignals, loaded: voiceLoaded } =
    useOwnedProjectVoiceSignals(user?.id);
  const ownedGames = useMemo(
    () => (user ? getOwnedProjects(user.id) : []),
    [getOwnedProjects, user],
  );

  const sortedGames = useMemo(
    () =>
      voiceLoaded
        ? sortProjectsForGrowthHub(ownedGames, voiceSignals, getDevlogsByProject)
        : ownedGames,
    [ownedGames, voiceSignals, voiceLoaded, getDevlogsByProject],
  );

  const gamesWithGrowth = useMemo(
    () =>
      sortedGames.map((game) => ({
        game,
        growth: buildProjectGrowthSnapshot(
          game,
          resolveVoiceSignalForGame(game, voiceSignals),
          getDevlogsByProject,
        ),
      })),
    [sortedGames, voiceSignals, getDevlogsByProject],
  );

  if (!hydrated || !dataReady) {
    return <StudioOwnedProjectsLoadingSection />;
  }

  if (!user && !shouldBypassStudioLoginOnPreview()) {
    return (
      <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">あなたの作品</h2>
        <p className="mt-2 text-sm text-zinc-400">
          ログインすると、投稿した作品がここに表示されます。
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          ログインして作品を管理
        </Link>
      </section>
    );
  }

  if (ownedGames.length === 0) {
    return (
      <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">あなたの作品</h2>
        <p className="mt-2 text-sm text-zinc-400">
          まだ投稿した作品がありません。投稿後、ここから各作品の Studio を開けます。
        </p>
        <Link
          href={studioSubmitModalHref()}
          className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          最初の作品を投稿
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">
          プレイヤーから新たな反応があった作品
        </h2>
        <p className="mt-2 text-sm text-zinc-400">新たなフィードバックが届きました</p>
      </div>

      <div className="mt-5 space-y-3">
        {gamesWithGrowth.slice(0, 3).map(({ game, growth }) => (
          <ProjectListCard
            key={game.id}
            game={game}
            growth={growth}
            supportCount={getSupportCount(game.id)}
            showViewReceivedFeedbackButton
            hideCycleInMeta
            compact
            layout="directory"
          />
        ))}
      </div>

      {ownedGames.length > 3 && (
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/studio/mypage" className="text-violet-300 hover:text-violet-200">
            すべての作品を見る（{ownedGames.length}件）
          </Link>
        </p>
      )}

    </section>
  );
}
