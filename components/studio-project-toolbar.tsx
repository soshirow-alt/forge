"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, FileText, Link2, MessageSquare, Pencil } from "lucide-react";
import { InputHintBadge } from "@/components/input-hint-badge";
import { ProjectShareLinkModal } from "@/components/project-share-link-modal";
import {
  PROJECT_STUDIO_FEEDBACK_SECTION_ID,
  projectStudioPath,
} from "@/lib/project-nurture-links";

const nurturePrimaryButtonClassName =
  "inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-sm shadow-orange-500/20 transition-opacity hover:opacity-90";

const nurtureSecondaryButtonClassName =
  "inline-flex items-center gap-2 rounded-lg border border-orange-500/35 bg-orange-500/10 px-4 py-2.5 text-sm font-medium text-orange-100 transition-colors hover:border-orange-500/50 hover:bg-orange-500/15";

const nurtureShareButtonClassName =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-orange-500/25 bg-orange-500/5 px-3 py-2 text-sm font-medium text-orange-200/90 transition-colors hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-100";

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
  const [shareModalOpen, setShareModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-4">
        <section aria-label="作品の設定">
          <p className="mb-2 text-xs font-medium tracking-wide text-zinc-600">作品の設定</p>
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

        <section aria-label="育成の操作">
          <p className="mb-2 text-sm font-semibold text-orange-200/90">育成</p>
          <div className="rounded-xl border border-orange-500/25 bg-gradient-to-b from-orange-500/[0.08] to-zinc-950/50 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-zinc-400">
                  届いたFBをもとに直し、記録して新verを届ける — Studio の主な作業はここです。
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onOpenNewVersionDevlog}
                    className={nurturePrimaryButtonClassName}
                  >
                    <FileText className="size-4 shrink-0" aria-hidden="true" />
                    新verの開発ログ
                  </button>
                  <Link
                    href={`${projectStudioPath(projectId)}#${PROJECT_STUDIO_FEEDBACK_SECTION_ID}`}
                    className={nurtureSecondaryButtonClassName}
                  >
                    <MessageSquare className="size-4 shrink-0 text-orange-300/90" aria-hidden="true" />
                    届いたFBを読む
                  </Link>
                </div>
              </div>
              <div className="flex shrink-0 items-start gap-0.5">
                <button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  className={nurtureShareButtonClassName}
                >
                  <Copy className="size-4 shrink-0" aria-hidden="true" />
                  リンクをコピー
                </button>
                <InputHintBadge label="?" ariaLabel="リンクをコピーについて">
                  作品ページのURLをコピーし、X・Discord・ブログなど Forge の外に貼り付けて、プレイヤーを呼び込めます。
                </InputHintBadge>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ProjectShareLinkModal
        projectId={projectId}
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </>
  );
}
