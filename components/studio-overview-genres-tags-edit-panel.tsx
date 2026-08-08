"use client";

import { useEffect, useState } from "react";
import { AgeRatingR18ConfirmModal } from "@/components/age-rating-r18-confirm-modal";
import { CollapsibleFormSection } from "@/components/collapsible-form-section";
import { StudioFieldAnchor } from "@/components/studio-field-anchor";
import { StudioPanelEditShell } from "@/components/studio-panel-edit-shell";
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
  parsePlayEnvironmentFromTags,
} from "@/lib/play-environment";
import { composeProjectTagsForWrite } from "@/lib/project-tags";
import { buildGameGenresTagsEditPersistPayload } from "@/lib/studio-game-overview-edit-persist";
import { STUDIO_FIELD_IDS, type StudioFieldId } from "@/lib/studio-preview-edit-targets";
import { normalizeAgeRating, type AgeRating } from "@/lib/age-rating";

export type StudioOverviewGenresTagsEditPanelProps = StudioOverviewEditPanelCommonProps & {
  highlightFieldId?: StudioFieldId | null;
};

export function StudioOverviewGenresTagsEditPanel({
  projectId,
  onCancel,
  onSaved,
  onPreviewPatchChange,
  highlightFieldId = null,
}: StudioOverviewGenresTagsEditPanelProps) {
  const { getOwnedProjectById, updateProjectDetails, dataReady } = useGames();
  const game = getOwnedProjectById(projectId);

  const [selectedGenres, setSelectedGenres] = useState<ForgeGenreOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<ForgeFeatureTagOption[]>([]);
  const [ageRating, setAgeRating] = useState<AgeRating>("general");
  const [confirmR18Open, setConfirmR18Open] = useState(false);
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
    setAgeRating(normalizeAgeRating(game.ageRating));
    setFormLoaded(true);
  }, [game, formLoaded]);

  useEffect(() => {
    setValidationError(null);
  }, [selectedGenres, selectedTags, ageRating]);

  function emitPreview(
    genres: ForgeGenreOption[],
    tags: ForgeFeatureTagOption[],
    rating: AgeRating,
  ) {
    const sanitizedGenres = sanitizeProjectGenresForSave(genres);
    const playEnvironment = parsePlayEnvironmentFromTags(game?.tags ?? []);
    const mergedTags = composeProjectTagsForWrite({
      featureTags: sanitizeFeatureTagsForSave(tags),
      playEnvironment,
      existingTags: game?.tags,
    });
    onPreviewPatchChange?.({
      genres: sanitizedGenres,
      genre: genresToLegacyGenreColumn(sanitizedGenres) || "",
      tags: mergedTags,
      ageRating: rating,
    });
  }

  function handleAgeCheckboxChange(checked: boolean) {
    if (checked && ageRating !== "r18") {
      setConfirmR18Open(true);
      return;
    }
    const next: AgeRating = checked ? "r18" : "general";
    setAgeRating(next);
    emitPreview(selectedGenres, selectedTags, next);
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

    setIsSaving(true);
    try {
      await updateProjectDetails(
        projectId,
        buildGameGenresTagsEditPersistPayload(game, {
          genres,
          featureTags: selectedTags,
          ageRating,
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
    <>
      <StudioPanelEditShell
        title="ジャンル・タグを編集"
        onCancel={onCancel}
        onSave={() => void handleSave()}
        isSaving={isSaving}
        saveError={saveError}
        validationError={validationError}
      >
        <StudioFieldAnchor
          fieldId={STUDIO_FIELD_IDS.genres}
          highlight={highlightFieldId === STUDIO_FIELD_IDS.genres}
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
                      ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                      : "border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(option)}
                    onChange={() => {
                      const nextGenres = toggleForgeGenre(selectedGenres, option);
                      setSelectedGenres(nextGenres);
                      emitPreview(nextGenres, selectedTags, ageRating);
                    }}
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
          </CollapsibleFormSection>
        </StudioFieldAnchor>

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
                    emitPreview(selectedGenres, nextTags, ageRating);
                  }}
                  className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
                />
                <span className="text-xs text-zinc-300">{tag}</span>
              </label>
            ))}
          </div>
        </CollapsibleFormSection>

        <CollapsibleFormSection
          title="年齢制限"
          summary={ageRating === "r18" ? "R18" : "なし"}
        >
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={ageRating === "r18"}
              onChange={(event) => handleAgeCheckboxChange(event.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
            />
            <span>
              <span className="block text-xs font-medium text-zinc-200">
                R18作品として設定する
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-zinc-500">
                18歳未満の方はプレイできない作品に設定します。
              </span>
            </span>
          </label>
        </CollapsibleFormSection>
      </StudioPanelEditShell>

      {confirmR18Open ? (
        <AgeRatingR18ConfirmModal
          onCancel={() => setConfirmR18Open(false)}
          onConfirm={() => {
            setAgeRating("r18");
            emitPreview(selectedGenres, selectedTags, "r18");
            setConfirmR18Open(false);
          }}
        />
      ) : null}
    </>
  );
}
