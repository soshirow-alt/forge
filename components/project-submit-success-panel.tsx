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

const primaryCtaClassName =
  "rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90";

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
  const editHref = `${projectStudioPath(gameId)}?edit=project`;
  const submitAnotherHref = studioSubmitModalHref();

  const shellClassName = compact
    ? "space-y-6 py-2 text-center"
    : "mt-12 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center";

  const bodyText =
    visibility === "private"
      ? "非公開で保存しました。公開するときは作品情報から切り替えられます。"
      : "作品ページが公開されました。外部に共有して、プレイヤーに遊んでもらいましょう。";

  return (
    <>
      <div className={shellClassName}>
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10">
            <svg
              className="h-7 w-7 text-orange-400"
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
              投稿しました！
            </h1>
          ) : null}
          <p className={`text-zinc-500 ${compact ? "mt-4 text-sm" : "mt-2"}`}>
            {bodyText}
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
          <Link
            href={gamePlayHref(gameId)}
            onClick={onClose}
            className={primaryCtaClassName}
          >
            作品ページを見る
          </Link>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className={secondaryCtaClassName}
          >
            外部に共有する
          </button>
          <Link
            href={editHref}
            onClick={onClose}
            className={tertiaryCtaClassName}
          >
            作品情報を編集する
          </Link>
          {onSubmitAnother ? (
            <button
              type="button"
              onClick={onSubmitAnother}
              className={tertiaryCtaClassName}
            >
              もう1本投稿する
            </button>
          ) : (
            <Link
              href={submitAnotherHref}
              onClick={onClose}
              className={tertiaryCtaClassName}
            >
              もう1本投稿する
            </Link>
          )}
        </div>
      </div>

      <ProjectShareLinkModal
        projectId={gameId}
        title={title}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
