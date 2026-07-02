"use client";

import { useEffect, useState } from "react";
import { ProjectThumbnailFields } from "@/components/project-thumbnail-fields";
import {
  StudioPanelEditShell,
} from "@/components/studio-panel-edit-shell";
import { useGames } from "@/components/games-provider";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import { resolveProjectGenres } from "@/lib/project-genres";
import { resolveProjectThumbnailUrls } from "@/lib/project-thumbnails";

export type StudioOverviewImagesEditPanelProps = {
  projectId: string;
  onCancel: () => void;
  onSaved?: () => void;
};

export function StudioOverviewImagesEditPanel({
  projectId,
  onCancel,
  onSaved,
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

  const genres = resolveProjectGenres(game);

  return (
    <StudioPanelEditShell
      title="画像を編集"
      onCancel={onCancel}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saveError={saveError}
    >
      <ProjectThumbnailFields
        inputId={`studio-images-${projectId}`}
        thumbnails={thumbnailUrls}
        onChange={setThumbnailUrls}
        posterFallback={{
          projectId: game.id,
          title: game.title,
          genre: genres[0] ?? "その他",
          phase: game.phase,
        }}
      />
    </StudioPanelEditShell>
  );
}
