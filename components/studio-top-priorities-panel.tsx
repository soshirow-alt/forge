"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useGames } from "@/components/games-provider";
import {
  PROJECT_STUDIO_FEEDBACK_SECTION_ID,
  projectStudioFeedbackHref,
} from "@/lib/project-nurture-links";
import type { ProjectGrowthSnapshot } from "@/lib/project-growth-state";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";
import { buildTopPriorities, type TopPriority } from "@/lib/top-priorities";
import { buildVoicePromptAggregates } from "@/lib/voice-aggregates";

function categoryLabel(category: TopPriority["category"]): string {
  switch (category) {
    case "bug":
      return "バグ";
    case "concern":
      return "気になる点";
    case "voice":
      return "回答傾向";
    case "action":
      return "確認";
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
}: {
  projectId: string;
  growth: ProjectGrowthSnapshot;
  feedbackEntries: ProjectFeedbackEntry[];
  voiceRead: boolean;
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

  const feedbackHref = projectStudioFeedbackHref(projectId);

  return (
    <section
      className="mt-8 rounded-xl border border-orange-500/25 bg-zinc-900/40 p-4 sm:p-5 ring-1 ring-orange-500/10"
      aria-labelledby="studio-top-priorities-heading"
      data-forge-p0="top-priorities"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2
            id="studio-top-priorities-heading"
            className="text-sm font-semibold text-zinc-200"
          >
            次に直すこと
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            v{growth.playableVersion} の回答から、優先度の高い候補を最大3件表示します。
          </p>
        </div>
        <Link
          href={feedbackHref}
          className="text-xs text-orange-400/90 transition-colors hover:text-orange-300"
        >
          回答を見る →
        </Link>
      </div>

      {!loaded ? (
        <p className="mt-3 text-sm text-zinc-600">集計を読み込み中…</p>
      ) : priorities.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/30 px-4 py-3">
          <p className="text-sm font-medium text-zinc-400">まだ次に直すことはありません</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            プレイヤーのフィードバックが届くと、ここに優先候補が最大3件表示されます。
          </p>
        </div>
      ) : (
        <PriorityList priorities={priorities} />
      )}

      {priorities.some((item) => item.category === "action") && (
        <p className="mt-3 text-xs text-zinc-600">
          <Link href={`#${PROJECT_STUDIO_FEEDBACK_SECTION_ID}`} className="hover:text-zinc-400">
            下の「プレイヤーの回答」
          </Link>
          から内容を確認してください。
        </p>
      )}
    </section>
  );
}
