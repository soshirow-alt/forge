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
import { ProjectAccessEnvironmentFields } from "@/components/project-access-environment-fields";
import { validatePlayAccess } from "@/lib/project-access-form";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  isSpecifiedPlayAccessType,
  type SubmitPlayAccessType,
} from "@/lib/play-access-type";
import {
  EMPTY_PLAY_ENVIRONMENT_FORM,
  getPublicGameTags,
  mergePlayEnvironmentIntoTags,
  parsePlayEnvironmentFromTags,
  type PlayEnvironmentFormState,
} from "@/lib/play-environment";
import { STUDIO_FIELD_IDS, type StudioFieldId } from "@/lib/studio-preview-edit-targets";

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
  const [playUrl, setPlayUrl] = useState("");
  const [estimatedPlayTime, setEstimatedPlayTime] = useState("");
  const [playAccessType, setPlayAccessType] = useState<SubmitPlayAccessType | "">("free");
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
    setPlayAccessType(
      isSpecifiedPlayAccessType(game.playAccessType) ? game.playAccessType : "",
    );
    setFormLoaded(true);
  }, [game, formLoaded]);

  const previewSignature = useMemo(
    () =>
      JSON.stringify({
        playEnvironment,
        playUrl,
        estimatedPlayTime,
        playAccessType,
      }),
    [playEnvironment, playUrl, estimatedPlayTime, playAccessType],
  );

  useEffect(() => {
    setValidationError(null);
  }, [previewSignature]);

  function emitPreview(
    nextEnvironment: PlayEnvironmentFormState,
    nextPlayUrl: string,
    nextEstimatedPlayTime: string,
    nextPlayAccessType: SubmitPlayAccessType | "" = playAccessType,
  ) {
    if (!game) {
      return;
    }
    const featureTags = sanitizeFeatureTagsForSave(
      pickFeatureTagsFromGameTags(getPublicGameTags(game.tags ?? [])),
    );
    onPreviewPatchChange?.({
      playUrl: nextPlayUrl,
      estimatedPlayTime: nextEstimatedPlayTime || undefined,
      tags: mergePlayEnvironmentIntoTags(featureTags, nextEnvironment),
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

    const accessError = validatePlayAccess(playEnvironment, playUrl);
    if (accessError) {
      setValidationError(accessError);
      return;
    }
    if (!isSpecifiedPlayAccessType(playAccessType)) {
      setValidationError("料金・公開形態を選んでください。");
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
        playAccessType,
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
      title="プレイ情報を編集"
      onCancel={onCancel}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saveError={saveError}
      validationError={validationError}
    >
      <p className="text-xs text-zinc-600">
        プレイヤーが遊ぶ前に知っておきたい料金・時間・アクセス方法を設定します。
      </p>

      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.playAccess}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.playAccess}
      >
        <ProjectPlayAccessFormFields
          value={playAccessType}
          onChange={(value) => {
            setPlayAccessType(value);
            emitPreview(playEnvironment, playUrl, estimatedPlayTime, value);
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
        <div className="space-y-4">
          <p className="text-xs font-medium text-zinc-500">想定プレイ時間</p>
          <ProjectEstimatedPlayTimeField
            value={estimatedPlayTime}
            onChange={(value) => {
              setEstimatedPlayTime(value);
              emitPreview(playEnvironment, playUrl, value);
            }}
            inputClassName={studioPanelInputClassName}
            inputId={`studio-play-time-${projectId}`}
          />
        </div>
      </StudioFieldAnchor>

      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.distribution}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.distribution}
      >
        <div className="space-y-4">
          <p className="text-xs font-medium text-zinc-500">アクセス方法・対応環境</p>
          <ProjectAccessEnvironmentFields
            playEnvironment={playEnvironment}
            onPlayEnvironmentChange={(value) => {
              setPlayEnvironment(value);
              emitPreview(value, playUrl, estimatedPlayTime);
            }}
            playUrl={playUrl}
            onPlayUrlChange={(value) => {
              setPlayUrl(value);
              emitPreview(playEnvironment, value, estimatedPlayTime);
            }}
            inputClassName={studioPanelInputClassName}
            playUrlInputId={`studio-play-url-${projectId}`}
            distributionRadioName={`studio-distribution-${projectId}`}
          />
        </div>
      </StudioFieldAnchor>
    </StudioPanelEditShell>
  );
}
