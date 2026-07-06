import {
  DISCOVERY_CARD_FEEDBACK_STAT_LABEL,
  DISCOVERY_CARD_WATCH_STAT_LABEL,
} from "@/lib/watch-ui-labels";
import { MessageSquare, Users } from "lucide-react";

export function DiscoveryCardStatPills({
  feedbackCount,
  watchCount,
  compact = false,
}: {
  feedbackCount: number;
  watchCount: number;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="size-3.5 text-violet-400" aria-hidden="true" />
          {DISCOVERY_CARD_FEEDBACK_STAT_LABEL} {feedbackCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5 text-violet-400" aria-hidden="true" />
          {DISCOVERY_CARD_WATCH_STAT_LABEL} {watchCount}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
      <span className="inline-flex items-center gap-1.5">
        <MessageSquare className="size-4 text-violet-400" aria-hidden="true" />
        {DISCOVERY_CARD_FEEDBACK_STAT_LABEL} {feedbackCount}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users className="size-4 text-violet-400" aria-hidden="true" />
        {DISCOVERY_CARD_WATCH_STAT_LABEL} {watchCount}
      </span>
    </div>
  );
}
