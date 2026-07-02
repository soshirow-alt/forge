"use client";

import { useEffect, useState } from "react";
import { CollapsibleFormSection } from "@/components/collapsible-form-section";
import {
  StudioPanelEditShell,
} from "@/components/studio-panel-edit-shell";
import type { StudioOverviewEditPanelCommonProps } from "@/components/studio-overview-edit-panel-types";
import { useGames } from "@/components/games-provider";
import { FORGE_GENRE_OPTIONS, type ForgeGenreOption } from "@/lib/forge-genre-options";
import {
  FORGE_FEATURE_TAG_OPTIONS,
  MAX_PROJECT_FEATURE_TAGS,
  pickFeatureTagsFromGameTags,
  sanitizeFeatureTagsForSave,
  toggleForgeFeatureTag,
  type ForgeFeatureTagOption,
} from "@/lib/forge-feature-tag-options";
import {
  MAX_PROJECT_GENRES,
  pickForgeGenresFromList,
  resolveProjectGenres,
  sanitizeProjectGenresForSave,
  toggleForgeGenre,
  genresToLegacyGenreColumn,
} from "@/lib/project-genres";
import {
  getPublicGameTags,
  mergePlayEnvironmentIntoTags,
  parsePlayEnvironmentFromTags,
} from "@/lib/play-environment";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";

export type StudioOverviewGenresTagsEditPanelProps = StudioOverviewEditPanelCommonProps;

export function StudioOverviewGenresTagsEditPanel({
  projectId,
  onCancel,
  onSaved,
  onPreviewPatchChange,
}: StudioOverviewGenresTagsEditPanelProps) {
  const { getOwnedProjectById, updateProjectDetails, dataReady } = useGames();
  const game = getOwnedProjectById(projectId);

  const [selectedGenres, setSelectedGenres] = useState<ForgeGenreOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<ForgeFeatureTagOption[]>([]);
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }

    setSelectedGenres(
      sanitizeProjectGenresForSave(pickForgeGenresFromList(resolveProjectGenres(game))),
    );
    setSelectedTags(
      sanitizeFeatureTagsForSave(
        pickFeatureTagsFromGameTags(getPublicGameTags(game.tags)),
      ),
    );
    setFormLoaded(true);
  }, [game, formLoaded]);

  function emitPreview(
    genres: ForgeGenreOption[],
    tags: ForgeFeatureTagOption[],
  ) {
    const sanitizedGenres = sanitizeProjectGenresForSave(genres);
    const playEnvironment = parsePlayEnvironmentFromTags(game?.tags ?? []);
    const mergedTags = mergePlayEnvironmentIntoTags(
      sanitizeFeatureTagsForSave(tags),
      playEnvironment,
    );
    onPreviewPatchChange?.({
      genres: sanitizedGenres,
      genre: genresToLegacyGenreColumn(sanitizedGenres) || "",
      tags: mergedTags,
    });
  }

  async function handleSave() {
    if (!game) {
      return;
    }

    setSaveError(null);
    setValidationError(null);

    const genres = sanitizeProjectGenresForSave(selectedGenres);
    if (genres.length === 0) {
      setValidationError("ジャンルを1つ以上選んでください。");
      return;
    }

    const playEnvironment = parsePlayEnvironmentFromTags(game.tags ?? []);

    setIsSaving(true);
    try {
      await updateProjectDetails(projectId, {
        ...buildProjectEditFormDataFromGame(game),
        genres,
        tags: mergePlayEnvironmentIntoTags(
          sanitizeFeatureTagsForSave(selectedTags),
          playEnvironment,
        ),
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
      title="ジャンル・タグを編集"
      onCancel={onCancel}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saveError={saveError}
      validationError={validationError}
    >
      <CollapsibleFormSection
        title="ジャンル"
        summary={selectedGenres.length > 0 ? selectedGenres.join("・") : "未選択（1つ以上）"}
      >
        <p className="text-xs text-zinc-600">最大 {MAX_PROJECT_GENRES} つまで。</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {FORGE_GENRE_OPTIONS.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-xs transition-colors ${
                selectedGenres.includes(option)
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                  : "border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedGenres.includes(option)}
                onChange={() => {
                  const nextGenres = toggleForgeGenre(selectedGenres, option);
                  setSelectedGenres(nextGenres);
                  emitPreview(nextGenres, selectedTags);
                }}
                className="sr-only"
              />
              {option}
            </label>
          ))}
        </div>
      </CollapsibleFormSection>

      <CollapsibleFormSection
        title="特徴タグ"
        summary={selectedTags.length > 0 ? selectedTags.join("・") : "なし（任意）"}
      >
        <p className="text-xs text-zinc-600">任意・最大 {MAX_PROJECT_FEATURE_TAGS} つ。</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {FORGE_FEATURE_TAG_OPTIONS.map((tag) => (
            <label
              key={tag}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-2 py-1.5"
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => {
                  const nextTags = toggleForgeFeatureTag(selectedTags, tag);
                  setSelectedTags(nextTags);
                  emitPreview(selectedGenres, nextTags);
                }}
                className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
              />
              <span className="text-xs text-zinc-300">{tag}</span>
            </label>
          ))}
        </div>
      </CollapsibleFormSection>
    </StudioPanelEditShell>
  );
}
