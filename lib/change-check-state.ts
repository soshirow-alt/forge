import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChangeCheckState } from "@/lib/change-check-types";
import { hasConfirmationRequestContent } from "@/lib/confirmation-request-draft";
import type { DevlogEntry } from "@/lib/devlogs";
import { fetchConfirmationRequestByDevlogId } from "@/lib/supabase/confirmation-requests-db";
import { fetchLatestPlaySessionForProject } from "@/lib/supabase/play-sessions-db";
import {
  fetchUserFeedbackForVersion,
  fetchUserLatestFeedbackVersionKey,
} from "@/lib/supabase/user-engagement";
import { fetchUserVoiceResponses } from "@/lib/supabase/voice-engagement";

function devlogTimestamp(entry: DevlogEntry): number {
  return new Date(entry.date).getTime();
}

export async function resolveChangeCheckState(
  supabase: SupabaseClient,
  input: {
    userId: string;
    projectId: string;
    currentVersion: string;
    hasPlayed: boolean;
    devlogs: DevlogEntry[];
  },
): Promise<ChangeCheckState | null> {
  if (!input.hasPlayed) {
    return null;
  }

  const currentFeedback = await fetchUserFeedbackForVersion(
    supabase,
    input.userId,
    input.projectId,
    input.currentVersion,
  );
  const currentVoice = await fetchUserVoiceResponses(
    supabase,
    input.userId,
    input.projectId,
    input.currentVersion,
  );
  if (currentFeedback || currentVoice.length > 0) {
    return null;
  }

  const latestSession = await fetchLatestPlaySessionForProject(
    supabase,
    input.userId,
    input.projectId,
  );
  const priorVersion =
    latestSession?.versionKey ??
    (await fetchUserLatestFeedbackVersionKey(
      supabase,
      input.userId,
      input.projectId,
    ));

  if (!priorVersion) {
    return null;
  }

  const projectDevlogs = input.devlogs
    .filter((entry) => entry.projectId === input.projectId)
    .sort((a, b) => devlogTimestamp(b) - devlogTimestamp(a));

  const latestDevlog = projectDevlogs[0];
  if (!latestDevlog) {
    return null;
  }

  const versionChanged = priorVersion !== input.currentVersion;
  const lastPlayedAt = latestSession ? new Date(latestSession.playedAt).getTime() : 0;
  const devlogSincePlay = latestSession
    ? devlogTimestamp(latestDevlog) > lastPlayedAt
    : false;

  if (!versionChanged && !devlogSincePlay) {
    return null;
  }

  const confirmationRecord = await fetchConfirmationRequestByDevlogId(
    supabase,
    latestDevlog.id,
  );

  if (
    confirmationRecord &&
    hasConfirmationRequestContent({
      changesSummary: confirmationRecord.changesSummary,
      askSummary: confirmationRecord.askSummary,
      estimatedDuration: confirmationRecord.estimatedDuration,
    })
  ) {
    return {
      kind: "confirmed",
      priorPlayedVersion: priorVersion,
      confirmation: {
        changesSummary: confirmationRecord.changesSummary,
        askSummary: confirmationRecord.askSummary,
        estimatedDuration: confirmationRecord.estimatedDuration,
      },
    };
  }

  return {
    kind: "generic",
    priorPlayedVersion: priorVersion,
    updateKind: latestDevlog.publishedVersion ? "version" : "devlog",
  };
}
