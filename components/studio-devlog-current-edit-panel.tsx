"use client";

import { useEffect, useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import { StudioPanelEditShell } from "@/components/studio-panel-edit-shell";
import { VersionPromptStudioModal } from "@/components/version-prompt-studio-modal";
import { summarizeVersionPromptSettings } from "@/components/version-prompt-editor-dialog";
import { useGames } from "@/components/games-provider";
import { formatDevlogPublishedAt } from "@/hooks/use-game-devlogs-v0";
import { sortDevlogsNewestFirst } from "@/lib/devlogs";
import { resolvePlayableVersion } from "@/lib/playable-version";
import {
  createPresetPromptDraft,
  draftFromVersionPrompt,
  resolvePromptEditorMode,
  type DeveloperPromptDraft,
} from "@/lib/version-prompt-form";

const panelButtonClassName =
  "inline-flex w-full items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-100";

export type StudioDevlogCurrentEditPanelProps = {
  projectId: string;
  playableVersion: string;
  onCancel: () => void;
  onOpenNewVersionDevlog: () => void;
  onSaved?: () => void;
};

export function StudioDevlogCurrentEditPanel({
  projectId,
  playableVersion,
  onCancel,
  onOpenNewVersionDevlog,
  onSaved,
}: StudioDevlogCurrentEditPanelProps) {
  const { getDevlogsByProject, getDeveloperVersionPrompts } = useGames();
  const versionKey = resolvePlayableVersion(playableVersion);
  const versionLabel = `v${versionKey}`;

  const latestDevlog = useMemo(() => {
    const devlogs = sortDevlogsNewestFirst(getDevlogsByProject(projectId));
    return devlogs[0] ?? null;
  }, [getDevlogsByProject, projectId]);

  const [promptMode, setPromptMode] = useState<"none" | "custom">("none");
  const [promptDrafts, setPromptDrafts] = useState<DeveloperPromptDraft[]>([
    createPresetPromptDraft("replay"),
  ]);
  const [promptsLoaded, setPromptsLoaded] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState(false);

  async function loadPrompts() {
    const prompts = await getDeveloperVersionPrompts(projectId, versionKey);
    if (prompts.length > 0) {
      const nextDrafts = prompts.map(draftFromVersionPrompt);
      setPromptMode(resolvePromptEditorMode(nextDrafts));
      setPromptDrafts(nextDrafts);
    } else {
      setPromptMode("none");
      setPromptDrafts([createPresetPromptDraft("replay")]);
    }
    setPromptsLoaded(true);
  }

  useEffect(() => {
    let cancelled = false;
    void getDeveloperVersionPrompts(projectId, versionKey).then((prompts) => {
      if (cancelled) {
        return;
      }
      if (prompts.length > 0) {
        const nextDrafts = prompts.map(draftFromVersionPrompt);
        setPromptMode(resolvePromptEditorMode(nextDrafts));
        setPromptDrafts(nextDrafts);
      } else {
        setPromptMode("none");
        setPromptDrafts([createPresetPromptDraft("replay")]);
      }
      setPromptsLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [projectId, versionKey, getDeveloperVersionPrompts]);

  const promptSummary = summarizeVersionPromptSettings(promptMode, promptDrafts);

  if (!promptsLoaded) {
    return <p className="text-sm text-zinc-500">読み込み中…</p>;
  }

  return (
    <>
      <StudioPanelEditShell
        title={`${versionLabel} の記録と問い`}
        backLabel="← 開発ログに戻る"
        onCancel={onCancel}
        hideSave
      >
        <div>
          <p className="text-xs font-medium text-zinc-500">公開ログ（読み取り専用）</p>
          {latestDevlog ? (
            <div className="mt-2 rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-3 py-2.5">
              <p className="text-sm font-medium text-zinc-200">{latestDevlog.title}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {formatDevlogPublishedAt(latestDevlog.date)}
                {latestDevlog.publishedVersion ? ` · ${latestDevlog.publishedVersion}` : ""}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">{latestDevlog.content}</p>
            </div>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              開発ログはまだありません。
            </p>
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
            公開済みの本文は変更できません。修正や追記は新verの開発ログで記録してください。
          </p>
          <button
            type="button"
            onClick={() => {
              onOpenNewVersionDevlog();
              onCancel();
            }}
            className="mt-2 w-full rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
          >
            新verの開発ログを書く
          </button>
        </div>

        <div className="border-t border-zinc-800/60 pt-4">
          <p className="text-xs font-medium text-zinc-500">
            プレイヤーに見てほしいこと・答えてほしいこと
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
            {versionLabel} の質問設定です。プレイ後に届けてほしい問いを調整できます。
          </p>
          <div className="mt-2 flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-3 py-2">
            <span className="text-xs text-zinc-500">現在の設定</span>
            <span className="text-sm font-medium text-zinc-200">{promptSummary}</span>
          </div>
          <button
            type="button"
            onClick={() => setPromptModalOpen(true)}
            className={`${panelButtonClassName} mt-2`}
          >
            <Settings2 className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            質問設定を開く
          </button>
        </div>
      </StudioPanelEditShell>

      <VersionPromptStudioModal
        projectId={projectId}
        playableVersion={playableVersion}
        open={promptModalOpen}
        onClose={() => setPromptModalOpen(false)}
        onSaved={() => {
          void loadPrompts();
          onSaved?.();
        }}
        dialogTitle="プレイヤーに見てほしいこと・答えてほしいこと"
        dialogSubtitle={`${versionLabel} — 未設定の場合はデフォルトの問いが表示されます`}
      />
    </>
  );
}
