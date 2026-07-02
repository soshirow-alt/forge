"use client";

import type { GameDetailPlayerMeta } from "@/lib/game-detail-player-meta";

export function GameDetailPhaseBadge({
  meta,
  muted = false,
}: {
  meta: GameDetailPlayerMeta;
  muted?: boolean;
}) {
  return (
    <span
      className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
        muted
          ? "border-zinc-700/60 bg-zinc-900/50 text-zinc-500"
          : "border-orange-500/35 bg-orange-500/10 text-orange-200"
      }`}
    >
      {meta.phaseLabel}
    </span>
  );
}
