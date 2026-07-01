"use client";

import { useEffect, useState } from "react";
import { CollapsibleFormSection } from "@/components/collapsible-form-section";
import { ProjectPhaseFormFields } from "@/components/project-phase-form-fields";
import {
  StudioPanelEditShell,
  studioPanelInputClassName,
} from "@/components/studio-panel-edit-shell";
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
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";

export type StudioOverviewProjectInfoEditPanelProps = {
  projectId: string;
  onCancel: () => void;
  onSaved?: () => void;
  onEditThumbnail?: () => void;
};

export function StudioOverviewProjectInfoEditPanel({
  projectId,
  onCancel,
  onSaved,
  onEditThumbnail,
}: StudioOverviewProjectInfoEditPanelProps) {
  const { getSubmittedGameById, updateProjectDetails, dataReady } = useGames();
  const game = getSubmittedGameById(projectId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<ForgeGenreOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<ForgeFeatureTagOption[]>([]);
  const [phase, setPhase] = useState("");
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }

    setTitle(game.title);
    setDescription(game.description ?? "");
    setSelectedGenres(
      sanitizeProjectGenresForSave(pickForgeGenresFromList(resolveProjectGenres(game))),
    );
    setSelectedTags(
      sanitizeFeatureTagsForSave(
        pickFeatureTagsFromGameTags(getPublicGameTags(game.tags)),
      ),
    );
    setPhase(game.phase);
    setFormLoaded(true);
  }, [game, formLoaded]);

  async function handleSave() {
    if (!game) {
      return;
    }

    setSaveError(null);
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError("タイトルを入力してください。");
      return;
    }

    const genres = sanitizeProjectGenresForSave(selectedGenres);
    if (genres.length === 0) {
      setValidationError("ジャンルを1つ以上選んでください。");
      return;
    }
    if (!phase) {
      setValidationError("開発フェーズを選んでください。");
      return;
    }

    const playEnvironment = parsePlayEnvironmentFromTags(game.tags ?? []);

    setIsSaving(true);
    try {
      await updateProjectDetails(projectId, {
        ...buildProjectEditFormDataFromGame(game),
        title: trimmedTitle,
        description: description.trim(),
        genres,
        phase,
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

  const hasOverviewIntro = Boolean(game.overviewIntroduction?.trim());

  return (
    <StudioPanelEditShell
      title="作品情報を編集"
      onCancel={onCancel}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saveError={saveError}
      validationError={validationError}
      footerNote={
        onEditThumbnail ? (
          <p className="text-xs text-zinc-600">
            サムネイルの編集は{" "}
            <button
              type="button"
              onClick={onEditThumbnail}
              className="text-orange-400/90 underline-offset-2 hover:underline"
            >
              従来の編集画面
            </button>
            で行えます。
          </p>
        ) : null
      }
    >
      <div>
        <label htmlFor={`studio-info-title-${projectId}`} className="text-xs font-medium text-zinc-500">
          タイトル
        </label>
        <input
          id={`studio-info-title-${projectId}`}
          type="text"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={studioPanelInputClassName}
          placeholder="ゲームのタイトル"
        />
      </div>

      <div>
        <label
          htmlFor={`studio-info-lead-${projectId}`}
          className="text-xs font-medium text-zinc-500"
        >
          1行説明
        </label>
        <textarea
          id={`studio-info-lead-${projectId}`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className={`${studioPanelInputClassName} resize-y`}
          placeholder="ヒーローに表示される短い説明"
        />
        {hasOverviewIntro ? (
          <p className="mt-1 text-[11px] text-zinc-600">
            作品紹介を設定している場合、一覧用の短い説明は作品紹介からも生成されます。
          </p>
        ) : null}
      </div>

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
                onChange={() =>
                  setSelectedGenres((current) => toggleForgeGenre(current, option))
                }
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
                onChange={() =>
                  setSelectedTags((prev) => toggleForgeFeatureTag(prev, tag))
                }
                className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
              />
              <span className="text-xs text-zinc-300">{tag}</span>
            </label>
          ))}
        </div>
      </CollapsibleFormSection>

      <ProjectPhaseFormFields
        value={phase}
        onChange={setPhase}
        radioName={`studio-phase-${projectId}`}
      />
    </StudioPanelEditShell>
  );
}
