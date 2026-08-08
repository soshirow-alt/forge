"use client";

import Link from "next/link";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import {
  PROJECT_CATEGORY_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import { truncatePlayerIaText } from "@/lib/player-ia/format";

export type PlayerIaProjectCardProps = {
  projectId: string;
  title: string;
  category: ProjectCategoryId;
  description?: string | null;
  meta?: string;
  creator?: string;
};

function CategoryPill({ category }: { category: ProjectCategoryId }) {
  const label = PROJECT_CATEGORY_LABELS[category]?.trim();
  if (!label) return null;
  return (
    <span className="inline-flex max-w-[9.5rem] items-center truncate rounded-md bg-zinc-950/75 px-2 py-0.5 text-[11px] font-medium leading-none text-zinc-200 ring-1 ring-inset ring-zinc-700/80">
      {label}
    </span>
  );
}

export function PlayerIaProjectCard({
  projectId,
  title,
  category,
  description,
  meta,
  creator,
}: PlayerIaProjectCardProps) {
  const descriptionText = description?.trim()
    ? truncatePlayerIaText(description, 120)
    : "";

  return (
    <Link
      href={gameDetailHref(projectId)}
      title={title}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/45 text-left transition-colors duration-150 hover:border-zinc-700/90 hover:bg-zinc-900/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      aria-label={`${title}の詳細`}
    >
      <article className="flex h-full min-w-0 flex-col">
        <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
          <ProjectThumbnail
            projectId={projectId}
            title={title}
            variant="card"
            className="!absolute !inset-0 !aspect-auto !h-full !w-full !max-w-none rounded-none transition-[filter] duration-150 group-hover:brightness-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 45vw, 28vw"
          />
          <div className="pointer-events-none absolute left-2.5 top-2.5">
            <CategoryPill category={category} />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5">
          <h3
            className="line-clamp-2 text-sm font-bold leading-snug text-white transition-colors duration-150 group-hover:text-violet-100"
            title={title}
          >
            {title}
          </h3>
          {descriptionText ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
              {descriptionText}
            </p>
          ) : null}
          <div className="mt-auto flex min-w-0 items-end justify-between gap-2 pt-1.5">
            {creator ? (
              <span className="min-w-0 truncate text-[11px] text-zinc-500" title={creator}>
                {creator}
              </span>
            ) : (
              <span className="min-w-0" />
            )}
            {meta ? (
              <span className="shrink-0 text-[11px] text-zinc-500">{meta}</span>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  );
}
