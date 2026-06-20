"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Check,
  FilePlus2,
  Lightbulb,
  MessageSquare,
  Play,
  Plus,
  Rocket,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { StudioSectionHeader, StudioShell } from "@/components/studio-shell";
import { StudioOwnedProjectsSection } from "@/components/studio-owned-projects-section";
import { studioRankingSnippets } from "@/lib/studio-rankings-v0-mock-data";
import {
  devHintCards,
  newlyPostedWorks,
  phaseBadgeClass,
  releasedThisWeek,
  studioActivities,
  studioProjectHref,
  studioProjects,
  trendingWorks,
  type StudioActivityItem,
  type StudioProjectCard,
} from "@/lib/studio-home-v0-mock-data";

function PhaseBadge({ phase }: { phase: StudioProjectCard["phase"] }) {
  return (
    <span
      className={`absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[10px] font-semibold ${phaseBadgeClass(phase)}`}
    >
      {phase}
    </span>
  );
}

function ProjectCard({
  project,
  href,
}: {
  project: StudioProjectCard;
  href: string;
}) {
  const { title, genres, phase, image, witnessCount, firstVoiceCount, updatedLabel, version, progressPercent } =
    project;
  return (
    <Link
      href={href}
      className="group block w-64 shrink-0 snap-start rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 sm:w-72"
    >
      <div className="relative overflow-hidden rounded-xl bg-zinc-800">
        <PhaseBadge phase={phase} />
        <div className="relative aspect-[16/10] w-full">
          <Image src={image} alt={title} fill className="object-cover" sizes="288px" />
        </div>
      </div>
      <h3 className="mt-3 truncate font-semibold text-white group-hover:text-violet-100">
        {title}
      </h3>
      <p className="mt-1 text-xs text-zinc-500">{genres}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5 text-violet-400" aria-hidden="true" />
          見届け人 {witnessCount ?? "—"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="size-3.5 text-violet-400" aria-hidden="true" />
          初声 {firstVoiceCount}
        </span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-500/80"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <span>最終更新：{updatedLabel}</span>
        <span className="font-medium text-zinc-400">{version ?? "—"}</span>
      </div>
    </Link>
  );
}

function NewProjectCard() {
  return (
    <Link
      href="/submit"
      className="flex w-64 shrink-0 snap-start flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/20 px-6 py-10 text-center transition-colors hover:border-violet-500/40 hover:bg-violet-600/5 sm:w-72"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-violet-600/20 text-violet-300 ring-1 ring-violet-500/30">
        <Plus className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-semibold text-zinc-200">新しい作品を投稿</p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500">
        最初のプレイ可能版を公開して、声を集め始めましょう
      </p>
    </Link>
  );
}

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

function CommunityListItem({
  title,
  image,
  meta,
  subMeta,
}: {
  title: string;
  image: string;
  meta: string;
  subMeta?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-zinc-900/50">
      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
        <Image src={image} alt={title} fill className="object-cover" sizes="40px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-200">{title}</p>
        <p className="truncate text-xs text-zinc-500">{meta}</p>
      </div>
      {subMeta && <span className="shrink-0 text-xs text-zinc-600">{subMeta}</span>}
    </div>
  );
}

function CommunityColumn({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: { id: string; title: string; image: string; meta: string; subMeta?: string }[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-violet-400">{icon}</span>
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <CommunityListItem key={item.id} {...item} />
        ))}
      </div>
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
        <StudioOwnedProjectsSection />

        <section>
          <StudioSectionHeader
            title="サンプル作品（プレビュー）"
            href="/studio/projects"
            icon={<Sparkles className="size-5 text-violet-400" aria-hidden="true" />}
          />
          <p className="mt-2 text-xs text-zinc-600">
            実データの改善ループ Studio は、上の「あなたの作品 — 改善ループ」から開いてください。
          </p>
          <div className="-mx-1 mt-5 flex gap-4 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
            {studioProjects.slice(0, 5).map((project) => (
              <ProjectCard key={project.id} project={project} href={studioProjectHref(project.id)} />
            ))}
            <NewProjectCard />
          </div>
        </section>

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
            title="Forgeで起きていること"
            icon={<TrendingUp className="size-5 text-violet-400" aria-hidden="true" />}
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <CommunityColumn
              title="今週正式版になった作品"
              icon={<Sparkles className="size-4" aria-hidden="true" />}
              items={releasedThisWeek}
            />
            <CommunityColumn
              title="話題の作品"
              icon={<TrendingUp className="size-4" aria-hidden="true" />}
              items={trendingWorks}
            />
            <CommunityColumn
              title="新しく投稿された作品"
              icon={<FilePlus2 className="size-4" aria-hidden="true" />}
              items={newlyPostedWorks}
            />
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
