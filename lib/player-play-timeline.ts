import type { DevlogEntry } from "@/lib/devlogs";
import {
  getFirstReleasedEvent,
  type ProjectReleaseEvent,
} from "@/lib/project-release-state";
import type { ProjectPlaySession } from "@/lib/supabase/play-sessions-db";
import type { VoiceResponse } from "@/lib/version-prompt-types";

export type PlayHistoryEventType = "play" | "voice" | "devlog" | "release";

export type PlayHistoryTimelineEvent = {
  id: string;
  type: PlayHistoryEventType;
  occurredAt: string;
  label: string;
  versionKey?: string;
  releaseEventType?: "released" | "release_reopened";
};

export type PlayHistoryRelationshipBadge = {
  id: string;
  emoji: string;
  label: string;
};

export type PlayHistoryProjectSummary = {
  playCount: number;
  voiceCount: number;
  updateWatchCount: number;
  daysSinceFirstPlay: number;
  reachedOfficialRelease: boolean;
  badges: PlayHistoryRelationshipBadge[];
};

export type PlayHistoryProjectTimeline = {
  projectId: string;
  firstPlayedAt: string | null;
  latestActivityAt: string;
  summary: PlayHistoryProjectSummary;
  events: PlayHistoryTimelineEvent[];
};

export function daysBetween(fromIso: string, toDate = new Date()): number {
  const from = new Date(fromIso);
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const end = Date.UTC(
    toDate.getUTCFullYear(),
    toDate.getUTCMonth(),
    toDate.getUTCDate(),
  );
  const diffMs = end - start;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function buildPlayHistoryRelationshipBadges(input: {
  hasWitnessGrant: boolean;
  voiceCount: number;
  updateWatchCount: number;
  distinctVersionsPlayed: number;
  hasPlayed: boolean;
}): PlayHistoryRelationshipBadge[] {
  const badges: PlayHistoryRelationshipBadge[] = [];

  if (input.hasWitnessGrant) {
    badges.push({ id: "witness", emoji: "🏅", label: "見届け人" });
  }

  if (input.voiceCount > 0) {
    badges.push({ id: "voice", emoji: "💬", label: "フィードバック済" });
  }

  if (input.updateWatchCount > 0) {
    badges.push({ id: "update", emoji: "🔄", label: "更新を見た" });
  }

  if (input.distinctVersionsPlayed >= 2) {
    badges.push({ id: "multi-version", emoji: "🎮", label: "複数版プレイ" });
  }

  if (badges.length === 0 && input.hasPlayed) {
    badges.push({ id: "played", emoji: "▶️", label: "プレイ済み" });
  }

  return badges;
}

function countDistinctVersions(sessions: ProjectPlaySession[]): number {
  return new Set(sessions.map((session) => session.versionKey)).size;
}

function playSessionLabel(session: ProjectPlaySession): string {
  return `版 ${session.versionKey} をプレイ`;
}

function devlogEventLabel(devlog: DevlogEntry): string {
  const version = devlog.publishedVersion?.trim();
  if (version) {
    return `版 ${version} が公開されました`;
  }

  return "新バージョンが公開されました";
}

function playerReleaseTimelineLabel(event: ProjectReleaseEvent): string {
  if (event.eventType === "released") {
    return "正式版になりました";
  }

  return "正式版が再調整されました";
}

export function buildPlayHistoryTimelineEvents(input: {
  sessions: ProjectPlaySession[];
  voices: VoiceResponse[];
  devlogs: DevlogEntry[];
  releaseEvents?: ProjectReleaseEvent[];
}): PlayHistoryTimelineEvent[] {
  const events: PlayHistoryTimelineEvent[] = [];

  for (const session of input.sessions) {
    events.push({
      id: `play:${session.id}`,
      type: "play",
      occurredAt: session.playedAt,
      label: playSessionLabel(session),
      versionKey: session.versionKey,
    });
  }

  for (const voice of input.voices) {
    events.push({
      id: `voice:${voice.id}`,
      type: "voice",
      occurredAt: voice.createdAt,
      label: "フィードバック済",
      versionKey: voice.versionKey,
    });
  }

  for (const devlog of input.devlogs) {
    if (!devlog.publishedVersion) {
      continue;
    }

    events.push({
      id: `devlog:${devlog.id}`,
      type: "devlog",
      occurredAt: `${devlog.date}T12:00:00.000Z`,
      label: devlogEventLabel(devlog),
      versionKey: devlog.publishedVersion,
    });
  }

  for (const releaseEvent of input.releaseEvents ?? []) {
    events.push({
      id: `release:${releaseEvent.id}`,
      type: "release",
      occurredAt: releaseEvent.createdAt,
      label: playerReleaseTimelineLabel(releaseEvent),
      releaseEventType: releaseEvent.eventType,
    });
  }

  events.sort(
    (left, right) =>
      new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime(),
  );

  return events;
}

export function buildPlayHistoryProjectTimeline(input: {
  projectId: string;
  firstPlayedAt: string | null;
  sessions: ProjectPlaySession[];
  voices: VoiceResponse[];
  devlogs: DevlogEntry[];
  releaseEvents?: ProjectReleaseEvent[];
  hasWitnessGrant?: boolean;
}): PlayHistoryProjectTimeline {
  const releaseEvents = input.releaseEvents ?? [];
  const firstReleased = getFirstReleasedEvent(releaseEvents);
  const reachedOfficialRelease = Boolean(
    firstReleased &&
      input.firstPlayedAt &&
      new Date(input.firstPlayedAt).getTime() <=
        new Date(firstReleased.createdAt).getTime(),
  );

  const events = buildPlayHistoryTimelineEvents({
    sessions: input.sessions,
    voices: input.voices,
    devlogs: input.devlogs,
    releaseEvents,
  });

  const updateWatchCount = input.devlogs.filter((devlog) =>
    Boolean(devlog.publishedVersion),
  ).length;

  const daysSinceFirstPlay = input.firstPlayedAt
    ? daysBetween(input.firstPlayedAt)
    : 0;

  const badges = buildPlayHistoryRelationshipBadges({
    hasWitnessGrant: input.hasWitnessGrant ?? false,
    voiceCount: input.voices.length,
    updateWatchCount,
    distinctVersionsPlayed: countDistinctVersions(input.sessions),
    hasPlayed: input.sessions.length > 0 || Boolean(input.firstPlayedAt),
  });

  const latestActivityAt =
    events.length > 0
      ? events[events.length - 1]!.occurredAt
      : input.firstPlayedAt ?? new Date(0).toISOString();

  return {
    projectId: input.projectId,
    firstPlayedAt: input.firstPlayedAt,
    latestActivityAt,
    summary: {
      playCount: input.sessions.length,
      voiceCount: input.voices.length,
      updateWatchCount,
      daysSinceFirstPlay,
      reachedOfficialRelease,
      badges,
    },
    events,
  };
}

export function buildPlayHistoryForProjects(input: {
  playedProjectIds: string[];
  firstPlayedByProject: Map<string, string>;
  sessions: ProjectPlaySession[];
  voices: VoiceResponse[];
  devlogs: DevlogEntry[];
  releaseEvents?: ProjectReleaseEvent[];
  witnessGrantProjectIds?: Set<string>;
}): PlayHistoryProjectTimeline[] {
  const sessionsByProject = new Map<string, ProjectPlaySession[]>();
  const voicesByProject = new Map<string, VoiceResponse[]>();
  const devlogsByProject = new Map<string, DevlogEntry[]>();
  const releasesByProject = new Map<string, ProjectReleaseEvent[]>();
  const witnessProjects = input.witnessGrantProjectIds ?? new Set<string>();

  for (const session of input.sessions) {
    const list = sessionsByProject.get(session.projectId) ?? [];
    list.push(session);
    sessionsByProject.set(session.projectId, list);
  }

  for (const voice of input.voices) {
    const list = voicesByProject.get(voice.projectId) ?? [];
    list.push(voice);
    voicesByProject.set(voice.projectId, list);
  }

  for (const devlog of input.devlogs) {
    const list = devlogsByProject.get(devlog.projectId) ?? [];
    list.push(devlog);
    devlogsByProject.set(devlog.projectId, list);
  }

  for (const releaseEvent of input.releaseEvents ?? []) {
    const list = releasesByProject.get(releaseEvent.projectId) ?? [];
    list.push(releaseEvent);
    releasesByProject.set(releaseEvent.projectId, list);
  }

  return input.playedProjectIds
    .map((projectId) =>
      buildPlayHistoryProjectTimeline({
        projectId,
        firstPlayedAt: input.firstPlayedByProject.get(projectId) ?? null,
        sessions: sessionsByProject.get(projectId) ?? [],
        voices: voicesByProject.get(projectId) ?? [],
        devlogs: devlogsByProject.get(projectId) ?? [],
        releaseEvents: releasesByProject.get(projectId) ?? [],
        hasWitnessGrant: witnessProjects.has(projectId),
      }),
    )
    .sort(
      (left, right) =>
        new Date(right.latestActivityAt).getTime() -
        new Date(left.latestActivityAt).getTime(),
    );
}

export function formatPlayHistoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
