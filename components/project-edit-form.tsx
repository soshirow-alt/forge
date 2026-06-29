"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Plus } from "lucide-react";
import {
  GameDetailOverviewV0Tab,
  type GameOverviewEditorHandle,
} from "@/components/game-detail-overview-v0-tab";
import { ForgeSdkNote } from "@/components/forge-sdk-note";
import { useGames } from "@/components/games-provider";
import { FORGE_GENRE_OPTIONS } from "@/lib/forge-genre-options";
import {
  FORGE_FEATURE_TAG_OPTIONS,
  pickFeatureTagsFromGameTags,
} from "@/lib/forge-feature-tag-options";
import {
  getPublicGameTags,
  mergePlayEnvironmentIntoTags,
  parsePlayEnvironmentFromTags,
} from "@/lib/play-environment";
import {
  normalizeOverviewIntroduction,
  resolveEditableIntroduction,
} from "@/lib/project-overview";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  PROJECT_VISIBILITY_FORM_OPTIONS,
  type ProjectVisibility,
} from "@/lib/project-visibility";
import { gameToDetailV0 } from "@/lib/submitted-game-v0-adapter";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

function CollapsibleFormSection({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-900/50"
      >
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 transition-transform ${
            open ? "rotate-45" : ""
          }`}
          aria-hidden="true"
        >
          <Plus className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-zinc-300">{title}</span>
          {!open ? (
            <span className="mt-0.5 block truncate text-xs text-zinc-600">{summary}</span>
          ) : null}
        </span>
      </button>
      {open ? <div className="border-t border-zinc-800 px-4 py-4">{children}</div> : null}
    </div>
  );
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

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
  const [genre, setGenre] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<ProjectVisibility>("public");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | undefined>();
  const [fileInputKey, setFileInputKey] = useState(0);
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
    setGenre(game.genre);
    setSelectedTags(pickFeatureTagsFromGameTags(getPublicGameTags(game.tags)));
    setVisibility(game.visibility ?? "public");
    setThumbnailUrl(game.thumbnailUrl);
    setThumbnailPreview(game.thumbnailUrl);
    setFormLoaded(true);
  }, [game, formLoaded, projectId]);

  if (!dataReady || !game || !formLoaded) {
    return <p className="text-sm text-zinc-500">読み込み中…</p>;
  }

  async function handleThumbnailChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await readImageAsDataUrl(file);
    setThumbnailUrl(dataUrl);
    setThumbnailPreview(dataUrl);
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
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

      const playEnvironment = parsePlayEnvironmentFromTags(game.tags ?? []);

      await updateProjectDetails(projectId, {
        ...buildProjectEditFormDataFromGame(game),
        title,
        genre,
        lookingForTesters: game.lookingForTesters,
        testerSlots: game.testerSlots,
        tags: mergePlayEnvironmentIntoTags(selectedTags, playEnvironment),
        thumbnailUrl,
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
        <h2 className="text-sm font-medium text-zinc-400">作品紹介</h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">
          作品詳細の「概要」タブに表示されます。一覧用の短い説明は先頭から自動生成されます。
        </p>
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

      <CollapsibleFormSection
        title="ジャンル"
        summary={genre || "未選択"}
      >
        <fieldset>
          <legend className="sr-only">ジャンル</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FORGE_GENRE_OPTIONS.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                  genre === option
                    ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                    : "border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name={`genre-${projectId}`}
                  required
                  value={option}
                  checked={genre === option}
                  onChange={() => setGenre(option)}
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
          ジャンル以外のプレイ特性や見た目。複数選べます（任意）。
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
        <p className="text-sm font-medium text-zinc-400">公開設定</p>
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

      <div>
        <label htmlFor={`edit-thumbnail-${projectId}`} className="text-sm font-medium text-zinc-400">
          サムネイル画像
        </label>
        <input
          id={`edit-thumbnail-${projectId}`}
          key={fileInputKey}
          type="file"
          accept="image/*"
          onChange={handleThumbnailChange}
          className="mt-2 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-200 hover:file:bg-zinc-700"
        />
        {thumbnailPreview && (
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-700">
            <img
              src={thumbnailPreview}
              alt="サムネイルプレビュー"
              className="aspect-video w-full object-cover"
            />
          </div>
        )}
      </div>

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
