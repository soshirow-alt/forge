"use client";

import { useMemo, useState } from "react";
import { useGames } from "@/components/games-provider";
import { useProjectReleaseEvents } from "@/hooks/use-project-release-events";
import {
  RELEASE_EVENT_LABELS,
  RELEASE_STATUS_LABELS,
  validateReleasedDeclaration,
  validateReleaseReopenedDeclaration,
} from "@/lib/project-release-state";
import { formatPlayHistoryDate } from "@/lib/player-play-timeline";

type ProjectReleaseStudioPanelProps = {
  projectId: string;
  devlogCount: number;
  playableVersion: string;
  embedded?: boolean;
};

export function ProjectReleaseStudioPanel({
  projectId,
  devlogCount,
  playableVersion,
  embedded = false,
}: ProjectReleaseStudioPanelProps) {
  const {
    events,
    loaded,
    busy,
    error,
    releaseStatus,
    declareReleased,
    declareReleaseReopened,
  } = useProjectReleaseEvents(projectId);

  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const releasedValidation = useMemo(
    () =>
      validateReleasedDeclaration({
        devlogCount,
        playableVersion,
        currentStatus: releaseStatus,
      }),
    [devlogCount, playableVersion, releaseStatus],
  );

  const reopenedValidation = useMemo(
    () => validateReleaseReopenedDeclaration({ currentStatus: releaseStatus }),
    [releaseStatus],
  );

  const handleReleased = async () => {
    setActionError(null);
    if (!releasedValidation.ok) {
      setActionError(releasedValidation.reason);
      return;
    }

    try {
      await declareReleased(note.trim() || undefined);
      setNote("");
    } catch {
      /* error state handled in hook */
    }
  };

  const handleReopened = async () => {
    setActionError(null);
    if (!reopenedValidation.ok) {
      setActionError(reopenedValidation.reason);
      return;
    }

    try {
      await declareReleaseReopened(note.trim() || undefined);
      setNote("");
    } catch {
      /* error state handled in hook */
    }
  };

  if (!loaded) {
    return (
      <section
        className={
          embedded
            ? "rounded-xl border border-zinc-800/80 bg-zinc-900/35 p-4"
            : "mt-10 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5"
        }
      >
        <p className="text-sm text-zinc-500">読み込み中…</p>
      </section>
    );
  }

  return (
    <section
      id={embedded ? undefined : "official-release"}
      className={
        embedded
          ? "scroll-mt-24 rounded-xl border border-zinc-800/80 bg-zinc-900/35 p-4"
          : "mt-10 scroll-mt-24 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          className={
            embedded
              ? "text-xs font-semibold uppercase tracking-wide text-zinc-500"
              : "text-base font-semibold tracking-tight text-zinc-100"
          }
        >
          {embedded ? "正式版" : "正式verとして宣言する"}
        </h2>
        <span className="rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1 text-xs font-medium text-zinc-200">
          {RELEASE_STATUS_LABELS[releaseStatus]}
        </span>
      </div>

      {(error || actionError) && (
        <p className="mt-3 text-sm text-red-400/90">{actionError ?? error}</p>
      )}

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-xs text-zinc-500">メモ（任意）</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="この区切りについて、開発者メモがあれば"
            className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || !releasedValidation.ok}
            onClick={() => void handleReleased()}
            className={`rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${
              embedded ? "w-full px-4 py-2 text-sm" : "px-5 py-2.5 text-sm"
            }`}
          >
            正式verとして宣言する
          </button>

          {releaseStatus === "released" && (
            <button
              type="button"
              disabled={busy || !reopenedValidation.ok}
              onClick={() => void handleReopened()}
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              再調整を始める
            </button>
          )}
        </div>

        {!releasedValidation.ok && releaseStatus !== "released" ? (
          <p className="text-xs text-zinc-600">{releasedValidation.reason}</p>
        ) : null}
      </div>

      {events.length > 0 ? (
        <div className="mt-5 border-t border-zinc-800/80 pt-4">
          <button
            type="button"
            onClick={() => setHistoryExpanded((value) => !value)}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            過去の宣言を見る（{events.length}件）{historyExpanded ? " ▲" : " ▼"}
          </button>
          {historyExpanded && (
            <ol className="mt-3 space-y-2">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col gap-1 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2 text-sm sm:flex-row sm:items-start sm:gap-3"
                >
                  <time
                    dateTime={event.createdAt}
                    className="shrink-0 text-xs text-zinc-600"
                  >
                    {formatPlayHistoryDate(event.createdAt)}
                  </time>
                  <div className="min-w-0">
                    <p className="text-zinc-200">
                      {RELEASE_EVENT_LABELS[event.eventType]}
                    </p>
                    {event.note ? (
                      <p className="mt-1 text-xs text-zinc-500">{event.note}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}
    </section>
  );
}
