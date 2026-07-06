"use client";

import Link from "next/link";
import { useState } from "react";
import { ProjectShareLinkModal } from "@/components/project-share-link-modal";
import {
  gamePlayHref,
  projectStudioPath,
  studioSubmitModalHref,
} from "@/lib/project-nurture-links";
import type { ProjectVisibility } from "@/lib/project-visibility";

type ProjectSubmitSuccessPanelProps = {
  gameId: string;
  title?: string;
  visibility: ProjectVisibility;
  compact?: boolean;
  onSubmitAnother?: () => void;
  onClose?: () => void;
};

const playerPageCtaLabel = "Player表示で作品ページを見る";

const primaryCtaClassName =
  "rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500";

const primaryDisabledClassName =
  "cursor-not-allowed rounded-xl border border-zinc-800 bg-zinc-950/50 px-6 py-3.5 text-sm font-semibold text-zinc-600";

const secondaryCtaClassName =
  "rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-600 hover:text-white";

const tertiaryCtaClassName =
  "rounded-xl border border-zinc-800 bg-transparent px-6 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200";

export function ProjectSubmitSuccessPanel({
  gameId,
  title,
  visibility,
  compact = false,
  onSubmitAnother,
  onClose,
}: ProjectSubmitSuccessPanelProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const isPublic = visibility !== "private";
  const displayTitle = title?.trim() || "作品";
  const studioHref = projectStudioPath(gameId);
  const submitAnotherHref = studioSubmitModalHref();
  const successHeading = `『${displayTitle}』を投稿しました`;

  const shellClassName = compact
    ? "space-y-6 py-2 text-center"
    : "mt-12 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-6 py-16 text-center";

  const bodyText = isPublic
    ? "Player表示の作品ページが公開されました。外部に共有して、プレイヤーに遊んでもらいましょう。"
    : "非公開で保存しました。公開すると、Player表示の作品ページを共有できます。公開設定は編集画面から変更できます。";

  return (
    <>
      <div className={shellClassName}>
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-violet-500/30 bg-violet-600/10">
            <svg
              className="h-7 w-7 text-violet-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          {!compact ? (
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-100">
              {successHeading}
            </h1>
          ) : (
            <p className="mt-4 text-base font-semibold text-zinc-100">{successHeading}</p>
          )}
          <p className={`text-zinc-500 ${compact ? "mt-2 text-sm" : "mt-2"}`}>
            {bodyText}
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
          {isPublic ? (
            <Link
              href={gamePlayHref(gameId)}
              onClick={onClose}
              className={primaryCtaClassName}
            >
              {playerPageCtaLabel}
            </Link>
          ) : (
            <button type="button" disabled className={primaryDisabledClassName}>
              {playerPageCtaLabel}
            </button>
          )}
          {isPublic ? (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className={secondaryCtaClassName}
            >
              外部に共有する
            </button>
          ) : null}
          <Link
            href={studioHref}
            onClick={onClose}
            className={tertiaryCtaClassName}
          >
            投稿した作品を編集する
          </Link>
          {onSubmitAnother ? (
            <button
              type="button"
              onClick={onSubmitAnother}
              className={tertiaryCtaClassName}
            >
              続けて投稿する
            </button>
          ) : (
            <Link
              href={submitAnotherHref}
              onClick={onClose}
              className={tertiaryCtaClassName}
            >
              続けて投稿する
            </Link>
          )}
        </div>
      </div>

      {isPublic ? (
        <ProjectShareLinkModal
          projectId={gameId}
          title={title}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </>
  );
}
