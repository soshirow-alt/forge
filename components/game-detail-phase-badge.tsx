"use client";

import type { GameDetailPlayerMeta } from "@/lib/game-detail-player-meta";

function MetaBadge({
  label,
  emoji,
  tone,
}: {
  label: string;
  emoji?: string;
  tone: "completed" | "reopened" | "phase" | "play-access";
}) {
  const toneClass =
    tone === "completed"
      ? "border-amber-500/35 bg-amber-500/10 text-amber-200"
      : tone === "reopened"
        ? "border-sky-500/35 bg-sky-500/10 text-sky-200"
        : tone === "play-access"
          ? "border-zinc-600/60 bg-zinc-900/60 text-zinc-300"
          : "border-violet-500/35 bg-violet-500/10 text-violet-200";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}
    >
      {emoji ? <span aria-hidden="true">{emoji}</span> : null}
      {label}
    </span>
  );
}

export function GameDetailPhaseBadge({
  meta,
  muted = false,
}: {
  meta: GameDetailPlayerMeta;
  muted?: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {meta.releaseBadgeLabel ? (
        <MetaBadge
          label={meta.releaseBadgeLabel}
          emoji={meta.releaseBadgeEmoji}
          tone={meta.releaseBadgeTone ?? "completed"}
        />
      ) : null}
      {meta.playAccessBadgeLabel ? (
        <MetaBadge label={meta.playAccessBadgeLabel} tone="play-access" />
      ) : null}
      {meta.phaseLabel ? (
        <span
          className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
            muted || meta.releaseBadgeLabel
              ? "border-zinc-700/60 bg-zinc-900/50 text-zinc-500"
              : "border-violet-500/35 bg-violet-500/10 text-violet-200"
          }`}
        >
          {meta.phaseLabel}
        </span>
      ) : null}
    </span>
  );
}
