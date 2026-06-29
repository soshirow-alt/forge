"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  GameDetailOverviewV0Tab,
  type GameOverviewEditorHandle,
} from "@/components/game-detail-overview-v0-tab";
import { StudioShell } from "@/components/studio-shell";
import { ForgeSdkNote } from "@/components/forge-sdk-note";
import { PlayEnvironmentFormFields } from "@/components/play-environment-form-fields";
import { VersionPromptSettingsModal } from "@/components/version-prompt-settings-modal";
import { useGames } from "@/components/games-provider";
import { AVAILABLE_TAGS } from "@/lib/game-tags";
import {
  EMPTY_PLAY_ENVIRONMENT_FORM,
  getPublicGameTags,
  mergePlayEnvironmentIntoTags,
  parsePlayEnvironmentFromTags,
} from "@/lib/play-environment";
import { projectStudioPath } from "@/lib/project-nurture-links";
import {
  normalizeOverviewIntroduction,
  resolveEditableIntroduction,
} from "@/lib/project-overview";
import type { ProjectVisibility } from "@/lib/project-visibility";
import { gameToDetailV0 } from "@/lib/submitted-game-v0-adapter";
import { ExternalLinksFormFields } from "@/components/external-links-form-fields";
import { getDeveloperSocialLinkDefaults, mergeSocialLinkDefaults } from "@/lib/developer-external-link-defaults";
import {
  emptyExternalLinkFormValues,
  type ExternalLinkFormValues,
} from "@/lib/game-links";
import { resolvePlayableVersion } from "@/lib/playable-version";
import {
  createEmptyPromptDraft,
  draftFromVersionPrompt,
  sanitizePromptDrafts,
  validatePromptDrafts,
  type DeveloperPromptDraft,
} from "@/lib/version-prompt-form";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

function emptyExternalUrls(): ExternalLinkFormValues {
  return emptyExternalLinkFormValues();
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ProjectEditPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { user, hydrated: authHydrated } = useAuth();
  const overviewEditorRef = useRef<GameOverviewEditorHandle>(null);
  const { getSubmittedGameById, isProjectOwner, updateProjectDetails, updateProjectOverview, getDeveloperVersionPrompts, saveDeveloperVersionPrompts, getDeveloperProfileByUserId, getOwnedProjects, dataReady } =
    useGames();

  const game = getSubmittedGameById(projectId);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [lookingForTesters, setLookingForTesters] = useState(false);
  const [testerSlots, setTesterSlots] = useState(10);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [externalUrls, setExternalUrls] = useState(emptyExternalUrls);
  const [visibility, setVisibility] = useState<ProjectVisibility>("public");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | undefined>();
  const [fileInputKey, setFileInputKey] = useState(0);
  const [formLoaded, setFormLoaded] = useState(false);
  const [playEnvironment, setPlayEnvironment] = useState(EMPTY_PLAY_ENVIRONMENT_FORM);
  const [promptMode, setPromptMode] = useState<"none" | "custom">("none");
  const [promptDrafts, setPromptDrafts] = useState<DeveloperPromptDraft[]>([
    createEmptyPromptDraft(),
  ]);
  const [promptsLoaded, setPromptsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPromptValidation, setShowPromptValidation] = useState(false);
  const [overviewValidationError, setOverviewValidationError] = useState<string | null>(null);

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
    setLookingForTesters(game.lookingForTesters);
    setTesterSlots(game.testerSlots ?? 10);
    setSelectedTags(getPublicGameTags(game.tags));
    setPlayEnvironment(parsePlayEnvironmentFromTags(game.tags ?? []));
    const loadedUrls = {
      steamUrl: game.steamUrl ?? "",
      itchUrl: game.itchUrl ?? "",
      discordUrl: game.discordUrl ?? "",
      xUrl: game.xUrl ?? "",
      officialUrl: game.officialUrl ?? "",
      youtubeUrl: game.youtubeUrl ?? "",
      githubUrl: game.githubUrl ?? "",
    };
    const profile = user ? getDeveloperProfileByUserId(user.id) : undefined;
    const ownedProjects = user ? getOwnedProjects(user.id) : [];
    const defaults = getDeveloperSocialLinkDefaults(profile, ownedProjects, projectId);
    setExternalUrls(mergeSocialLinkDefaults(loadedUrls, defaults));
    setVisibility(game.visibility ?? "public");
    setThumbnailUrl(game.thumbnailUrl);
    setThumbnailPreview(game.thumbnailUrl);
    setFormLoaded(true);
  }, [game, formLoaded, getDeveloperProfileByUserId, getOwnedProjects, projectId, user]);

  useEffect(() => {
    if (!game || promptsLoaded) {
      return;
    }

    const versionKey = resolvePlayableVersion(game.playableVersion);
    void getDeveloperVersionPrompts(projectId, versionKey).then((prompts) => {
      if (prompts.length > 0) {
        setPromptMode("custom");
        setPromptDrafts(prompts.map(draftFromVersionPrompt));
      } else {
        setPromptMode("none");
        setPromptDrafts([createEmptyPromptDraft()]);
      }
      setPromptsLoaded(true);
    });
  }, [game, getDeveloperVersionPrompts, projectId, promptsLoaded]);

  if (!dataReady) {
    return (
      <StudioShell activeNav="mypage">
        <p className="text-zinc-500">読み込み中...</p>
      </StudioShell>
    );
  }

  if (!game) {
    notFound();
  }

  if (authHydrated && !isProjectOwner(projectId, user?.id)) {
    return (
      <StudioShell activeNav="mypage">
        <main className="mx-auto max-w-2xl">
          <Link
            href={`/games/${projectId}`}
            className="text-sm text-zinc-500 transition-colors hover:text-violet-400"
          >
            ← 作品詳細に戻る
          </Link>

          <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
            <p className="text-zinc-400">この作品を編集する権限がありません</p>
          </div>
        </main>
      </StudioShell>
    );
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
    setSaveError(null);
    setOverviewValidationError(null);
    setShowPromptValidation(false);
    setIsSaving(true);

    try {
      const overviewResult = overviewEditorRef.current?.validateAndGetPayload();
      if (!overviewResult?.ok) {
        setOverviewValidationError(
          overviewResult?.error ?? "作品紹介を入力してください。",
        );
        return;
      }

      await updateProjectDetails(projectId, {
        title,
        genre,
        lookingForTesters,
        testerSlots: lookingForTesters ? testerSlots : undefined,
        tags: mergePlayEnvironmentIntoTags(selectedTags, playEnvironment),
        thumbnailUrl,
        steamUrl: externalUrls.steamUrl || undefined,
        itchUrl: externalUrls.itchUrl || undefined,
        discordUrl: externalUrls.discordUrl || undefined,
        xUrl: externalUrls.xUrl || undefined,
        officialUrl: externalUrls.officialUrl || undefined,
        youtubeUrl: externalUrls.youtubeUrl || undefined,
        githubUrl: externalUrls.githubUrl || undefined,
        visibility,
      });

      await updateProjectOverview(projectId, {
        overviewIntroduction: normalizeOverviewIntroduction(
          overviewResult.payload.introduction,
        ),
        overviewFeatures:
          overviewResult.payload.features.length > 0
            ? overviewResult.payload.features
            : null,
      });

      const versionKey = resolvePlayableVersion(game?.playableVersion);

      if (promptMode === "custom") {
        const validation = validatePromptDrafts(promptDrafts);
        if (validation.blocking) {
          setShowPromptValidation(true);
          setSaveError(validation.message);
          return;
        }
      }

      const promptsToSave =
        promptMode === "custom" ? sanitizePromptDrafts(promptDrafts) : [];

      await saveDeveloperVersionPrompts(projectId, versionKey, promptsToSave);

      router.push(`/games/${projectId}`);
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
    <StudioShell activeNav="mypage">
      <main className="mx-auto max-w-2xl">
        <Link
          href={projectStudioPath(projectId)}
          className="text-sm text-zinc-500 transition-colors hover:text-violet-400"
        >
          ← Studio に戻る
        </Link>

        <h1 className="mt-8 text-3xl font-bold tracking-tight">作品を編集する</h1>
        <p className="mt-2 text-zinc-500">作品情報を更新できます。</p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8"
        >
          <div>
            <label htmlFor="title" className="text-sm font-medium text-zinc-400">
              タイトル
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClassName}
              placeholder="ゲームのタイトル"
            />
          </div>

          <div>
            <label htmlFor="genre" className="text-sm font-medium text-zinc-400">
              ジャンル
            </label>
            <input
              id="genre"
              type="text"
              required
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              className={inputClassName}
              placeholder="例：アクションRPG"
            />
          </div>

          <div id="overview" className="scroll-mt-8">
            <h2 className="text-sm font-medium text-zinc-400">作品紹介・見どころ</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
              ここに書いた内容が作品詳細の「概要」タブに表示されます。一覧・カード用の短い説明は、
              先頭から自動で作られます。見どころカードは任意です。
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
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 sm:p-5">
                <GameDetailOverviewV0Tab
                  ref={overviewEditorRef}
                  key={`${projectId}-${editIntroduction}`}
                  game={overviewDisplayGame}
                  editable
                  embeddedInForm
                  hideVersionQuestions
                  editIntroduction={editIntroduction}
                />
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-400">公開設定</p>
            <div className="mt-3 flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                  className="h-4 w-4 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
                />
                <span className="text-sm text-zinc-300">公開中</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                  className="h-4 w-4 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
                />
                <span className="text-sm text-zinc-300">下書き</span>
              </label>
            </div>
          </div>

          <PlayEnvironmentFormFields
            value={playEnvironment}
            onChange={setPlayEnvironment}
          />

          <VersionPromptSettingsModal
            mode={promptMode}
            onModeChange={setPromptMode}
            drafts={promptDrafts}
            onDraftsChange={setPromptDrafts}
            showValidation={showPromptValidation}
            versionLabel={`v${resolvePlayableVersion(game.playableVersion)}`}
          />

          <ExternalLinksFormFields
            formKey={projectId}
            values={externalUrls}
            onChange={(field, value) =>
              setExternalUrls((current) => ({ ...current, [field]: value }))
            }
            inputClassName={inputClassName}
          />

          <div>
            <p className="text-sm font-medium text-zinc-400">タグ</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AVAILABLE_TAGS.filter((tag) => tag !== "テスター募集中").map(
                (tag) => (
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
                ),
              )}
            </div>
          </div>

          <div>
            <label htmlFor="thumbnail" className="text-sm font-medium text-zinc-400">
              サムネイル画像
            </label>
            <input
              id="thumbnail"
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

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3">
            <ForgeSdkNote />
          </div>

          {saveError && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {saveError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "保存中..." : "更新する"}
          </button>
        </form>
      </main>
    </StudioShell>
  );
}
