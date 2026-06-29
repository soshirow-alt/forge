"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  GameDetailOverviewV0Tab,
  type GameOverviewEditorHandle,
} from "@/components/game-detail-overview-v0-tab";
import { CollapsibleFormSection } from "@/components/collapsible-form-section";
import { ForgeSdkNote } from "@/components/forge-sdk-note";
import { ProjectEstimatedPlayTimeField } from "@/components/project-estimated-play-time-field";
import { ProjectPhaseFormFields } from "@/components/project-phase-form-fields";
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
} from "@/lib/project-genres";
import {
  getPublicGameTags,
  mergePlayEnvironmentIntoTags,
  parsePlayEnvironmentFromTags,
} from "@/lib/play-environment";
import {
  normalizeOverviewIntroduction,
  resolveEditableIntroduction,
} from "@/lib/project-overview";
import { resolveProjectThumbnailUrls } from "@/lib/project-thumbnails";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  PROJECT_VISIBILITY_FORM_OPTIONS,
  type ProjectVisibility,
} from "@/lib/project-visibility";
import { gameToDetailV0 } from "@/lib/submitted-game-v0-adapter";
import { PROJECT_INTRO_HINT, PROJECT_VISIBILITY_SECTION_HINT } from "@/lib/project-form-copy";
import { ProjectThumbnailFields } from "@/components/project-thumbnail-fields";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

type ProjectEditFormProps = {
  projectId: string;
  onSaved?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function ProjectEditForm({
  projectId,
  onSaved,
  onCancel,
  submitLabel = "保存する",
}: ProjectEditFormProps) {
  const overviewEditorRef = useRef<GameOverviewEditorHandle>(null);
  const {
    getSubmittedGameById,
    updateProjectDetails,
    updateProjectOverview,
    dataReady,
  } = useGames();

  const game = getSubmittedGameById(projectId);

  const [title, setTitle] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<ForgeGenreOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<ForgeFeatureTagOption[]>([]);
  const [phase, setPhase] = useState("");
  const [estimatedPlayTime, setEstimatedPlayTime] = useState("");
  const [visibility, setVisibility] = useState<ProjectVisibility>("public");
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [overviewValidationError, setOverviewValidationError] = useState<string | null>(
    null,
  );

  const overviewDisplayGame = useMemo(
    () => (game ? gameToDetailV0(game) : null),
    [game],
  );

  const editIntroduction = game
    ? resolveEditableIntroduction(game.overviewIntroduction, game.description)
    : "";

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }

    setTitle(game.title);
    setSelectedGenres(
      sanitizeProjectGenresForSave(pickForgeGenresFromList(resolveProjectGenres(game))),
    );
    setSelectedTags(
      sanitizeFeatureTagsForSave(
        pickFeatureTagsFromGameTags(getPublicGameTags(game.tags)),
      ),
    );
    setPhase(game.phase);
    setEstimatedPlayTime(game.estimatedPlayTime ?? "");
    setVisibility(game.visibility ?? "public");
    setThumbnailUrls(resolveProjectThumbnailUrls(game));
    setFormLoaded(true);
  }, [game, formLoaded, projectId]);

  if (!dataReady || !game || !formLoaded) {
    return <p className="text-sm text-zinc-500">読み込み中…</p>;
  }

  function toggleGenre(genre: ForgeGenreOption) {
    setSelectedGenres((current) => toggleForgeGenre(current, genre));
  }

  function toggleTag(tag: ForgeFeatureTagOption) {
    setSelectedTags((prev) => toggleForgeFeatureTag(prev, tag));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!game) {
      return;
    }

    setSaveError(null);
    setOverviewValidationError(null);
    setIsSaving(true);

    try {
      const overviewResult = overviewEditorRef.current?.validateAndGetPayload();
      if (!overviewResult?.ok) {
        setOverviewValidationError(
          overviewResult?.error ?? "作品紹介を入力してください。",
        );
        return;
      }

      const genres = sanitizeProjectGenresForSave(selectedGenres);
      if (genres.length === 0) {
        setSaveError("ジャンルを1つ以上選んでください。");
        return;
      }
      if (!phase) {
        setSaveError("開発フェーズを選んでください。");
        return;
      }

      const playEnvironment = parsePlayEnvironmentFromTags(game.tags ?? []);

      await updateProjectDetails(projectId, {
        ...buildProjectEditFormDataFromGame(game),
        title,
        genres,
        phase,
        estimatedPlayTime: estimatedPlayTime || undefined,
        lookingForTesters: game.lookingForTesters,
        testerSlots: game.testerSlots,
        tags: mergePlayEnvironmentIntoTags(
          sanitizeFeatureTagsForSave(selectedTags),
          playEnvironment,
        ),
        thumbnailUrls,
        visibility,
      });

      await updateProjectOverview(projectId, {
        overviewIntroduction: normalizeOverviewIntroduction(
          overviewResult.payload.introduction,
        ),
        overviewFeatures: null,
      });

      onSaved?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "保存に失敗しました。時間をおいて再度お試しください。";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor={`edit-title-${projectId}`} className="text-sm font-medium text-zinc-400">
          タイトル
        </label>
        <input
          id={`edit-title-${projectId}`}
          type="text"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={inputClassName}
          placeholder="ゲームのタイトル"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-400">公開設定</p>
        <p className="mt-1 text-xs text-zinc-600">{PROJECT_VISIBILITY_SECTION_HINT}</p>
        <div className="mt-3 space-y-2">
          {PROJECT_VISIBILITY_FORM_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
                visibility === option.value
                  ? "border-orange-500/40 bg-orange-500/5"
                  : "border-zinc-800 bg-zinc-950/50"
              }`}
            >
              <input
                type="radio"
                name={`visibility-${projectId}`}
                checked={visibility === option.value}
                onChange={() => setVisibility(option.value)}
                className="mt-0.5 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
              />
              <span>
                <span className="block text-sm font-medium text-zinc-300">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-600">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <CollapsibleFormSection
        title="ジャンル"
        summary={
          selectedGenres.length > 0
            ? selectedGenres.join("・")
            : "未選択（1つ以上）"
        }
      >
        <p className="text-xs text-zinc-600">
          複数選べます（最大 {MAX_PROJECT_GENRES} つ）。
        </p>
        <fieldset className="mt-3">
          <legend className="sr-only">ジャンル</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FORGE_GENRE_OPTIONS.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                  selectedGenres.includes(option)
                    ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                    : "border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(option)}
                  onChange={() => toggleGenre(option)}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      </CollapsibleFormSection>

      <CollapsibleFormSection
        title="特徴タグ"
        summary={
          selectedTags.length > 0 ? selectedTags.join("・") : "なし（任意）"
        }
      >
        <p className="text-xs text-zinc-600">
          ジャンル以外のプレイ特性や見た目。複数選べます（任意・最大{" "}
          {MAX_PROJECT_FEATURE_TAGS} つ）。
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FORGE_FEATURE_TAG_OPTIONS.map((tag) => (
            <label
              key={tag}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => toggleTag(tag)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
              />
              <span className="text-sm text-zinc-300">{tag}</span>
            </label>
          ))}
        </div>
      </CollapsibleFormSection>

      <div>
        <h2 className="text-sm font-medium text-zinc-400">作品紹介</h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">{PROJECT_INTRO_HINT}</p>
        {overviewValidationError ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {overviewValidationError}
          </p>
        ) : null}
        {overviewDisplayGame ? (
          <div className="mt-4">
            <GameDetailOverviewV0Tab
              ref={overviewEditorRef}
              key={`${projectId}-${editIntroduction}`}
              game={overviewDisplayGame}
              editable
              embeddedInForm
              hideVersionQuestions
              hideFeatures
              compactIntroduction
              editIntroduction={editIntroduction}
            />
          </div>
        ) : null}
      </div>

      <ProjectPhaseFormFields
        value={phase}
        onChange={setPhase}
        radioName={`phase-${projectId}`}
      />

      <ProjectEstimatedPlayTimeField
        value={estimatedPlayTime}
        onChange={setEstimatedPlayTime}
        inputClassName={inputClassName}
        inputId={`estimated-play-time-${projectId}`}
      />

      <ProjectThumbnailFields
        inputId={`edit-thumbnail-${projectId}`}
        thumbnails={thumbnailUrls}
        onChange={setThumbnailUrls}
      />

      <ForgeSdkNote />

      {saveError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {saveError}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-60"
          >
            キャンセル
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
