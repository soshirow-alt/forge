"use client";

type PostPlayFeedbackBannerProps = {
  onWriteFeedback: () => void;
};

export function PostPlayFeedbackBanner({
  onWriteFeedback,
}: PostPlayFeedbackBannerProps) {
  return (
    <div className="mt-4 rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-zinc-950/40 to-zinc-950/40 px-4 py-4 sm:px-5">
      <p className="text-sm font-semibold text-orange-300">プレイありがとう</p>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
        プレイ後、このタブに戻って開発者の問いに返事を届けてください。
      </p>
      <button
        type="button"
        onClick={onWriteFeedback}
        className="mt-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
      >
        返事を届ける
      </button>
    </div>
  );
}
