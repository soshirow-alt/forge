"use client";

import Link from "next/link";
import {
  projectStudioDevlogHref,
  projectStudioPath,
} from "@/lib/project-nurture-links";
import type { ProjectVisibility } from "@/lib/project-visibility";

type ProjectSubmitSuccessPanelProps = {
  gameId: string;
  visibility: ProjectVisibility;
  compact?: boolean;
  onSubmitAnother?: () => void;
  onClose?: () => void;
};

export function ProjectSubmitSuccessPanel({
  gameId,
  visibility,
  compact = false,
  onSubmitAnother,
  onClose,
}: ProjectSubmitSuccessPanelProps) {
  return (
    <div className={compact ? "space-y-6 py-2" : "mt-12 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center"}>
      <div className={compact ? "text-center" : undefined}>
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
            投稿が完了しました
          </h1>
        ) : null}
        <p className={`text-zinc-500 ${compact ? "mt-4 text-sm" : "mt-2"}`}>
          {visibility === "private"
            ? "非公開として保存しました。公開するには Studio の作品情報から「公開」に切り替えてください。"
            : "作品一覧の「新着作品」に表示されます"}
        </p>
      </div>

      <div className="mx-auto max-w-lg text-left">
        <p className="text-sm font-medium text-zinc-300">次にやること</p>
        <p className="mt-1 text-xs text-zinc-600">
          投稿 → 発見 → プレイ → 回答の流れに沿って進められます。
        </p>
        <ul className="mt-4 space-y-3">
          {visibility === "public" ? (
            <li>
              <Link
                href={`/?highlight=${gameId}#discover`}
                className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
                onClick={onClose}
              >
                新着作品で表示を確認
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ) : null}
          <li>
            <Link
              href={projectStudioPath(gameId)}
              className="flex w-full items-center justify-between rounded-lg border border-violet-500/40 bg-violet-500/10 px-5 py-3.5 text-sm font-semibold text-violet-100 transition-colors hover:border-violet-400/50 hover:bg-violet-500/15"
              onClick={onClose}
            >
              作品育成ページを開く
              <span aria-hidden="true">→</span>
            </Link>
          </li>
          <li>
            <Link
              href={projectStudioDevlogHref(gameId)}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-violet-500/40 hover:text-violet-200"
              onClick={onClose}
            >
              新verの開発ログ
              <span aria-hidden="true">→</span>
            </Link>
          </li>
          <li>
            <Link
              href={`/games/${gameId}`}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
              onClick={onClose}
            >
              プレイURLを確認する
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        {onSubmitAnother ? (
          <button
            type="button"
            onClick={onSubmitAnother}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
          >
            もう1件投稿する
          </button>
        ) : null}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-orange-500/50 hover:text-orange-400"
          >
            閉じる
          </button>
        ) : null}
      </div>
    </div>
  );
}
