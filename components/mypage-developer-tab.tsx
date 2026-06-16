"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ForgeSdkNote } from "@/components/forge-sdk-note";
import { ProjectListCard } from "@/components/project-list-card";
import { useGames } from "@/components/games-provider";
import { useOwnedProjectVoiceSignals } from "@/hooks/use-owned-project-voice-signals";
import {
  buildProjectGrowthSnapshot,
  sortProjectsForGrowthHub,
} from "@/lib/project-growth-state";
import { resolveVoiceSignalForGame } from "@/lib/project-voice-nurture";
import { projectStudioPath } from "@/lib/project-nurture-links";

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

function MyPageDeveloperTabContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusProjectId = searchParams.get("focus");
  const { user } = useAuth();
  const {
    getOwnedProjects,
    deleteSubmittedGame,
    getSupportCount,
    getDevlogsByProject,
    dataReady,
  } = useGames();

  const { signals: voiceSignals, loaded: voiceLoaded } =
    useOwnedProjectVoiceSignals(user?.id);

  const [filter, setFilter] = useState<"all" | "attention">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const ownedGames = useMemo(
    () => getOwnedProjects(user?.id),
    [getOwnedProjects, user?.id],
  );

  const sortedGames = useMemo(
    () =>
      voiceLoaded
        ? sortProjectsForGrowthHub(
            ownedGames,
            voiceSignals,
            getDevlogsByProject,
          )
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

  const filteredGames = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return gamesWithGrowth.filter(({ game, growth }) => {
      if (filter === "attention") {
        if (
          growth.pendingFeedbackCount === 0 &&
          !growth.needsAttention
        ) {
          return false;
        }
      }

      if (!normalizedQuery) {
        return true;
      }

      return game.title.toLowerCase().includes(normalizedQuery);
    });
  }, [filter, gamesWithGrowth, searchQuery]);

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
    if (!focusProjectId) {
      return;
    }

    router.replace(projectStudioPath(focusProjectId));
  }, [focusProjectId, router]);

  if (!dataReady || !voiceLoaded) {
    return <p className="text-zinc-500">読み込み中...</p>;
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="max-w-2xl text-sm text-zinc-500">
            投稿した作品の管理はここから。各作品の studio
            で次にやることを進められます。
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

      {!hasProjects ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
          <p className="text-zinc-400">まだ投稿した作品がありません。</p>
          <Link
            href="/submit"
            className="mt-6 inline-block rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
          >
            最初の作品を投稿する
          </Link>
        </div>
      ) : (
        <section aria-label="作品一覧">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">作品一覧</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {filteredGames.length} / {ownedGames.length} 件
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="作品名で検索"
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={() =>
                  setFilter((current) =>
                    current === "all" ? "attention" : "all",
                  )
                }
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  filter === "attention"
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                対応が必要な作品
              </button>
            </div>
          </div>

          {filteredGames.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-500">
              条件に一致する作品がありません。
            </p>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {filteredGames.map(({ game, growth }) => (
                <ProjectListCard
                  key={game.id}
                  game={game}
                  growth={growth}
                  supportCount={getSupportCount(game.id, 0)}
                  onDelete={() => deleteSubmittedGame(game.id)}
                  compact
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
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

      <section>
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Forge SDK</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                より詳細なアナリティクスは、任意で Forge SDK
                を組み込むことで利用できる予定です。
              </p>
              <ForgeSdkNote className="mt-3 max-w-2xl" />
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Coming Soon
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export function MyPageDeveloperTab() {
  return (
    <Suspense fallback={<p className="text-zinc-500">読み込み中...</p>}>
      <MyPageDeveloperTabContent />
    </Suspense>
  );
}
