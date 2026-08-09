"use client";

import { useEffect, useMemo, useState } from "react";
import { ProjectPlayAccessFormFields } from "@/components/project-play-access-form-fields";
import { ProjectEstimatedPlayTimeField } from "@/components/project-estimated-play-time-field";
import { StudioFieldAnchor } from "@/components/studio-field-anchor";
import {
  StudioPanelEditShell,
  studioPanelInputClassName,
} from "@/components/studio-panel-edit-shell";
import type { StudioOverviewEditPanelCommonProps } from "@/components/studio-overview-edit-panel-types";
import { useGames } from "@/components/games-provider";
import { pickFeatureTagsFromGameTags, sanitizeFeatureTagsForSave } from "@/lib/forge-feature-tag-options";
import { ProjectDeviceEnvironmentFields } from "@/components/project-device-environment-fields";
import {
  isSpecifiedPlayAccessType,
  type SubmitPlayAccessType,
} from "@/lib/play-access-type";
import {
  EMPTY_PLAY_ENVIRONMENT_FORM,
  getPublicGameTags,
  parsePlayEnvironmentFromTags,
  type PlayEnvironmentFormState,
} from "@/lib/play-environment";
import { composeProjectTagsForWrite } from "@/lib/project-tags";
import { buildGamePlayInfoEditPersistPayload } from "@/lib/studio-game-overview-edit-persist";
import {
  distributionTypeFromPrimary,
  resolveGamePublishLinks,
} from "@/lib/project-publish-links";
import { STUDIO_FIELD_IDS, type StudioFieldId } from "@/lib/studio-preview-edit-targets";
import { PLAYER_COUNT_OPTIONS } from "@/lib/project-formal-filter-registry";
import { SubmitPrototypeMultiChipGroup } from "@/components/studio-submit-edit-panels";

export type StudioOverviewPlayInfoEditPanelProps = StudioOverviewEditPanelCommonProps & {
  highlightFieldId?: StudioFieldId | null;
};

export function StudioOverviewPlayInfoEditPanel({
  projectId,
  onCancel,
  onSaved,
  onPreviewPatchChange,
  highlightFieldId = null,
}: StudioOverviewPlayInfoEditPanelProps) {
  const { getOwnedProjectById, updateProjectDetails, dataReady } = useGames();
  const game = getOwnedProjectById(projectId);

  const [playEnvironment, setPlayEnvironment] = useState<PlayEnvironmentFormState>(
    EMPTY_PLAY_ENVIRONMENT_FORM,
  );
  const [estimatedPlayTime, setEstimatedPlayTime] = useState("");
  const [playAccessType, setPlayAccessType] = useState<SubmitPlayAccessType | "">("free");
  const [playerCounts, setPlayerCounts] = useState<string[]>([]);
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }

    setPlayEnvironment(parsePlayEnvironmentFromTags(game.tags ?? []));
    setEstimatedPlayTime(game.estimatedPlayTime ?? "");
    setPlayAccessType(
      isSpecifiedPlayAccessType(game.playAccessType) ? game.playAccessType : "",
    );
    setPlayerCounts(game.playerCounts ?? []);
    setFormLoaded(true);
  }, [game, formLoaded]);

  const previewSignature = useMemo(
    () =>
      JSON.stringify({
        playEnvironment,
        estimatedPlayTime,
        playAccessType,
      }),
    [playEnvironment, estimatedPlayTime, playAccessType],
  );

  useEffect(() => {
    setValidationError(null);
  }, [previewSignature]);

  function emitPreview(
    nextEnvironment: PlayEnvironmentFormState,
    nextEstimatedPlayTime: string,
    nextPlayAccessType: SubmitPlayAccessType | "" = playAccessType,
  ) {
    if (!game) {
      return;
    }
    const featureTags = sanitizeFeatureTagsForSave(
      pickFeatureTagsFromGameTags(getPublicGameTags(game.tags ?? [])),
    );
    const links = resolveGamePublishLinks(game);
    const env = {
      ...nextEnvironment,
      distribution:
        distributionTypeFromPrimary(links.publishDestinations) ||
        nextEnvironment.distribution,
    };
    onPreviewPatchChange?.({
      estimatedPlayTime: nextEstimatedPlayTime || undefined,
      tags: composeProjectTagsForWrite({
        featureTags,
        playEnvironment: env,
        existingTags: game.tags,
      }),
      ...(isSpecifiedPlayAccessType(nextPlayAccessType)
        ? { playAccessType: nextPlayAccessType }
        : {}),
    });
  }

  async function handleSave() {
    if (!game) {
      return;
    }

    setSaveError(null);
    setValidationError(null);

    if (!isSpecifiedPlayAccessType(playAccessType)) {
      setValidationError("料金・公開形態を選んでください。");
      return;
    }

    const featureTags = sanitizeFeatureTagsForSave(
      pickFeatureTagsFromGameTags(getPublicGameTags(game.tags ?? [])),
    );
    const links = resolveGamePublishLinks(game);
    const env = {
      ...playEnvironment,
      distribution:
        distributionTypeFromPrimary(links.publishDestinations) ||
        playEnvironment.distribution,
    };
    const built = buildGamePlayInfoEditPersistPayload(game, {
      playAccessType,
      estimatedPlayTime,
      playEnvironment: env,
      featureTags,
      playerCounts,
    });
    if (!built.ok) {
      setValidationError(built.message);
      return;
    }

    setIsSaving(true);
    try {
      await updateProjectDetails(projectId, built.payload);
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
      title="プレイ情報を編集"
      onCancel={onCancel}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saveError={saveError}
      validationError={validationError}
    >
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.playAccess}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.playAccess}
      >
        <ProjectPlayAccessFormFields
          value={playAccessType}
          onChange={(value) => {
            setPlayAccessType(value);
            emitPreview(playEnvironment, estimatedPlayTime, value);
          }}
          radioName={`studio-play-access-${projectId}`}
          showUnspecifiedHint={!isSpecifiedPlayAccessType(playAccessType)}
        />
      </StudioFieldAnchor>

      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.playInfo}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.playInfo}
        scrollOnHighlight={false}
      >
        <ProjectEstimatedPlayTimeField
          value={estimatedPlayTime}
          onChange={(value) => {
            setEstimatedPlayTime(value);
            emitPreview(playEnvironment, value);
          }}
          inputClassName={studioPanelInputClassName}
          inputId={`studio-play-time-${projectId}`}
        />
      </StudioFieldAnchor>

      <SubmitPrototypeMultiChipGroup
        label="プレイ人数（任意）"
        options={PLAYER_COUNT_OPTIONS}
        values={playerCounts}
        onChange={setPlayerCounts}
      />

      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.distribution}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.distribution}
      >
        <ProjectDeviceEnvironmentFields
          playEnvironment={playEnvironment}
          onPlayEnvironmentChange={(value) => {
            setPlayEnvironment(value);
            emitPreview(value, estimatedPlayTime);
          }}
        />
      </StudioFieldAnchor>
    </StudioPanelEditShell>
  );
}
