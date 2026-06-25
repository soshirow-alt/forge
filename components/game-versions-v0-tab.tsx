"use client";

import { useMemo, useState } from "react";
import {
  getVersionsForGame,
  getVersionStatsForGame,
  type GameVersionEntry,
} from "@/lib/game-versions-v0-mock-data";
import { ChevronDown, GitBranch, History, Play, Tag } from "lucide-react";

function LatestVersionCard({
  entry,
  onPlay,
}: {
  entry: GameVersionEntry;
  onPlay?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-zinc-900/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-violet-400/40 bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-200">
          最新ver
        </span>
        <span className="text-sm font-medium text-white">{entry.version}</span>
        <span className="text-xs text-zinc-500">{entry.relativeLabel}</span>
      </div>
      <h2 className="mt-3 text-lg font-semibold text-white">{entry.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{entry.summary}</p>
      {entry.changes.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {entry.changes.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-zinc-300">
              <Tag className="mt-0.5 size-3.5 shrink-0 text-violet-400" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      )}
      {onPlay && (
        <button
          type="button"
          onClick={onPlay}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          <Play className="size-4" aria-hidden="true" />
          最新verでプレイ
        </button>
      )}
    </section>
  );
}

function VersionTimelineItem({
  entry,
  expanded,
  onToggle,
}: {
  entry: GameVersionEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasChanges = entry.changes.length > 0;

  return (
    <article className="relative pl-8">
      <span
        className={`absolute left-0 top-2 size-3 rounded-full border-2 ${
          entry.isLatest
            ? "border-violet-400 bg-violet-500/30"
            : "border-zinc-600 bg-zinc-900"
        }`}
        aria-hidden="true"
      />
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-300">
            {entry.version}
          </span>
          <span className="text-xs text-zinc-600">{entry.publishedAt}</span>
          <span className="text-xs text-zinc-600">· {entry.relativeLabel}</span>
          {entry.playCount != null && (
            <span className="text-xs text-zinc-600">· {entry.playCount.toLocaleString()} プレイ</span>
          )}
        </div>
        <h3 className="mt-3 font-semibold text-white">{entry.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{entry.summary}</p>
        {hasChanges && expanded && (
          <ul className="mt-3 space-y-1 border-t border-zinc-800/80 pt-3">
            {entry.changes.map((item) => (
              <li key={item} className="text-sm text-zinc-500">
                · {item}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {hasChanges && (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1 text-sm text-violet-400 transition-colors hover:text-violet-300"
            >
              {expanded ? "閉じる" : "変更点を見る"}
              <ChevronDown
                className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function GameVersionsV0Tab({
  gameId,
  onPlayLatest,
  embedded = false,
}: {
  gameId: string;
  onPlayLatest?: () => void;
  embedded?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allEntries = useMemo(() => getVersionsForGame(gameId), [gameId]);
  const stats = useMemo(() => getVersionStatsForGame(allEntries), [allEntries]);
  const latest = allEntries.find((e) => e.isLatest) ?? allEntries[0];
  const listEntries = latest ? allEntries.filter((e) => e.id !== latest.id) : allEntries;

  return (
    <div className="space-y-8">
      {!embedded && (
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
          <p className="text-xs text-zinc-500">現在のver</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-white">
            <GitBranch className="size-4 text-violet-400" aria-hidden="true" />
            {stats.currentVersion}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
          <p className="text-xs text-zinc-500">公開ver数</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-white">
            <History className="size-4 text-violet-400" aria-hidden="true" />
            {stats.totalVersions}ver
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
          <p className="text-xs text-zinc-500">初回公開</p>
          <p className="mt-1 text-lg font-bold text-white">{stats.firstPublished}</p>
        </div>
      </div>
      )}

      {latest && <LatestVersionCard entry={latest} onPlay={onPlayLatest} />}

      <div className="relative space-y-6 border-l border-zinc-800/80 pl-4">
        {listEntries.map((entry) => (
          <VersionTimelineItem
            key={entry.id}
            entry={entry}
            expanded={expandedId === entry.id}
            onToggle={() =>
              setExpandedId((current) => (current === entry.id ? null : entry.id))
            }
          />
        ))}
        {listEntries.length === 0 && (
          <p className="rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center text-sm text-zinc-500">
            過去のverはありません。
          </p>
        )}
      </div>
    </div>
  );
}
