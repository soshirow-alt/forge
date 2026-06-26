"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { StudioPreviewSampleBanner } from "@/components/studio-preview-sample-banner";
import {
  StudioFilterPills,
  StudioInlineSelect,
} from "@/components/studio-shell";
import { ViewModeToggle, type ViewMode } from "@/components/view-mode-toggle";
import {
  formatStat,
  matchesStudioPhaseFilter,
  phaseBadgeClass,
  STUDIO_PROJECTS_PAGE_SIZE,
  studioPhaseFilterOptions,
  studioProjectHref,
  studioProjectPhaseLabel,
  studioProjectsAll,
  studioSortOptions,
  type StudioProjectCard,
  type StudioSortId,
} from "@/lib/studio-projects-v0-mock-data";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Users,
} from "lucide-react";

function PhaseBadge({ phase }: { phase: StudioProjectCard["phase"] }) {
  const label = studioProjectPhaseLabel(phase);
  return (
    <span
      className={`absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[10px] font-semibold ${phaseBadgeClass(phase)}`}
    >
      {label}
    </span>
  );
}

function ProjectGridCard({ project }: { project: StudioProjectCard }) {
  const hasNotification = (project.notificationCount ?? 0) > 0;
  return (
    <Link
      href={studioProjectHref(project.id)}
      className={`group flex flex-col rounded-2xl border bg-zinc-900/40 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 ${
        hasNotification
          ? "border-orange-500/50 ring-1 ring-orange-500/25"
          : "border-zinc-800"
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-zinc-800">
        <PhaseBadge phase={project.phase} />
        {hasNotification && (
          <span className="absolute right-2 top-2 z-10 rounded-md bg-orange-500/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-950">
            新着 {project.notificationCount}
          </span>
        )}
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover transition-transform group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="truncate font-semibold text-white group-hover:text-violet-100">
          {project.title}
        </h2>
        <p className="mt-1 truncate text-xs text-zinc-500">{project.genres}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5 shrink-0 text-violet-400" aria-hidden="true" />
            <span>
              見届け人数 <span className="text-zinc-200">{formatStat(project.witnessCount)}</span>
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="size-3.5 shrink-0 text-violet-400" aria-hidden="true" />
            <span>
              フィードバック数 <span className="text-zinc-200">{formatStat(project.voiceCount)}</span>
            </span>
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="min-w-0 text-xs text-zinc-500">
            <p>
              最新ver{" "}
              <span className="text-zinc-300">{project.version ?? "—"}</span>
            </p>
            <p className="mt-0.5">最終更新：{project.updatedLabel}</p>
          </div>
          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="その他の操作"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}

function ProjectListRow({ project }: { project: StudioProjectCard }) {
  const hasNotification = (project.notificationCount ?? 0) > 0;
  return (
    <Link
      href={studioProjectHref(project.id)}
      className={`flex gap-4 rounded-2xl border bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 sm:items-center ${
        hasNotification
          ? "border-orange-500/50 ring-1 ring-orange-500/25"
          : "border-zinc-800"
      }`}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-zinc-800 sm:size-24">
        <PhaseBadge phase={project.phase} />
        <Image src={project.image} alt={project.title} fill className="object-cover" sizes="96px" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-white">{project.title}</h2>
          {hasNotification && (
            <span className="rounded-md bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-300 ring-1 ring-orange-500/30">
              新着 {project.notificationCount}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-zinc-500">{project.genres}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
          <span>見届け人数 {formatStat(project.witnessCount)}</span>
          <span>フィードバック数 {formatStat(project.voiceCount)}</span>
          <span>最新ver {project.version ?? "—"}</span>
          <span>最終更新 {project.updatedLabel}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => e.preventDefault()}
        className="hidden shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 sm:block"
        aria-label="その他の操作"
      >
        <MoreHorizontal className="size-4" />
      </button>
    </Link>
  );
}

function NewProjectCard({ compact }: { compact?: boolean }) {
  return (
    <Link
      href="/submit"
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/20 text-center transition-colors hover:border-violet-500/40 hover:bg-violet-600/5 ${
        compact ? "p-6" : "min-h-[280px] px-6 py-10"
      }`}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-violet-600/20 text-violet-300 ring-1 ring-violet-500/30">
        <Plus className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-semibold text-zinc-200">新しい作品を投稿</p>
      <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-zinc-500">
        まだ誰も見たことのないあなたの作品を投稿しよう。
      </p>
    </Link>
  );
}

export function StudioProjectsTabPanel({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [phase, setPhase] = useState("all");
  const [sortId, setSortId] = useState<StudioSortId>("updated-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...studioProjectsAll];
    if (phase !== "all") {
      list = list.filter((p) => matchesStudioPhaseFilter(p.phase, phase));
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    if (sortId === "title-asc") {
      list.sort((a, b) => a.title.localeCompare(b.title, "ja"));
    } else if (sortId === "updated-asc") {
      list.reverse();
    }
    return list;
  }, [phase, query, sortId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / STUDIO_PROJECTS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * STUDIO_PROJECTS_PAGE_SIZE,
    safePage * STUDIO_PROJECTS_PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">プロジェクト一覧</h1>
          <p className="mt-2 text-sm text-zinc-400">
            あなたの作品を管理し、届いたフィードバックをもとに改善を進められます。
          </p>
        </div>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          <Plus className="size-4" aria-hidden="true" />
          新しい作品を投稿
        </Link>
      </div>

        <StudioPreviewSampleBanner compact />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="作品名で検索"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500/40 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StudioInlineSelect
                label="並び替え"
                value={sortId}
                options={[...studioSortOptions]}
                onChange={(id) => setSortId(id as StudioSortId)}
              />
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">公開状態</p>
            <StudioFilterPills
              options={[...studioPhaseFilterOptions]}
              active={phase}
              onChange={(id) => {
                setPhase(id);
                setPage(1);
              }}
            />
          </div>
        </div>

        <p className="text-sm text-zinc-500">
          全 <span className="font-medium text-zinc-300">{filtered.length}</span> 件のプロジェクト
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center">
            <p className="text-sm text-zinc-500">該当する作品がありません</p>
            <NewProjectCard compact />
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {pageItems.map((project) => (
              <ProjectGridCard key={project.id} project={project} />
            ))}
            {safePage === totalPages && <NewProjectCard />}
          </div>
        ) : (
          <div className="space-y-3">
            {pageItems.map((project) => (
              <ProjectListRow key={project.id} project={project} />
            ))}
            {safePage === totalPages && <NewProjectCard compact />}
          </div>
        )}

        {totalPages > 1 && (
          <nav
            className="flex items-center justify-center gap-2 pt-2"
            aria-label="ページネーション"
          >
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition-colors hover:border-zinc-700 disabled:opacity-40"
              aria-label="前のページ"
            >
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`min-w-9 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  n === safePage
                    ? "bg-violet-600/20 font-medium text-violet-200 ring-1 ring-violet-500/30"
                    : "border border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition-colors hover:border-zinc-700 disabled:opacity-40"
              aria-label="次のページ"
            >
              <ChevronRight className="size-4" />
            </button>
          </nav>
        )}
    </div>
  );
}
