"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  StudioFilterPills,
  StudioShell,
  StudioSortDropdown,
} from "@/components/studio-shell";
import {
  studioProjectHref,
  studioProjects,
  type StudioProjectCard,
} from "@/lib/studio-home-v0-mock-data";

const phaseFilters = [
  { id: "all", label: "すべて" },
  { id: "開発中", label: "開発中" },
  { id: "正式版", label: "正式版" },
];

function ProjectListCard({ project }: { project: StudioProjectCard }) {
  return (
    <Link
      href={studioProjectHref(project.id)}
      className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 sm:p-5"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-zinc-800 sm:size-24">
        <Image src={project.image} alt={project.title} fill className="object-cover" sizes="96px" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-white">{project.title}</h2>
          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/25">
            {project.phase}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500">{project.genres}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-400">
          <span>{project.version}</span>
          <span>声 {project.voiceCount}</span>
          <span>見届け人 {project.witnessCount}</span>
          <span>最終更新 {project.updatedLabel}</span>
        </div>
      </div>
      <span className="hidden self-center text-sm text-violet-400 sm:inline">開く →</span>
    </Link>
  );
}

export function StudioProjectsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [phase, setPhase] = useState("all");
  const [sortLabel, setSortLabel] = useState("更新が新しい順");

  const filtered = useMemo(() => {
    let list = [...studioProjects];
    if (phase !== "all") {
      list = list.filter((p) => p.phase === phase);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.genres.toLowerCase().includes(q),
      );
    }
    return list;
  }, [phase, query]);

  return (
    <StudioShell activeNav="projects" headerSearchDefault={initialQuery}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">プロジェクト一覧</h1>
            <p className="mt-1 text-sm text-zinc-500">全作品の管理</p>
          </div>
          <Link
            href="/submit"
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            新規投稿
          </Link>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="作品名・ジャンルで検索"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500/40 focus:outline-none sm:max-w-xs"
          />
          <div className="flex flex-wrap items-center gap-3">
            <StudioFilterPills options={phaseFilters} active={phase} onChange={setPhase} />
            <StudioSortDropdown
              label={sortLabel}
              onClick={() =>
                setSortLabel((l) =>
                  l === "更新が新しい順" ? "タイトル順" : "更新が新しい順",
                )
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center text-sm text-zinc-500">
              該当する作品がありません
            </div>
          ) : (
            filtered.map((project) => <ProjectListCard key={project.id} project={project} />)
          )}
        </div>
      </div>
    </StudioShell>
  );
}
