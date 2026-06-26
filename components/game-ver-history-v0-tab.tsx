"use client";

import Link from "next/link";
import { GameDevlogV0Tab } from "@/components/game-devlog-v0-tab";
import { GameVersionsV0Tab } from "@/components/game-versions-v0-tab";
import { studioProjectDevlogNewHref } from "@/lib/studio-devlog-draft-v0-store";
import { studioReleaseState } from "@/lib/studio-project-detail-v0-mock-data";
import { Pencil } from "lucide-react";

function StudioReleaseSection() {
  const release = studioReleaseState;

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">正式ver</h2>
      <p className="mt-2 text-sm text-zinc-500">現在の状態</p>
      <p className="mt-1 text-xl font-bold text-white">{release.phase}</p>
      {release.releasedAt && (
        <p className="mt-1 text-sm text-zinc-500">公開日 {release.releasedAt}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          正式verとして公開
        </button>
        <button
          type="button"
          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-600"
        >
          Reopen
        </button>
      </div>

      <h3 className="mt-6 text-sm font-semibold text-zinc-300">正式verの履歴</h3>
      <ul className="mt-3 space-y-2">
        {release.history.map((item) => (
          <li
            key={item.id}
            className="flex justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-sm"
          >
            <span className="text-zinc-200">{item.label}</span>
            <span className="text-zinc-500">{item.date}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GameVerHistoryV0Tab({
  gameId,
  projectId,
  studioMode = false,
  onPlayLatest,
}: {
  gameId: string;
  projectId?: string;
  studioMode?: boolean;
  onPlayLatest?: () => void;
}) {
  return (
    <div className="space-y-12">
      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">開発ログ</h2>
          {studioMode && projectId && (
            <Link
              href={studioProjectDevlogNewHref(projectId)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              <Pencil className="size-4" aria-hidden="true" />
              開発ログを書く
            </Link>
          )}
        </div>
        <GameDevlogV0Tab
          gameId={gameId}
          projectId={projectId}
          onPlayLatest={onPlayLatest}
          embedded
        />
      </section>

      {!studioMode && (
        <section className="border-t border-zinc-800/80 pt-10">
          <h2 className="mb-6 text-base font-semibold text-white">verの履歴</h2>
          <GameVersionsV0Tab gameId={gameId} onPlayLatest={onPlayLatest} embedded />
        </section>
      )}

      {studioMode && (
        <section className="border-t border-zinc-800/80 pt-10">
          <StudioReleaseSection />
        </section>
      )}
    </div>
  );
}
