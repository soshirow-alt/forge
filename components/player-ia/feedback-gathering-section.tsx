"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { CategoryHomeHero } from "@/components/player-ia/category-home-hero";
import { CategoryHomePlaceholder } from "@/components/player-ia/category-home-placeholder";
import { buildGameDetailTabHref } from "@/lib/game-detail-tabs";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import { resolveFeedbackGatheringLayout } from "@/lib/player-ia/feedback-gathering-layout";
import { WHOLE_HOME_HERO_PLACEHOLDER_COPY } from "@/lib/player-ia/category-home-hero";
import {
  HOME_HERO_CARD_CHROME_CLASS,
  HOME_HERO_QUEUE_CARD_CLASS,
  HOME_HERO_QUEUE_THUMB_BOX_CLASS,
  HOME_HERO_QUEUE_THUMB_IMG_CLASS,
  HOME_HERO_THUMB_FLEX_CLASS,
  HOME_HERO_THUMB_IMG_CLASS,
} from "@/lib/player-ia/home-hero-geometry";
import {
  formatPlayerIaRelativeTime,
  formatPlayerIaWindowLabel,
  truncatePlayerIaText,
} from "@/lib/player-ia/format";
import {
  PROJECT_CATEGORY_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import { createRequestNowMs } from "@/lib/player-ia/request-now";
import type { HomeFeedbackGatheringProject } from "@/lib/supabase/player-ia-home-db";

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

function FeedbackHeroCard({
  item,
  nowMs,
}: {
  item: HomeFeedbackGatheringProject;
  nowMs: number;
}) {
  return (
    <article className={HOME_HERO_CARD_CHROME_CLASS}>
      <Link href={gameDetailHref(item.projectId)} className={HOME_HERO_THUMB_FLEX_CLASS}>
        <ProjectThumbnail
          projectId={item.projectId}
          title={item.title}
          variant="hero"
          className={HOME_HERO_THUMB_IMG_CLASS}
          sizes="(min-width: 1024px) 40vw, 100vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <CategoryBadge category={item.category} />
        </div>
      </Link>
      <div className="flex shrink-0 flex-col p-4">
        <Link href={gameDetailHref(item.projectId)}>
          <h3 className="line-clamp-2 text-lg font-bold text-white hover:text-violet-200">
            {item.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">
          {truncatePlayerIaText(item.description, 120)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span>{formatPlayerIaWindowLabel(item.windowDays)}</span>
          <span>投稿 {item.distinctAuthorCount}人</span>
          <span>FB {item.feedbackCount}件</span>
          {item.hasCreatorReply ? <span>制作者返信あり</span> : null}
          <span>{formatPlayerIaRelativeTime(item.lastFeedbackAt, { nowMs })}</span>
        </div>
        <Link
          href={buildGameDetailTabHref(item.projectId, "voices")}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300"
        >
          <MessageSquare className="size-3.5" aria-hidden="true" />
          フィードバックを見る
        </Link>
      </div>
    </article>
  );
}

function FeedbackQueueCard({
  item,
  onPromote,
}: {
  item: HomeFeedbackGatheringProject;
  onPromote: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPromote}
      className={HOME_HERO_QUEUE_CARD_CLASS}
      aria-label={`${item.title} を注目表示`}
    >
      <span className={HOME_HERO_QUEUE_THUMB_BOX_CLASS}>
        <ProjectThumbnail
          projectId={item.projectId}
          title={item.title}
          variant="mini"
          className={HOME_HERO_QUEUE_THUMB_IMG_CLASS}
          sizes="140px"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start">
        <CategoryBadge category={item.category} />
        <span className="mt-1 line-clamp-1 text-sm font-bold text-white group-hover:text-violet-200">
          {item.title}
        </span>
        <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
          {truncatePlayerIaText(item.description, 80)}
        </span>
        <span className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-[11px] text-zinc-500">
          <span>{item.distinctAuthorCount}人</span>
          <span>FB {item.feedbackCount}</span>
          {item.hasCreatorReply ? <span>返信あり</span> : null}
        </span>
      </span>
    </button>
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
      headingId="player-ia-feedback-gathering"
      title={
        <h2
          id="player-ia-feedback-gathering"
          className="text-lg font-bold tracking-tight text-white text-balance"
        >
          フィードバックが集まっている作品
        </h2>
      }
      placeholder={
        <CategoryHomePlaceholder copy={WHOLE_HOME_HERO_PLACEHOLDER_COPY} />
      }
      renderHero={(item) => (
        <FeedbackHeroCard item={item} nowMs={displayNowMs} />
      )}
      renderRail={(item, onPromote) => (
        <FeedbackQueueCard item={item} onPromote={onPromote} />
      )}
    />
  );
}
