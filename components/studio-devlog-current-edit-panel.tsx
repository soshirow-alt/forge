"use client";

import { useMemo } from "react";
import { StudioPanelEditShell } from "@/components/studio-panel-edit-shell";
import { useGames } from "@/components/games-provider";
import { formatDevlogPublishedAt } from "@/hooks/use-game-devlogs-v0";
import { sortDevlogsNewestFirst } from "@/lib/devlogs";

export type StudioDevlogCurrentEditPanelProps = {
  projectId: string;
  onCancel: () => void;
  onOpenNewVersionDevlog: () => void;
};

export function StudioDevlogCurrentEditPanel({
  projectId,
  onCancel,
  onOpenNewVersionDevlog,
}: StudioDevlogCurrentEditPanelProps) {
  const { getDevlogsByProject } = useGames();

  const latestDevlog = useMemo(() => {
    const devlogs = sortDevlogsNewestFirst(getDevlogsByProject(projectId));
    return devlogs[0] ?? null;
  }, [getDevlogsByProject, projectId]);

  return (
    <StudioPanelEditShell
      title="現在の開発ログ"
      onCancel={onCancel}
      hideSave
    >
      {latestDevlog ? (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-3 py-2.5">
          <p className="text-sm font-medium text-zinc-200">{latestDevlog.title}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {formatDevlogPublishedAt(latestDevlog.date)}
            {latestDevlog.publishedVersion ? ` · ${latestDevlog.publishedVersion}` : ""}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">{latestDevlog.content}</p>
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-zinc-500">
          開発ログはまだありません。新verの開発ログから最初の更新を記録できます。
        </p>
      )}

      <p className="text-xs leading-relaxed text-zinc-600">
        公開済みの開発ログ本文は直接書き換えません。追記や修正は新verの開発ログで記録してください。
      </p>

      <button
        type="button"
        onClick={() => {
          onOpenNewVersionDevlog();
          onCancel();
        }}
        className="w-full rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2.5 text-sm font-medium text-orange-200 transition-colors hover:border-orange-500/50 hover:bg-orange-500/15"
      >
        新verの開発ログを書く
      </button>
    </StudioPanelEditShell>
  );
}
