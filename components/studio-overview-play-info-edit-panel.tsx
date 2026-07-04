"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLinksFormFields } from "@/components/external-links-form-fields";
import { ProjectAccessEnvironmentFields } from "@/components/project-access-environment-fields";
import { ProjectEstimatedPlayTimeField } from "@/components/project-estimated-play-time-field";
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
import { validatePlayAccess } from "@/lib/project-access-form";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import type { Game } from "@/lib/mock-games";
import {
  EMPTY_PLAY_ENVIRONMENT_FORM,
  getPublicGameTags,
  mergePlayEnvironmentIntoTags,
  parsePlayEnvironmentFromTags,
  type PlayEnvironmentFormState,
} from "@/lib/play-environment";

export type StudioOverviewPlayInfoEditPanelProps = StudioOverviewEditPanelCommonProps;

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
}: StudioOverviewPlayInfoEditPanelProps) {
  const { getOwnedProjectById, updateProjectDetails, dataReady } = useGames();
  const game = getOwnedProjectById(projectId);

  const [playEnvironment, setPlayEnvironment] = useState<PlayEnvironmentFormState>(
    EMPTY_PLAY_ENVIRONMENT_FORM,
  );
  const [playUrl, setPlayUrl] = useState("");
  const [estimatedPlayTime, setEstimatedPlayTime] = useState("");
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
      }),
    [playEnvironment, playUrl, estimatedPlayTime, externalLinks],
  );

  useEffect(() => {
    setValidationError(null);
  }, [previewSignature]);

  function emitPreview(
    nextEnvironment: PlayEnvironmentFormState,
    nextPlayUrl: string,
    nextEstimatedPlayTime: string,
    nextExternalLinks: ExternalLinkFormValues,
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
      <ProjectEstimatedPlayTimeField
        value={estimatedPlayTime}
        onChange={(value) => {
          setEstimatedPlayTime(value);
          emitPreview(playEnvironment, playUrl, value, externalLinks);
        }}
        inputClassName={studioPanelInputClassName}
        inputId={`studio-play-time-${projectId}`}
      />

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

      <ExternalLinksFormFields
        formKey={`studio-play-info-${projectId}`}
        values={externalLinks}
        onChange={setExternalLinkField}
        inputClassName={studioPanelInputClassName}
      />
    </StudioPanelEditShell>
  );
}
