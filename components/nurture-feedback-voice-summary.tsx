"use client";

import { useMemo } from "react";
import { buildFeedbackVoiceSummary } from "@/lib/feedback-voice-summary";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";

type NurtureFeedbackVoiceSummaryProps = {
  feedbackEntries: ProjectFeedbackEntry[];
  playableVersion: string;
};

export function NurtureFeedbackVoiceSummary({
  feedbackEntries,
  playableVersion,
}: NurtureFeedbackVoiceSummaryProps) {
  const summary = useMemo(
    () => buildFeedbackVoiceSummary(feedbackEntries, playableVersion),
    [feedbackEntries, playableVersion],
  );

  return (
    <section
      aria-label="届いている声"
      className="mt-4 rounded-lg border border-zinc-800/50 bg-zinc-950/25 px-3.5 py-3"
    >
      <h3 className="text-xs font-medium text-zinc-500">{summary.title}</h3>
      <ul className="mt-2 space-y-1">
        {summary.lines.map((line) => (
          <li key={line} className="text-xs leading-relaxed text-zinc-600">
            · {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
