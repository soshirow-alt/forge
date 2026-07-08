"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLinksFormFields } from "@/components/external-links-form-fields";
import { StudioFieldAnchor } from "@/components/studio-field-anchor";
import {
  StudioPanelEditShell,
  studioPanelInputClassName,
} from "@/components/studio-panel-edit-shell";
import type { StudioOverviewEditPanelCommonProps } from "@/components/studio-overview-edit-panel-types";
import { useGames } from "@/components/games-provider";
import {
  emptyExternalLinkFormValues,
  type ExternalLinkFormValues,
  type ProjectExternalLinksInput,
} from "@/lib/game-links";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  PROJECT_VISIBILITY_FORM_OPTIONS,
  type ProjectVisibility,
} from "@/lib/project-visibility";
import type { Game } from "@/lib/mock-games";
import { STUDIO_FIELD_IDS, type StudioFieldId } from "@/lib/studio-preview-edit-targets";

export type StudioOverviewPublicationEditPanelProps = StudioOverviewEditPanelCommonProps & {
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

export function StudioOverviewPublicationEditPanel({
  projectId,
  onCancel,
  onSaved,
  onPreviewPatchChange,
  highlightFieldId = null,
}: StudioOverviewPublicationEditPanelProps) {
  const { getOwnedProjectById, updateProjectDetails, dataReady } = useGames();
  const game = getOwnedProjectById(projectId);

  const [visibility, setVisibility] = useState<ProjectVisibility>("public");
  const [externalLinks, setExternalLinks] = useState<ExternalLinkFormValues>(
    emptyExternalLinkFormValues(),
  );
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }
    setVisibility(game.visibility ?? "public");
    setExternalLinks(externalLinksFromGame(game));
    setFormLoaded(true);
  }, [game, formLoaded]);

  const previewSignature = useMemo(
    () => JSON.stringify({ visibility, externalLinks }),
    [visibility, externalLinks],
  );

  useEffect(() => {
    setSaveError(null);
  }, [previewSignature]);

  function emitPreview(
    nextVisibility: ProjectVisibility,
    nextExternalLinks: ExternalLinkFormValues,
  ) {
    onPreviewPatchChange?.({
      visibility: nextVisibility,
      ...externalLinksPayload(nextExternalLinks),
    });
  }

  function setExternalLinkField(field: keyof ProjectExternalLinksInput, value: string) {
    setExternalLinks((current) => {
      const next = { ...current, [field]: value };
      emitPreview(visibility, next);
      return next;
    });
  }

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
      title="公開先・公開設定を編集"
      onCancel={onCancel}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saveError={saveError}
    >
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.publication}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.publication}
        scrollOnHighlight={false}
      >
        <ExternalLinksFormFields
          formKey={`studio-publication-${projectId}`}
          values={externalLinks}
          onChange={setExternalLinkField}
          inputClassName={studioPanelInputClassName}
        />
      </StudioFieldAnchor>

      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-400">公開設定</p>
        <div className="space-y-2">
          {PROJECT_VISIBILITY_FORM_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex w-full min-w-0 max-w-full box-border cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
                visibility === option.value
                  ? "border-orange-500/40 bg-orange-500/5"
                  : "border-zinc-800 bg-zinc-950/50"
              }`}
            >
              <input
                type="radio"
                name={`studio-visibility-${projectId}`}
                checked={visibility === option.value}
                onChange={() => {
                  setVisibility(option.value);
                  emitPreview(option.value, externalLinks);
                }}
                className="mt-0.5 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-zinc-300">{option.label}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </StudioPanelEditShell>
  );
}
