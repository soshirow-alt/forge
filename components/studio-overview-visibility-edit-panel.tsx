"use client";

import { useEffect, useState } from "react";
import {
  StudioPanelEditShell,
} from "@/components/studio-panel-edit-shell";
import { useGames } from "@/components/games-provider";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import { PROJECT_VISIBILITY_SECTION_HINT } from "@/lib/project-form-copy";
import {
  PROJECT_VISIBILITY_FORM_OPTIONS,
  type ProjectVisibility,
} from "@/lib/project-visibility";

export type StudioOverviewVisibilityEditPanelProps = {
  projectId: string;
  onCancel: () => void;
  onSaved?: () => void;
};

export function StudioOverviewVisibilityEditPanel({
  projectId,
  onCancel,
  onSaved,
}: StudioOverviewVisibilityEditPanelProps) {
  const { getOwnedProjectById, updateProjectDetails, dataReady } = useGames();
  const game = getOwnedProjectById(projectId);

  const [visibility, setVisibility] = useState<ProjectVisibility>("public");
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }

    setVisibility(game.visibility ?? "public");
    setFormLoaded(true);
  }, [game, formLoaded]);

  async function handleSave() {
    if (!game) {
      return;
    }

    setSaveError(null);
    setIsSaving(true);
    try {
      await updateProjectDetails(projectId, {
        ...buildProjectEditFormDataFromGame(game),
        visibility,
      });
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

  if (!dataReady || !game || !formLoaded) {
    return <p className="text-sm text-zinc-500">読み込み中…</p>;
  }

  return (
    <StudioPanelEditShell
      title="公開設定"
      onCancel={onCancel}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saveError={saveError}
    >
      <p className="text-xs text-zinc-600">{PROJECT_VISIBILITY_SECTION_HINT}</p>
      <div className="space-y-2">
        {PROJECT_VISIBILITY_FORM_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
              visibility === option.value
                ? "border-orange-500/40 bg-orange-500/5"
                : "border-zinc-800 bg-zinc-950/50"
            }`}
          >
            <input
              type="radio"
              name={`studio-visibility-${projectId}`}
              checked={visibility === option.value}
              onChange={() => setVisibility(option.value)}
              className="mt-0.5 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-300">{option.label}</span>
              <span className="mt-0.5 block text-xs text-zinc-600">{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </StudioPanelEditShell>
  );
}
