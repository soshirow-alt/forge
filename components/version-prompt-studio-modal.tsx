"use client";

import { useEffect, useState } from "react";
import { VersionPromptEditorDialog } from "@/components/version-prompt-editor-dialog";
import { useGames } from "@/components/games-provider";
import { resolvePlayableVersion } from "@/lib/playable-version";
import {
  createPresetPromptDraft,
  draftFromVersionPrompt,
  resolvePromptEditorMode,
  sanitizePromptDrafts,
  validatePromptDrafts,
  type DeveloperPromptDraft,
} from "@/lib/version-prompt-form";

type VersionPromptStudioModalProps = {
  projectId: string;
  playableVersion: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  dialogTitle?: string;
  dialogSubtitle?: string;
};

export function VersionPromptStudioModal({
  projectId,
  playableVersion,
  open,
  onClose,
  onSaved,
  dialogTitle,
  dialogSubtitle,
}: VersionPromptStudioModalProps) {
  const { getDeveloperVersionPrompts, saveDeveloperVersionPrompts } = useGames();
  const [mode, setMode] = useState<"none" | "custom">("none");
  const [drafts, setDrafts] = useState<DeveloperPromptDraft[]>([
    createPresetPromptDraft("replay"),
  ]);
  const [loaded, setLoaded] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const versionKey = resolvePlayableVersion(playableVersion);
  const versionLabel = `v${versionKey}`;

  useEffect(() => {
    if (!open) {
      setLoaded(false);
      setShowValidation(false);
      setSaveError(null);
      return;
    }

    let cancelled = false;
    void getDeveloperVersionPrompts(projectId, versionKey).then((prompts) => {
      if (cancelled) {
        return;
      }
      if (prompts.length > 0) {
        const nextDrafts = prompts.map(draftFromVersionPrompt);
        setMode(resolvePromptEditorMode(nextDrafts));
        setDrafts(nextDrafts);
      } else {
        setMode("none");
        setDrafts([createPresetPromptDraft("replay")]);
      }
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [open, projectId, versionKey, getDeveloperVersionPrompts]);

  async function handleSave() {
    setSaveError(null);
    setShowValidation(false);

    const validation = validatePromptDrafts(drafts);
    if (validation.blocking) {
      setShowValidation(true);
      setSaveError(validation.message);
      return;
    }

    setSaving(true);
    try {
      const promptsToSave = sanitizePromptDrafts(drafts);
      await saveDeveloperVersionPrompts(projectId, versionKey, promptsToSave);
      onSaved?.();
      onClose();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "保存に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open || !loaded) {
    return null;
  }

  return (
    <VersionPromptEditorDialog
      open={open}
      onClose={onClose}
      mode={mode}
      onModeChange={setMode}
      drafts={drafts}
      onDraftsChange={setDrafts}
      versionLabel={versionLabel}
      showValidation={showValidation}
      onConfirm={handleSave}
      confirming={saving}
      confirmError={saveError}
      title={dialogTitle}
      subtitle={dialogSubtitle}
    />
  );
}
