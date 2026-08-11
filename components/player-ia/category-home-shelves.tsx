import Link from "next/link";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { buildGameDetailTabHref } from "@/lib/game-detail-tabs";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import {
  formatPlayerIaRelativeTime,
  formatPlayerIaVersionLabel,
  truncatePlayerIaText,
} from "@/lib/player-ia/format";
import type {
  HomeMeaningfulUpdate,
  HomeNewestProject,
} from "@/lib/supabase/player-ia-home-db";

export function CategoryHomeUpdateShelf({
  items,
  title,
  headingId,
  seeAllHref,
  nowMs,
}: {
  items: HomeMeaningfulUpdate[];
  title: string;
  headingId: string;
  seeAllHref: string;
  nowMs: number;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2
          id={headingId}
          className="text-lg font-bold tracking-tight text-white text-balance"
        >
          {title}
        </h2>
        <Link
          href={seeAllHref}
          className="group inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
        >
          すべて見る
        </Link>
      </div>
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
                  className="!max-w-none rounded-none"
                  sizes="(min-width: 1024px) 22vw, 45vw"
                />
              </div>
              <div className="p-3.5">
                <span className="inline-flex rounded-md bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-300">
                  {item.updateLabel}
                </span>
                <h3 className="mt-2 truncate text-sm font-bold text-white group-hover:text-violet-200">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                  {truncatePlayerIaText(item.updateSummary, 80)}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                  {versionLabel ? <span>{versionLabel}</span> : null}
                  <span>
                    {formatPlayerIaRelativeTime(item.meaningfulUpdateAt, {
                      nowMs,
                    })}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function CategoryHomeNewestShelf({
  items,
  title,
  headingId,
  seeAllHref,
  nowMs,
}: {
  items: HomeNewestProject[];
  title: string;
  headingId: string;
  seeAllHref: string;
  nowMs: number;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2
          id={headingId}
          className="text-lg font-bold tracking-tight text-white text-balance"
        >
          {title}
        </h2>
        <Link
          href={seeAllHref}
          className="group inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
        >
          すべて見る
        </Link>
      </div>
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
                className="!max-w-none rounded-none"
                sizes="(min-width: 1024px) 22vw, 45vw"
              />
            </div>
            <div className="p-3.5">
              <h3 className="truncate text-sm font-bold text-white group-hover:text-violet-200">
                {item.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                {truncatePlayerIaText(item.description, 80)}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                <span className="truncate">{item.creator}</span>
                <span className="shrink-0">
                  {formatPlayerIaRelativeTime(item.firstPublishedAt, {
                    nowMs,
                  })}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
