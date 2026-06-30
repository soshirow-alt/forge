"use client";

import { useMemo, useState } from "react";
import { useGameDevlogsV0 } from "@/hooks/use-game-devlogs-v0";
import {
  filterDevlogs,
  getDevlogFilterTabs,
  getDevlogStatsForGame,
  type DevlogFilterId,
  type GameDevlogEntry,
} from "@/lib/game-devlog-v0-mock-data";
import {
  ChevronDown,
  FileText,
  GitBranch,
  Play,
  Sparkles,
} from "lucide-react";

function KindBadge({ kind }: { kind: GameDevlogEntry["kind"] }) {
  if (kind === "version") {
    return (
      <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-300">
        verの更新
      </span>
    );
  }
  return (
    <span className="rounded-md border border-zinc-600 bg-zinc-800/60 px-2 py-0.5 text-xs font-medium text-zinc-400">
      開発メモ
    </span>
  );
}

function normalizeEntry(entry: GameDevlogEntry): GameDevlogEntry {
  return {
    ...entry,
    highlights: entry.highlights ?? [],
  };
}

function LatestDevlogCard({
  entry,
  onPlay,
}: {
  entry: GameDevlogEntry;
  onPlay?: () => void;
}) {
  const highlights = entry.highlights ?? [];
  return (
    <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-zinc-900/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-violet-400/40 bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-200">
          最新の更新
        </span>
        {entry.version !== "—" && (
          <span className="text-sm font-medium text-white">{entry.version}</span>
        )}
        <span className="text-xs text-zinc-500">{entry.relativeLabel}</span>
      </div>
      <h2 className="mt-3 text-lg font-semibold text-white">{entry.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{entry.excerpt}</p>
      {highlights.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {highlights.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-zinc-300">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-violet-400" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      )}
      {onPlay && entry.kind === "version" && (
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

function DevlogTimelineItem({
  entry,
  expanded,
  onToggle,
}: {
  entry: GameDevlogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const highlights = entry.highlights ?? [];
  const hasMore = highlights.length > 0;

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
          <KindBadge kind={entry.kind} />
          {entry.version !== "—" && (
            <span className="text-xs font-medium text-zinc-300">{entry.version}</span>
          )}
          <span className="text-xs text-zinc-600">{entry.publishedAt}</span>
          <span className="text-xs text-zinc-600">· {entry.relativeLabel}</span>
        </div>
        <h3 className="mt-3 font-semibold text-white">{entry.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{entry.excerpt}</p>
        {hasMore && expanded && (
          <ul className="mt-3 space-y-1 border-t border-zinc-800/80 pt-3">
            {highlights.map((item) => (
              <li key={item} className="text-sm text-zinc-500">
                · {item}
              </li>
            ))}
          </ul>
        )}
        {hasMore && (
          <button
            type="button"
            onClick={onToggle}
            className="mt-3 inline-flex items-center gap-1 text-sm text-violet-400 transition-colors hover:text-violet-300"
          >
            {expanded ? "閉じる" : "変更点を見る"}
            <ChevronDown
              className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </article>
  );
}

export function GameDevlogV0Tab({
  gameId,
  projectId,
  onPlayLatest,
  embedded = false,
}: {
  gameId: string;
  projectId?: string;
  onPlayLatest?: () => void;
  embedded?: boolean;
}) {
  const [filter, setFilter] = useState<DevlogFilterId>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { entries: rawEntries, loaded } = useGameDevlogsV0(gameId, projectId);
  const allEntries = useMemo(
    () => rawEntries.map(normalizeEntry),
    [rawEntries],
  );
  const filtered = useMemo(() => filterDevlogs(allEntries, filter), [allEntries, filter]);
  const stats = useMemo(() => getDevlogStatsForGame(allEntries), [allEntries]);
  const filterTabs = useMemo(() => getDevlogFilterTabs(allEntries), [allEntries]);
  const latest = allEntries.find((e) => e.isLatest) ?? allEntries[0];
  const listEntries =
    filter === "all" && latest
      ? filtered.filter((e) => e.id !== latest.id)
      : filtered;

  if (!loaded) {
    return (
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 px-6 py-12 text-center">
        <p className="text-sm text-zinc-500">開発ログを読み込み中...</p>
      </div>
    );
  }

  if (allEntries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center">
        <p className="text-sm font-medium text-zinc-300">開発ログはまだありません</p>
        <p className="mt-2 text-sm text-zinc-500">
          開発者が更新を記録すると、ここに表示されます。
        </p>
      </div>
    );
  }

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
          <p className="text-xs text-zinc-500">ログ件数</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-white">
            <FileText className="size-4 text-violet-400" aria-hidden="true" />
            {stats.totalPosts}件
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
          <p className="text-xs text-zinc-500">最終更新</p>
          <p className="mt-1 text-lg font-bold text-white">{stats.lastUpdated}</p>
        </div>
      </div>
      )}

      {latest && filter !== "note" && (
        <LatestDevlogCard entry={latest} onPlay={onPlayLatest} />
      )}

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              filter === tab.id
                ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="relative space-y-6 border-l border-zinc-800/80 pl-4">
        {listEntries.map((entry) => (
          <DevlogTimelineItem
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
            該当する開発ログはありません。
          </p>
        )}
      </div>
    </div>
  );
}
