/**
 * Whole-Home FB hero presentation tokens from 9a1ff25.
 * Restore visual geometry only — do not invent new ratios or widths.
 */

export const HOME_HERO_QUEUE_GAP_PX = 12;
export const HOME_HERO_QUEUE_MIN_ROW_PX = 88;
export const HOME_HERO_RAIL_SLOTS = 3;
export const HOME_HERO_ROTATE_MS = 6000;

export const HOME_HERO_MIN_HEIGHT_CLASS = "min-h-[22rem]";
export const HOME_HERO_GRID_CLASS =
  "grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch";

export const HOME_HERO_CARD_CHROME_CLASS =
  "group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-violet-500/40";

export const HOME_HERO_THUMB_FLEX_CLASS =
  "relative block min-h-0 flex-[1.35] overflow-hidden";

export const HOME_HERO_THUMB_IMG_CLASS =
  "!h-full !w-full !max-w-none !rounded-none object-cover transition-transform duration-500 group-hover:scale-[1.02]";

export const HOME_HERO_QUEUE_CARD_CLASS =
  "group flex h-full min-h-0 w-full gap-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-left transition-colors hover:border-violet-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500/70";

export const HOME_HERO_QUEUE_THUMB_BOX_CLASS =
  "relative aspect-[4/3] h-full max-h-full w-28 shrink-0 overflow-hidden rounded-lg sm:w-32";

export const HOME_HERO_QUEUE_THUMB_IMG_CLASS =
  "!h-full !w-full !max-w-none rounded-lg object-cover transition-transform duration-500 group-hover:scale-[1.04]";

export const HOME_HERO_PLACEHOLDER_CHROME_CLASS =
  "flex h-full min-h-0 w-full gap-3 overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-3 text-left";

export const HOME_HERO_PLACEHOLDER_THUMB_BOX_CLASS =
  "relative aspect-[4/3] h-full max-h-full w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-900/70 sm:w-32";

export function resolveHomeHeroQueueRowHeight(
  railHeight: number | null | undefined,
  slotCount = HOME_HERO_RAIL_SLOTS,
  gapPx = HOME_HERO_QUEUE_GAP_PX,
): number | null {
  if (railHeight == null || !Number.isFinite(railHeight) || slotCount <= 0) {
    return null;
  }
  return Math.max(
    HOME_HERO_QUEUE_MIN_ROW_PX,
    (railHeight - gapPx * (slotCount - 1)) / slotCount,
  );
}
