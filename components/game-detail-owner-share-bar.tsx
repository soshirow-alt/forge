"use client";

import Link from "next/link";
import { useState } from "react";
import { ProjectShareLinkModal } from "@/components/project-share-link-modal";
import { studioOverviewEditHref } from "@/lib/studio-edit-url";
import { isGamePublic } from "@/lib/project-visibility";
import type { ProjectVisibility } from "@/lib/project-visibility";

type GameDetailOwnerShareBarProps = {
  projectId: string;
  title: string;
  visibility?: ProjectVisibility;
  studioHref: string;
};

const actionButtonClassName =
  "inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/80 px-3.5 py-2 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-600 hover:text-white";

const primaryActionButtonClassName =
  "inline-flex items-center justify-center rounded-lg bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500";

export function GameDetailOwnerShareBar({
  projectId,
  title,
  visibility,
  studioHref,
}: GameDetailOwnerShareBarProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const isPublic = isGamePublic({ visibility: visibility ?? "public" });
  const visibilityEditHref = studioOverviewEditHref(projectId, "visibility");

  return (
    <>
      <section
        className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 sm:px-5 sm:py-3.5"
        aria-label="共有"
      >
        {isPublic ? (
          <>
            <p className="text-sm font-medium text-zinc-200">このページを共有できます</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              公開ページのURLをコピーして、プレイヤーに共有できます。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className={primaryActionButtonClassName}
              >
                外部に共有する
              </button>
              <Link href={studioHref} className={actionButtonClassName}>
                作品を編集する
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-zinc-200">非公開中です</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              共有するには公開設定にしてください。{" "}
              <Link
                href={visibilityEditHref}
                className="text-violet-400 underline-offset-2 hover:text-violet-300 hover:underline"
              >
                公開設定を変更
              </Link>
            </p>
            <div className="mt-3">
              <Link href={studioHref} className={actionButtonClassName}>
                作品を編集する
              </Link>
            </div>
          </>
        )}
      </section>

      {isPublic ? (
        <ProjectShareLinkModal
          projectId={projectId}
          title={title}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </>
  );
}
