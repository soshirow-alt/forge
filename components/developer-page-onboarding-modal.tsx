"use client";

type DeveloperPageOnboardingModalProps = {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export function DeveloperPageOnboardingModal({
  open,
  onAccept,
  onDecline,
}: DeveloperPageOnboardingModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="developer-onboarding-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
          Studio
        </p>
        <h2
          id="developer-onboarding-title"
          className="mt-2 text-xl font-bold tracking-tight text-white"
        >
          開発者ページを作成しますか？
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          はいを選ぶと Studio が使えるようになり、フォロワー向けのマイコミュニティも自動で開設されます。
          作品の投稿はあとからでも大丈夫です。
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDecline}
            className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
          >
            いいえ
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            はい、作成する
          </button>
        </div>
      </div>
    </div>
  );
}
