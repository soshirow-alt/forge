"use client";

import { useEffect, useState } from "react";
import { ProjectAlreadyReleasedConfirmModal } from "@/components/project-already-released-confirm-modal";
import { ProjectAlreadyReleasedFormFields } from "@/components/project-already-released-form-fields";
import { ProjectPhaseFormFields } from "@/components/project-phase-form-fields";
import { ProjectOneLineDescriptionField } from "@/components/project-one-line-description-field";
import { ProjectTitleField } from "@/components/project-title-field";
import {
  StudioPanelEditShell,
  studioPanelInputClassName,
} from "@/components/studio-panel-edit-shell";
import type { StudioOverviewEditPanelCommonProps } from "@/components/studio-overview-edit-panel-types";
import { useGames } from "@/components/games-provider";
import { hasEverBeenReleasedForEdit } from "@/lib/game-player-display";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  clampProjectOneLineDescription,
  validateProjectOneLineDescription,
} from "@/lib/project-one-line-description";
import { clampProjectTitle, validateProjectTitle } from "@/lib/project-title";

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
  const [declareAlreadyReleased, setDeclareAlreadyReleased] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false);

  const readOnlyReleased = game ? hasEverBeenReleasedForEdit(game) : false;

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }

    setTitle(clampProjectTitle(game.title));
    setDescription(clampProjectOneLineDescription(game.description ?? ""));
    setPhase(game.phase);
    setDeclareAlreadyReleased(false);
    setFormLoaded(true);
  }, [game, formLoaded]);

  useEffect(() => {
    setValidationError(null);
  }, [title, description, phase, declareAlreadyReleased]);

  function emitPreview(next: { title: string; description: string; phase: string }) {
    onPreviewPatchChange?.({
      title: clampProjectTitle(next.title),
      description: clampProjectOneLineDescription(next.description),
      phase: next.phase,
    });
  }

  async function performSave() {
    if (!game) {
      return;
    }

    setIsSaving(true);
    try {
      await updateProjectDetails(projectId, {
        ...buildProjectEditFormDataFromGame(game),
        title: title.trim(),
        description: description.trim(),
        phase,
        declareAlreadyReleased: declareAlreadyReleased || undefined,
      });
      onSaved?.();
      setReleaseConfirmOpen(false);
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
    const titleError = validateProjectTitle(title);
    if (titleError) {
      setValidationError(titleError);
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

    if (declareAlreadyReleased && !readOnlyReleased) {
      setReleaseConfirmOpen(true);
      return;
    }

    await performSave();
  }

  if (!dataReady || !game || !formLoaded) {
    return <p className="text-sm text-zinc-500">読み込み中…</p>;
  }

  return (
    <>
      <StudioPanelEditShell
        title="基本情報を編集"
        onCancel={onCancel}
        onSave={() => void handleSave()}
        isSaving={isSaving}
        saveError={saveError}
        validationError={validationError}
      >
        <ProjectTitleField
          id={`studio-basic-title-${projectId}`}
          value={title}
          onChange={(nextTitle) => {
            setTitle(nextTitle);
            emitPreview({ title: nextTitle, description, phase });
          }}
          inputClassName={studioPanelInputClassName}
          required
        />

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

        <ProjectAlreadyReleasedFormFields
          checked={readOnlyReleased || declareAlreadyReleased}
          onChange={setDeclareAlreadyReleased}
          readOnlyReleased={readOnlyReleased}
          inputId={`studio-basic-already-released-${projectId}`}
        />
      </StudioPanelEditShell>

      <ProjectAlreadyReleasedConfirmModal
        open={releaseConfirmOpen}
        busy={isSaving}
        onCancel={() => setReleaseConfirmOpen(false)}
        onConfirm={() => void performSave()}
      />
    </>
  );
}
