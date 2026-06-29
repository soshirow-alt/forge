"use client";

import Link from "next/link";
import { FileText, Link2, MessageSquare, Pencil } from "lucide-react";
import {
  PROJECT_STUDIO_FEEDBACK_SECTION_ID,
  projectStudioPath,
} from "@/lib/project-nurture-links";

const nurtureButtonClassName =
  "inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-50";

const settingsButtonClassName =
  "inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80 hover:text-zinc-200";

type StudioProjectToolbarProps = {
  projectId: string;
  onOpenNewVersionDevlog: () => void;
  onEditProject: () => void;
  onEditDistribution: () => void;
};

export function StudioProjectToolbar({
  projectId,
  onOpenNewVersionDevlog,
  onEditProject,
  onEditDistribution,
}: StudioProjectToolbarProps) {
  return (
    <div className="space-y-4">
      <section aria-label="育成の操作">
        <p className="mb-2 text-xs font-medium tracking-wide text-zinc-500">育成</p>
        <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 sm:p-4">
          <button type="button" onClick={onOpenNewVersionDevlog} className={nurtureButtonClassName}>
            <FileText className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
            新verの開発ログ
          </button>
          <Link
            href={`${projectStudioPath(projectId)}#${PROJECT_STUDIO_FEEDBACK_SECTION_ID}`}
            className={nurtureButtonClassName}
          >
            <MessageSquare className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
            届いたFBを読む
          </Link>
        </div>
      </section>

      <section aria-label="作品の設定">
        <p className="mb-2 text-xs font-medium tracking-wide text-zinc-500">作品の設定</p>
        <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-zinc-800/90 bg-zinc-950/20 p-3 sm:p-4">
          <button type="button" onClick={onEditProject} className={settingsButtonClassName}>
            <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            作品情報を編集
          </button>
          <button type="button" onClick={onEditDistribution} className={settingsButtonClassName}>
            <Link2 className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            配布・リンク
          </button>
        </div>
      </section>
    </div>
  );
}
