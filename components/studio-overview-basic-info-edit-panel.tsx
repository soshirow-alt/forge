"use client";

import { useEffect, useState } from "react";
import { ProjectPhaseFormFields } from "@/components/project-phase-form-fields";
import { ProjectOneLineDescriptionField } from "@/components/project-one-line-description-field";
import {
  StudioPanelEditShell,
  studioPanelInputClassName,
} from "@/components/studio-panel-edit-shell";
import type { StudioOverviewEditPanelCommonProps } from "@/components/studio-overview-edit-panel-types";
import { useGames } from "@/components/games-provider";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  clampProjectOneLineDescription,
  validateProjectOneLineDescription,
} from "@/lib/project-one-line-description";

export type StudioOverviewBasicInfoEditPanelProps = StudioOverviewEditPanelCommonProps;

export function StudioOverviewBasicInfoEditPanel({
  projectId,
  onCancel,
  onSaved,
  onPreviewPatchChange,
}: StudioOverviewBasicInfoEditPanelProps) {
  const { getOwnedProjectById, updateProjectDetails, dataReady } = useGames();
  const game = getOwnedProjectById(projectId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState("");
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }

    setTitle(game.title);
    setDescription(clampProjectOneLineDescription(game.description ?? ""));
    setPhase(game.phase);
    setFormLoaded(true);
  }, [game, formLoaded]);

  function emitPreview(next: { title: string; description: string; phase: string }) {
    onPreviewPatchChange?.({
      title: next.title,
      description: clampProjectOneLineDescription(next.description),
      phase: next.phase,
    });
  }

  async function handleSave() {
    if (!game) {
      return;
    }

    setSaveError(null);
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError("タイトルを入力してください。");
      return;
    }
    if (!phase) {
      setValidationError("開発フェーズを選んでください。");
      return;
    }

    const leadError = validateProjectOneLineDescription(description);
    if (leadError) {
      setValidationError(leadError);
      return;
    }

    setIsSaving(true);
    try {
      await updateProjectDetails(projectId, {
        ...buildProjectEditFormDataFromGame(game),
        title: trimmedTitle,
        description: description.trim(),
        phase,
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
      title="基本情報を編集"
      onCancel={onCancel}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saveError={saveError}
      validationError={validationError}
    >
      <div>
        <label htmlFor={`studio-basic-title-${projectId}`} className="text-xs font-medium text-zinc-500">
          タイトル
        </label>
        <input
          id={`studio-basic-title-${projectId}`}
          type="text"
          required
          value={title}
          onChange={(event) => {
            const nextTitle = event.target.value;
            setTitle(nextTitle);
            emitPreview({ title: nextTitle, description, phase });
          }}
          className={studioPanelInputClassName}
        />
      </div>

      <ProjectOneLineDescriptionField
        id={`studio-basic-lead-${projectId}`}
        value={description}
        onChange={(nextDescription) => {
          setDescription(nextDescription);
          emitPreview({ title, description: nextDescription, phase });
        }}
        inputClassName={studioPanelInputClassName}
      />

      <ProjectPhaseFormFields
        value={phase}
        onChange={(nextPhase) => {
          setPhase(nextPhase);
          emitPreview({ title, description, phase: nextPhase });
        }}
        radioName={`studio-basic-phase-${projectId}`}
      />
    </StudioPanelEditShell>
  );
}
