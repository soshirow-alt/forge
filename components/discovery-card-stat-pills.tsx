import {
  DISCOVERY_CARD_FEEDBACK_STAT_LABEL,
  DISCOVERY_CARD_WATCH_STAT_LABEL,
} from "@/lib/watch-ui-labels";
import { PublicStatText } from "@/components/public-stat-text";
import { MessageSquare, Users } from "lucide-react";

export function DiscoveryCardStatPills({
  feedbackCount,
  watchCount,
  compact = false,
  loaded = true,
}: {
  feedbackCount: number | null;
  watchCount: number | null;
  compact?: boolean;
  loaded?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-400">
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
