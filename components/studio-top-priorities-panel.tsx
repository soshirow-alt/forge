"use client";

import { useEffect, useMemo, useState } from "react";
import { useGames } from "@/components/games-provider";
import type { ProjectGrowthSnapshot } from "@/lib/project-growth-state";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";
import { buildTopPriorities, type TopPriority } from "@/lib/top-priorities";
import { buildVoicePromptAggregates } from "@/lib/voice-aggregates";

function categoryLabel(category: TopPriority["category"]): string {
  switch (category) {
    case "bug":
      return "不具合報告";
    case "concern":
      return "気になる反応";
    case "voice":
      return "多かった意見";
    case "action":
      return "未確認";
    default:
      return "";
  }
}

function PriorityList({ priorities }: { priorities: TopPriority[] }) {
  return (
    <ol className="mt-3 space-y-2">
      {priorities.map((item, index) => (
        <li
          key={item.id}
          className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5"
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-xs font-semibold text-orange-400/90">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-200">{item.title}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                <span className="text-zinc-600">{categoryLabel(item.category)}</span>
                {" · "}
                {item.reason}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function StudioTopPrioritiesPanel({
  projectId,
  growth,
  feedbackEntries,
  voiceRead,
  embedded = false,
  hideHeading = false,
}: {
  projectId: string;
  growth: ProjectGrowthSnapshot;
  feedbackEntries: ProjectFeedbackEntry[];
  voiceRead: boolean;
  embedded?: boolean;
  hideHeading?: boolean;
}) {
  const { getOwnerVoiceAggregates } = useGames();
  const [loaded, setLoaded] = useState(false);
  const [aggregates, setAggregates] = useState(() => buildVoicePromptAggregates([]));

  useEffect(() => {
    let cancelled = false;
    void getOwnerVoiceAggregates(projectId, growth.playableVersion)
      .then((rows) => {
        if (!cancelled) {
          setAggregates(buildVoicePromptAggregates(rows));
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAggregates(buildVoicePromptAggregates([]));
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, growth.playableVersion, getOwnerVoiceAggregates]);

  const priorities = useMemo(
    () =>
      buildTopPriorities({
        projectId,
        playableVersion: growth.playableVersion,
        feedbackEntries,
        aggregates,
        pendingFeedbackCount: growth.pendingFeedbackCount,
        hasUnreadVoice: !voiceRead && growth.totalVoiceResponseCount > 0,
      }),
    [
      projectId,
      growth.playableVersion,
      growth.pendingFeedbackCount,
      growth.totalVoiceResponseCount,
      feedbackEntries,
      aggregates,
      voiceRead,
    ],
  );

  const displayPriorities = useMemo(
    () => (hideHeading ? priorities.filter((item) => item.id !== "unread-voices") : priorities),
    [priorities, hideHeading],
  );

  return (
    <section
      className={`${
        hideHeading
          ? ""
          : `rounded-xl border border-orange-500/25 bg-zinc-900/40 p-4 sm:p-5 ring-1 ring-orange-500/10 ${
              embedded ? "" : "mt-8"
            }`
      }`}
      aria-labelledby={hideHeading ? undefined : "studio-top-priorities-heading"}
      data-forge-p0="top-priorities"
    >
      {hideHeading ? null : (
        <h2
          id="studio-top-priorities-heading"
          className="text-sm font-semibold text-zinc-200"
        >
          フィードバックの傾向
        </h2>
      )}

      {!loaded ? (
        <p className={`text-sm text-zinc-600 ${hideHeading ? "" : "mt-3"}`}>集計を読み込み中…</p>
      ) : displayPriorities.length === 0 ? (
        <div
          className={`rounded-lg border border-dashed border-zinc-800 bg-zinc-950/30 px-4 py-3 ${
            hideHeading ? "" : "mt-3"
          }`}
        >
          <p className="text-sm font-medium text-zinc-400">十分なフィードバックがありません</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            フィードバックが集まると、多かった意見や気になる傾向が表示されます。
          </p>
        </div>
      ) : (
        <PriorityList priorities={displayPriorities} />
      )}
    </section>
  );
}
