"use client";

import type { GameFeedbackItem } from "@/lib/game-feedback-storage";
import {
  FEEDBACK_TONE_STYLES,
  formatFeedbackDate,
  getFeedbackDisplayFields,
  getReplayIntentDisplay,
} from "@/lib/feedback-display";

type FeedbackStructuredCardProps = {
  item: GameFeedbackItem;
  compact?: boolean;
  showDate?: boolean;
};

export function FeedbackStructuredCard({
  item,
  compact = false,
  showDate = true,
}: FeedbackStructuredCardProps) {
  const fields = getFeedbackDisplayFields(item);
  const replayLabel = getReplayIntentDisplay(item);

  if (fields.length === 0 && !replayLabel && !item.text?.trim()) {
    return (
      <p className="text-sm text-zinc-500">内容のないフィードバック</p>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-2.5"}>
      {(showDate || replayLabel) && (
        <div className="flex flex-wrap items-center gap-2">
          {showDate && (
            <time
              dateTime={item.createdAt}
              className="text-xs tabular-nums text-zinc-600"
            >
              {formatFeedbackDate(item.createdAt)}
            </time>
          )}
          {replayLabel && (
            <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-300/90">
              {replayLabel}
            </span>
          )}
        </div>
      )}

      {item.text?.trim() && fields.length === 0 && (
        <p className="text-sm leading-relaxed text-zinc-400">{item.text.trim()}</p>
      )}

      <dl className={compact ? "space-y-2" : "space-y-2.5"}>
        {fields.map((field) => {
          const styles = FEEDBACK_TONE_STYLES[field.tone];
          return (
            <div key={field.label}>
              <dt className={`text-[11px] font-medium ${styles.label}`}>
                {field.label}
              </dt>
              <dd
                className={`mt-0.5 text-sm leading-relaxed ${styles.value} ${
                  compact ? "line-clamp-3" : ""
                }`}
              >
                {field.value}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
