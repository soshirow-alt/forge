"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  BarChart3,
  Check,
  Lightbulb,
  MessageSquare,
  Play,
  Rocket,
} from "lucide-react";
import { StudioOwnedProjectsSection } from "@/components/studio-owned-projects-section";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { StudioSectionHeader, StudioShell } from "@/components/studio-shell";
import { useHideV0MockContent } from "@/lib/forge-deployment-context";
import {
  countStudioUnread,
  studioNotifications,
} from "@/lib/studio-notifications-v0-mock-data";
import { studioHomeGrowthRankings } from "@/lib/studio-rankings-v0-mock-data";
import { developerProfileHref } from "@/lib/developer-search-v0-mock-data";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import {
  devHintCards,
  studioActivities,
  type StudioActivityItem,
} from "@/lib/studio-home-v0-mock-data";

function activityIcon(type: StudioActivityItem["type"]) {
  switch (type) {
    case "voice":
      return "bg-red-500/15 text-red-400 ring-red-500/25";
    case "witness":
      return "bg-orange-500/15 text-orange-400 ring-orange-500/25";
    case "play":
      return "bg-sky-500/15 text-sky-400 ring-sky-500/25";
    case "devlog":
      return "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25";
    case "first-voice":
      return "bg-violet-500/15 text-violet-300 ring-violet-500/25";
  }
}

function ActivityIcon({ type }: { type: StudioActivityItem["type"] }) {
  const className = "size-4";
  if (type === "play") {
    return <Play className={className} aria-hidden="true" />;
  }
  return <MessageSquare className={className} aria-hidden="true" />;
}

function ActivityRow({ item }: { item: StudioActivityItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 px-4 py-3 transition-colors hover:border-violet-500/30 hover:bg-violet-500/5"
    >
      <span
        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ring-1 ${activityIcon(item.type)}`}
      >
        <ActivityIcon type={item.type} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-zinc-200">{item.title}</p>
        <p className="mt-0.5 text-sm text-zinc-500">{item.description}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-xs text-zinc-600">{item.timeLabel}</span>
        <span className="flex size-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
          {item.badge}
        </span>
      </div>
    </Link>
  );
}

function WorkGrowthColumn({
  title,
  metricLabel,
  entries,
}: {
  title: string;
  metricLabel: string;
  entries: { rank: number; id: string; title: string; image: string; creator: string; growthRate: string }[];
}) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="mt-0.5 text-xs text-zinc-600">{metricLabel}</p>
      <ul className="mt-3 space-y-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={gameDetailHref(entry.id)}
              className="flex items-center gap-3 rounded-lg px-1 py-0.5 transition-colors hover:bg-zinc-800/40"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-xs font-bold text-zinc-400">
                {entry.rank}
              </span>
              <div className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                <Image src={entry.image} alt="" fill className="object-cover" sizes="32px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-200">{entry.title}</p>
                <p className="text-xs text-zinc-500">{entry.creator}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-violet-300">
                {entry.growthRate}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeveloperGrowthColumn({
  title,
  metricLabel,
  entries,
}: {
  title: string;
  metricLabel: string;
  entries: { rank: number; id: string; name: string; avatar: string; handle: string; growthRate: string }[];
}) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="mt-0.5 text-xs text-zinc-600">{metricLabel}</p>
      <ul className="mt-3 space-y-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={developerProfileHref(entry.id, { from: "studio-home" })}
              className="flex items-center gap-3 rounded-lg px-1 py-0.5 transition-colors hover:bg-zinc-800/40"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-xs font-bold text-zinc-400">
                {entry.rank}
              </span>
              <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                <Image src={entry.avatar} alt="" fill className="object-cover" sizes="32px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-200">{entry.name}</p>
                <p className="text-xs text-zinc-500">@{entry.handle}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-violet-300">
                {entry.growthRate}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DevHintCard({
  id,
  title,
  tips,
}: {
  id: string;
  title: string;
  tips: string[];
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
      <h3 className="text-sm font-semibold leading-snug text-zinc-200">{title}</h3>
      <ul className="mt-4 flex-1 space-y-2.5">
        {tips.map((tip) => (
          <li key={tip} className="flex gap-2 text-sm leading-relaxed text-zinc-400">
            <Check className="mt-0.5 size-4 shrink-0 text-violet-400" aria-hidden="true" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
      <Link
        href={`/studio/guide#${id}`}
        className="mt-4 self-end text-sm text-violet-400 transition-colors hover:text-violet-300"
      >
        詳しく見る →
      </Link>
    </article>
  );
}

function RankingSnippetsSection() {
  const [expanded, setExpanded] = useState(false);
  const limit = expanded ? 10 : 3;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 sm:p-6">
      <StudioSectionHeader
        title="今週の伸び"
        icon={<BarChart3 className="size-5 text-violet-400" aria-hidden="true" />}
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <WorkGrowthColumn
          title="見届け人が伸びた作品"
          metricLabel="見届け人 · 前週比"
          entries={studioHomeGrowthRankings.witnessGrowthWorks.slice(0, limit)}
        />
        <WorkGrowthColumn
          title="FBが増えた作品"
          metricLabel="フィードバック · 前週比"
          entries={studioHomeGrowthRankings.feedbackGrowthWorks.slice(0, limit)}
        />
        <DeveloperGrowthColumn
          title="フォロワーが増えた開発者"
          metricLabel="フォロワー · 前週比"
          entries={studioHomeGrowthRankings.followerGrowthDevelopers.slice(0, limit)}
        />
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-violet-200"
          >
            もっと見る
          </button>
        )}
        <Link
          href="/studio/rankings"
          className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-2.5 text-sm font-medium text-violet-200 transition-colors hover:bg-violet-500/15"
        >
          月間ランキングを見る
        </Link>
      </div>
    </section>
  );
}

export function StudioHomePage() {
  const hideV0Mock = useHideV0MockContent();
  const notificationBadge = hideV0Mock ? 0 : countStudioUnread(studioNotifications);

  return (
    <StudioShell activeNav="home" notificationBadge={notificationBadge}>
      <div className="mx-auto max-w-7xl space-y-10">
        <StudioOwnedProjectsSection />

        {!hideV0Mock ? (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 sm:p-6">
            <StudioSectionHeader
              title="最近の動き"
              href="/studio/notifications"
              icon={<Rocket className="size-5 text-violet-400" aria-hidden="true" />}
            />
            <div className="mt-5 space-y-3">
              {studioActivities.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        {hideV0Mock ? (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 sm:p-6">
            <StudioSectionHeader
              title="今週の伸び"
              icon={<BarChart3 className="size-5 text-violet-400" aria-hidden="true" />}
            />
            <div className="mt-5">
              <FeatureComingSoonPanel
                title="今週の伸び"
                description="週次ランキングの集計・表示は準備中です。公開をお待ちください。"
              />
            </div>
          </section>
        ) : (
          <RankingSnippetsSection />
        )}

        <section>
          <StudioSectionHeader
            title="開発ヒント"
            icon={<Lightbulb className="size-5 text-violet-400" aria-hidden="true" />}
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {devHintCards.map((card) => (
              <DevHintCard key={card.id} id={card.id} title={card.title} tips={card.tips} />
            ))}
          </div>
        </section>
      </div>
    </StudioShell>
  );
}
