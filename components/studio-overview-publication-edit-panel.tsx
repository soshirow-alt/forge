"use client";

import { useEffect, useMemo, useState } from "react";
import { PublishDestinationsFormFields } from "@/components/publish-destinations-form-fields";
import { RelatedLinksFormFields } from "@/components/related-links-form-fields";
import { StudioFieldAnchor } from "@/components/studio-field-anchor";
import {
  StudioPanelEditShell,
  studioPanelInputClassName,
} from "@/components/studio-panel-edit-shell";
import type { StudioOverviewEditPanelCommonProps } from "@/components/studio-overview-edit-panel-types";
import { useGames } from "@/components/games-provider";
import { previewLegacyLinkFieldsFromPublish } from "@/lib/project-publish-write-adapter";
import { buildGamePublicationEditPersistPayload } from "@/lib/studio-game-overview-edit-persist";
import {
  createEmptyPublishDestination,
  resolveGamePublishLinks,
  validatePublishDestinations,
  type PublishDestination,
  type RelatedLink,
} from "@/lib/project-publish-links";
import {
  PROJECT_VISIBILITY_FORM_OPTIONS,
  type ProjectVisibility,
} from "@/lib/project-visibility";
import { STUDIO_FIELD_IDS, type StudioFieldId } from "@/lib/studio-preview-edit-targets";

export type StudioOverviewPublicationEditPanelProps = StudioOverviewEditPanelCommonProps & {
  highlightFieldId?: StudioFieldId | null;
};

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
  const [publishDestinations, setPublishDestinations] = useState<PublishDestination[]>([
    createEmptyPublishDestination({
      isPrimary: true,
      kind: "other",
      usageMethod: "other",
    }),
  ]);
  const [relatedLinks, setRelatedLinks] = useState<RelatedLink[]>([]);
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }
    setVisibility(game.visibility ?? "public");
    const links = resolveGamePublishLinks(game);
    setPublishDestinations(
      links.publishDestinations.length > 0
        ? links.publishDestinations
        : [
            createEmptyPublishDestination({
              isPrimary: true,
              kind: "other",
              usageMethod: "other",
            }),
          ],
    );
    setRelatedLinks(links.relatedLinks);
    setFormLoaded(true);
  }, [game, formLoaded]);

  const previewSignature = useMemo(
    () => JSON.stringify({ visibility, publishDestinations, relatedLinks }),
    [visibility, publishDestinations, relatedLinks],
  );

  useEffect(() => {
    setSaveError(null);
    setValidationError(null);
  }, [previewSignature]);

  function emitPreview(
    nextVisibility: ProjectVisibility,
    nextDestinations: PublishDestination[],
    nextRelated: RelatedLink[],
  ) {
    const legacy = previewLegacyLinkFieldsFromPublish(nextDestinations, nextRelated);
    onPreviewPatchChange?.({
      visibility: nextVisibility,
      publishDestinations: nextDestinations,
      relatedLinks: nextRelated,
      playUrl: legacy.playUrl,
      steamUrl: legacy.steamUrl,
      itchUrl: legacy.itchUrl,
      githubUrl: legacy.githubUrl,
      discordUrl: legacy.discordUrl,
      officialUrl: legacy.officialUrl,
      xUrl: legacy.xUrl,
      youtubeUrl: legacy.youtubeUrl,
    });
  }

  async function handleSave() {
    if (!game) {
      return;
    }
    setSaveError(null);
    setValidationError(null);

    const publishError = validatePublishDestinations(publishDestinations);
    if (publishError) {
      setValidationError(publishError);
      return;
    }

    setIsSaving(true);
    try {
      await updateProjectDetails(
        projectId,
        buildGamePublicationEditPersistPayload(game, {
          visibility,
          publishDestinations,
          relatedLinks,
        }),
      );
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
      validationError={validationError}
    >
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.publication}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.publication}
        scrollOnHighlight={false}
      >
        <div className="space-y-4">
          <PublishDestinationsFormFields
            value={publishDestinations}
            onChange={(next) => {
              setPublishDestinations(next);
              emitPreview(visibility, next, relatedLinks);
            }}
            inputClassName={studioPanelInputClassName}
            formKey={`studio-publication-publish-${projectId}`}
          />
          <RelatedLinksFormFields
            value={relatedLinks}
            onChange={(next) => {
              setRelatedLinks(next);
              emitPreview(visibility, publishDestinations, next);
            }}
            inputClassName={studioPanelInputClassName}
            formKey={`studio-publication-related-${projectId}`}
          />
        </div>
      </StudioFieldAnchor>

      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-400">公開設定</p>
        <div className="space-y-2">
          {PROJECT_VISIBILITY_FORM_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex w-full min-w-0 max-w-full box-border cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
                visibility === option.value
                  ? "border-violet-500/40 bg-violet-500/5"
                  : "border-zinc-800 bg-zinc-950/50"
              }`}
            >
              <input
                type="radio"
                name={`studio-visibility-${projectId}`}
                checked={visibility === option.value}
                onChange={() => {
                  setVisibility(option.value);
                  emitPreview(option.value, publishDestinations, relatedLinks);
                }}
                className="mt-0.5 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
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
