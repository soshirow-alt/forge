"use client";

import { useEffect, useMemo, useState } from "react";
import { VersionPromptEditor } from "@/components/version-prompt-editor";
import { StudioPanelEditShell } from "@/components/studio-panel-edit-shell";
import { useGames } from "@/components/games-provider";
import { formatDevlogPublishedAt } from "@/hooks/use-game-devlogs-v0";
import { sortDevlogsNewestFirst } from "@/lib/devlogs";
import { resolvePlayableVersion } from "@/lib/playable-version";
import {
  createEmptyPromptDraft,
  draftFromVersionPrompt,
  sanitizePromptDrafts,
  validatePromptDrafts,
  type DeveloperPromptDraft,
} from "@/lib/version-prompt-form";

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
  const { getDevlogsByProject, getDeveloperVersionPrompts, saveDeveloperVersionPrompts } =
    useGames();
  const versionKey = resolvePlayableVersion(playableVersion);
  const versionLabel = `v${versionKey}`;

  const latestDevlog = useMemo(() => {
    const devlogs = sortDevlogsNewestFirst(getDevlogsByProject(projectId));
    return devlogs[0] ?? null;
  }, [getDevlogsByProject, projectId]);

  const [promptMode, setPromptMode] = useState<"none" | "custom">("none");
  const [promptDrafts, setPromptDrafts] = useState<DeveloperPromptDraft[]>([
    createEmptyPromptDraft(),
  ]);
  const [promptsLoaded, setPromptsLoaded] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getDeveloperVersionPrompts(projectId, versionKey).then((prompts) => {
      if (cancelled) {
        return;
      }
      if (prompts.length > 0) {
        setPromptMode("custom");
        setPromptDrafts(prompts.map(draftFromVersionPrompt));
      } else {
        setPromptMode("none");
        setPromptDrafts([createEmptyPromptDraft()]);
      }
      setPromptsLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [projectId, versionKey, getDeveloperVersionPrompts]);

  async function handleSave() {
    setSaveError(null);
    setValidationError(null);
    setShowValidation(false);

    if (promptMode === "custom") {
      const validation = validatePromptDrafts(promptDrafts);
      if (validation.blocking) {
        setShowValidation(true);
        setValidationError(validation.message);
        return;
      }
    }

    setIsSaving(true);
    try {
      const promptsToSave =
        promptMode === "custom" ? sanitizePromptDrafts(promptDrafts) : [];
      await saveDeveloperVersionPrompts(projectId, versionKey, promptsToSave);
      onSaved?.();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "保存に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!promptsLoaded) {
    return <p className="text-sm text-zinc-500">読み込み中…</p>;
  }

  return (
    <StudioPanelEditShell
      title="現在の開発ログを編集"
      onCancel={onCancel}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saveError={saveError}
      validationError={validationError}
    >
      <div>
        <p className="text-xs font-medium text-zinc-500">このverで変えたこと</p>
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
          公開済みの本文は直接書き換えません。追記や修正は新verの開発ログで記録してください。
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
        <p className="mt-1 text-[11px] text-zinc-600">
          {versionLabel} の質問事項。開発ログと一緒に保存されます。
        </p>
        <div className="mt-3">
          <VersionPromptEditor
            mode={promptMode}
            onModeChange={setPromptMode}
            drafts={promptDrafts}
            onDraftsChange={setPromptDrafts}
            versionLabel={versionLabel}
            showValidation={showValidation}
            embeddedInModal
          />
        </div>
      </div>
    </StudioPanelEditShell>
  );
}
