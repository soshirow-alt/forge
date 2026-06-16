"use client";

import type { AdoptionVerifyContextRow } from "@/lib/adoption-verify-context";

type PlayLaunchDialogProps = {
  open: boolean;
  onClose: () => void;
  onLaunch: () => void;
  launching?: boolean;
  adoptionContext?: AdoptionVerifyContextRow | null;
};

export function PlayLaunchDialog({
  open,
  onClose,
  onLaunch,
  launching = false,
  adoptionContext = null,
}: PlayLaunchDialogProps) {
  if (!open) {
    return null;
  }

  const hasAdoptionContext = Boolean(adoptionContext);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="play-launch-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-zinc-700/80 bg-zinc-900 px-6 py-6 shadow-2xl shadow-black/50"
      >
        <h2
          id="play-launch-dialog-title"
          className="text-lg font-semibold tracking-tight text-zinc-50"
        >
          {hasAdoptionContext
            ? `版 ${adoptionContext!.publishedVersion} をプレイ`
            : "ゲームを起動します"}
        </h2>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
          {hasAdoptionContext ? (
            <p>
              「
              <span className="text-zinc-200">{adoptionContext!.playerQuote}</span>
              」と答えた点について、「
              <span className="text-zinc-200">{adoptionContext!.updateSummary}</span>
              」が本当に変わっているか確かめましょう。
            </p>
          ) : (
            <>
              <p>
                ゲームを遊び終わったら、
                <span className="text-zinc-200">
                  このタブに戻って、開発者の質問に答えてください。
                </span>
              </p>
              <p>1つ答えるだけでOKです。</p>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={launching}
            className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-60"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onLaunch}
            disabled={launching}
            className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {launching ? "起動中..." : "ゲームを起動"}
          </button>
        </div>
      </div>
    </div>
  );
}
