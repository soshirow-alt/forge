"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { StudioShell } from "@/components/studio-shell";
import { ForgeSdkNote } from "@/components/forge-sdk-note";
import { PlayEnvironmentFormFields } from "@/components/play-environment-form-fields";
import { VersionPromptEditor } from "@/components/version-prompt-editor";
import { useGames } from "@/components/games-provider";
import { AVAILABLE_TAGS } from "@/lib/game-tags";
import {
  EMPTY_PLAY_ENVIRONMENT_FORM,
  getPublicGameTags,
  mergePlayEnvironmentIntoTags,
  parsePlayEnvironmentFromTags,
} from "@/lib/play-environment";
import { projectStudioPath } from "@/lib/project-nurture-links";
import type { ProjectVisibility } from "@/lib/project-visibility";
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
  const { getSubmittedGameById, isProjectOwner, updateProjectDetails, getDeveloperVersionPrompts, saveDeveloperVersionPrompts, dataReady } =
    useGames();

  const game = getSubmittedGameById(projectId);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [lookingForTesters, setLookingForTesters] = useState(false);
  const [testerSlots, setTesterSlots] = useState(10);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [steamUrl, setSteamUrl] = useState("");
  const [itchUrl, setItchUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
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

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }

    setTitle(game.title);
    setGenre(game.genre);
    setDescription(game.description);
    setLookingForTesters(game.lookingForTesters);
    setTesterSlots(game.testerSlots ?? 10);
    setSelectedTags(getPublicGameTags(game.tags));
    setPlayEnvironment(parsePlayEnvironmentFromTags(game.tags ?? []));
    setSteamUrl(game.steamUrl ?? "");
    setItchUrl(game.itchUrl ?? "");
    setGithubUrl(game.githubUrl ?? "");
    setDiscordUrl(game.discordUrl ?? "");
    setOfficialUrl(game.officialUrl ?? "");
    setVisibility(game.visibility ?? "public");
    setThumbnailUrl(game.thumbnailUrl);
    setThumbnailPreview(game.thumbnailUrl);
    setFormLoaded(true);
  }, [game, formLoaded]);

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
      <StudioShell activeNav="projects">
        <p className="text-zinc-500">読み込み中...</p>
      </StudioShell>
    );
  }

  if (!game) {
    notFound();
  }

  if (authHydrated && !isProjectOwner(projectId, user?.id)) {
    return (
      <StudioShell activeNav="projects">
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
    setShowPromptValidation(false);
    setIsSaving(true);

    try {
      await updateProjectDetails(projectId, {
        title,
        genre,
        description,
        lookingForTesters,
        testerSlots: lookingForTesters ? testerSlots : undefined,
        tags: mergePlayEnvironmentIntoTags(selectedTags, playEnvironment),
        thumbnailUrl,
        steamUrl: steamUrl || undefined,
        itchUrl: itchUrl || undefined,
        githubUrl: githubUrl || undefined,
        discordUrl: discordUrl || undefined,
        officialUrl: officialUrl || undefined,
        visibility,
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
    <StudioShell activeNav="projects">
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

          <div>
            <label
              htmlFor="description"
              className="text-sm font-medium text-zinc-400"
            >
              説明
            </label>
            <textarea
              id="description"
              required
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${inputClassName} resize-y`}
              placeholder="ゲームの概要を入力してください"
            />
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
                <span className="text-sm text-zinc-300">公開</span>
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
                <span className="text-sm text-zinc-300">非公開</span>
              </label>
            </div>
          </div>

          <PlayEnvironmentFormFields
            value={playEnvironment}
            onChange={setPlayEnvironment}
          />

          <VersionPromptEditor
            mode={promptMode}
            onModeChange={setPromptMode}
            drafts={promptDrafts}
            onDraftsChange={setPromptDrafts}
            showValidation={showPromptValidation}
            versionLabel={`v${resolvePlayableVersion(game.playableVersion)}`}
          />

          <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
            <p className="text-sm font-medium text-zinc-400">外部リンク（任意）</p>
            <div>
              <label htmlFor="steamUrl" className="text-sm text-zinc-500">
                Steam URL
              </label>
              <input
                id="steamUrl"
                type="url"
                value={steamUrl}
                onChange={(event) => setSteamUrl(event.target.value)}
                className={inputClassName}
                placeholder="https://store.steampowered.com/..."
              />
            </div>
            <div>
              <label htmlFor="itchUrl" className="text-sm text-zinc-500">
                itch.io URL
              </label>
              <input
                id="itchUrl"
                type="url"
                value={itchUrl}
                onChange={(event) => setItchUrl(event.target.value)}
                className={inputClassName}
                placeholder="https://example.itch.io/..."
              />
            </div>
            <div>
              <label htmlFor="githubUrl" className="text-sm text-zinc-500">
                GitHub URL
              </label>
              <input
                id="githubUrl"
                type="url"
                value={githubUrl}
                onChange={(event) => setGithubUrl(event.target.value)}
                className={inputClassName}
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <label htmlFor="discordUrl" className="text-sm text-zinc-500">
                Discord URL
              </label>
              <input
                id="discordUrl"
                type="url"
                value={discordUrl}
                onChange={(event) => setDiscordUrl(event.target.value)}
                className={inputClassName}
                placeholder="https://discord.gg/..."
              />
            </div>
            <div>
              <label htmlFor="officialUrl" className="text-sm text-zinc-500">
                公式サイトURL
              </label>
              <input
                id="officialUrl"
                type="url"
                value={officialUrl}
                onChange={(event) => setOfficialUrl(event.target.value)}
                className={inputClassName}
                placeholder="https://example.com"
              />
            </div>
          </div>

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
