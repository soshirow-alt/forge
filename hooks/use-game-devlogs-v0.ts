"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useGames } from "@/components/games-provider";
import { forgePerfTimed } from "@/lib/forge-perf-log";
import {
  getDevlogsForGame,
  type GameDevlogEntry,
} from "@/lib/game-devlog-v0-mock-data";
import { sortDevlogsNewestFirst, type DevlogEntry } from "@/lib/devlogs";
import { isVersionPublishDevlog } from "@/lib/player-update-display";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { fetchProjectDevlogsForProject } from "@/lib/supabase/project-devlogs";
import {
  getStudioDevlogExtrasServerSnapshot,
  getStudioDevlogExtrasSnapshot,
  subscribeStudioDevlogExtras,
} from "@/lib/studio-devlog-draft-v0-store";

const EMPTY_EXTRAS: Record<string, GameDevlogEntry[]> = {};

function subscribeNoop(_listener: () => void) {
  return () => {};
}

function getEmptyExtrasSnapshot(): Record<string, GameDevlogEntry[]> {
  return EMPTY_EXTRAS;
}

/** SSR/CSR で同じ文字列になる日付表示（相対日時は使わない） */
export function formatDevlogPublishedAt(date: string | undefined | null): string {
  const trimmed = date?.trim() ?? "";
  if (!trimmed) {
    return "—";
  }

  const isoDay = trimmed.split("T")[0] ?? trimmed;
  const parsed = Date.parse(isoDay);
  if (Number.isNaN(parsed)) {
    return trimmed;
  }

  return new Date(parsed).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function isValidDevlogEntry(
  entry: DevlogEntry | null | undefined,
): entry is DevlogEntry {
  return Boolean(entry?.id?.trim());
}

export function realDevlogToV0(entry: DevlogEntry, isLatest: boolean): GameDevlogEntry {
  const content = entry.content?.trim() ?? "";
  const title = entry.title?.trim() || "（無題）";
  const publishedAt = formatDevlogPublishedAt(entry.date);
  const isVersion = isVersionPublishDevlog(entry);
  const excerpt =
    content.length > 160 ? `${content.slice(0, 160)}…` : content || "—";

  return {
    id: entry.id,
    version: entry.publishedVersion?.trim() || "—",
    publishedAt,
    relativeLabel: publishedAt,
    title,
    excerpt,
    highlights: isVersion ? ["プレイ可能verが更新されました"] : [],
    kind: isVersion ? "version" : "note",
    isLatest,
  };
}

export function normalizeGameDevlogEntry(entry: GameDevlogEntry): GameDevlogEntry {
  return {
    ...entry,
    id: entry.id?.trim() || "unknown",
    title: entry.title?.trim() || "（無題）",
    excerpt: entry.excerpt?.trim() || "—",
    version: entry.version?.trim() || "—",
    publishedAt: entry.publishedAt?.trim() || "—",
    relativeLabel: entry.relativeLabel?.trim() || entry.publishedAt?.trim() || "—",
    highlights: Array.isArray(entry.highlights) ? entry.highlights : [],
    kind: entry.kind === "note" ? "note" : "version",
  };
}

function mergeMockDevlogEntries(
  gameId: string,
  projectId: string | undefined,
  extrasByProject: Record<string, GameDevlogEntry[]>,
): GameDevlogEntry[] {
  if (shouldHideV0MockContent()) {
    return [];
  }

  const base = getDevlogsForGame(gameId).map(normalizeGameDevlogEntry);
  const extras = projectId ? (extrasByProject[projectId] ?? []) : [];

  if (extras.length === 0) {
    return base;
  }

  return [
    ...extras.map((entry, index) =>
      normalizeGameDevlogEntry({
        ...entry,
        isLatest: index === 0,
      }),
    ),
    ...base.map((entry) => ({ ...entry, isLatest: false })),
  ];
}

function useRealGameDevlogs(gameId: string, enabled: boolean) {
  const { getDevlogsByProject, devlogsReady } = useGames();
  const [directLoaded, setDirectLoaded] = useState(false);
  const [directDevlogs, setDirectDevlogs] = useState<DevlogEntry[]>([]);

  useEffect(() => {
    if (!enabled || devlogsReady) {
      return;
    }

    let cancelled = false;
    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setDirectLoaded(true);
      return;
    }

    void forgePerfTimed("supabase.fetchProjectDevlogsForProject", () =>
      fetchProjectDevlogsForProject(supabase, gameId),
    )
      .then((rows) => {
        if (!cancelled) {
          setDirectDevlogs(rows);
          setDirectLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDirectDevlogs([]);
          setDirectLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [devlogsReady, enabled, gameId]);

  const entries = useMemo(() => {
    if (!enabled) {
      return [];
    }

    const source = devlogsReady
      ? getDevlogsByProject(gameId)
      : directDevlogs;

    return sortDevlogsNewestFirst(source)
      .filter(isValidDevlogEntry)
      .map((entry, index) => realDevlogToV0(entry, index === 0));
  }, [directDevlogs, devlogsReady, enabled, gameId, getDevlogsByProject]);

  return {
    entries,
    loaded: !enabled || devlogsReady || directLoaded,
  };
}

function useMockGameDevlogs(
  gameId: string,
  projectId: string | undefined,
  enabled: boolean,
) {
  const extrasByProject = useSyncExternalStore(
    enabled ? subscribeStudioDevlogExtras : subscribeNoop,
    enabled ? getStudioDevlogExtrasSnapshot : getEmptyExtrasSnapshot,
    getStudioDevlogExtrasServerSnapshot,
  );

  const entries = useMemo(() => {
    if (!enabled) {
      return [];
    }

    return mergeMockDevlogEntries(gameId, projectId, extrasByProject);
  }, [enabled, gameId, projectId, extrasByProject]);

  return { entries, loaded: true };
}

export function useGameDevlogsV0(gameId: string, projectId?: string) {
  const isRealProject = isSupabaseProjectId(gameId);
  const real = useRealGameDevlogs(gameId, isRealProject);
  const mock = useMockGameDevlogs(gameId, projectId, !isRealProject);

  return isRealProject ? real : mock;
}
