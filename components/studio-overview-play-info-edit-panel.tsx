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
import {
  distributionTypeFromPrimary,
  resolveGamePublishLinks,
} from "@/lib/project-publish-links";
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
      tags: mergePlayEnvironmentIntoTags(featureTags, env),
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

    setIsSaving(true);
    try {
      const featureTags = sanitizeFeatureTagsForSave(
        pickFeatureTagsFromGameTags(getPublicGameTags(game.tags ?? [])),
      );
      const base = buildProjectEditFormDataFromGame(game);
      const links = resolveGamePublishLinks(game);
      const env = {
        ...playEnvironment,
        distribution:
          distributionTypeFromPrimary(links.publishDestinations) ||
          playEnvironment.distribution,
      };
      await updateProjectDetails(projectId, {
        ...base,
        // Preserve publish destinations / related links / playUrl from existing game
        playUrl: base.playUrl,
        publishDestinations: base.publishDestinations,
        relatedLinks: base.relatedLinks,
        steamUrl: base.steamUrl,
        itchUrl: base.itchUrl,
        githubUrl: base.githubUrl,
        discordUrl: base.discordUrl,
        officialUrl: base.officialUrl,
        xUrl: base.xUrl,
        youtubeUrl: base.youtubeUrl,
        estimatedPlayTime: estimatedPlayTime || undefined,
        playAccessType,
        tags: mergePlayEnvironmentIntoTags(featureTags, env),
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
