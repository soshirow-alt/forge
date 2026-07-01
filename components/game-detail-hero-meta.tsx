"use client";

import { Clock, Monitor } from "lucide-react";
import type { GameDetailPlayerMeta } from "@/lib/game-detail-player-meta";

export function GameDetailHeroMeta({ meta }: { meta: GameDetailPlayerMeta }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-200">
          {meta.phaseLabel}
        </span>
        {meta.estimatedPlayTime ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <Clock className="size-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
            想定 {meta.estimatedPlayTime}
          </span>
        ) : null}
      </div>
      {meta.environmentLabels.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Monitor className="size-3.5 shrink-0 text-zinc-600" aria-hidden="true" />
          {meta.environmentLabels.map((label) => (
            <span
              key={label}
              className="rounded-md border border-zinc-700/70 bg-zinc-800/50 px-2 py-0.5 text-[11px] text-zinc-400"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
