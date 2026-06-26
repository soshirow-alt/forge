"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  getDevlogsForGame,
  type GameDevlogEntry,
} from "@/lib/game-devlog-v0-mock-data";
import {
  getStudioDevlogExtrasForProject,
  getStudioDevlogExtrasServerSnapshot,
  getStudioDevlogExtrasSnapshot,
  subscribeStudioDevlogExtras,
} from "@/lib/studio-devlog-draft-v0-store";

function mergeDevlogEntries(
  gameId: string,
  projectId?: string,
): GameDevlogEntry[] {
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
  const extrasSnapshot = useSyncExternalStore(
    subscribeStudioDevlogExtras,
    getStudioDevlogExtrasSnapshot,
    getStudioDevlogExtrasServerSnapshot,
  );

  const entries = useMemo(
    () => mergeDevlogEntries(gameId, projectId),
    [gameId, projectId, extrasSnapshot],
  );

  return { entries };
}
