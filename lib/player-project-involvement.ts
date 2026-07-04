import type { GameFeedbackItem } from "@/lib/game-feedback-storage";
import {
  DEFAULT_PLAYABLE_VERSION,
  resolvePlayableVersion,
} from "@/lib/playable-version";
import type { ProjectPlaySession } from "@/lib/supabase/play-sessions-db";
import type { VoiceResponse } from "@/lib/version-prompt-types";

function normalizeVersionKey(value: string | undefined | null): string {
  const resolved = resolvePlayableVersion(value).replace(/^v/i, "");
  return resolved || DEFAULT_PLAYABLE_VERSION;
}

export type PlayerProjectInvolvement = {
  firstPlayedAt: string | null;
  firstPlayedVersion: string | null;
  playCount: number;
  replayCount: number;
  voiceVersionCount: number;
  deepFeedbackCount: number;
  voiceOrFeedbackCount: number;
  lastVoiceVersion: string | null;
  watching: boolean;
  hasPlayedLatestVersion: boolean | null;
  hasAnyInvolvement: boolean;
};

function earliestIso(a: string | null, b: string | null): string | null {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

function latestVoiceOrFeedbackVersion(
  voices: VoiceResponse[],
  feedback: GameFeedbackItem[],
): string | null {
  type Entry = { versionKey: string; at: string };
  const entries: Entry[] = [];

  for (const voice of voices) {
    entries.push({ versionKey: voice.versionKey, at: voice.createdAt });
  }
  for (const item of feedback) {
    const versionKey = item.versionKey?.trim();
    if (!versionKey) {
      continue;
    }
    entries.push({ versionKey, at: item.createdAt });
  }

  if (entries.length === 0) {
    return null;
  }

  entries.sort(
    (left, right) => new Date(right.at).getTime() - new Date(left.at).getTime(),
  );
  return normalizeVersionKey(entries[0]!.versionKey);
}

export function buildPlayerProjectInvolvement(input: {
  sessions: ProjectPlaySession[];
  firstPlayedAtFromPlays: string | null;
  voices: VoiceResponse[];
  feedback: GameFeedbackItem[];
  watching: boolean;
  playableVersion: string;
}): PlayerProjectInvolvement {
  const sessionsAsc = [...input.sessions].sort(
    (left, right) =>
      new Date(left.playedAt).getTime() - new Date(right.playedAt).getTime(),
  );

  const firstSessionAt = sessionsAsc[0]?.playedAt ?? null;
  const firstPlayedAt = earliestIso(firstSessionAt, input.firstPlayedAtFromPlays);
  const firstPlayedVersion = sessionsAsc[0]
    ? normalizeVersionKey(sessionsAsc[0].versionKey)
    : null;

  const sessionPlayCount = sessionsAsc.length;
  const playCount =
    sessionPlayCount > 0 ? sessionPlayCount : firstPlayedAt ? 1 : 0;
  const replayCount = Math.max(playCount - 1, 0);

  const voiceVersions = new Set(
    input.voices.map((voice) => normalizeVersionKey(voice.versionKey)),
  );
  const voiceVersionCount = voiceVersions.size;
  const deepFeedbackCount = input.feedback.length;
  const voiceOrFeedbackCount = voiceVersionCount + deepFeedbackCount;
  const lastVoiceVersion = latestVoiceOrFeedbackVersion(
    input.voices,
    input.feedback,
  );

  const latestVersion = normalizeVersionKey(input.playableVersion);
  const playedVersions = new Set(
    sessionsAsc.map((session) => normalizeVersionKey(session.versionKey)),
  );
  const hasPlayedLatestVersion =
    sessionsAsc.length === 0
      ? firstPlayedAt
        ? null
        : false
      : playedVersions.has(latestVersion);

  const hasAnyInvolvement =
    Boolean(firstPlayedAt) ||
    voiceOrFeedbackCount > 0 ||
    input.watching;

  return {
    firstPlayedAt,
    firstPlayedVersion,
    playCount,
    replayCount,
    voiceVersionCount,
    deepFeedbackCount,
    voiceOrFeedbackCount,
    lastVoiceVersion,
    watching: input.watching,
    hasPlayedLatestVersion,
    hasAnyInvolvement,
  };
}

export function formatInvolvementDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}
