"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { DeveloperProfileSetup } from "@/components/developer-profile-setup";
import { PlayerShell } from "@/components/player-shell";
import { VersionPromptSettingsTrigger } from "@/components/version-prompt-settings-modal";
import { useGames } from "@/components/games-provider";
import {
  EMPTY_PLAY_ENVIRONMENT_FORM,
  mergePlayEnvironmentIntoTags,
  type PlayEnvironmentFormState,
} from "@/lib/play-environment";
import { projectStudioPath } from "@/lib/project-nurture-links";
import { validatePlayAccess } from "@/lib/project-access-form";
import {
  PROJECT_INTRO_HINT,
  PROJECT_VISIBILITY_SECTION_HINT,
} from "@/lib/project-form-copy";
import {
  PROJECT_VISIBILITY_FORM_OPTIONS,
  type ProjectVisibility,
} from "@/lib/project-visibility";
import { resolvePlayableVersion } from "@/lib/playable-version";
import {
  createEmptyPromptDraft,
  sanitizePromptDrafts,
  validatePromptDrafts,
  type DeveloperPromptDraft,
} from "@/lib/version-prompt-form";

import { FORGE_GENRE_OPTIONS, type ForgeGenreOption } from "@/lib/forge-genre-options";
import {
  FORGE_FEATURE_TAG_OPTIONS,
  MAX_PROJECT_FEATURE_TAGS,
  sanitizeFeatureTagsForSave,
  toggleForgeFeatureTag,
  type ForgeFeatureTagOption,
} from "@/lib/forge-feature-tag-options";
import {
  MAX_PROJECT_GENRES,
  sanitizeProjectGenresForSave,
  toggleForgeGenre,
} from "@/lib/project-genres";
import { ProjectAccessEnvironmentFields } from "@/components/project-access-environment-fields";
import { CollapsibleFormSection } from "@/components/collapsible-form-section";
import { ProjectEstimatedPlayTimeField } from "@/components/project-estimated-play-time-field";
import { ProjectPhaseFormFields } from "@/components/project-phase-form-fields";
import { ExternalLinksFormFields } from "@/components/external-links-form-fields";
import { getDeveloperSocialLinkDefaults } from "@/lib/developer-external-link-defaults";
import { ForgeSdkNote } from "@/components/forge-sdk-note";
import { ProjectThumbnailFields } from "@/components/project-thumbnail-fields";
import type { ProjectExternalLinksInput } from "@/lib/game-links";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

export function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { user, hydrated } = useAuth();

  const { addSubmittedGame, getDeveloperProfileByUserId, getOwnedProjects, saveDeveloperProfile, saveDeveloperVersionPrompts } =
    useGames();

  const developerProfile = user
    ? getDeveloperProfileByUserId(user.id)
    : undefined;
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedGameId, setSubmittedGameId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<ForgeGenreOption[]>([]);
  const [introduction, setIntroduction] = useState("");
  const [phase, setPhase] = useState("");
  const [visibility, setVisibility] = useState<ProjectVisibility>("public");
  const [estimatedPlayTime, setEstimatedPlayTime] = useState("");
  const [playUrl, setPlayUrl] = useState("");
  const [playEnvironment, setPlayEnvironment] = useState<PlayEnvironmentFormState>(
    EMPTY_PLAY_ENVIRONMENT_FORM,
  );
  const [testerNotesMode, setTesterNotesMode] = useState<"none" | "custom">(
    "none",
  );
  const [promptDrafts, setPromptDrafts] = useState<DeveloperPromptDraft[]>([
    createEmptyPromptDraft(),
  ]);
  const [selectedTags, setSelectedTags] = useState<ForgeFeatureTagOption[]>([]);
  const [steamUrl, setSteamUrl] = useState("");
  const [itchUrl, setItchUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
  const [promptSaveError, setPromptSaveError] = useState<string | null>(null);
  const [showPromptValidation, setShowPromptValidation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const socialPrefillDoneRef = useRef(false);

  useEffect(() => {
    if (!user || socialPrefillDoneRef.current) {
      return;
    }

    const ownedProjects = getOwnedProjects(user.id);
    if (!developerProfile && ownedProjects.length === 0) {
      return;
    }

    const defaults = getDeveloperSocialLinkDefaults(developerProfile, ownedProjects);
    if (defaults.discordUrl) {
      setDiscordUrl((current) => current || defaults.discordUrl);
    }
    if (defaults.xUrl) {
      setXUrl((current) => current || defaults.xUrl);
    }
    if (defaults.youtubeUrl) {
      setYoutubeUrl((current) => current || defaults.youtubeUrl);
    }
    if (defaults.officialUrl) {
      setOfficialUrl((current) => current || defaults.officialUrl);
    }
    socialPrefillDoneRef.current = true;
  }, [developerProfile, getOwnedProjects, user]);

  useEffect(() => {
    if (editId) {
      router.replace(`${projectStudioPath(editId)}?edit=project`);
    }
  }, [editId, router]);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    if (developerProfile) {
      setShowProjectForm(true);
    }
  }, [developerProfile]);

  if (!hydrated) {
    return (
      <PlayerShell activeNav="mypage">
        <main className="mx-auto max-w-2xl">
          <p className="text-zinc-500">読み込み中...</p>
        </main>
      </PlayerShell>
    );
  }

  if (!user) {
    return null;
  }

  function toggleTag(tag: ForgeFeatureTagOption) {
    setSelectedTags((prev) => toggleForgeFeatureTag(prev, tag));
  }

  function setExternalLinkField(field: keyof ProjectExternalLinksInput, value: string) {
    switch (field) {
      case "steamUrl":
        setSteamUrl(value);
        break;
      case "itchUrl":
        setItchUrl(value);
        break;
      case "discordUrl":
        setDiscordUrl(value);
        break;
      case "xUrl":
        setXUrl(value);
        break;
      case "officialUrl":
        setOfficialUrl(value);
        break;
      case "youtubeUrl":
        setYoutubeUrl(value);
        break;
      case "githubUrl":
        setGithubUrl(value);
        break;
    }
  }

  function handleDeveloperProfileComplete(input: {
    publicName: string;
    profile: string;
    xAccount?: string;
    website?: string;
  }) {
    if (!user) {
      return;
    }

    void saveDeveloperProfile(user.id, input).then(() => {
      setShowProjectForm(true);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPromptSaveError(null);
    setShowPromptValidation(false);

    if (!user) {
      router.push("/login");
      return;
    }

    const profile = getDeveloperProfileByUserId(user.id);
    if (!profile) {
      setShowProjectForm(false);
      return;
    }

    if (testerNotesMode === "custom") {
      const validation = validatePromptDrafts(promptDrafts);
      if (validation.blocking) {
        setShowPromptValidation(true);
        setPromptSaveError(validation.message);
        return;
      }
    }

    const genres = sanitizeProjectGenresForSave(selectedGenres);
    if (genres.length === 0) {
      setPromptSaveError("ジャンルを1つ以上選んでください。");
      return;
    }

    const accessError = validatePlayAccess(playEnvironment, playUrl);
    if (accessError) {
      setPromptSaveError(accessError);
      return;
    }

    const data = {
      title,
      creator: profile.publicName,
      genres,
      introduction,
      phase,
      thumbnailUrls,
      lookingForTesters: false,
      tags: mergePlayEnvironmentIntoTags(
        sanitizeFeatureTagsForSave(selectedTags),
        playEnvironment,
      ),
      playUrl: playUrl.trim(),
      estimatedPlayTime: estimatedPlayTime || undefined,
      steamUrl: steamUrl || undefined,
      itchUrl: itchUrl || undefined,
      discordUrl: discordUrl || undefined,
      xUrl: xUrl || undefined,
      officialUrl: officialUrl || undefined,
      youtubeUrl: youtubeUrl || undefined,
      githubUrl: githubUrl || undefined,
      visibility,
    };

    setSubmitting(true);
    try {
      const game = await addSubmittedGame(data, {
        ownerId: user.id,
        ownerName: user.name,
      });

      const versionKey = resolvePlayableVersion(game.playableVersion);
      const promptsToSave =
        testerNotesMode === "custom" ? sanitizePromptDrafts(promptDrafts) : [];
      await saveDeveloperVersionPrompts(game.id, versionKey, promptsToSave);

      setSubmittedGameId(game.id);
      setSuccess(true);
      setTitle("");
      setSelectedGenres([]);
      setIntroduction("");
      setPhase("");
      setVisibility("public");
      setEstimatedPlayTime("");
      setPlayUrl("");
      setPlayEnvironment(EMPTY_PLAY_ENVIRONMENT_FORM);
      setTesterNotesMode("none");
      setPromptDrafts([createEmptyPromptDraft()]);
      setSelectedTags([]);
      setSteamUrl("");
      setItchUrl("");
      setGithubUrl("");
      setDiscordUrl("");
      setOfficialUrl("");
      setThumbnailUrls([]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "投稿に失敗しました。時間をおいて再度お試しください。";
      setPromptSaveError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmitAnother() {
    setSuccess(false);
    setSubmittedGameId(null);
  }

  return (
    <PlayerShell activeNav="mypage">
      <main className="mx-auto max-w-2xl">
        <Link
          href="/home"
          className="text-sm text-zinc-500 transition-colors hover:text-violet-400"
        >
          ← ホームに戻る
        </Link>

        {!success && (
          <>
            <h1 className="mt-8 text-3xl font-bold tracking-tight">
              {showProjectForm ? "作品を投稿する" : "開発者プロフィールを作成"}
            </h1>
            <p className="mt-2 text-zinc-500">
              {showProjectForm
                ? "開発中のゲーム情報を入力して、Forgeに掲載しましょう。"
                : "初めて作品を投稿する前に、開発者として公開される情報を設定してください。"}
            </p>
          </>
        )}

        {success ? (
          <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10">
              <svg
                className="h-8 w-8 text-orange-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-100">
              投稿が完了しました
            </h1>
            <p className="mt-2 text-zinc-500">
              {visibility === "private"
                ? "非公開として保存しました。公開するには Studio の作品情報から「公開」に切り替えてください。"
                : "作品一覧の「新着作品」に表示されます"}
            </p>

            {submittedGameId && (
              <div className="mx-auto mt-10 max-w-lg text-left">
                <p className="text-sm font-medium text-zinc-300">次にやること</p>
                <p className="mt-1 text-xs text-zinc-600">
                  投稿 → 発見 → プレイ → 回答の流れに沿って進められます。
                </p>
                <ul className="mt-4 space-y-3">
                  {visibility === "public" && (
                    <li>
                      <Link
                        href={`/?highlight=${submittedGameId}#discover`}
                        className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
                      >
                        新着作品で表示を確認
                        <span aria-hidden="true">→</span>
                      </Link>
                      <p className="mt-1.5 text-xs text-zinc-600">
                        ホームの新着作品に載っているか確認しましょう。
                      </p>
                    </li>
                  )}
                  <li>
                    <Link
                      href={
                        submittedGameId
                          ? projectStudioPath(submittedGameId)
                          : "/studio/mypage"
                      }
                      className="flex w-full items-center justify-between rounded-lg border border-violet-500/40 bg-violet-500/10 px-5 py-3.5 text-sm font-semibold text-violet-100 transition-colors hover:border-violet-400/50 hover:bg-violet-500/15"
                    >
                      作品育成ページを開く
                      <span aria-hidden="true">→</span>
                    </Link>
                    <p className="mt-1.5 text-xs text-zinc-600">
                      届いた回答の確認・開発ログ・次の改善はここから進められます。
                    </p>
                  </li>
                  <li>
                    <Link
                      href={`/projects/${submittedGameId}/devlog/new`}
                      className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-violet-500/40 hover:text-violet-200"
                    >
                      開発ログを書く
                      <span aria-hidden="true">→</span>
                    </Link>
                    <p className="mt-1.5 text-xs text-zinc-600">
                      初回の更新告知や新ver公開に使えます（任意）。
                    </p>
                  </li>
                  <li>
                    <Link
                      href={`/games/${submittedGameId}`}
                      className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
                    >
                      プレイURLを確認する
                      <span aria-hidden="true">→</span>
                    </Link>
                    <p className="mt-1.5 text-xs text-zinc-600">
                      作品詳細からプレイボタンが正しく動くか確認できます。
                    </p>
                  </li>
                </ul>
              </div>
            )}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {submittedGameId && (
                <Link
                  href={`/games/${submittedGameId}`}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-orange-500/50 hover:text-orange-400"
                >
                  投稿した作品を見る
                </Link>
              )}
              <Link
                href={
                  submittedGameId
                    ? projectStudioPath(submittedGameId)
                    : "/studio/mypage"
                }
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-orange-500/50 hover:text-orange-400"
              >
                作品育成ページを開く
              </Link>
              <Link
                href="/"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
              >
                ホームへ戻る
              </Link>
              <button
                type="button"
                onClick={handleSubmitAnother}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
              >
                もう1件投稿する
              </button>
            </div>
          </div>
        ) : !showProjectForm ? (
          <DeveloperProfileSetup onComplete={handleDeveloperProfileComplete} />
        ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8"
        >
          {developerProfile && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <p className="text-sm text-zinc-500">開発者名（公開）</p>
              <p className="mt-1 font-medium text-zinc-100">
                {developerProfile.publicName}
              </p>
            </div>
          )}

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
                    name="submit-visibility"
                    checked={visibility === option.value}
                    onChange={() => setVisibility(option.value)}
                    className="mt-0.5 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-200">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {option.hint}
                    </span>
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
                      onChange={() =>
                        setSelectedGenres((current) => toggleForgeGenre(current, option))
                      }
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
              ジャンル以外のプレイ特性や見た目。複数選べます（最大{" "}
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
            <label
              htmlFor="introduction"
              className="text-sm font-medium text-zinc-400"
            >
              作品紹介
            </label>
            <p className="mt-1 text-xs text-zinc-600">{PROJECT_INTRO_HINT}</p>
            <textarea
              id="introduction"
              required
              rows={6}
              value={introduction}
              onChange={(event) => setIntroduction(event.target.value)}
              className={`${inputClassName} resize-y`}
              placeholder="世界観・遊び方・この作品の魅力を紹介してください"
            />
          </div>

          <ProjectPhaseFormFields value={phase} onChange={setPhase} />

          <ProjectEstimatedPlayTimeField
            value={estimatedPlayTime}
            onChange={setEstimatedPlayTime}
            inputClassName={inputClassName}
          />

          <ProjectAccessEnvironmentFields
            playEnvironment={playEnvironment}
            onPlayEnvironmentChange={setPlayEnvironment}
            playUrl={playUrl}
            onPlayUrlChange={setPlayUrl}
            inputClassName={inputClassName}
          />

          <VersionPromptSettingsTrigger
            mode={testerNotesMode}
            onModeChange={setTesterNotesMode}
            drafts={promptDrafts}
            onDraftsChange={setPromptDrafts}
            showValidation={showPromptValidation}
            versionLabel="初回のプレイ可能ver"
          />

          <ExternalLinksFormFields
            formKey="submit"
            values={{
              steamUrl,
              itchUrl,
              discordUrl,
              xUrl,
              officialUrl,
              youtubeUrl,
              githubUrl,
            }}
            onChange={setExternalLinkField}
            inputClassName={inputClassName}
          />

          <ProjectThumbnailFields
            inputId="thumbnail"
            thumbnails={thumbnailUrls}
            onChange={setThumbnailUrls}
            posterFallback={
              title.trim()
                ? {
                    projectId: "submit-preview",
                    title,
                    genre: selectedGenres[0] || "Indie",
                    phase,
                  }
                : undefined
            }
          />

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3">
            <ForgeSdkNote />
          </div>

          {promptSaveError && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {promptSaveError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "投稿中..." : "投稿する"}
          </button>
        </form>
        )}
      </main>
    </PlayerShell>
  );
}
