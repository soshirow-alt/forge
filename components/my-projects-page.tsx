"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { ForgeHeader } from "@/components/forge-header";
import { ProjectGrowthCard } from "@/components/project-growth-card";
import { useGames } from "@/components/games-provider";
import { useOwnedProjectFeedback } from "@/hooks/use-owned-project-feedback";
import {
  buildNurtureDisplayContext,
  buildProjectGrowthSnapshot,
  groupFeedbackByProject,
  sortProjectsForGrowthHub,
} from "@/lib/project-growth-state";
import { ForgeSdkNote } from "@/components/forge-sdk-note";

function AnalyticsCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-100">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

function MyProjectsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusProjectId = searchParams.get("focus");
  const { user, hydrated } = useAuth();
  const {
    getOwnedProjects,
    deleteSubmittedGame,
    getSupportCount,
    getDevlogsByProject,
    dataReady,
  } = useGames();

  const { entries: feedbackEntries, loaded: feedbackLoaded } =
    useOwnedProjectFeedback(user?.id);

  const ownedGames = useMemo(
    () => getOwnedProjects(user?.id),
    [getOwnedProjects, user?.id],
  );

  const sortedGames = useMemo(
    () =>
      feedbackLoaded
        ? sortProjectsForGrowthHub(
            ownedGames,
            feedbackEntries,
            getDevlogsByProject,
          )
        : ownedGames,
    [ownedGames, feedbackEntries, feedbackLoaded, getDevlogsByProject],
  );

  const feedbackByProject = useMemo(
    () => groupFeedbackByProject(feedbackEntries),
    [feedbackEntries],
  );

  const totalSupports = useMemo(
    () =>
      ownedGames.reduce(
        (sum, game) => sum + getSupportCount(game.id, 0),
        0,
      ),
    [ownedGames, getSupportCount],
  );

  const hasProjects = ownedGames.length > 0;

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!focusProjectId || !feedbackLoaded) {
      return;
    }

    const element = document.getElementById(`project-${focusProjectId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusProjectId, feedbackLoaded]);

  if (!hydrated || !dataReady || !feedbackLoaded) {
    return (
      <div className="min-h-full bg-zinc-950 text-zinc-100">
        <ForgeHeader />
        <main className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-zinc-500">読み込み中...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">開発マイページ</h1>
            <p className="mt-2 max-w-2xl text-zinc-500">
              作品一覧から育てたい作品を選び、声を見て、次の版につなげましょう。
            </p>
          </div>
          {hasProjects ? (
            <Link
              href="/submit"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              + 作品を投稿
            </Link>
          ) : (
            <Link
              href="/submit"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
            >
              作品を投稿する
            </Link>
          )}
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">作品一覧</h2>
          <p className="mt-1 text-sm text-zinc-500">
            各作品の育成サイクルと、やること一覧から次の行動を選べます。
          </p>

          {!hasProjects ? (
            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
              <p className="text-zinc-400">まだ投稿した作品がありません。</p>
              <Link
                href="/submit"
                className="mt-6 inline-block rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
              >
                最初の作品を投稿する
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {sortedGames.map((game) => {
                const growth = buildProjectGrowthSnapshot(
                  game,
                  feedbackEntries,
                  getDevlogsByProject,
                );
                const projectFeedback =
                  feedbackByProject.get(game.id) ?? [];

                return (
                  <ProjectGrowthCard
                    key={game.id}
                    game={game}
                    growth={growth}
                    feedbackEntries={projectFeedback}
                    supportCount={getSupportCount(game.id, 0)}
                    focusStep={
                      focusProjectId === game.id
                        ? buildNurtureDisplayContext(
                            growth,
                            false,
                            game.id,
                          ).nextStepId
                        : null
                    }
                    onDelete={() => deleteSubmittedGame(game.id)}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">アナリティクス</h2>
          <p className="mt-1 text-sm text-zinc-500">
            作品全体のパフォーマンス概要（準備中）
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnalyticsCard label="閲覧数" value="—" hint="準備中" />
            <AnalyticsCard label="プレイクリック" value="—" hint="準備中" />
            <AnalyticsCard
              label="応援数"
              value={String(totalSupports)}
              hint="現在の合計"
            />
          </div>
        </section>

        <section className="mt-12">
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Forge SDK
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                  より詳細なアナリティクス（プレイ時間、離脱ポイント、デバイス別の傾向など）は、
                  任意でForge SDKを組み込むことで利用できる予定です。
                </p>
                <ForgeSdkNote className="mt-3 max-w-2xl" />
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Coming Soon
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export function MyProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-zinc-950 text-zinc-100">
          <ForgeHeader />
          <main className="mx-auto max-w-7xl px-6 py-12">
            <p className="text-zinc-500">読み込み中...</p>
          </main>
        </div>
      }
    >
      <MyProjectsPageContent />
    </Suspense>
  );
}
