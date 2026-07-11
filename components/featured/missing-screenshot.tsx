"use client";

import { ImageOff } from "lucide-react";

/**
 * Placeholder shown in an additional-image slot when the game
 * has fewer than 2 registered screenshots. Not interactive.
 * DOM/size parity with v0 MissingScreenshot (aspect-video w-40 = 160×90).
 */
export function MissingScreenshot() {
  return (
    <div
      aria-hidden="true"
      className="flex aspect-video w-40 flex-col items-center justify-center gap-1 rounded-md border border-zinc-800 bg-black text-zinc-500"
    >
      <ImageOff className="size-4" />
      <span className="text-[10px] leading-none">追加画像未登録</span>
    </div>
  );
}

/** Same 160×90 footprint while extra thumbs are fetching. */
export function LoadingScreenshotSlot() {
  return (
    <div
      aria-hidden="true"
      className="aspect-video w-40 animate-pulse rounded-md border border-zinc-800/80 bg-zinc-900/80"
    />
  );
}
