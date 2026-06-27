"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

type VoiceOverlayMode = "hidden" | "prompt" | "form";

type PostPlayVoiceOverlayProps = {
  mode: VoiceOverlayMode;
  firstPromptPreview?: string | null;
  onDismiss: () => void;
  onOpenForm: () => void;
  children: ReactNode;
};

function ModalBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      aria-label="閉じる"
      onClick={onClose}
    />
  );
}

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

  const widthClass = mode === "form" ? "max-w-2xl" : "max-w-lg";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <ModalBackdrop onClose={onDismiss} />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-play-voice-title"
          className={`relative flex max-h-[min(92vh,820px)] w-full ${widthClass} flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a] shadow-2xl shadow-black/50`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 px-5 py-4 sm:px-6">
            <div>
              <h2
                id="post-play-voice-title"
                className="text-lg font-semibold text-white"
              >
                プレイありがとう
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                開発者から質問があります
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
              aria-label="閉じる"
            >
              <X className="size-5" />
            </button>
          </div>

          {mode === "prompt" ? (
            <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              {firstPromptPreview ? (
                <p className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-3 text-sm leading-relaxed text-zinc-300">
                  「{firstPromptPreview}」
                </p>
              ) : null}
              <p className="text-xs text-zinc-500">
                1つ答えるだけでOK。答えたくなければ閉じて大丈夫です。
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={onOpenForm}
                  className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                  質問に答える
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="rounded-xl px-5 py-3 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  あとで
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
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
