"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLinksFormFields } from "@/components/external-links-form-fields";
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
import {
  emptyExternalLinkFormValues,
  type ExternalLinkFormValues,
  type ProjectExternalLinksInput,
} from "@/lib/game-links";
import { ProjectAccessEnvironmentFields } from "@/components/project-access-environment-fields";
import { validatePlayAccess } from "@/lib/project-access-form";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  isSpecifiedPlayAccessType,
  type SubmitPlayAccessType,
} from "@/lib/play-access-type";
import type { Game } from "@/lib/mock-games";
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

function externalLinksFromGame(game: Game): ExternalLinkFormValues {
  return {
    steamUrl: game.steamUrl ?? "",
    itchUrl: game.itchUrl ?? "",
    discordUrl: game.discordUrl ?? "",
    xUrl: game.xUrl ?? "",
    officialUrl: game.officialUrl ?? "",
    youtubeUrl: game.youtubeUrl ?? "",
    githubUrl: game.githubUrl ?? "",
  };
}

function externalLinksPayload(
  values: ExternalLinkFormValues,
): ProjectExternalLinksInput {
  return {
    steamUrl: values.steamUrl.trim() || undefined,
    itchUrl: values.itchUrl.trim() || undefined,
    discordUrl: values.discordUrl.trim() || undefined,
    xUrl: values.xUrl.trim() || undefined,
    officialUrl: values.officialUrl.trim() || undefined,
    youtubeUrl: values.youtubeUrl.trim() || undefined,
    githubUrl: values.githubUrl.trim() || undefined,
  };
}

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
  const [externalLinks, setExternalLinks] = useState<ExternalLinkFormValues>(
    emptyExternalLinkFormValues(),
  );
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
    setExternalLinks(externalLinksFromGame(game));
    setFormLoaded(true);
  }, [game, formLoaded]);

  const previewSignature = useMemo(
    () =>
      JSON.stringify({
        playEnvironment,
        playUrl,
        estimatedPlayTime,
        externalLinks,
        playAccessType,
      }),
    [playEnvironment, playUrl, estimatedPlayTime, externalLinks, playAccessType],
  );

  useEffect(() => {
    setValidationError(null);
  }, [previewSignature]);

  function emitPreview(
    nextEnvironment: PlayEnvironmentFormState,
    nextPlayUrl: string,
    nextEstimatedPlayTime: string,
    nextExternalLinks: ExternalLinkFormValues,
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
      ...externalLinksPayload(nextExternalLinks),
    });
  }

  function setExternalLinkField(field: keyof ProjectExternalLinksInput, value: string) {
    setExternalLinks((current) => {
      const next = { ...current, [field]: value };
      emitPreview(playEnvironment, playUrl, estimatedPlayTime, next);
      return next;
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
        ...externalLinksPayload(externalLinks),
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
      <p className="text-xs text-zinc-600">
        プレイヤーが遊ぶ前に知っておきたい情報をまとめて設定します。
      </p>

      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.playAccess}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.playAccess}
      >
        <ProjectPlayAccessFormFields
          value={playAccessType}
          onChange={(value) => {
            setPlayAccessType(value);
            emitPreview(playEnvironment, playUrl, estimatedPlayTime, externalLinks, value);
          }}
          radioName={`studio-play-access-${projectId}`}
          showUnspecifiedHint={!isSpecifiedPlayAccessType(playAccessType)}
        />
      </StudioFieldAnchor>

      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.playInfo}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.playInfo}
      >
        <div className="space-y-4">
          <p className="text-xs font-medium text-zinc-500">プレイ情報</p>
          <ProjectEstimatedPlayTimeField
            value={estimatedPlayTime}
            onChange={(value) => {
              setEstimatedPlayTime(value);
              emitPreview(playEnvironment, playUrl, value, externalLinks);
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
          <p className="text-xs font-medium text-zinc-500">アクセス方法</p>
          <ProjectAccessEnvironmentFields
            playEnvironment={playEnvironment}
            onPlayEnvironmentChange={(value) => {
              setPlayEnvironment(value);
              emitPreview(value, playUrl, estimatedPlayTime, externalLinks);
            }}
            playUrl={playUrl}
            onPlayUrlChange={(value) => {
              setPlayUrl(value);
              emitPreview(playEnvironment, value, estimatedPlayTime, externalLinks);
            }}
            inputClassName={studioPanelInputClassName}
            playUrlInputId={`studio-play-url-${projectId}`}
            distributionRadioName={`studio-distribution-${projectId}`}
          />
        </div>
      </StudioFieldAnchor>

      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-500">公開先リンク</p>
        <ExternalLinksFormFields
          formKey={`studio-play-info-${projectId}`}
          values={externalLinks}
          onChange={setExternalLinkField}
          inputClassName={studioPanelInputClassName}
        />
      </div>
    </StudioPanelEditShell>
  );
}
