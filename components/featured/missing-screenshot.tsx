"use client";

import { ImageOff } from "lucide-react";

/**
 * Placeholder shown in an additional-image slot when the game
 * has fewer than 2 registered screenshots. Not interactive.
 * DOM/size parity with v0 MissingScreenshot (aspect-video w-40 = 160×90).
 * compact: fill parent grid cell (Player IA featured density).
 */
export function MissingScreenshot({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`flex aspect-video flex-col items-center justify-center gap-1 rounded-md border border-zinc-800 bg-black text-zinc-500 ${
        compact ? "min-w-0 w-full" : "w-40"
      }`}
    >
      <ImageOff className="size-4" />
      <span className="text-[10px] leading-none">追加画像未登録</span>
    </div>
  );
}

/** Same footprint while extra thumbs are fetching. */
export function LoadingScreenshotSlot({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`aspect-video animate-pulse rounded-md border border-zinc-800/80 bg-zinc-900/80 ${
        compact ? "min-w-0 w-full" : "w-40"
      }`}
    />
  );
}
