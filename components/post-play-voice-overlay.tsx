"use client";

import type { ReactNode } from "react";

type VoiceOverlayMode = "hidden" | "prompt" | "form";

type PostPlayVoiceOverlayProps = {
  mode: VoiceOverlayMode;
  firstPromptPreview?: string | null;
  onDismiss: () => void;
  onOpenForm: () => void;
  children: ReactNode;
};

export function PostPlayVoiceOverlay({
  mode,
  firstPromptPreview,
  onDismiss,
  onOpenForm,
  children,
}: PostPlayVoiceOverlayProps) {
  if (mode === "hidden") {
    return <div className="hidden">{children}</div>;
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="post-play-voice-title"
          className="pointer-events-auto w-full max-w-lg rounded-xl border border-orange-500/30 bg-zinc-950/95 shadow-2xl shadow-black/40 backdrop-blur-sm"
        >
          <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <div>
              <p
                id="post-play-voice-title"
                className="text-sm font-semibold text-orange-300"
              >
                プレイありがとう
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                開発者から質問があります
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-md px-2 py-1 text-lg leading-none text-zinc-500 transition-colors hover:text-zinc-300"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>

          {mode === "prompt" ? (
            <div className="px-4 py-4 sm:px-5 sm:py-5">
              {firstPromptPreview ? (
                <p className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-3 py-2 text-sm leading-relaxed text-zinc-200">
                  「{firstPromptPreview}」
                </p>
              ) : null}
              <p className="mt-3 text-xs text-zinc-500">
                1つ答えるだけでOK。答えたくなければ閉じて大丈夫です。
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onOpenForm}
                  className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
                >
                  声を届ける
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  あとで
                </button>
              </div>
            </div>
          ) : (
            <div className="max-h-[min(70vh,520px)] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              {children}
            </div>
          )}
        </div>
      </div>
      {mode === "form" ? null : <div className="hidden">{children}</div>}
    </>
  );
}

export type { VoiceOverlayMode };
