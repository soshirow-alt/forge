import {
  DISCOVERY_CARD_FEEDBACK_STAT_LABEL,
  DISCOVERY_CARD_PLAY_STAT_LABEL,
  DISCOVERY_CARD_WATCH_STAT_LABEL,
} from "@/lib/watch-ui-labels";
import { PublicStatText } from "@/components/public-stat-text";
import { Gamepad2, MessageSquare, Users } from "lucide-react";

/**
 * Unified discovery card metrics — order: プレイヤー → フィードバック → フォロー.
 * Play uses distinct registered players (project_plays). null = hide (not loaded / unavailable).
 */
export function DiscoveryCardStatPills({
  playCount = null,
  feedbackCount,
  watchCount,
  compact = false,
  loaded = true,
}: {
  /** Distinct players; null hides the metric (never fake). */
  playCount?: number | null;
  feedbackCount: number | null;
  watchCount: number | null;
  compact?: boolean;
  loaded?: boolean;
}) {
  const showPlay = loaded && playCount != null && Number.isFinite(playCount);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-400">
        {showPlay ? (
          <span className="inline-flex items-center gap-1">
            <Gamepad2 className="size-3.5 text-violet-400" aria-hidden="true" />
            <span className="text-xs text-zinc-400">
              {DISCOVERY_CARD_PLAY_STAT_LABEL} {Number(playCount).toLocaleString()}人
            </span>
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="size-3.5 text-violet-400" aria-hidden="true" />
          <PublicStatText
            loaded={loaded}
            value={feedbackCount}
            label={DISCOVERY_CARD_FEEDBACK_STAT_LABEL}
            className="text-xs text-zinc-400"
            compact
          />
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5 text-violet-400" aria-hidden="true" />
          <PublicStatText
            loaded={loaded}
            value={watchCount}
            label={DISCOVERY_CARD_WATCH_STAT_LABEL}
            className="text-xs text-zinc-400"
            compact
          />
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
      {showPlay ? (
        <span className="inline-flex items-center gap-1.5">
          <Gamepad2 className="size-4 text-violet-400" aria-hidden="true" />
          <span className="text-sm text-zinc-400">
            {DISCOVERY_CARD_PLAY_STAT_LABEL} {Number(playCount).toLocaleString()}人
          </span>
        </span>
      ) : !loaded ? (
        <span className="inline-flex items-center gap-1.5">
          <Gamepad2 className="size-4 text-violet-400" aria-hidden="true" />
          <span className="inline-block h-4 w-16 animate-pulse rounded bg-zinc-800/80" />
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1.5">
        <MessageSquare className="size-4 text-violet-400" aria-hidden="true" />
        <PublicStatText
          loaded={loaded}
          value={feedbackCount}
          label={DISCOVERY_CARD_FEEDBACK_STAT_LABEL}
          className="text-sm text-zinc-400"
        />
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users className="size-4 text-violet-400" aria-hidden="true" />
        <PublicStatText
          loaded={loaded}
          value={watchCount}
          label={DISCOVERY_CARD_WATCH_STAT_LABEL}
          className="text-sm text-zinc-400"
        />
      </span>
    </div>
  );
}
