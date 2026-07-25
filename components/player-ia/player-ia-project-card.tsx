"use client";

import Link from "next/link";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import {
  PROJECT_CATEGORY_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";

export type PlayerIaProjectCardProps = {
  projectId: string;
  title: string;
  category: ProjectCategoryId;
  meta?: string;
  creator?: string;
};

export function PlayerIaProjectCard({
  projectId,
  title,
  category,
  meta,
  creator,
}: PlayerIaProjectCardProps) {
  return (
    <Link
      href={gameDetailHref(projectId)}
      title={title}
      className="group block w-full min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      aria-label={`${title}の詳細`}
    >
      <article className="min-w-0">
        <ProjectThumbnail
          projectId={projectId}
          title={title}
          variant="card"
          className="transition-[filter] group-hover:brightness-110"
        />
        <div className="mt-2 flex min-w-0 items-center gap-2">
          <h3
            className="min-w-0 flex-1 truncate text-sm font-semibold text-white transition-colors group-hover:text-violet-200"
            title={title}
          >
            {title}
          </h3>
          <span className="shrink-0 rounded-md border border-zinc-700/80 bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            {PROJECT_CATEGORY_LABELS[category]}
          </span>
        </div>
        {meta ? (
          <p className="mt-0.5 truncate text-xs text-zinc-500">{meta}</p>
        ) : null}
        {creator ? (
          <p className="mt-0.5 truncate text-xs text-zinc-500">{creator}</p>
        ) : null}
      </article>
    </Link>
  );
}
