"use client";

import { useEffect, useState } from "react";
import { ProjectAlreadyReleasedFormFields } from "@/components/project-already-released-form-fields";
import { ProjectPhaseFormFields } from "@/components/project-phase-form-fields";
import { ProjectOneLineDescriptionField } from "@/components/project-one-line-description-field";
import { ProjectTitleField } from "@/components/project-title-field";
import { StudioFieldAnchor } from "@/components/studio-field-anchor";
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
import { STUDIO_FIELD_IDS, type StudioFieldId } from "@/lib/studio-preview-edit-targets";

export type StudioOverviewBasicInfoEditPanelProps = StudioOverviewEditPanelCommonProps & {
  highlightFieldId?: StudioFieldId | null;
};

export function StudioOverviewBasicInfoEditPanel({
  projectId,
  onCancel,
  onSaved,
  onPreviewPatchChange,
  highlightFieldId = null,
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

  function emitPreview(next: {
    title: string;
    description: string;
    phase: string;
    declareAlreadyReleased?: boolean;
  }) {
    onPreviewPatchChange?.({
      title: clampProjectTitle(next.title),
      description: clampProjectOneLineDescription(next.description),
      phase: next.phase,
      ...(next.declareAlreadyReleased || readOnlyReleased
        ? { releaseStatus: "released" as const }
        : { releaseStatus: "in_development" as const }),
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
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.title}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.title}
      >
        <ProjectTitleField
          id={`studio-basic-title-${projectId}`}
          value={title}
          onChange={(nextTitle) => {
            setTitle(nextTitle);
            emitPreview({ title: nextTitle, description, phase, declareAlreadyReleased });
          }}
          inputClassName={studioPanelInputClassName}
          required
        />
      </StudioFieldAnchor>

      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.catchCopy}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.catchCopy}
      >
        <ProjectOneLineDescriptionField
          id={`studio-basic-lead-${projectId}`}
          value={description}
          onChange={(nextDescription) => {
            setDescription(nextDescription);
            emitPreview({
              title,
              description: nextDescription,
              phase,
              declareAlreadyReleased,
            });
          }}
          inputClassName={studioPanelInputClassName}
        />
      </StudioFieldAnchor>

      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.phase}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.phase}
      >
        <ProjectPhaseFormFields
          value={phase}
          onChange={(nextPhase) => {
            setPhase(nextPhase);
            emitPreview({ title, description, phase: nextPhase, declareAlreadyReleased });
          }}
          radioName={`studio-basic-phase-${projectId}`}
        />
      </StudioFieldAnchor>

      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.alreadyReleased}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.alreadyReleased}
      >
        <ProjectAlreadyReleasedFormFields
          scheduled={readOnlyReleased || declareAlreadyReleased}
          readOnlyReleased={readOnlyReleased}
          onSchedule={() => {
            setDeclareAlreadyReleased(true);
            emitPreview({ title, description, phase, declareAlreadyReleased: true });
          }}
          onCancelSchedule={() => {
            setDeclareAlreadyReleased(false);
            emitPreview({ title, description, phase, declareAlreadyReleased: false });
          }}
        />
      </StudioFieldAnchor>
    </StudioPanelEditShell>
  );
}
