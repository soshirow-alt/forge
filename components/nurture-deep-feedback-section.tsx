"use client";

import { useMemo, useState } from "react";
import { DeveloperHelpfulMarkButton } from "@/components/developer-helpful-mark-button";
import { FeedbackStructuredCard } from "@/components/feedback-structured-card";
import { formatFeedbackDate } from "@/lib/feedback-display";
import type { HelpfulMarkSourceType } from "@/lib/developer-helpful-mark";
import { buildDeepFeedbackSummary } from "@/lib/feedback-voice-summary";
import { filterDeepFeedbackForVersion } from "@/lib/project-growth-state";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";

type NurtureDeepFeedbackSectionProps = {
  feedbackEntries: ProjectFeedbackEntry[];
  playableVersion: string;
  compact?: boolean;
  /** Studio 右ペイン向けの表示文言 */
  studioPane?: boolean;
  helpfulMarks?: Set<string>;
  onToggleHelpful?: (sourceType: HelpfulMarkSourceType, sourceId: string, marked: boolean) => void;
};

function DeepFeedbackRow({
  item,
  marked,
  onToggleHelpful,
}: {
  item: ProjectFeedbackEntry["item"];
  marked: boolean;
  onToggleHelpful?: (sourceType: HelpfulMarkSourceType, sourceId: string, marked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <FeedbackStructuredCard item={item} showDate={false} />
      </div>
      {onToggleHelpful && (
        <DeveloperHelpfulMarkButton
          marked={marked}
          onToggle={() => onToggleHelpful("project_feedback", item.id, !marked)}
        />
      )}
    </div>
  );
}

export function NurtureDeepFeedbackSection({
  feedbackEntries,
  playableVersion,
  compact = false,
  studioPane = false,
  helpfulMarks,
  onToggleHelpful,
}: NurtureDeepFeedbackSectionProps) {
  const [showPastFeedback, setShowPastFeedback] = useState(false);
  const versionFeedback = useMemo(
    () => filterDeepFeedbackForVersion(feedbackEntries, playableVersion),
    [feedbackEntries, playableVersion],
  );
  const summary = useMemo(
    () => buildDeepFeedbackSummary(feedbackEntries, playableVersion, studioPane),
    [feedbackEntries, playableVersion, studioPane],
  );
  const latestFeedback = versionFeedback[0];

  if (versionFeedback.length === 0) {
    return null;
  }

  const pastFeedback = versionFeedback.slice(1);
  const isMarked = (id: string) => helpfulMarks?.has(`project_feedback:${id}`) ?? false;

  return (
    <section
      aria-label={studioPane ? "自由な意見" : "詳しい感想"}
      className={`rounded-lg border border-zinc-800/40 bg-zinc-950/20 px-3.5 py-3 ${
        compact ? "" : "mt-4"
      }`}
    >
      <h3 className="text-xs font-medium text-zinc-500">{summary.title}</h3>
      {summary.lines.length > 0 && (
        <ul className="mt-2 space-y-1">
          {summary.lines.map((line) => (
            <li key={line} className="text-xs leading-relaxed text-zinc-600">
              · {line}
            </li>
          ))}
        </ul>
      )}

      {latestFeedback && (
        <div className="mt-3 border-t border-zinc-800/50 pt-3">
          <p className="text-[11px] text-zinc-600">
            最新 · {formatFeedbackDate(latestFeedback.item.createdAt)}
          </p>
          <div className="mt-2">
            <DeepFeedbackRow
              item={latestFeedback.item}
              marked={isMarked(latestFeedback.item.id)}
              onToggleHelpful={onToggleHelpful}
            />
          </div>
          {pastFeedback.length > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowPastFeedback((value) => !value)}
                className="text-xs text-zinc-500 transition-colors hover:text-orange-400"
              >
                過去の{studioPane ? "自由な意見" : "詳しい感想"} {pastFeedback.length}件
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
                        <DeepFeedbackRow
                          item={item}
                          marked={isMarked(item.id)}
                          onToggleHelpful={onToggleHelpful}
                        />
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
