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
      aria-label="プレイヤーの反応を読み込み中"
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

function StudioVoiceResponsesEmptyState() {
  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-100">確認したいプレイヤーの反応</h2>
      <p className="mt-2 text-sm text-zinc-400">
        まだプレイヤーからの反応はありません。
        <br />
        公開ページを整えて、プレイヤーに遊んでもらいましょう。
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/studio/mypage"
          className="inline-flex rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600"
        >
          作品一覧を見る
        </Link>
        <Link
          href={studioSubmitModalHref()}
          className="inline-flex rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          新規投稿する
        </Link>
      </div>
    </section>
  );
}

/** Studio ホーム `/studio` 専用 — プレイヤー回答がある作品（最大3件） */
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

  const projectsWithVoiceResponses = useMemo(
    () =>
      gamesWithGrowth.filter(({ growth }) => growth.totalVoiceResponseCount > 0),
    [gamesWithGrowth],
  );

  const displayProjects = useMemo(
    () => projectsWithVoiceResponses.slice(0, 3),
    [projectsWithVoiceResponses],
  );

  if (!hydrated || !dataReady || (Boolean(user) && ownedGames.length > 0 && !voiceLoaded)) {
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

  if (displayProjects.length === 0) {
    return <StudioVoiceResponsesEmptyState />;
  }

  return (
    <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">
          確認したいプレイヤーの反応
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          届いた回答を確認して、次の改善につなげましょう。
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {displayProjects.map(({ game, growth }) => (
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

      {projectsWithVoiceResponses.length > 3 && (
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/studio/mypage" className="text-violet-300 hover:text-violet-200">
            すべての作品を見る（{ownedGames.length}件）
          </Link>
        </p>
      )}
    </section>
  );
}
