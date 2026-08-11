"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FeedbackGatheringSection } from "@/components/player-ia/feedback-gathering-section";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { buildGameDetailTabHref } from "@/lib/game-detail-tabs";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import {
  formatPlayerIaRelativeTime,
  formatPlayerIaVersionLabel,
  truncatePlayerIaText,
} from "@/lib/player-ia/format";
import {
  emptyPublicCategoryPresence,
  resolvePlayerIaHomeFeatureCards,
} from "@/lib/player-ia/home-feature-cards";
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

function FeaturesSection({
  presence,
}: {
  presence: PlayerIaHomePayload["categoryHasPublicWork"];
}) {
  const cards = resolvePlayerIaHomeFeatureCards(presence);
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
        {cards.map((card) => {
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
      <FeaturesSection
        presence={home.categoryHasPublicWork ?? emptyPublicCategoryPresence()}
      />
      <UpdatesSection items={home.meaningfulUpdates} nowMs={displayNowMs} />
      <ConnectionsSection items={home.usageRelations} />
      <AnnouncementsSection items={home.announcements} nowMs={displayNowMs} />
      <NewestSection items={home.newestProjects} nowMs={displayNowMs} />
    </div>
  );
}
