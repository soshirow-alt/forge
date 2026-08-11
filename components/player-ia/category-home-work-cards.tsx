import Link from "next/link";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import type { CategoryHomeHeroWork } from "@/lib/player-ia/category-home-hero";
import {
  formatPlayerIaRelativeTime,
  truncatePlayerIaText,
} from "@/lib/player-ia/format";
import { PROJECT_CATEGORY_LABELS } from "@/lib/project-categories";

function WorkMeta({
  item,
  nowMs,
}: {
  item: CategoryHomeHeroWork;
  nowMs?: number;
}) {
  const categoryLabel = PROJECT_CATEGORY_LABELS[item.category];
  const published =
    item.publishedAt &&
    formatPlayerIaRelativeTime(item.publishedAt, { nowMs });
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
      <span className="rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-zinc-400">
        {categoryLabel}
      </span>
      {item.category === "game" && item.genre ? (
        <span className="truncate">{item.genre}</span>
      ) : null}
      {item.creator ? <span className="truncate">{item.creator}</span> : null}
      {published ? <span className="shrink-0">{published}</span> : null}
    </div>
  );
}

export function CategoryHomeHeroWorkCard({
  item,
  nowMs,
  ctaLabel,
}: {
  item: CategoryHomeHeroWork;
  nowMs?: number;
  ctaLabel: string;
}) {
  return (
    <Link
      href={gameDetailHref(item.projectId)}
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
        <h3 className="line-clamp-2 text-lg font-bold text-white group-hover:text-violet-200">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-400">
          {truncatePlayerIaText(item.description, 140)}
        </p>
        <WorkMeta item={item} nowMs={nowMs} />
        <span className="mt-3 inline-flex text-sm font-semibold text-violet-300">
          {ctaLabel}
        </span>
      </div>
    </Link>
  );
}

export function CategoryHomeRailWorkCard({
  item,
  nowMs,
  onPromote,
}: {
  item: CategoryHomeHeroWork;
  nowMs?: number;
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
        href={gameDetailHref(item.projectId)}
        className="group flex min-w-0 flex-1 flex-col justify-center p-3"
      >
        <h3 className="truncate text-sm font-bold text-white group-hover:text-violet-200">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
          {truncatePlayerIaText(item.description, 72)}
        </p>
        <WorkMeta item={item} nowMs={nowMs} />
      </Link>
    </div>
  );
}
