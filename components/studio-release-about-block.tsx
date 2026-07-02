"use client";

import { useState } from "react";
import { History, Settings2 } from "lucide-react";
import { StudioReleaseDetailModal } from "@/components/studio-release-detail-modal";
import { useProjectReleaseEvents } from "@/hooks/use-project-release-events";
import { formatPlayHistoryDate } from "@/lib/player-play-timeline";
import { getFirstReleasedEvent } from "@/lib/project-release-state";

const panelButtonClassName =
  "inline-flex w-full items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-100";

type StudioReleaseAboutBlockProps = {
  projectId: string;
  devlogCount: number;
  playableVersion: string;
};

export function StudioReleaseAboutBlock({
  projectId,
  devlogCount,
  playableVersion,
}: StudioReleaseAboutBlockProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const { events, loaded, releaseStatus } = useProjectReleaseEvents(projectId);
  const firstReleased = getFirstReleasedEvent(events);

  if (!loaded) {
    return (
      <section className="rounded-xl border border-zinc-800/50 bg-zinc-950/25 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          正式版について
        </h3>
        <p className="mt-3 text-xs text-zinc-500">読み込み中…</p>
      </section>
    );
  }

  const isReleased = releaseStatus === "released";
  const isReopened = releaseStatus === "release_reopened";

  return (
    <>
      <section className="rounded-xl border border-zinc-800/50 bg-zinc-950/25 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          正式版について
        </h3>
        <div className="mt-3 space-y-2">
          {isReleased ? (
            <>
              <p className="text-sm font-medium text-zinc-200">正式版として公開中</p>
              {firstReleased ? (
                <p className="text-xs text-zinc-500">
                  公開日: {formatPlayHistoryDate(firstReleased.createdAt)}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => setDetailOpen(true)}
                className={panelButtonClassName}
              >
                <History className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                履歴を見る
              </button>
            </>
          ) : isReopened ? (
            <>
              <p className="text-sm font-medium text-zinc-200">正式版を再調整中</p>
              <p className="text-xs leading-relaxed text-zinc-600">
                再調整の区切りや、再度の正式版宣言はこちらから行えます。
              </p>
              <button
                type="button"
                onClick={() => setDetailOpen(true)}
                className={panelButtonClassName}
              >
                <Settings2 className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                正式版の設定を開く
              </button>
            </>
          ) : (
            <>
              <p className="text-xs leading-relaxed text-zinc-600">
                完成版として公開する準備ができたら、正式版として宣言できます。
              </p>
              <button
                type="button"
                onClick={() => setDetailOpen(true)}
                className={panelButtonClassName}
              >
                <Settings2 className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                正式版の設定を開く
              </button>
            </>
          )}
        </div>
      </section>

      <StudioReleaseDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        projectId={projectId}
        devlogCount={devlogCount}
        playableVersion={playableVersion}
      />
    </>
  );
}
