"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { ProjectShareLinkModal } from "@/components/project-share-link-modal";
import { getClientProjectPageUrl } from "@/lib/project-share";
import { studioOverviewEditHref } from "@/lib/studio-edit-url";
import { isGamePublic } from "@/lib/project-visibility";
import type { ProjectVisibility } from "@/lib/project-visibility";

type GameDetailOwnerWorksCardProps = {
  projectId: string;
  title: string;
  visibility?: ProjectVisibility;
  studioHref: string;
};

const actionButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-900";

const primaryActionButtonClassName =
  "inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500";

export function GameDetailOwnerWorksCard({
  projectId,
  title,
  visibility,
  studioHref,
}: GameDetailOwnerWorksCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const isPublic = isGamePublic({ visibility: visibility ?? "public" });
  const visibilityEditHref = studioOverviewEditHref(projectId, "visibility");

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getClientProjectPageUrl(projectId));
      setUrlCopied(true);
      window.setTimeout(() => setUrlCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [projectId]);

  return (
    <>
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold text-white">これはあなたの作品です</h2>

        {isPublic ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              この公開ページをプレイヤーに共有できます。編集や更新はStudioから行えます。
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className={primaryActionButtonClassName}
              >
                外部に共有する
              </button>
              <button
                type="button"
                onClick={() => void handleCopyUrl()}
                className={actionButtonClassName}
              >
                {urlCopied ? (
                  <>
                    <Check className="size-4" aria-hidden="true" />
                    URLをコピーしました
                  </>
                ) : (
                  <>
                    <Copy className="size-4" aria-hidden="true" />
                    URLをコピー
                  </>
                )}
              </button>
              <Link href={studioHref} className={actionButtonClassName}>
                Studioで作品を編集する
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              非公開中です。公開設定にすると、この公開ページをプレイヤーに共有できます。
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              <Link
                href={visibilityEditHref}
                className="text-violet-400 underline-offset-2 hover:text-violet-300 hover:underline"
              >
                公開設定を変更
              </Link>
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link href={studioHref} className={actionButtonClassName}>
                Studioで作品を編集する
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
