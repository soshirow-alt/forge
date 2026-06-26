"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useGames } from "@/components/games-provider";
import {
  getDevlogsForGame,
  type GameDevlogEntry,
} from "@/lib/game-devlog-v0-mock-data";
import { sortDevlogsNewestFirst, type DevlogEntry } from "@/lib/devlogs";
import { isVersionPublishDevlog } from "@/lib/player-update-display";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";
import {
  getStudioDevlogExtrasForProject,
  getStudioDevlogExtrasServerSnapshot,
  getStudioDevlogExtrasSnapshot,
  subscribeStudioDevlogExtras,
} from "@/lib/studio-devlog-draft-v0-store";

function formatRelativeDevlogLabel(date: string): string {
  const parsed = Date.parse(date);
  if (Number.isNaN(parsed)) {
    return date;
  }

  const diffMs = Date.now() - parsed;
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days < 1) {
    return "今日";
  }
  if (days < 7) {
    return `${days}日前`;
  }
  return new Date(parsed).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

function realDevlogToV0(entry: DevlogEntry, isLatest: boolean): GameDevlogEntry {
  const isVersion = isVersionPublishDevlog(entry);
  const excerpt =
    entry.content.length > 160
      ? `${entry.content.slice(0, 160)}…`
      : entry.content;

  return {
    id: entry.id,
    version: entry.publishedVersion ?? "—",
    publishedAt: new Date(entry.date).toLocaleDateString("ja-JP"),
    relativeLabel: formatRelativeDevlogLabel(entry.date),
    title: entry.title,
    excerpt,
    highlights: isVersion ? ["プレイ可能verが更新されました"] : [],
    kind: isVersion ? "version" : "note",
    isLatest,
  };
}

function mergeDevlogEntries(
  gameId: string,
  projectId: string | undefined,
  realDevlogs: GameDevlogEntry[] | null,
): GameDevlogEntry[] {
  if (realDevlogs && realDevlogs.length > 0) {
    return realDevlogs;
  }

  const base = getDevlogsForGame(gameId);
  const extras = projectId ? getStudioDevlogExtrasForProject(projectId) : [];

  if (extras.length === 0) {
    return base;
  }

  return [
    ...extras.map((entry, index) => ({
      ...entry,
      isLatest: index === 0,
    })),
    ...base.map((entry) => ({ ...entry, isLatest: false })),
  ];
}

export function useGameDevlogsV0(gameId: string, projectId?: string) {
  const { getDevlogsByProject } = useGames();
  const extrasSnapshot = useSyncExternalStore(
    subscribeStudioDevlogExtras,
    getStudioDevlogExtrasSnapshot,
    getStudioDevlogExtrasServerSnapshot,
  );

  const entries = useMemo(() => {
    const realDevlogs = isSupabaseProjectId(gameId)
      ? sortDevlogsNewestFirst(getDevlogsByProject(gameId)).map((entry, index) =>
          realDevlogToV0(entry, index === 0),
        )
      : null;

    return mergeDevlogEntries(gameId, projectId, realDevlogs);
  }, [gameId, projectId, extrasSnapshot, getDevlogsByProject]);

  return { entries };
}
