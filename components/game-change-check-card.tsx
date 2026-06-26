"use client";

import {
  formatChangeCheckConfirmedBody,
  type ChangeCheckPreviewState,
} from "@/lib/change-check-preview-mock";

export const CHANGE_CHECK_SECTION_ID = "change-check-card";

type GameChangeCheckCardProps = {
  state: ChangeCheckPreviewState;
  currentVersion: string;
  onViewUpdate: () => void;
  onTryVersion: () => void;
};

export function GameChangeCheckCard({
  state,
  currentVersion,
  onViewUpdate,
  onTryVersion,
}: GameChangeCheckCardProps) {
  if (state.kind === "confirmed") {
    const { changeLine, askLine } = formatChangeCheckConfirmedBody(
      state.confirmation,
    );

    return (
      <section
        id={CHANGE_CHECK_SECTION_ID}
        className="scroll-mt-24 rounded-xl border border-orange-500/25 border-l-[3px] border-l-orange-500/70 bg-orange-500/[0.06] px-4 py-3.5 sm:px-5"
        aria-label="前回からの変化"
      >
        <p className="text-xs font-medium text-orange-300/90">前回からの変化</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-200">
          {changeLine}
          {changeLine && !changeLine.endsWith("。") ? "。" : ""}
        </p>
        {askLine && (
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{askLine}</p>
        )}
        <p className="mt-2 text-xs text-zinc-600">
          前回プレイ: {state.priorPlayedVersion} → 現行 {currentVersion}
        </p>
        <div className="mt-3">
          <button
            type="button"
            onClick={onTryVersion}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
          >
            変化を確認する
          </button>
        </div>
      </section>
    );
  }

  const updateLabel =
    state.updateKind === "version"
      ? `新しいプレイ可能ver ${currentVersion} が公開されています。`
      : "新しい開発ログが公開されています。";

  return (
    <section
      id={CHANGE_CHECK_SECTION_ID}
      className="scroll-mt-24 rounded-xl border border-zinc-800 border-l-[3px] border-l-emerald-500/50 bg-zinc-900/50 px-4 py-3.5 sm:px-5"
      aria-label="前回からの更新"
    >
      <p className="text-sm leading-relaxed text-zinc-300">
        前回遊んだverから更新があります。
      </p>
      <p className="mt-1 text-sm text-zinc-500">{updateLabel}</p>
      <p className="mt-2 text-xs text-zinc-600">
        前回プレイ: {state.priorPlayedVersion} → 現行 {currentVersion}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onViewUpdate}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
        >
          更新内容を見る
        </button>
        <button
          type="button"
          onClick={onTryVersion}
          className="inline-flex items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition-colors hover:bg-violet-500/15"
        >
          このverを試す
        </button>
      </div>
    </section>
  );
}
