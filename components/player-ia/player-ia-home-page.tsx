"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  MessageSquare,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { buildGameDetailTabHref } from "@/lib/game-detail-tabs";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import {
  formatPlayerIaRelativeTime,
  formatPlayerIaVersionLabel,
  formatPlayerIaWindowLabel,
  truncatePlayerIaText,
} from "@/lib/player-ia/format";
import { PLAYER_IA_HOME_FEATURE_CARDS } from "@/lib/player-ia/home-feature-cards";
import { createRequestNowMs } from "@/lib/player-ia/request-now";
import {
  PROJECT_CATEGORY_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import type { PlayerIaHomePayload } from "@/lib/supabase/player-ia-home-db";

function createClientFallbackNowMs(): number {
  return createRequestNowMs();
}
function CategoryBadge({ category }: { category: ProjectCategoryId }) {
  const label = PROJECT_CATEGORY_LABELS[category]?.trim();
  if (!label) return null;
  return (
    <span className="inline-flex w-fit max-w-full shrink-0 items-center rounded-md bg-zinc-950/70 px-2 py-0.5 text-[11px] font-medium leading-none text-zinc-200 ring-1 ring-inset ring-zinc-700/80">
      {label}
    </span>
  );
}

function SectionHeading({
  title,
  headingId,
  seeAllHref,
}: {
  title: string;
  headingId: string;
  seeAllHref?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2
        id={headingId}
        className="text-lg font-bold tracking-tight text-white text-balance"
      >
        {title}
      </h2>
      {seeAllHref ? (
        <Link
          href={seeAllHref}
          className="group inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
        >
          すべて見る
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}

function FeedbackGatheringSection({
  items,
  nowMs,
}: {
  items: PlayerIaHomePayload["feedbackGathering"];
  nowMs: number;
}) {
  if (items.length === 0) return null;
  const [featured, ...rest] = items;

  return (
    <section aria-labelledby="player-ia-feedback-gathering">
      <SectionHeading
        title="フィードバックが集まっている作品"
        headingId="player-ia-feedback-gathering"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-violet-500/40">
          <Link
            href={gameDetailHref(featured.projectId)}
            className="block"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <ProjectThumbnail
                projectId={featured.projectId}
                title={featured.title}
                variant="hero"
                className="!rounded-none transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(min-width: 1024px) 40vw, 100vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <CategoryBadge category={featured.category} />
              </div>
            </div>
          </Link>
          <div className="p-4">
            <Link href={gameDetailHref(featured.projectId)}>
              <h3 className="text-lg font-bold text-white hover:text-violet-200">
                {featured.title}
              </h3>
            </Link>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">
              {truncatePlayerIaText(featured.description, 140)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
              <span>{formatPlayerIaWindowLabel(featured.windowDays)}</span>
              <span>投稿 {featured.distinctAuthorCount}人</span>
              <span>FB {featured.feedbackCount}件</span>
              {featured.hasCreatorReply ? <span>制作者返信あり</span> : null}
              <span>{formatPlayerIaRelativeTime(featured.lastFeedbackAt, { nowMs })}</span>
            </div>
            <Link
              href={buildGameDetailTabHref(featured.projectId, "voices")}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              <MessageSquare className="size-3.5" aria-hidden="true" />
              フィードバックを見る
            </Link>
          </div>
        </article>

        <div className="flex flex-col gap-4">
          {rest.map((item) => (
            <div
              key={item.projectId}
              className="group flex gap-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-violet-500/40"
            >
              <Link
                href={gameDetailHref(item.projectId)}
                className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg sm:w-36"
              >
                <ProjectThumbnail
                  projectId={item.projectId}
                  title={item.title}
                  variant="mini"
                  className="!h-full !w-full !max-w-none rounded-lg transition-transform duration-500 group-hover:scale-[1.05]"
                  sizes="160px"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col items-start">
                <CategoryBadge category={item.category} />
                <Link
                  href={gameDetailHref(item.projectId)}
                  className="mt-1.5 truncate text-sm font-bold text-white hover:text-violet-200"
                >
                  {item.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                  {truncatePlayerIaText(item.description, 90)}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-[11px] text-zinc-500">
                  <span>{formatPlayerIaWindowLabel(item.windowDays)}</span>
                  <span>{item.distinctAuthorCount}人</span>
                  <span>FB {item.feedbackCount}</span>
                  {item.hasCreatorReply ? <span>返信あり</span> : null}
                </div>
                <Link
                  href={buildGameDetailTabHref(item.projectId, "voices")}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:text-violet-300"
                  onClick={(event) => event.stopPropagation()}
                >
                  フィードバックを見る
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section aria-labelledby="player-ia-features">
      <div className="mb-4">
        <h2
          id="player-ia-features"
          className="text-lg font-bold tracking-tight text-white"
        >
          作品を見つける・試す
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PLAYER_IA_HOME_FEATURE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white">{card.title}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-zinc-500">
                    {card.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-zinc-800 pt-3">
                <ul className="flex flex-col gap-1.5">
                  {card.ctas.map((cta) => {
                    if (cta.kind === "coming_soon") {
                      return (
                        <li key={`${card.id}-${cta.id}`}>
                          <div className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5 text-sm text-zinc-500">
                            <span>{cta.label}</span>
                            <span className="shrink-0 text-[11px] font-medium tracking-wide text-zinc-600">
                              Coming Soon
                            </span>
                          </div>
                        </li>
                      );
                    }
                    return (
                      <li key={`${card.id}-${cta.id}`}>
                        <Link
                          href={cta.href}
                          className="group flex items-center justify-between gap-2 rounded-md px-1 py-1.5 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-500/10 hover:text-violet-200"
                        >
                          <span>{cta.label}</span>
                          <ChevronRight className="size-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-300" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UpdatesSection({
  items,
  nowMs,
}: {
  items: PlayerIaHomePayload["meaningfulUpdates"];
  nowMs: number;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="player-ia-updates">
      <SectionHeading
        title="最近アップデートされた作品"
        headingId="player-ia-updates"
        seeAllHref="/search?sort=updated"
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((item) => {
          const versionLabel = formatPlayerIaVersionLabel(item.publishedVersion);
          return (
            <Link
              key={item.projectId}
              href={
                item.updateKind === "devlog"
                  ? buildGameDetailTabHref(item.projectId, "devlog")
                  : gameDetailHref(item.projectId)
              }
              className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-violet-500/40"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <ProjectThumbnail
                  projectId={item.projectId}
                  title={item.title}
                  variant="card"
                  className="!max-w-none rounded-none transition-transform duration-500 group-hover:scale-[1.05]"
                  sizes="(min-width: 1024px) 22vw, 45vw"
                />
                <div className="absolute left-2.5 top-2.5">
                  <CategoryBadge category={item.category} />
                </div>
              </div>
              <div className="p-3.5">
                <span className="inline-flex items-center rounded-md bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-300">
                  {item.updateLabel}
                </span>
                <h3 className="mt-2 truncate text-sm font-bold text-white group-hover:text-violet-200">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                  {truncatePlayerIaText(item.updateSummary, 80)}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                  {versionLabel ? <span>{versionLabel}</span> : null}
                  <span>{formatPlayerIaRelativeTime(item.meaningfulUpdateAt, { nowMs })}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ConnectionsSection({
  items,
}: {
  items: PlayerIaHomePayload["usageRelations"];
}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="player-ia-connections">
      <SectionHeading
        title="Forgeでつながった作品"
        headingId="player-ia-connections"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3"
          >
            <Link
              href={gameDetailHref(item.sourceProjectId)}
              className="group min-w-0 flex-1 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/40 transition-colors hover:border-violet-500/40"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <ProjectThumbnail
                  projectId={item.sourceProjectId}
                  title={item.sourceTitle}
                  variant="card"
                  className="!max-w-none rounded-none transition-transform duration-500 group-hover:scale-[1.05]"
                  sizes="180px"
                />
                <div className="absolute left-2 top-2">
                  <CategoryBadge category={item.sourceCategory} />
                </div>
              </div>
              <div className="p-2.5">
                <h3 className="truncate text-xs font-semibold text-white group-hover:text-violet-200">
                  {item.sourceTitle}
                </h3>
              </div>
            </Link>
            <span className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-full bg-violet-500/15 px-1.5 py-2 text-center text-[10px] font-semibold leading-tight text-violet-300">
              <ArrowRight className="size-3.5" aria-hidden="true" />
              使用している
            </span>
            <Link
              href={gameDetailHref(item.targetProjectId)}
              className="group min-w-0 flex-1 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/40 transition-colors hover:border-violet-500/40"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <ProjectThumbnail
                  projectId={item.targetProjectId}
                  title={item.targetTitle}
                  variant="card"
                  className="!max-w-none rounded-none transition-transform duration-500 group-hover:scale-[1.05]"
                  sizes="180px"
                />
                <div className="absolute left-2 top-2">
                  <CategoryBadge category={item.targetCategory} />
                </div>
              </div>
              <div className="p-2.5">
                <h3 className="truncate text-xs font-semibold text-white group-hover:text-violet-200">
                  {item.targetTitle}
                </h3>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnnouncementsSection({
  items,
  nowMs,
}: {
  items: PlayerIaHomePayload["announcements"];
  nowMs: number;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="player-ia-announcements">
      <SectionHeading
        title="Forgeからのお知らせ"
        headingId="player-ia-announcements"
        seeAllHref="/announcements"
      />
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        {items.map((item, index) => (
          <Link
            key={item.id}
            href={`/announcements/${item.slug}`}
            className={`group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-violet-500/5 ${
              index !== 0 ? "border-t border-zinc-800" : ""
            }`}
          >
            <span
              className={`inline-flex w-16 shrink-0 items-center justify-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${
                item.importance === "important"
                  ? "bg-rose-500/15 text-rose-300 ring-rose-500/25"
                  : "bg-violet-500/15 text-violet-300 ring-violet-500/25"
              }`}
            >
              {item.importance === "important" ? "重要" : "お知らせ"}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-white group-hover:text-violet-200">
                {item.title}
              </h3>
              <p className="mt-0.5 truncate text-xs text-zinc-500">{item.summary}</p>
            </div>
            <span className="hidden shrink-0 text-xs text-zinc-500 sm:block">
              {formatPlayerIaRelativeTime(item.publishedAt, { nowMs })}
            </span>
            <ChevronRight className="size-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-300" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function NewestSection({
  items,
  nowMs,
}: {
  items: PlayerIaHomePayload["newestProjects"];
  nowMs: number;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="player-ia-newest">
      <SectionHeading
        title="新着作品"
        headingId="player-ia-newest"
        seeAllHref="/search?sort=newest"
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.projectId}
            href={gameDetailHref(item.projectId)}
            className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-violet-500/40"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <ProjectThumbnail
                projectId={item.projectId}
                title={item.title}
                variant="card"
                className="!max-w-none rounded-none transition-transform duration-500 group-hover:scale-[1.05]"
                sizes="(min-width: 1024px) 22vw, 45vw"
              />
              <div className="absolute left-2.5 top-2.5">
                <CategoryBadge category={item.category} />
              </div>
            </div>
            <div className="p-3.5">
              <h3 className="truncate text-sm font-bold text-white group-hover:text-violet-200">
                {item.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                {truncatePlayerIaText(item.description, 80)}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="truncate text-[11px] text-zinc-500">
                  {item.creator}
                </span>
                <span className="shrink-0 text-[11px] text-zinc-500">
                  {formatPlayerIaRelativeTime(item.firstPublishedAt, { nowMs })}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PlayerIaHomePage({
  initialHome = null,
  nowMs,
}: {
  /** Server-fetched payload; when present, skip mount-time API re-fetch. */
  initialHome?: PlayerIaHomePayload | null;
  /** Server clock for relative-time hydration parity. */
  nowMs?: number;
}) {
  const [fallbackNowMs] = useState(createClientFallbackNowMs);
  const displayNowMs = nowMs ?? fallbackNowMs;
  const [clientHome, setClientHome] = useState<PlayerIaHomePayload | null>(null);
  const [clientLoading, setClientLoading] = useState(initialHome == null);
  const [clientError, setClientError] = useState(false);

  useEffect(() => {
    if (initialHome) {
      return;
    }

    let cancelled = false;
    void fetch("/api/discovery/player-ia-home", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("home fetch failed");
        }
        const payload = (await response.json()) as {
          ok?: boolean;
          home?: PlayerIaHomePayload;
        };
        if (!payload.ok || !payload.home) {
          throw new Error("home payload invalid");
        }
        if (!cancelled) {
          setClientHome(payload.home);
          setClientError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClientError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setClientLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [initialHome]);

  const home = initialHome ?? clientHome;
  const loading = initialHome ? false : clientLoading;
  const error = initialHome ? false : clientError;

  if (loading) {
    return (
      <div className="flex flex-col gap-10">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40"
          />
        ))}
      </div>
    );
  }

  if (error || !home) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
        <Search className="mx-auto size-10 text-zinc-600" aria-hidden="true" />
        <p className="mt-4 text-sm text-zinc-400">ホームを読み込めませんでした。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10">
      <FeedbackGatheringSection items={home.feedbackGathering} nowMs={displayNowMs} />
      <FeaturesSection />
      <UpdatesSection items={home.meaningfulUpdates} nowMs={displayNowMs} />
      <ConnectionsSection items={home.usageRelations} />
      <AnnouncementsSection items={home.announcements} nowMs={displayNowMs} />
      <NewestSection items={home.newestProjects} nowMs={displayNowMs} />
    </div>
  );
}
