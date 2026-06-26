"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { useOwnedProjectFeedback } from "@/hooks/use-owned-project-feedback";
import { useOwnedProjectVoiceSignals } from "@/hooks/use-owned-project-voice-signals";
import {
  buildProjectGrowthSnapshot,
  groupFeedbackByProject,
} from "@/lib/project-growth-state";
import { resolveVoiceSignalForGame } from "@/lib/project-voice-nurture";
import { buildTopPriorities, type TopPriority } from "@/lib/top-priorities";
import { buildVoicePromptAggregates } from "@/lib/voice-aggregates";

export function useDevlogTopPriorities(
  projectId: string,
  playableVersion: string,
): { priorities: TopPriority[]; loaded: boolean } {
  const { user } = useAuth();
  const { getSubmittedGameById, getOwnerVoiceAggregates, getDevlogsByProject } =
    useGames();
  const { entries: feedbackEntries, loaded: feedbackLoaded } =
    useOwnedProjectFeedback(user?.id);
  const { signals: voiceSignals, loaded: voiceLoaded } =
    useOwnedProjectVoiceSignals(user?.id);

  const [aggregatesLoaded, setAggregatesLoaded] = useState(false);
  const [aggregates, setAggregates] = useState(() => buildVoicePromptAggregates([]));

  const game = getSubmittedGameById(projectId);

  const growth = useMemo(() => {
    if (!game) {
      return null;
    }

    return buildProjectGrowthSnapshot(
      game,
      resolveVoiceSignalForGame(game, voiceSignals),
      getDevlogsByProject,
    );
  }, [game, voiceSignals, getDevlogsByProject]);

  useEffect(() => {
    let cancelled = false;
    setAggregatesLoaded(false);

    void getOwnerVoiceAggregates(projectId, playableVersion)
      .then((rows) => {
        if (!cancelled) {
          setAggregates(buildVoicePromptAggregates(rows));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAggregates(buildVoicePromptAggregates([]));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAggregatesLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, playableVersion, getOwnerVoiceAggregates]);

  const priorities = useMemo(() => {
    if (!growth) {
      return [];
    }

    const projectFeedback =
      groupFeedbackByProject(feedbackEntries).get(projectId) ?? [];

    return buildTopPriorities({
      projectId,
      playableVersion,
      feedbackEntries: projectFeedback,
      aggregates,
      pendingFeedbackCount: growth.pendingFeedbackCount,
      hasUnreadVoice: growth.totalVoiceResponseCount > 0,
    });
  }, [
    growth,
    feedbackEntries,
    projectId,
    playableVersion,
    aggregates,
  ]);

  const loaded = feedbackLoaded && voiceLoaded && aggregatesLoaded;

  return { priorities, loaded };
}
