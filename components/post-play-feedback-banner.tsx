"use client";

type PostPlayFeedbackBannerProps = {
  firstPromptPreview?: string | null;
  onWriteFeedback: () => void;
};

export function PostPlayFeedbackBanner({
  firstPromptPreview,
  onWriteFeedback,
}: PostPlayFeedbackBannerProps) {
  return (
    <div className="mt-4 rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-zinc-950/40 to-zinc-950/40 px-4 py-4 sm:px-5">
      <p className="text-sm font-semibold text-orange-300">プレイありがとう</p>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
        開発者からの質問に、短く返事を届けてください。
      </p>
      {firstPromptPreview ? (
        <p className="mt-3 rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-2 text-sm leading-relaxed text-zinc-200">
          「{firstPromptPreview}」
        </p>
      ) : null}
      <button
        type="button"
        onClick={onWriteFeedback}
        className="mt-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
      >
        返事を届ける
      </button>
      <p className="mt-2 text-xs text-zinc-500">1つ答えるだけでOK</p>
    </div>
  );
}
