"use client";

import Link from "next/link";
import { FileText, Link2, MessageCircle, MessageSquare, Pencil } from "lucide-react";
import {
  PROJECT_STUDIO_FEEDBACK_SECTION_ID,
  projectStudioPath,
} from "@/lib/project-nurture-links";

const toolButtonClassName =
  "inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-50";

type StudioProjectToolbarProps = {
  projectId: string;
  onEditProject: () => void;
  onEditDistribution: () => void;
};

export function StudioProjectToolbar({
  projectId,
  onEditProject,
  onEditDistribution,
}: StudioProjectToolbarProps) {
  return (
    <nav
      aria-label="作品の操作"
      className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 sm:p-4"
    >
      <Link href={`/projects/${projectId}/devlog/new`} className={toolButtonClassName}>
        <FileText className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
        開発ログを書く
      </Link>
      <Link
        href={`${projectStudioPath(projectId)}#${PROJECT_STUDIO_FEEDBACK_SECTION_ID}`}
        className={toolButtonClassName}
      >
        <MessageSquare className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
        届いたFBを読む
      </Link>
      <Link
        href={`/projects/${projectId}/devlog/new#version-prompts`}
        className={toolButtonClassName}
      >
        <MessageCircle className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
        プレイヤーへの問い
      </Link>
      <button type="button" onClick={onEditProject} className={toolButtonClassName}>
        <Pencil className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
        作品情報を編集
      </button>
      <button type="button" onClick={onEditDistribution} className={toolButtonClassName}>
        <Link2 className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
        配布・リンク
      </button>
    </nav>
  );
}
