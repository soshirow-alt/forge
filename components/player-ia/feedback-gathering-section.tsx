"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { MessageSquare } from "lucide-react";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { buildGameDetailTabHref } from "@/lib/game-detail-tabs";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import {
  formatPlayerIaRelativeTime,
  formatPlayerIaWindowLabel,
  truncatePlayerIaText,
} from "@/lib/player-ia/format";
import {
  PROJECT_CATEGORY_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import type { PlayerIaHomePayload } from "@/lib/supabase/player-ia-home-db";

const ROTATE_MS = 6000;
const QUEUE_GAP_PX = 12;

type FeedbackItem = PlayerIaHomePayload["feedbackGathering"][number];

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
}: {
  title: string;
  headingId: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2
        id={headingId}
        className="text-lg font-bold tracking-tight text-white text-balance"
      >
        {title}
      </h2>
    </div>
  );
}

function FeedbackHeroCard({
  item,
  nowMs,
}: {
  item: FeedbackItem;
  nowMs: number;
}) {
  return (
    <article className="group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-violet-500/40">
      <Link href={gameDetailHref(item.projectId)} className="relative block min-h-0 flex-[1.35] overflow-hidden">
        <ProjectThumbnail
          projectId={item.projectId}
          title={item.title}
          variant="hero"
          className="!h-full !w-full !max-w-none !rounded-none object-cover transition-transform duration-500 group-hover:scale-[1.02]"
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
  style,
}: {
  item: FeedbackItem;
  onPromote: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onPromote}
      style={style}
      className="group flex min-h-0 w-full gap-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-left transition-colors hover:border-violet-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500/70"
      aria-label={`${item.title} を注目表示`}
    >
      <span className="relative aspect-[4/3] h-full max-h-full w-28 shrink-0 overflow-hidden rounded-lg sm:w-32">
        <ProjectThumbnail
          projectId={item.projectId}
          title={item.title}
          variant="mini"
          className="!h-full !w-full !max-w-none rounded-lg object-cover transition-transform duration-500 group-hover:scale-[1.04]"
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
  items: PlayerIaHomePayload["feedbackGathering"];
  nowMs: number;
}) {
  const count = items.length;
  const [heroIndex, setHeroIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [railHeight, setRailHeight] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const safeIndex = count > 0 ? ((heroIndex % count) + count) % count : 0;
  const hero = count > 0 ? items[safeIndex]! : null;
  const queue = count > 1
    ? [1, 2, 3]
        .map((offset) => items[(safeIndex + offset) % count])
        .filter((item, index, arr): item is FeedbackItem => {
          if (!item) return false;
          // Avoid duplicates when count < 4
          return arr.findIndex((x) => x?.projectId === item.projectId) === index
            && item.projectId !== hero?.projectId;
        })
        .slice(0, Math.min(3, count - 1))
    : [];

  const canRotate = count >= 4 && !reducedMotion;

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const promote = useCallback(
    (projectId: string) => {
      const index = items.findIndex((item) => item.projectId === projectId);
      if (index < 0) return;
      setHeroIndex(index);
    },
    [items],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const measure = () => setRailHeight(el.clientHeight || null);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hero?.projectId, count]);

  useEffect(() => {
    clearTimer();
    if (!canRotate || hovering || focusWithin) return;
    timerRef.current = window.setTimeout(() => {
      setHeroIndex((current) => (current + 1) % count);
    }, ROTATE_MS);
    return clearTimer;
  }, [canRotate, hovering, focusWithin, heroIndex, count, clearTimer]);

  if (!hero) return null;

  const queueRowHeight =
    railHeight != null && queue.length > 0
      ? Math.max(
          88,
          (railHeight - QUEUE_GAP_PX * (queue.length - 1)) / queue.length,
        )
      : undefined;

  return (
    <section
      aria-labelledby="player-ia-feedback-gathering"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={() => {
        window.requestAnimationFrame(() => {
          const active = document.activeElement;
          const section = document.getElementById("player-ia-feedback-gathering-root");
          if (!section || !(active instanceof Element) || !section.contains(active)) {
            setFocusWithin(false);
          }
        });
      }}
      id="player-ia-feedback-gathering-root"
    >
      <SectionHeading
        title="フィードバックが集まっている作品"
        headingId="player-ia-feedback-gathering"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <div
          ref={heroRef}
          className={
            reducedMotion
              ? "min-h-[22rem]"
              : "min-h-[22rem] transition-opacity duration-500"
          }
          key={hero.projectId}
        >
          <FeedbackHeroCard item={hero} nowMs={nowMs} />
        </div>
        {queue.length > 0 ? (
          <div
            className="flex flex-col"
            style={{
              height: railHeight ?? undefined,
              gap: QUEUE_GAP_PX,
            }}
          >
            {queue.map((item) => (
              <FeedbackQueueCard
                key={item.projectId}
                item={item}
                onPromote={() => promote(item.projectId)}
                style={
                  queueRowHeight != null
                    ? { height: queueRowHeight, flex: "0 0 auto" }
                    : { flex: "1 1 0" }
                }
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
