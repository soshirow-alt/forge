"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { PlayerShell } from "@/components/player-shell";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { ProfileAvatar } from "@/components/profile-avatar";
import {
  influenceRankingMetricWeights,
  influenceRankingMonths,
  parseRankingMonthId,
  type InfluenceRankingEntry,
  type InfluenceRankingMetrics,
} from "@/lib/influence-ranking-v0-mock-data";
import { useInfluenceRankingMonth } from "@/hooks/use-influence-ranking-month";
import { playerRankingProfileHref } from "@/lib/player-ranking-profile";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { RANKING_LIST_INITIAL } from "@/lib/ranking-v0-shared";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";

function RankingMetricSummary({ metrics }: { metrics: InfluenceRankingMetrics }) {
  const items = [
    { label: "開発者評価", value: `${metrics.devEvalCount}件` },
    { label: "改善に繋がったFB", value: `${metrics.improvementLinkedCount}件` },
    { label: "確認依頼への回答", value: `${metrics.verificationContributionCount}件` },
    { label: "継続見届け中の作品", value: `${metrics.continuedWitnessCount}件` },
    { label: "声が少ない作品への貢献", value: `${metrics.lowVoiceContributionCount}件` },
  ];

  return (
    <ul className="mt-4 space-y-1.5 text-left text-[11px] leading-relaxed text-zinc-500">
      {items.map((item) => (
        <li key={item.label} className="flex justify-between gap-2">
          <span>{item.label}</span>
          <span className="shrink-0 font-medium text-zinc-400">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

function Top3Card({ entry }: { entry: InfluenceRankingEntry }) {
  const isFirst = entry.rank === 1;
  return (
    <Link
      href={playerRankingProfileHref(entry.handle)}
      className={`flex flex-col rounded-2xl border p-5 text-center transition-colors hover:border-violet-500/30 ${
        isFirst
          ? "border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-zinc-900/40"
          : "border-zinc-800/80 bg-zinc-900/40"
      }`}
    >
      <p className="text-2xl" aria-hidden="true">
        {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
      </p>
      <ProfileAvatar src={entry.avatar} className="mx-auto mt-3 size-16" size={64} />
      <p className="mt-3 font-semibold text-white">{entry.name}</p>
      <p className="text-xs text-zinc-500">@{entry.handle}</p>
      <p className={`mt-2 text-sm font-medium ${entry.titleColor}`}>{entry.title}</p>
      <p className="mt-2 text-lg font-bold text-violet-300">月間影響度 {entry.score.toLocaleString()}</p>
      <RankingMetricSummary metrics={entry.metrics} />
    </Link>
  );
}

function PlayerCell({ entry }: { entry: InfluenceRankingEntry }) {
  return (
    <Link
      href={playerRankingProfileHref(entry.handle)}
      className="flex items-center gap-3 transition-colors hover:text-violet-200"
    >
      <ProfileAvatar src={entry.avatar} className="size-8" size={32} />
      <div className="min-w-0">
        <p className="font-medium text-white">{entry.name}</p>
        <p className="text-xs text-zinc-500">@{entry.handle}</p>
      </div>
    </Link>
  );
}

function InfluenceRankingComingSoon() {
  return (
    <PlayerShell activeNav="ranking">
      <nav className="text-sm text-zinc-500">
        <Link href="/home" className="hover:text-violet-400">
          ホーム
        </Link>
        <span className="mx-2">›</span>
        <span className="text-zinc-400">月間影響度ランキング</span>
      </nav>
      <header className="mt-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">月間影響度ランキング</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          今月、開発者の意思決定・作品改善・確認依頼に対して良い影響を与えたプレイヤーを称えます。
        </p>
      </header>
      <div className="mt-8">
        <FeatureComingSoonPanel
          title="月間影響度ランキング"
          description="ランキングの集計・表示は準備中です。公開をお待ちください。"
        />
      </div>
    </PlayerShell>
  );
}

function InfluenceRankingContent() {
  if (shouldHideV0MockContent()) {
    return <InfluenceRankingComingSoon />;
  }

  return <InfluenceRankingLive />;
}

function InfluenceRankingLive() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthId = parseRankingMonthId(searchParams.get("month"));
  const { month, loaded: rankingLoaded, dataSource } = useInfluenceRankingMonth(monthId);
  const monthIndex = influenceRankingMonths.findIndex((item) => item.id === monthId);
  const canGoPrev = monthIndex < influenceRankingMonths.length - 1;
  const canGoNext = monthIndex > 0;
  const [showAll, setShowAll] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

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
              <button
                type="button"
                onClick={() => setShowHelp((value) => !value)}
                className="text-zinc-500 transition-colors hover:text-violet-300"
                aria-label="影響度ランキングの説明"
              >
                <HelpCircle className="size-5" aria-hidden="true" />
              </button>
            </div>
            {showHelp && (
              <p className="mt-3 max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm leading-relaxed text-zinc-400">
                今月、開発者の意思決定・改善・確認依頼に対して実際に役立つFBを届けたプレイヤーを称えるランキングです。FB投稿数・共感数・プレイ回数だけでは決まりません。
              </p>
            )}
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              今月、開発者の意思決定・作品改善・確認依頼に対して良い影響を与えたプレイヤーを称えます。
              {rankingLoaded && dataSource === "live" ? (
                <span className="mt-1 block text-xs text-emerald-400/90">
                  実データ集計を表示中（役立った評価・採用・確認依頼への貢献など）
                </span>
              ) : null}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-300">
                <button
                  type="button"
                  disabled={!canGoPrev}
                  onClick={() => goMonth(influenceRankingMonths[monthIndex + 1]!.id)}
                  className="text-zinc-500 transition-colors hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="前月"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {month.label}
                <button
                  type="button"
                  disabled={!canGoNext}
                  onClick={() => goMonth(influenceRankingMonths[monthIndex - 1]!.id)}
                  className="text-zinc-500 transition-colors hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="次月"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <span className="text-xs text-zinc-600">{month.period}</span>
            </div>
          </header>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {month.top3.map((entry) => (
              <Top3Card key={entry.rank} entry={entry} />
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
                      <PlayerCell entry={entry} />
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
        </div>

        <aside className="w-full shrink-0 space-y-5 xl:w-72">
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-white">このランキングについて</h2>
            <p className="mt-3 text-xs leading-relaxed text-zinc-400">
              今月、開発者の意思決定や作品改善に良い影響を与えたプレイヤーを称えるランキングです。
              FB投稿数や共感数だけでは決まりません。
            </p>
            <p className="mt-4 text-xs font-medium text-zinc-300">評価に含まれるもの</p>
            <ul className="mt-2 space-y-2 text-xs text-zinc-500">
              {influenceRankingMetricWeights.map((metric) => (
                <li key={metric.id}>
                  {metric.label}
                  <span className="ml-1 text-zinc-600">({metric.weight})</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs font-medium text-zinc-300">評価に含まれないもの</p>
            <ul className="mt-2 space-y-1.5 text-xs text-zinc-600">
              <li>FB投稿数だけ</li>
              <li>プレイ回数だけ</li>
              <li>共感数</li>
              <li>身内評価や水増し</li>
            </ul>
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
            <button
              type="button"
              onClick={() => setShowArchive((value) => !value)}
              className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl border border-zinc-800 py-2.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            >
              過去のランキング
              <ChevronRight
                className={`size-3.5 transition-transform ${showArchive ? "rotate-90" : ""}`}
              />
            </button>
            {showArchive && (
              <ul className="mt-3 space-y-2 border-t border-zinc-800/80 pt-3">
                {influenceRankingMonths.map((archiveMonth) => (
                  <li key={archiveMonth.id}>
                    <button
                      type="button"
                      onClick={() => goMonth(archiveMonth.id)}
                      className={`w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-zinc-800/60 ${
                        archiveMonth.id === monthId ? "text-violet-300" : "text-zinc-400"
                      }`}
                    >
                      {archiveMonth.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
