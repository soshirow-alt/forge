"use client";

import { useEffect, useState } from "react";
import { VersionPromptEditor } from "@/components/version-prompt-editor";
import { StudioPanelEditShell } from "@/components/studio-panel-edit-shell";
import { useGames } from "@/components/games-provider";
import { resolvePlayableVersion } from "@/lib/playable-version";
import {
  createEmptyPromptDraft,
  draftFromVersionPrompt,
  sanitizePromptDrafts,
  validatePromptDrafts,
  type DeveloperPromptDraft,
} from "@/lib/version-prompt-form";

export type StudioDevlogPromptsEditPanelProps = {
  projectId: string;
  playableVersion: string;
  onCancel: () => void;
  onSaved?: () => void;
};

export function StudioDevlogPromptsEditPanel({
  projectId,
  playableVersion,
  onCancel,
  onSaved,
}: StudioDevlogPromptsEditPanelProps) {
  const { getDeveloperVersionPrompts, saveDeveloperVersionPrompts } = useGames();
  const versionKey = resolvePlayableVersion(playableVersion);
  const versionLabel = `v${versionKey}`;

  const [mode, setMode] = useState<"none" | "custom">("none");
  const [drafts, setDrafts] = useState<DeveloperPromptDraft[]>([createEmptyPromptDraft()]);
  const [loaded, setLoaded] = useState(false);
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
        setMode("custom");
        setDrafts(prompts.map(draftFromVersionPrompt));
      } else {
        setMode("none");
        setDrafts([createEmptyPromptDraft()]);
      }
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [projectId, versionKey, getDeveloperVersionPrompts]);

  async function handleSave() {
    setSaveError(null);
    setValidationError(null);
    setShowValidation(false);

    if (mode === "custom") {
      const validation = validatePromptDrafts(drafts);
      if (validation.blocking) {
        setShowValidation(true);
        setValidationError(validation.message);
        return;
      }
    }

    setIsSaving(true);
    try {
      const promptsToSave = mode === "custom" ? sanitizePromptDrafts(drafts) : [];
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

  if (!loaded) {
    return <p className="text-sm text-zinc-500">読み込み中…</p>;
  }

  return (
    <StudioPanelEditShell
      title="質問事項を編集"
      onCancel={onCancel}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saveError={saveError}
      validationError={validationError}
    >
      <p className="text-xs text-zinc-600">
        {versionLabel} のプレイヤーへの質問を設定します。
      </p>
      <VersionPromptEditor
        mode={mode}
        onModeChange={setMode}
        drafts={drafts}
        onDraftsChange={setDrafts}
        versionLabel={versionLabel}
        showValidation={showValidation}
        embeddedInModal
      />
    </StudioPanelEditShell>
  );
}
