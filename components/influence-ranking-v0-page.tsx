"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { PlayerShell } from "@/components/player-shell";
import {
  getInfluenceRankingMonth,
  influenceRankingMonths,
  parseRankingMonthId,
  RANKING_LIST_INITIAL,
} from "@/lib/influence-ranking-v0-mock-data";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";

function InfluenceRankingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthId = parseRankingMonthId(searchParams.get("month"));
  const month = useMemo(() => getInfluenceRankingMonth(monthId), [monthId]);
  const monthIndex = influenceRankingMonths.findIndex((item) => item.id === monthId);
  const canGoPrev = monthIndex < influenceRankingMonths.length - 1;
  const canGoNext = monthIndex > 0;
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setShowAll(false);
  }, [monthId]);

  const visibleList = showAll ? month.list : month.list.slice(0, RANKING_LIST_INITIAL);
  const hasMore = month.list.length > RANKING_LIST_INITIAL && !showAll;

  const goMonth = useCallback(
    (targetId: string) => {
      setShowAll(false);
      router.push(`/rankings/influence?month=${encodeURIComponent(targetId)}`);
    },
    [router],
  );

  return (
    <PlayerShell activeNav="ranking">
      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="min-w-0 flex-1">
          <nav className="text-sm text-zinc-500">
            <Link href="/home" className="hover:text-violet-400">
              ホーム
            </Link>
            <span className="mx-2">›</span>
            <span className="text-zinc-400">月間影響度ランキング</span>
          </nav>

          <header className="mt-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">月間影響度ランキング</h1>
              <HelpCircle className="size-5 text-zinc-500" aria-hidden="true" />
            </div>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              質の高いフィードバックでゲームの成長を支えたプレイヤーを紹介します。
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-300">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => goMonth(influenceRankingMonths[monthIndex + 1].id)}
                className="text-zinc-500 transition-colors hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="前月"
              >
                <ChevronLeft className="size-4" />
              </button>
              {month.label}
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => goMonth(influenceRankingMonths[monthIndex - 1].id)}
                className="text-zinc-500 transition-colors hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="次月"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </header>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {month.top3.map((entry) => (
              <div
                key={entry.rank}
                className={`rounded-2xl border p-5 text-center ${
                  entry.rank === 1
                    ? "border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-zinc-900/40"
                    : "border-zinc-800/80 bg-zinc-900/40"
                }`}
              >
                <p className="text-2xl">
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                </p>
                <span className="relative mx-auto mt-3 block size-16 overflow-hidden rounded-full bg-zinc-800">
                  <Image src={entry.avatar} alt="" fill className="object-cover" />
                </span>
                <p className="mt-3 font-semibold text-white">{entry.name}</p>
                <p className="text-xs text-zinc-500">@{entry.handle}</p>
                <p className={`mt-2 text-sm font-medium ${entry.titleColor}`}>{entry.title}</p>
                <p className="mt-2 text-lg font-bold text-violet-300">
                  {entry.score.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800/80">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/60 text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-3">順位</th>
                  <th className="px-4 py-3">プレイヤー</th>
                  <th className="px-4 py-3">影響度スコア</th>
                  <th className="hidden px-4 py-3 sm:table-cell">今月の称号</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {visibleList.map((entry) => (
                  <tr key={entry.rank} className="bg-zinc-900/30">
                    <td className="px-4 py-3 font-medium text-zinc-400">{entry.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="relative size-8 overflow-hidden rounded-full bg-zinc-800">
                          <Image src={entry.avatar} alt="" fill className="object-cover" />
                        </span>
                        <div>
                          <p className="font-medium text-white">{entry.name}</p>
                          <p className="text-xs text-zinc-500">@{entry.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-violet-300">
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className={`text-xs font-medium ${entry.titleColor}`}>
                        {entry.title}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-4 w-full rounded-xl border border-zinc-800 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            >
              もっと見る
            </button>
          )}
          {showAll && month.list.length > RANKING_LIST_INITIAL && (
            <p className="mt-3 text-center text-xs text-zinc-500">
              {month.list.length}位まで表示中
            </p>
          )}
        </div>

        <aside className="w-full shrink-0 space-y-5 xl:w-72">
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-white">影響度ランキングとは</h2>
            <p className="mt-3 text-xs leading-relaxed text-zinc-400">
              フィードバックが作品・開発者に与えた良い影響を評価します。
            </p>
            <ul className="mt-4 space-y-2 text-xs text-zinc-500">
              <li>💬 役立つフィードバック — 開発者が「役立った」と評価</li>
              <li>💗 共感を集めたフィードバック</li>
              <li>🌱 新人への貢献</li>
              <li>🔄 継続して見届けたフィードバック</li>
            </ul>
            <p className="mt-4 text-xs text-violet-300">
              あなたのフィードバックが、ゲームの未来をつくる。
            </p>
          </section>
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-white">先月の TOP3</h2>
            <ul className="mt-3 space-y-2">
              {month.lastMonthTop3.map((entry) => (
                <li key={entry.rank} className="flex justify-between text-sm">
                  <span className="text-zinc-400">
                    {entry.rank}位 {entry.name}
                  </span>
                  <span className="text-violet-300">{entry.score.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </PlayerShell>
  );
}

export function InfluenceRankingV0Page() {
  return (
    <Suspense
      fallback={
        <PlayerShell activeNav="ranking">
          <p className="text-sm text-zinc-500">読み込み中...</p>
        </PlayerShell>
      }
    >
      <InfluenceRankingContent />
    </Suspense>
  );
}
