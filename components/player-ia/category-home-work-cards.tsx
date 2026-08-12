import Link from "next/link";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import type { CategoryHomeHeroWork } from "@/lib/player-ia/category-home-hero";
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
    <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-[11px] text-zinc-500">
      <span className="rounded-md bg-zinc-950/70 px-2 py-0.5 text-zinc-200 ring-1 ring-inset ring-zinc-700/80">
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
        <WorkMeta item={item} nowMs={nowMs} />
        <Link
          href={gameDetailHref(item.projectId)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300"
        >
          {ctaLabel}
        </Link>
      </div>
    </article>
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
        <span className="mt-1 line-clamp-1 text-sm font-bold text-white group-hover:text-violet-200">
          {item.title}
        </span>
        <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
          {truncatePlayerIaText(item.description, 80)}
        </span>
        <WorkMeta item={item} nowMs={nowMs} />
      </span>
    </button>
  );
}
