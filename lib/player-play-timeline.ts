import type { DevlogEntry } from "@/lib/devlogs";
import {
  formatReleaseTimelineLabel,
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

export type PlayHistoryProjectSummary = {
  playCount: number;
  voiceCount: number;
  updateWatchCount: number;
  daysSinceFirstPlay: number;
  reachedOfficialRelease: boolean;
  summaryLines: string[];
};

export type PlayHistoryProjectTimeline = {
  projectId: string;
  firstPlayedAt: string | null;
  latestActivityAt: string;
  summary: PlayHistoryProjectSummary;
  events: PlayHistoryTimelineEvent[];
};

function truncateQuote(value: string, maxLength = 28): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}…`;
}

function formatVoiceQuote(response: VoiceResponse): string {
  const label = response.answerLabel?.trim() || response.answerValue.trim();
  return truncateQuote(label);
}

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

export function buildPlayHistorySummary(input: {
  playCount: number;
  voiceCount: number;
  updateWatchCount: number;
  firstPlayedAt: string | null;
  reachedOfficialRelease: boolean;
}): PlayHistoryProjectSummary {
  const lines: string[] = [];

  if (input.playCount > 0) {
    lines.push(`${input.playCount}回プレイ`);
  }

  if (input.voiceCount > 0) {
    lines.push(`${input.voiceCount}回声を届けた`);
  }

  if (input.updateWatchCount > 0) {
    lines.push(`${input.updateWatchCount}回更新を見届けた`);
  }

  if (input.reachedOfficialRelease) {
    lines.push("正式版到達を見届けた");
  }

  const daysSinceFirstPlay = input.firstPlayedAt
    ? daysBetween(input.firstPlayedAt)
    : 0;

  if (input.firstPlayedAt && daysSinceFirstPlay >= 0) {
    lines.push(`最初のプレイから${daysSinceFirstPlay}日`);
  }

  return {
    playCount: input.playCount,
    voiceCount: input.voiceCount,
    updateWatchCount: input.updateWatchCount,
    daysSinceFirstPlay,
    reachedOfficialRelease: input.reachedOfficialRelease,
    summaryLines: lines,
  };
}

function playSessionLabel(session: ProjectPlaySession): string {
  const versionLabel = `版 ${session.versionKey}`;

  if (session.context === "adoption_verify") {
    return `${versionLabel} をプレイ — 変化を確かめる`;
  }

  if (session.context === "new_version") {
    return `${versionLabel} をプレイ — 新版`;
  }

  return `${versionLabel} をプレイ`;
}

function devlogEventLabel(devlog: DevlogEntry): string {
  if (devlog.publishedVersion) {
    const title = devlog.title.trim();
    if (title) {
      return `新版 ${devlog.publishedVersion} が公開 — ${title}`;
    }
    return `新版 ${devlog.publishedVersion} が公開`;
  }

  const title = devlog.title.trim();
  return title ? `更新 — ${title}` : "更新がありました";
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
      label: `「${formatVoiceQuote(voice)}」と声を届けた`,
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
      label: formatReleaseTimelineLabel(releaseEvent),
      releaseEventType: releaseEvent.eventType,
    });
  }

  events.sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
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

  const updateWatchCount = input.devlogs.filter(
    (devlog) => Boolean(devlog.publishedVersion),
  ).length;

  const summary = buildPlayHistorySummary({
    playCount: input.sessions.length,
    voiceCount: input.voices.length,
    updateWatchCount,
    firstPlayedAt: input.firstPlayedAt,
    reachedOfficialRelease,
  });

  const latestActivityAt =
    events[0]?.occurredAt ?? input.firstPlayedAt ?? new Date(0).toISOString();

  return {
    projectId: input.projectId,
    firstPlayedAt: input.firstPlayedAt,
    latestActivityAt,
    summary,
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
}): PlayHistoryProjectTimeline[] {
  const sessionsByProject = new Map<string, ProjectPlaySession[]>();
  const voicesByProject = new Map<string, VoiceResponse[]>();
  const devlogsByProject = new Map<string, DevlogEntry[]>();
  const releasesByProject = new Map<string, ProjectReleaseEvent[]>();

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
