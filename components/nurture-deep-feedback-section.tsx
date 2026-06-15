"use client";

import { useMemo, useState } from "react";
import { FeedbackStructuredCard } from "@/components/feedback-structured-card";
import { formatFeedbackDate } from "@/lib/feedback-display";
import { buildDeepFeedbackSummary } from "@/lib/feedback-voice-summary";
import { filterDeepFeedbackForVersion } from "@/lib/project-growth-state";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";

type NurtureDeepFeedbackSectionProps = {
  feedbackEntries: ProjectFeedbackEntry[];
  playableVersion: string;
  compact?: boolean;
};

export function NurtureDeepFeedbackSection({
  feedbackEntries,
  playableVersion,
  compact = false,
}: NurtureDeepFeedbackSectionProps) {
  const [showPastFeedback, setShowPastFeedback] = useState(false);
  const versionFeedback = useMemo(
    () => filterDeepFeedbackForVersion(feedbackEntries, playableVersion),
    [feedbackEntries, playableVersion],
  );
  const summary = useMemo(
    () => buildDeepFeedbackSummary(feedbackEntries, playableVersion),
    [feedbackEntries, playableVersion],
  );
  const latestFeedback = versionFeedback[0];
  const pastFeedback = versionFeedback.slice(1);

  return (
    <section
      aria-label="詳しい感想"
      className={`rounded-lg border border-zinc-800/40 bg-zinc-950/20 px-3.5 py-3 ${
        compact ? "" : "mt-4"
      }`}
    >
      <h3 className="text-xs font-medium text-zinc-500">{summary.title}</h3>
      <ul className="mt-2 space-y-1">
        {summary.lines.map((line) => (
          <li key={line} className="text-xs leading-relaxed text-zinc-600">
            · {line}
          </li>
        ))}
      </ul>

      {latestFeedback && (
        <div className="mt-3 border-t border-zinc-800/50 pt-3">
          <p className="text-[11px] text-zinc-600">
            最新 · {formatFeedbackDate(latestFeedback.item.createdAt)}
          </p>
          <div className="mt-2">
            <FeedbackStructuredCard
              item={latestFeedback.item}
              showDate={false}
            />
          </div>
          {pastFeedback.length > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowPastFeedback((value) => !value)}
                className="text-xs text-zinc-500 transition-colors hover:text-orange-400"
              >
                過去の詳しい感想 {pastFeedback.length}件
                {showPastFeedback ? " ▲" : " ▼"}
              </button>
              {showPastFeedback && (
                <div className="mt-3 space-y-3">
                  {pastFeedback.map(({ item }) => (
                    <div
                      key={item.id}
                      className="rounded-md border border-zinc-800/50 bg-zinc-950/30 p-3"
                    >
                      <p className="text-[11px] text-zinc-600">
                        {formatFeedbackDate(item.createdAt)}
                      </p>
                      <div className="mt-2">
                        <FeedbackStructuredCard item={item} showDate={false} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
