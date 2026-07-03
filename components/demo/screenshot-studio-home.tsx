"use client";

import Image from "next/image";
import Link from "next/link";
import { StudioShell } from "@/components/studio-shell";
import {
  SCREENSHOT_STUDIO_LIFECYCLE_STEPS,
  screenshotStudioHomeProjects,
  type ScreenshotStudioHomeProject,
  type ScreenshotStudioLifecycleStepId,
} from "@/lib/demo/screenshot-catalog";
import { screenshotGameHref } from "@/lib/demo/screenshot-routes";
import { formatStat } from "@/lib/studio-projects-v0-mock-data";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Heart,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";

type RailVisual = "done" | "current" | "upcoming";

function lifecycleStepVisual(
  stepId: ScreenshotStudioLifecycleStepId,
  currentStepId: ScreenshotStudioLifecycleStepId,
): RailVisual {
  const order = SCREENSHOT_STUDIO_LIFECYCLE_STEPS.map((step) => step.id);
  const currentIndex = order.indexOf(currentStepId);
  const stepIndex = order.indexOf(stepId);
  if (stepIndex < currentIndex) {
    return "done";
  }
  if (stepIndex === currentIndex) {
    return "current";
  }
  return "upcoming";
}

function StudioMicroRail({ currentStepId }: { currentStepId: ScreenshotStudioLifecycleStepId }) {
  return (
    <div
      className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-2 py-3 sm:px-3"
      aria-label="公開までの流れ"
    >
      <div className="flex items-start justify-between gap-0.5">
        {SCREENSHOT_STUDIO_LIFECYCLE_STEPS.map((step, index) => {
          const visual = lifecycleStepVisual(step.id, currentStepId);
          const isCurrent = visual === "current";

          return (
            <div key={step.id} className="flex min-w-0 flex-1 flex-col items-center">
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[10px] font-semibold sm:size-7 sm:text-xs ${
                  isCurrent
                    ? "bg-orange-500/20 text-orange-300 ring-2 ring-orange-500/50"
                    : visual === "done"
                      ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                      : "bg-zinc-900 text-zinc-600 ring-1 ring-zinc-800"
                }`}
              >
                {visual === "done" ? (
                  <Check className="size-3 sm:size-3.5" aria-hidden="true" />
                ) : isCurrent ? (
                  "●"
                ) : (
                  "·"
                )}
              </span>
              <span
                className={`mt-1.5 line-clamp-2 text-center text-[9px] leading-tight sm:text-[10px] ${
                  isCurrent ? "font-medium text-orange-300" : "text-zinc-500"
                }`}
              >
                {step.label}
              </span>
              {index < SCREENSHOT_STUDIO_LIFECYCLE_STEPS.length - 1 ? (
                <span
                  className={`pointer-events-none absolute hidden h-0.5 w-full ${visual === "done" ? "bg-emerald-500/40" : "bg-zinc-800"}`}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScreenshotStudioProjectCard({ project }: { project: ScreenshotStudioHomeProject }) {
  const hasNotification = (project.notificationCount ?? 0) > 0;
  const hasHighlight = hasNotification || project.currentStepId === "read";

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-zinc-900/40 ${
        hasHighlight
          ? "border-orange-500/50 ring-1 ring-orange-500/25"
          : "border-zinc-800"
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-zinc-800 sm:aspect-auto sm:h-auto sm:w-44 md:w-52">
          {hasNotification ? (
            <span className="absolute right-2 top-2 z-10 rounded-md bg-orange-500/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-950">
              新着 FB {project.notificationCount}
            </span>
          ) : null}
          <Image
            src={project.image}
            alt={project.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 208px"
          />
        </div>

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-base font-semibold text-zinc-100">{project.title}</h3>
            {project.cycleNumber ? (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-zinc-700">
                第 {project.cycleNumber} 回
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-zinc-500">{project.genres}</p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="size-3.5 shrink-0 text-violet-400" aria-hidden="true" />
              FB {formatStat(project.voiceCount)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0 text-violet-400" aria-hidden="true" />
              見届け {formatStat(project.witnessCount)}
            </span>
            <span className="text-zinc-500">
              {project.version ?? "—"} · {project.updatedLabel}
            </span>
          </div>

          <StudioMicroRail currentStepId={project.currentStepId} />

          <p className="mt-3 text-sm text-zinc-400">
            次: <span className="font-medium text-orange-300">{project.nextAction}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

const QUICK_LINKS = [
  { href: "#", label: "作品一覧", icon: LayoutGrid },
  { href: "#", label: "コミュニティ", icon: Heart },
] as const;

export function ScreenshotStudioHomePage() {
  const unreadCount = screenshotStudioHomeProjects.reduce(
    (sum, project) => sum + (project.notificationCount ?? 0),
    0,
  );

  return (
    <StudioShell activeNav="home" notificationBadge={unreadCount}>
      <div className="mx-auto max-w-7xl space-y-8 pb-6">
        <section>
          <h1 className="text-2xl font-bold text-zinc-100">Studio ホーム</h1>
          <p className="mt-2 text-sm text-zinc-500">
            公開中の作品ごとに、プレイヤーとのつながりと次のアクションを確認できます。
          </p>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-4 text-violet-400" aria-hidden="true" />
            <h2 className="text-base font-semibold text-zinc-100">気になる動き</h2>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-zinc-950/50 to-zinc-950/80 p-5 backdrop-blur-md">
            <ArrowUpRight
              className="absolute right-4 top-4 size-4 text-zinc-600"
              aria-hidden="true"
            />
            <div className="flex items-start gap-3 pr-8">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/15">
                <MessageSquare className="size-5 text-violet-300" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-zinc-100">未確認のフィードバックがあります</p>
                <p className="mt-1 text-sm text-zinc-500">
                  星灯の旅路に新着 {screenshotStudioHomeProjects[0]?.notificationCount ?? 0}{" "}
                  件 — 回答を見る工程です
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">あなたの作品</h2>
              <p className="mt-1 text-sm text-zinc-500">現在地と次にやることを確認</p>
            </div>
            <span className="text-xs text-zinc-600">
              {screenshotStudioHomeProjects.length} 作品
            </span>
          </div>

          <div className="space-y-4">
            {screenshotStudioHomeProjects.map((project) => (
              <ScreenshotStudioProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 p-4 backdrop-blur-md">
          <h2 className="text-base font-semibold text-zinc-100">クイックアクセス</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.label}>
                  <span className="relative flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-zinc-950/50 px-3 py-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/15">
                      <Icon className="size-4 text-violet-300" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-zinc-300">{link.label}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="text-center text-xs text-zinc-600">
          <Link href={screenshotGameHref()} className="text-violet-400 hover:text-violet-300">
            代表作のプレイヤー画面を見る（撮影用）
          </Link>
          <ChevronRight className="ml-0.5 inline size-3" aria-hidden="true" />
        </p>
      </div>
    </StudioShell>
  );
}
