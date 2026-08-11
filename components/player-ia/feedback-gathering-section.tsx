"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, MessageSquare } from "lucide-react";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { CategoryHomeHero } from "@/components/player-ia/category-home-hero";
import { CategoryHomePlaceholder } from "@/components/player-ia/category-home-placeholder";
import { buildGameDetailTabHref } from "@/lib/game-detail-tabs";
import { resolveFeedbackGatheringLayout } from "@/lib/player-ia/feedback-gathering-layout";
import { WHOLE_HOME_HERO_PLACEHOLDER_COPY } from "@/lib/player-ia/category-home-hero";
import {
  formatPlayerIaRelativeTime,
  formatPlayerIaWindowLabel,
  truncatePlayerIaText,
} from "@/lib/player-ia/format";
import { PROJECT_CATEGORY_LABELS } from "@/lib/project-categories";
import { createRequestNowMs } from "@/lib/player-ia/request-now";
import type { HomeFeedbackGatheringProject } from "@/lib/supabase/player-ia-home-db";

function createClientFallbackNowMs(): number {
  return createRequestNowMs();
}

function windowLabel(days: number): string | null {
  if (days === 30 || days === 90) return formatPlayerIaWindowLabel(days);
  return null;
}

function FeedbackHeroCard({
  item,
  nowMs,
}: {
  item: HomeFeedbackGatheringProject;
  nowMs: number;
}) {
  const href = buildGameDetailTabHref(item.projectId, "voices");
  const categoryLabel = PROJECT_CATEGORY_LABELS[item.category];
  const window = windowLabel(item.windowDays);
  return (
    <Link
      href={href}
      className="group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 transition-colors hover:border-violet-500/40"
    >
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden">
        <ProjectThumbnail
          projectId={item.projectId}
          title={item.title}
          variant="card"
          className="!max-w-none rounded-none"
          sizes="(min-width: 1024px) 36vw, 100vw"
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400">
            {categoryLabel}
          </span>
          {window ? (
            <span className="text-[11px] text-zinc-500">{window}</span>
          ) : null}
        </div>
        <h3 className="line-clamp-2 text-lg font-bold text-white group-hover:text-violet-200">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-400">
          {truncatePlayerIaText(item.description, 140)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span>FB {item.feedbackCount}</span>
          <span>投稿者 {item.distinctAuthorCount}</span>
          <span>
            {formatPlayerIaRelativeTime(item.lastFeedbackAt, { nowMs })}
          </span>
        </div>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-300">
          <MessageSquare className="size-3.5" />
          フィードバックを見る
        </span>
      </div>
    </Link>
  );
}

function FeedbackQueueCard({
  item,
  nowMs,
  onPromote,
}: {
  item: HomeFeedbackGatheringProject;
  nowMs: number;
  onPromote: () => void;
}) {
  return (
    <div className="flex h-full min-h-[148px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
      <button
        type="button"
        onClick={onPromote}
        className="relative w-[42%] shrink-0 overflow-hidden"
        aria-label={`${item.title} を大きく見る`}
      >
        <ProjectThumbnail
          projectId={item.projectId}
          title={item.title}
          variant="card"
          className="!max-w-none rounded-none"
          sizes="(min-width: 1024px) 16vw, 40vw"
        />
      </button>
      <Link
        href={buildGameDetailTabHref(item.projectId, "voices")}
        className="group flex min-w-0 flex-1 flex-col justify-center p-3"
      >
        <h3 className="truncate text-sm font-bold text-white group-hover:text-violet-200">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
          {truncatePlayerIaText(item.description, 72)}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
          <span>FB {item.feedbackCount}</span>
          <span>
            {formatPlayerIaRelativeTime(item.lastFeedbackAt, { nowMs })}
          </span>
        </div>
      </Link>
    </div>
  );
}

export function FeedbackGatheringSection({
  items,
  nowMs,
}: {
  items: HomeFeedbackGatheringProject[];
  nowMs?: number;
}) {
  const layout = resolveFeedbackGatheringLayout(items.length);
  const [clientNowMs] = useState(createClientFallbackNowMs);
  const displayNowMs = nowMs ?? clientNowMs;

  if (!layout.show) return null;

  return (
    <CategoryHomeHero
      items={items}
      headingId="feedback-gathering-heading"
      title={
        <h2
          id="feedback-gathering-heading"
          className="text-lg font-bold tracking-tight text-white text-balance"
        >
          フィードバックが集まっている作品
        </h2>
      }
      seeAll={
        <Link
          href="/search?sort=feedback"
          className="group inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
        >
          すべて見る
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      }
      placeholder={
        <CategoryHomePlaceholder copy={WHOLE_HOME_HERO_PLACEHOLDER_COPY} />
      }
      renderHero={(item) => (
        <FeedbackHeroCard item={item} nowMs={displayNowMs} />
      )}
      renderRail={(item, onPromote) => (
        <FeedbackQueueCard
          item={item}
          nowMs={displayNowMs}
          onPromote={onPromote}
        />
      )}
    />
  );
}
