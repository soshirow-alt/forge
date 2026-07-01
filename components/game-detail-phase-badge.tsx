"use client";

import type { GameDetailPlayerMeta } from "@/lib/game-detail-player-meta";

export function GameDetailPhaseBadge({ meta }: { meta: GameDetailPlayerMeta }) {
  return (
    <span className="rounded-md border border-orange-500/35 bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-200">
      {meta.phaseLabel}
    </span>
  );
}
