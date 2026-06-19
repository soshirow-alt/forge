"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { StudioShell } from "@/components/studio-shell";
import {
  formatMonthOverMonth,
  studioDeveloperLastMonthTop3,
  studioDeveloperRankingList,
  studioDeveloperRankingMetrics,
  studioDeveloperRankingMonth,
  studioDeveloperRankingPeriod,
  studioDeveloperRankingTop3,
  type StudioDeveloperRankingEntry,
} from "@/lib/studio-rankings-v0-mock-data";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageSquare,
  UserPlus,
  Users,
} from "lucide-react";

function MetricIcon({ icon }: { icon: string }) {
  const className = "size-4 shrink-0";
  switch (icon) {
    case "heart":
      return <Heart className={className} aria-hidden="true" />;
    case "user-plus":
      return <UserPlus className={className} aria-hidden="true" />;
    case "message":
      return <MessageSquare className={className} aria-hidden="true" />;
    default:
      return <Users className={className} aria-hidden="true" />;
  }
}

function Top3Card({ entry }: { entry: StudioDeveloperRankingEntry }) {
  const isFirst = entry.rank === 1;
  return (
    <article
      className={`flex flex-col rounded-2xl border p-5 text-center ${
        isFirst
          ? "border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-zinc-900/40 sm:scale-[1.02]"
          : "border-zinc-800/80 bg-zinc-900/40"
      } ${entry.rank === 1 ? "sm:order-2" : entry.rank === 2 ? "sm:order-1" : "sm:order-3"}`}
    >
      <p className="text-2xl" aria-hidden="true">
        {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
      </p>
      <span className="relative mx-auto mt-3 block size-16 overflow-hidden rounded-full bg-zinc-800 ring-2 ring-zinc-700/80">
        <Image src={entry.avatar} alt="" fill className="object-cover" sizes="64px" />
      </span>
      <p className="mt-3 font-semibold text-white">{entry.name}</p>
      <p className="text-xs text-zinc-500">@{entry.handle}</p>
      <p className={`mt-2 text-sm font-medium ${entry.epithetColor}`}>{entry.epithet}</p>
      <p className="mt-3 text-2xl font-bold text-violet-300">{entry.score.toLocaleString()}</p>
      <p className="mt-1 text-xs font-medium text-emerald-400">
        先月比 {formatMonthOverMonth(entry.monthOverMonth)}
      </p>
      <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-3 py-2">
        <div className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
          <Image
            src={entry.representativeWork.image}
            alt=""
            fill
            className="object-cover"
            sizes="32px"
          />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[10px] text-zinc-500">代表作品</p>
          <p className="truncate text-xs font-medium text-zinc-200">
            {entry.representativeWork.title}
          </p>
        </div>
      </div>
    </article>
  );
}

function DeveloperCell({ entry }: { entry: StudioDeveloperRankingEntry }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-zinc-800">
        <Image src={entry.avatar} alt="" fill className="object-cover" sizes="32px" />
      </span>
      <div className="min-w-0">
        <p className="font-medium text-white">{entry.name}</p>
        <p className="text-xs text-zinc-500">@{entry.handle}</p>
      </div>
    </div>
  );
}

export function StudioRankingsPage() {
  const [showAll, setShowAll] = useState(false);
  const visibleList = showAll
    ? studioDeveloperRankingList
    : studioDeveloperRankingList.slice(0, 5);

  return (
    <StudioShell activeNav="ranking">
      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="min-w-0 flex-1">
          <nav className="text-sm text-zinc-500">
            <Link href="/studio" className="transition-colors hover:text-violet-400">
              ホーム
            </Link>
            <span className="mx-2">›</span>
            <span className="text-zinc-400">ランキング</span>
          </nav>

          <header className="mt-4">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              今月もっとも作品を育てた開発者
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              プレイヤーの声と応援によって、作品を大きく前進させた開発者を称えます。
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-300">
                <button type="button" className="text-zinc-500 hover:text-zinc-300" aria-label="前月">
                  <ChevronLeft className="size-4" />
                </button>
                {studioDeveloperRankingMonth}
                <button type="button" className="text-zinc-500 hover:text-zinc-300" aria-label="次月">
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <span className="text-xs text-zinc-600">{studioDeveloperRankingPeriod}</span>
            </div>
          </header>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {studioDeveloperRankingTop3.map((entry) => (
              <Top3Card key={entry.id} entry={entry} />
            ))}
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-800/80">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-zinc-900/60 text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-3">順位</th>
                  <th className="px-4 py-3">開発者</th>
                  <th className="px-4 py-3">代表作品</th>
                  <th className="px-4 py-3">影響度スコア</th>
                  <th className="px-4 py-3">先月比</th>
                  <th className="px-4 py-3">見届け人増</th>
                  <th className="px-4 py-3">作品フォロー増</th>
                  <th className="px-4 py-3">開発者フォロー増</th>
                  <th className="px-4 py-3">声の増加</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {visibleList.map((entry) => (
                  <tr key={entry.id} className="bg-zinc-900/30">
                    <td className="px-4 py-3 font-medium text-zinc-400">{entry.rank}</td>
                    <td className="px-4 py-3">
                      <DeveloperCell entry={entry} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                          <Image
                            src={entry.representativeWork.image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                        <span className="text-zinc-300">{entry.representativeWork.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-violet-300">
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-400">
                      {formatMonthOverMonth(entry.monthOverMonth)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">+{entry.witnessGrowth}</td>
                    <td className="px-4 py-3 text-zinc-400">+{entry.workFollowGrowth}</td>
                    <td className="px-4 py-3 text-zinc-400">+{entry.devFollowGrowth}</td>
                    <td className="px-4 py-3 text-zinc-400">+{entry.voiceGrowth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!showAll && studioDeveloperRankingList.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-4 w-full rounded-xl border border-zinc-800 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            >
              もっと見る
            </button>
          )}
        </div>

        <aside className="w-full shrink-0 space-y-5 xl:w-72">
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-white">ランキングの指標</h2>
            <p className="mt-3 text-xs leading-relaxed text-zinc-400">
              このランキングは、開発者が今月どれだけ作品を育てたかを評価します。
            </p>
            <ul className="mt-4 space-y-3">
              {studioDeveloperRankingMetrics.map((metric) => (
                <li key={metric.id} className="flex items-start gap-2.5 text-xs">
                  <span className={`mt-0.5 ${metric.color}`}>
                    <MetricIcon icon={metric.icon} />
                  </span>
                  <div>
                    <p className="font-medium text-zinc-300">{metric.label}</p>
                    <p className="text-zinc-600">比重 {metric.weight}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              絶対数と成長率の両方を加味します（目安: 絶対数 7 : 成長率 3）。
            </p>
            <p className="mt-3 text-xs leading-relaxed text-zinc-600">
              投稿数・更新数・正式版公開数だけでは評価しません。
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-white">先月の TOP3</h2>
            <ul className="mt-3 space-y-2">
              {studioDeveloperLastMonthTop3.map((entry) => (
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
              className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl border border-zinc-800 py-2.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            >
              過去のランキング
              <ChevronRight className="size-3.5" />
            </button>
          </section>
        </aside>
      </div>
    </StudioShell>
  );
}
