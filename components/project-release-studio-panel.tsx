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
};

export function ProjectReleaseStudioPanel({
  projectId,
  devlogCount,
  playableVersion,
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
      <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <p className="text-sm text-zinc-500">正式版情報を読み込み中…</p>
      </section>
    );
  }

  return (
    <section
      id="official-release"
      className="mt-10 scroll-mt-24 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5"
    >
      <div className="border-l-2 border-emerald-500 pl-3">
        <h2 className="text-base font-semibold tracking-tight text-zinc-100">
          正式版
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Forge は品質審査しません。開発者が Released を宣言することが正本です。
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1 text-xs font-medium text-zinc-200">
          現在: {RELEASE_STATUS_LABELS[releaseStatus]}
        </span>
        {events.length > 0 ? (
          <span className="text-xs text-zinc-600">
            イベント {events.length} 件（履歴は削除しません）
          </span>
        ) : null}
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
            className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            正式版として宣言（Released）
          </button>

          <button
            type="button"
            disabled={busy || !reopenedValidation.ok}
            onClick={() => void handleReopened()}
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            正式版を再調整（Release Reopened）
          </button>
        </div>

        {!releasedValidation.ok && releaseStatus !== "released" ? (
          <p className="text-xs text-zinc-600">{releasedValidation.reason}</p>
        ) : null}
      </div>

      {events.length > 0 ? (
        <div className="mt-6 border-t border-zinc-800/80 pt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            履歴
          </h3>
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
                  <p className="text-zinc-200">{RELEASE_EVENT_LABELS[event.eventType]}</p>
                  {event.note ? (
                    <p className="mt-1 text-xs text-zinc-500">{event.note}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
