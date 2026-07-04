"use client";

import Link from "next/link";
import { MessageSquareText, Play, ScrollText } from "lucide-react";
import { buildGameDetailTabHref } from "@/lib/game-detail-tabs";
import { formatPlayableVersionLabel } from "@/lib/playable-version";

type GameHubSummaryCardProps = {
  gameId: string;
  playableVersion?: string | null;
  focusNotes?: string | null;
  playLabel: string;
  onPlay: () => void;
  playDisabled?: boolean;
  onSendVoice: () => void;
  voiceLabel: string;
};

export function GameHubSummaryCard({
  gameId,
  playableVersion,
  focusNotes,
  playLabel,
  onPlay,
  playDisabled = false,
  onSendVoice,
  voiceLabel,
}: GameHubSummaryCardProps) {
  const versionLabel = playableVersion?.trim()
    ? formatPlayableVersionLabel(playableVersion)
    : null;
  const focus = focusNotes?.trim() || null;
  const devlogHref = buildGameDetailTabHref(gameId, "devlog");

  return (
    <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
      <h2 className="text-sm font-semibold text-white">この作品のハブ</h2>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
        遊ぶ場所はどこでも。最新版・声・更新はここにまとまります。
      </p>

      <dl className="mt-4 space-y-3 text-sm">
        {versionLabel ? (
          <div>
            <dt className="text-xs text-zinc-500">今遊んでほしい版</dt>
            <dd className="mt-0.5 font-medium text-violet-200">{versionLabel}</dd>
          </div>
        ) : null}

        {focus ? (
          <div>
            <dt className="text-xs text-zinc-500">いま見てほしいこと</dt>
            <dd className="mt-0.5 leading-relaxed text-zinc-300">{focus}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={onPlay}
          disabled={playDisabled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Play className="size-4" aria-hidden="true" />
          {playLabel}
        </button>
        <button
          type="button"
          onClick={onSendVoice}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:text-white"
        >
          <MessageSquareText className="size-4" aria-hidden="true" />
          {voiceLabel}
        </button>
        <Link
          href={devlogHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-violet-300"
        >
          <ScrollText className="size-4" aria-hidden="true" />
          更新の歩み（開発ログ）
        </Link>
      </div>
    </section>
  );
}
