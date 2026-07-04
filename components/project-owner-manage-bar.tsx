"use client";

import Link from "next/link";
import { useState } from "react";
import { ProjectShareLinkModal } from "@/components/project-share-link-modal";
import type { ProjectVisibility } from "@/lib/project-visibility";

type ProjectOwnerManageBarProps = {
  projectId: string;
  title: string;
  visibility?: ProjectVisibility;
  studioHref: string;
};

const actionClassName =
  "rounded-md border border-zinc-700/80 bg-zinc-950/40 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-100";

export function ProjectOwnerManageBar({
  projectId,
  title,
  visibility,
  studioHref,
}: ProjectOwnerManageBarProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const statusLabel = visibility === "private" ? "非公開" : "公開中";
  const editHref = `${studioHref}?edit=project`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2 text-xs">
        <span className="shrink-0 font-medium text-zinc-400">{statusLabel}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className={actionClassName}
          >
            外部に共有する
          </button>
          <Link href={editHref} className={actionClassName}>
            作品情報を編集する
          </Link>
          <Link href={studioHref} className={actionClassName}>
            Studioで見る
          </Link>
        </div>
      </div>

      <ProjectShareLinkModal
        projectId={projectId}
        title={title}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
