"use client";

import Link from "next/link";
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
  const shellClassName = compact
    ? "space-y-6 py-2 text-center"
    : "mt-12 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center";

  return (
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
            投稿が完了しました
          </h1>
        ) : null}
        <p className={`text-zinc-500 ${compact ? "mt-4 text-sm" : "mt-2"}`}>
          {visibility === "private"
            ? "非公開で保存しました。公開するときは作品情報から切り替えられます。"
            : "公開しました。作品ページから表示を確認できます。"}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <Link
          href={`/games/${gameId}`}
          onClick={onClose}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          作品ページを見る
        </Link>
        {onSubmitAnother ? (
          <button
            type="button"
            onClick={onSubmitAnother}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-600 hover:text-white"
          >
            もう1件投稿する
          </button>
        ) : null}
        <Link
          href="/studio"
          onClick={onClose}
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-violet-100"
        >
          Studioホームへ
        </Link>
      </div>
    </div>
  );
}
