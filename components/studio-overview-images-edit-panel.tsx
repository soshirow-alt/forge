"use client";

import { useEffect, useState } from "react";
import { ProjectThumbnailFields } from "@/components/project-thumbnail-fields";
import {
  StudioPanelEditShell,
} from "@/components/studio-panel-edit-shell";
import type { StudioOverviewEditPanelCommonProps } from "@/components/studio-overview-edit-panel-types";
import { useGames } from "@/components/games-provider";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import { resolveProjectThumbnailUrls } from "@/lib/project-thumbnails";

export type StudioOverviewImagesEditPanelProps = StudioOverviewEditPanelCommonProps;

export function StudioOverviewImagesEditPanel({
  projectId,
  onCancel,
  onSaved,
  onPreviewPatchChange,
}: StudioOverviewImagesEditPanelProps) {
  const { getOwnedProjectById, updateProjectDetails, dataReady } = useGames();
  const game = getOwnedProjectById(projectId);

  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }

    setThumbnailUrls(resolveProjectThumbnailUrls(game));
    setFormLoaded(true);
  }, [game, formLoaded]);

  function handleThumbnailChange(urls: string[]) {
    setThumbnailUrls(urls);
    onPreviewPatchChange?.({
      thumbnailUrls: urls,
      thumbnailUrl: urls[0],
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
        thumbnailUrls,
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
      title="サムネイルを編集"
      onCancel={onCancel}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saveError={saveError}
    >
      <ProjectThumbnailFields
        inputId={`studio-images-${projectId}`}
        thumbnails={thumbnailUrls}
        onChange={handleThumbnailChange}
      />
    </StudioPanelEditShell>
  );
}
