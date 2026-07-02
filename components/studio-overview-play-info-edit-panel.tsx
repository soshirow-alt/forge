"use client";

import { useEffect, useState } from "react";
import { ProjectAccessEnvironmentFields } from "@/components/project-access-environment-fields";
import { ProjectEstimatedPlayTimeField } from "@/components/project-estimated-play-time-field";
import {
  StudioPanelEditShell,
  studioPanelInputClassName,
} from "@/components/studio-panel-edit-shell";
import { useGames } from "@/components/games-provider";
import { pickFeatureTagsFromGameTags, sanitizeFeatureTagsForSave } from "@/lib/forge-feature-tag-options";
import { validatePlayAccess } from "@/lib/project-access-form";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  EMPTY_PLAY_ENVIRONMENT_FORM,
  getPublicGameTags,
  mergePlayEnvironmentIntoTags,
  parsePlayEnvironmentFromTags,
  type PlayEnvironmentFormState,
} from "@/lib/play-environment";

export type StudioOverviewPlayInfoEditPanelProps = {
  projectId: string;
  onCancel: () => void;
  onSaved?: () => void;
};

export function StudioOverviewPlayInfoEditPanel({
  projectId,
  onCancel,
  onSaved,
}: StudioOverviewPlayInfoEditPanelProps) {
  const { getOwnedProjectById, updateProjectDetails, dataReady } = useGames();
  const game = getOwnedProjectById(projectId);

  const [playEnvironment, setPlayEnvironment] = useState<PlayEnvironmentFormState>(
    EMPTY_PLAY_ENVIRONMENT_FORM,
  );
  const [playUrl, setPlayUrl] = useState("");
  const [estimatedPlayTime, setEstimatedPlayTime] = useState("");
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }

    setPlayEnvironment(parsePlayEnvironmentFromTags(game.tags ?? []));
    setPlayUrl(game.playUrl ?? "");
    setEstimatedPlayTime(game.estimatedPlayTime ?? "");
    setFormLoaded(true);
  }, [game, formLoaded]);

  async function handleSave() {
    if (!game) {
      return;
    }

    setSaveError(null);
    setValidationError(null);

    const accessError = validatePlayAccess(playEnvironment, playUrl);
    if (accessError) {
      setValidationError(accessError);
      return;
    }

    setIsSaving(true);
    try {
      const featureTags = sanitizeFeatureTagsForSave(
        pickFeatureTagsFromGameTags(getPublicGameTags(game.tags ?? [])),
      );
      await updateProjectDetails(projectId, {
        ...buildProjectEditFormDataFromGame(game),
        playUrl: playUrl.trim(),
        estimatedPlayTime: estimatedPlayTime || undefined,
        tags: mergePlayEnvironmentIntoTags(featureTags, playEnvironment),
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
      title="プレイ情報・公開先を編集"
      onCancel={onCancel}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saveError={saveError}
      validationError={validationError}
    >
      <ProjectEstimatedPlayTimeField
        value={estimatedPlayTime}
        onChange={setEstimatedPlayTime}
        inputClassName={studioPanelInputClassName}
        inputId={`studio-play-time-${projectId}`}
      />

      <ProjectAccessEnvironmentFields
        playEnvironment={playEnvironment}
        onPlayEnvironmentChange={setPlayEnvironment}
        playUrl={playUrl}
        onPlayUrlChange={setPlayUrl}
        inputClassName={studioPanelInputClassName}
        playUrlInputId={`studio-play-url-${projectId}`}
        distributionRadioName={`studio-distribution-${projectId}`}
      />
    </StudioPanelEditShell>
  );
}
