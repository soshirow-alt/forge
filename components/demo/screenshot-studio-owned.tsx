"use client";

import Image from "next/image";
import { StudioShell } from "@/components/studio-shell";
import { screenshotStudioProjects } from "@/lib/demo/screenshot-catalog";
import { screenshotGameHref } from "@/lib/demo/screenshot-routes";
import {
  formatStat,
  phaseBadgeClass,
  studioProjectPhaseLabel,
  type StudioProjectCard,
} from "@/lib/studio-projects-v0-mock-data";
import { MessageSquare, Users } from "lucide-react";

function noop() {}

function ScreenshotStudioProjectRow({ project }: { project: StudioProjectCard }) {
  const hasNotification = (project.notificationCount ?? 0) > 0;
  const phaseLabel = studioProjectPhaseLabel(project.phase);

  return (
    <button
      type="button"
      onClick={noop}
      className={`flex w-full gap-4 rounded-2xl border bg-zinc-900/40 p-4 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 sm:items-center ${
        hasNotification
          ? "border-orange-500/50 ring-1 ring-orange-500/25"
          : "border-zinc-800"
      }`}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-zinc-800 sm:size-24">
        <span
          className={`absolute left-1.5 top-1.5 z-10 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${phaseBadgeClass(project.phase)}`}
        >
          {phaseLabel}
        </span>
        <Image src={project.image} alt={project.title} fill className="object-cover" sizes="96px" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold text-white">{project.title}</h3>
          {hasNotification ? (
            <span className="rounded-md bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-300 ring-1 ring-orange-500/30">
              新着 FB {project.notificationCount}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-zinc-500">{project.genres}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5 text-violet-400" aria-hidden="true" />
            見届け {formatStat(project.witnessCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3.5 text-violet-400" aria-hidden="true" />
            FB {formatStat(project.voiceCount)}
          </span>
          <span className="text-zinc-500">
            {project.version ?? "—"} · {project.updatedLabel}
          </span>
        </div>
      </div>
    </button>
  );
}

export function ScreenshotStudioOwnedPage() {
  const projects = screenshotStudioProjects;
  const top = projects[0];

  return (
    <StudioShell activeNav="home" notificationBadge={3}>
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-orange-400/90">Studio · あなたの作品</p>
              <h2 className="mt-1 text-lg font-semibold text-zinc-100">あなたの作品</h2>
              <p className="mt-2 text-sm text-zinc-400">
                フィードバック確認・devlog・ver公開はここから。
              </p>
            </div>
            {top ? (
              <button
                type="button"
                onClick={noop}
                className="inline-flex shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
              >
                新着あり · 作品 Studio を開く
              </button>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            {projects.map((project) => (
              <ScreenshotStudioProjectRow key={project.id} project={project} />
            ))}
          </div>

          <p className="mt-4 text-center text-sm text-zinc-500">
            <a
              href={screenshotGameHref()}
              className="text-violet-300 hover:text-violet-200"
              onClick={(event) => event.preventDefault()}
            >
              代表作のプレイヤー画面を見る（撮影用）
            </a>
          </p>
        </section>
      </div>
    </StudioShell>
  );
}
