"use client";

import Link from "next/link";
import {
  BarChart3,
  Check,
  Lightbulb,
  MessageSquare,
  Play,
  Rocket,
} from "lucide-react";
import { StudioOwnedProjectsSection } from "@/components/studio-owned-projects-section";
import { StudioSectionHeader, StudioShell } from "@/components/studio-shell";
import { studioRankingSnippets } from "@/lib/studio-rankings-v0-mock-data";
import {
  devHintCards,
  studioActivities,
  type StudioActivityItem,
} from "@/lib/studio-home-v0-mock-data";
import Image from "next/image";

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
    <div className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 px-4 py-3">
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
    </div>
  );
}

function RankingSnippetColumn({
  title,
  entries,
}: {
  title: string;
  entries: { rank: number; title: string; image: string; meta: string; value: string }[];
}) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <ul className="mt-3 space-y-2">
        {entries.map((entry) => (
          <li key={entry.rank} className="flex items-center gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-xs font-bold text-zinc-400">
              {entry.rank}
            </span>
            <div className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
              <Image src={entry.image} alt="" fill className="object-cover" sizes="32px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-200">{entry.title}</p>
              <p className="text-xs text-zinc-500">{entry.meta}</p>
            </div>
            <span className="shrink-0 text-xs font-medium text-violet-300">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DevHintCard({
  title,
  tips,
}: {
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
      <button
        type="button"
        className="mt-4 self-end text-sm text-violet-400 transition-colors hover:text-violet-300"
      >
        詳しく見る →
      </button>
    </article>
  );
}

export function StudioHomePage() {
  return (
    <StudioShell activeNav="home">
      <div className="mx-auto max-w-7xl space-y-10">
        <StudioOwnedProjectsSection variant="home" />

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

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 sm:p-6">
          <StudioSectionHeader
            title="Forgeランキング抜粋"
            href="/studio/rankings"
            icon={<BarChart3 className="size-5 text-violet-400" aria-hidden="true" />}
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <RankingSnippetColumn title="今週の注目作品" entries={studioRankingSnippets.featured} />
            <RankingSnippetColumn title="今週成長した作品" entries={studioRankingSnippets.growth} />
            <RankingSnippetColumn title="見届け人数増加" entries={studioRankingSnippets.witnessGain} />
          </div>
        </section>

        <section>
          <StudioSectionHeader
            title="開発ヒント"
            icon={<Lightbulb className="size-5 text-violet-400" aria-hidden="true" />}
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {devHintCards.map((card) => (
              <DevHintCard key={card.id} title={card.title} tips={card.tips} />
            ))}
          </div>
        </section>
      </div>
    </StudioShell>
  );
}
