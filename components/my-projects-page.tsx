"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { ForgeHeader } from "@/components/forge-header";
import { useGames } from "@/components/games-provider";
import type { Game } from "@/lib/mock-games";
import { LABEL_TEST_PLAY_JOIN, displayGameStatus } from "@/lib/user-labels";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getCreatedDate(game: Game) {
  return game.createdAt ?? game.lastUpdated;
}

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

export function MyProjectsPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const {
    getOwnedProjects,
    deleteSubmittedGame,
    getSupportCount,
    getApplicantCount,
    dataReady,
  } = useGames();

  const ownedGames = useMemo(
    () =>
      getOwnedProjects(user?.id).sort(
        (a, b) =>
          new Date(getCreatedDate(b)).getTime() -
          new Date(getCreatedDate(a)).getTime(),
      ),
    [getOwnedProjects, user?.id],
  );

  const totalSupports = useMemo(
    () =>
      ownedGames.reduce(
        (sum, game) => sum + getSupportCount(game.id, 0),
        0,
      ),
    [ownedGames, getSupportCount],
  );

  const totalTesterApplications = useMemo(
    () =>
      ownedGames.reduce(
        (sum, game) => sum + getApplicantCount(game.id, 0),
        0,
      ),
    [ownedGames, getApplicantCount],
  );

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login?redirect=/my-projects");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !dataReady) {
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
            <h1 className="text-3xl font-bold tracking-tight">
              クリエイターダッシュボード
            </h1>
            <p className="mt-2 text-zinc-500">
              投稿した作品の管理と、今後のアナリティクス機能の確認ができます。
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
          >
            作品を投稿する
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">作品管理</h2>
          <p className="mt-1 text-sm text-zinc-500">
            あなたが投稿した作品の一覧です。
          </p>

          {ownedGames.length === 0 ? (
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
            <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="px-5 py-4 font-medium">タイトル</th>
                      <th className="px-5 py-4 font-medium">ステータス</th>
                      <th className="px-5 py-4 font-medium">投稿日</th>
                      <th className="px-5 py-4 font-medium">応援数</th>
                      <th className="px-5 py-4 font-medium">{LABEL_TEST_PLAY_JOIN}</th>
                      <th className="px-5 py-4 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownedGames.map((game) => (
                      <tr
                        key={game.id}
                        className="border-b border-zinc-800/80 last:border-b-0"
                      >
                        <td className="px-5 py-4 font-medium text-zinc-100">
                          {game.title}
                        </td>
                        <td className="px-5 py-4 text-zinc-300">{displayGameStatus(game.status)}</td>
                        <td className="px-5 py-4 text-zinc-400">
                          {formatDate(getCreatedDate(game))}
                        </td>
                        <td className="px-5 py-4 text-orange-400">
                          {getSupportCount(game.id, 0)}
                        </td>
                        <td className="px-5 py-4 text-zinc-300">
                          {game.lookingForTesters
                            ? getApplicantCount(game.id, 0)
                            : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/games/${game.id}`}
                              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:text-orange-400"
                            >
                              詳細を見る
                            </Link>
                            <Link
                              href={`/projects/${game.id}/edit`}
                              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                            >
                              編集
                            </Link>
                            <button
                              type="button"
                              onClick={() => deleteSubmittedGame(game.id)}
                              className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/50 hover:bg-red-950/30"
                            >
                              削除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-zinc-800 md:hidden">
                {ownedGames.map((game) => (
                  <article key={game.id} className="p-5">
                    <h3 className="font-semibold text-zinc-100">{game.title}</h3>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-zinc-500">ステータス</dt>
                        <dd className="text-zinc-300">{displayGameStatus(game.status)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-zinc-500">投稿日</dt>
                        <dd className="text-zinc-400">
                          {formatDate(getCreatedDate(game))}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-zinc-500">応援数</dt>
                        <dd className="text-orange-400">
                          {getSupportCount(game.id, 0)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-zinc-500">{LABEL_TEST_PLAY_JOIN}</dt>
                        <dd className="text-zinc-300">
                          {game.lookingForTesters
                            ? getApplicantCount(game.id, 0)
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/games/${game.id}`}
                        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:text-orange-400"
                      >
                        詳細を見る
                      </Link>
                      <Link
                        href={`/projects/${game.id}/edit`}
                        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                      >
                        編集
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteSubmittedGame(game.id)}
                        className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/50 hover:bg-red-950/30"
                      >
                        削除
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">アナリティクス</h2>
          <p className="mt-1 text-sm text-zinc-500">
            作品全体のパフォーマンス概要（準備中）
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AnalyticsCard label="閲覧数" value="—" hint="準備中" />
            <AnalyticsCard label="プレイクリック" value="—" hint="準備中" />
            <AnalyticsCard
              label="応援数"
              value={String(totalSupports)}
              hint="現在の合計"
            />
            <AnalyticsCard
              label={LABEL_TEST_PLAY_JOIN}
              value={String(totalTesterApplications)}
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
                  SDKの導入は必須ではありません。
                </p>
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
