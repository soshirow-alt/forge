"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { DeveloperProfileSetup } from "@/components/developer-profile-setup";
import { PlayerShell } from "@/components/player-shell";
import { GeneratedThumbnailPoster } from "@/components/generated-thumbnail-poster";
import { ForgeSdkNote } from "@/components/forge-sdk-note";
import { VersionPromptEditor } from "@/components/version-prompt-editor";
import { useGames } from "@/components/games-provider";
import {
  EMPTY_PLAY_ENVIRONMENT_FORM,
  mergePlayEnvironmentIntoTags,
  type DistributionType,
} from "@/lib/play-environment";
import { projectStudioPath } from "@/lib/project-nurture-links";
import { DEVELOPMENT_PHASE_OPTIONS } from "@/lib/development-phases";
import { PLAY_TIME_OPTIONS } from "@/lib/play-time-options";
import { resolvePlayableVersion } from "@/lib/playable-version";
import {
  createEmptyPromptDraft,
  sanitizePromptDrafts,
  validatePromptDrafts,
  type DeveloperPromptDraft,
} from "@/lib/version-prompt-form";

const phaseOptions = DEVELOPMENT_PHASE_OPTIONS;

const genreOptions = [
  "アクション",
  "RPG",
  "ADV",
  "シミュレーション",
  "パズル",
  "ホラー",
  "シューティング",
  "ノベル",
  "その他",
] as const;

const featureTags = [
  "協力プレイ",
  "ソロ向け",
  "短時間プレイ",
  "高難度",
  "ストーリー重視",
  "PvP",
  "PvE",
] as const;

const distributionOptions: {
  value: DistributionType;
  label: string;
  hint: string;
}[] = [
  {
    value: "browser",
    label: "ブラウザプレイ",
    hint: "URLを開くとブラウザでそのまま遊べる",
  },
  {
    value: "download",
    label: "ダウンロード",
    hint: "ファイルを落としてプレイする",
  },
  {
    value: "external",
    label: "外部サイト",
    hint: "Steam・itch.io など別サイトでプレイ",
  },
];

function getAccessUrlField(distribution: DistributionType) {
  switch (distribution) {
    case "browser":
      return {
        label: "プレイURL",
        placeholder: "https://example.com/play",
        hint: "テスターがブラウザで開いて遊べるURL",
      };
    case "download":
      return {
        label: "ダウンロードURL",
        placeholder: "https://example.com/game.zip",
        hint: "zip など配布ファイルのURL",
      };
    case "external":
      return {
        label: "ゲームページURL",
        placeholder: "https://store.steampowered.com/...",
        hint: "Steam・itch.io 等、テスターがゲームにアクセスするURL",
      };
    default:
      return null;
  }
}

type ExternalLinkKey = "steam" | "itch" | "discord" | "github" | "official";

const externalLinkOptions: { key: ExternalLinkKey; label: string }[] = [
  { key: "steam", label: "Steam" },
  { key: "itch", label: "itch.io" },
  { key: "discord", label: "Discord" },
  { key: "github", label: "GitHub" },
  { key: "official", label: "公式サイト" },
];

const externalLinkPlaceholders: Record<ExternalLinkKey, string> = {
  steam: "https://store.steampowered.com/...",
  itch: "https://example.itch.io/...",
  discord: "https://discord.gg/...",
  github: "https://github.com/...",
  official: "https://example.com",
};

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

export function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { user, hydrated } = useAuth();

  const { addSubmittedGame, getDeveloperProfileByUserId, saveDeveloperProfile, saveDeveloperVersionPrompts } =
    useGames();

  const developerProfile = user
    ? getDeveloperProfileByUserId(user.id)
    : undefined;
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedGameId, setSubmittedGameId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState("");
  const [estimatedPlayTime, setEstimatedPlayTime] = useState("");
  const [playUrl, setPlayUrl] = useState("");
  const [distribution, setDistribution] = useState<DistributionType>("");
  const [testerNotesMode, setTesterNotesMode] = useState<"none" | "custom">(
    "none",
  );
  const [promptDrafts, setPromptDrafts] = useState<DeveloperPromptDraft[]>([
    createEmptyPromptDraft(),
  ]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [enabledExternalLinks, setEnabledExternalLinks] = useState<
    ExternalLinkKey[]
  >([]);
  const [steamUrl, setSteamUrl] = useState("");
  const [itchUrl, setItchUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | undefined>();
  const [fileInputKey, setFileInputKey] = useState(0);
  const [promptSaveError, setPromptSaveError] = useState<string | null>(null);
  const [showPromptValidation, setShowPromptValidation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editId) {
      router.replace(`/projects/${editId}/edit`);
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

  function toggleExternalLink(key: ExternalLinkKey) {
    setEnabledExternalLinks((prev) => {
      if (prev.includes(key)) {
        switch (key) {
          case "steam":
            setSteamUrl("");
            break;
          case "itch":
            setItchUrl("");
            break;
          case "discord":
            setDiscordUrl("");
            break;
          case "github":
            setGithubUrl("");
            break;
          case "official":
            setOfficialUrl("");
            break;
        }
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
  }

  function getExternalLinkUrl(key: ExternalLinkKey): string {
    switch (key) {
      case "steam":
        return steamUrl;
      case "itch":
        return itchUrl;
      case "discord":
        return discordUrl;
      case "github":
        return githubUrl;
      case "official":
        return officialUrl;
    }
  }

  function setExternalLinkUrl(key: ExternalLinkKey, value: string) {
    switch (key) {
      case "steam":
        setSteamUrl(value);
        break;
      case "itch":
        setItchUrl(value);
        break;
      case "discord":
        setDiscordUrl(value);
        break;
      case "github":
        setGithubUrl(value);
        break;
      case "official":
        setOfficialUrl(value);
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

    const playEnvironment = {
      ...EMPTY_PLAY_ENVIRONMENT_FORM,
      distribution,
    };

    const data = {
      title,
      creator: profile.publicName,
      genre,
      description,
      phase,
      thumbnailUrl,
      lookingForTesters: false,
      tags: mergePlayEnvironmentIntoTags(selectedTags, playEnvironment),
      playUrl,
      estimatedPlayTime: estimatedPlayTime || undefined,
      steamUrl: steamUrl || undefined,
      itchUrl: itchUrl || undefined,
      githubUrl: githubUrl || undefined,
      discordUrl: discordUrl || undefined,
      officialUrl: officialUrl || undefined,
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
      setGenre("");
      setDescription("");
      setPhase("");
      setEstimatedPlayTime("");
      setPlayUrl("");
      setDistribution("");
      setTesterNotesMode("none");
      setPromptDrafts([createEmptyPromptDraft()]);
      setSelectedTags([]);
      setEnabledExternalLinks([]);
      setSteamUrl("");
      setItchUrl("");
      setGithubUrl("");
      setDiscordUrl("");
      setOfficialUrl("");
      setThumbnailUrl(undefined);
      setThumbnailPreview(undefined);
      setFileInputKey((key) => key + 1);
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
              作品一覧の「新着作品」に表示されます
            </p>

            {submittedGameId && (
              <div className="mx-auto mt-10 max-w-lg text-left">
                <p className="text-sm font-medium text-zinc-300">次にやること</p>
                <p className="mt-1 text-xs text-zinc-600">
                  投稿 → 発見 → プレイ → 回答の流れに沿って進められます。
                </p>
                <ul className="mt-4 space-y-3">
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
                  <li>
                    <Link
                      href={`/games/${submittedGameId}`}
                      className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-orange-500/50 hover:text-orange-400"
                    >
                      プレイURLを確認する
                      <span aria-hidden="true">→</span>
                    </Link>
                    <p className="mt-1.5 text-xs text-zinc-600">
                      作品詳細からプレイボタンが正しく動くか確認できます。
                    </p>
                  </li>
                  <li>
                    <Link
                      href={
                        submittedGameId
                          ? projectStudioPath(submittedGameId)
                          : "/my-projects"
                      }
                      className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-orange-500/50 hover:text-orange-400"
                    >
                      作品育成ページを開く
                      <span aria-hidden="true">→</span>
                    </Link>
                    <p className="mt-1.5 text-xs text-zinc-600">
                      届いた回答の確認や、次の改善は育成ページから進められます。
                    </p>
                  </li>
                  <li>
                    <Link
                      href={`/projects/${submittedGameId}/devlog/new`}
                      className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
                    >
                      開発ログを書く
                      <span aria-hidden="true">→</span>
                    </Link>
                    <p className="mt-1.5 text-xs text-zinc-600">
                      初回の更新告知や改善共有に使えます（任意）。
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
                    : "/my-projects"
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

          <fieldset>
            <legend className="text-sm font-medium text-zinc-400">ジャンル</legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {genreOptions.map((option) => (
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
                    name="genre"
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

          <div>
            <label
              htmlFor="description"
              className="text-sm font-medium text-zinc-400"
            >
              ゲーム説明
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

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-zinc-400">
              開発フェーズ
            </legend>
            <p className="text-xs text-zinc-600">
              今の完成度を選んでください。テスターがどこまで遊べるかの目安になります
            </p>
            <div className="space-y-2">
              {phaseOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
                    phase === option.value
                      ? "border-orange-500/40 bg-orange-500/5"
                      : "border-zinc-800 bg-zinc-950/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="phase"
                    required
                    value={option.value}
                    checked={phase === option.value}
                    onChange={() => setPhase(option.value)}
                    className="mt-0.5 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-300">
                      {option.value}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-600">
                      {option.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="estimatedPlayTime" className="text-sm font-medium text-zinc-400">
              想定プレイ時間{" "}
              <span className="font-normal text-zinc-600">（任意）</span>
            </label>
            <select
              id="estimatedPlayTime"
              value={estimatedPlayTime}
              onChange={(event) => setEstimatedPlayTime(event.target.value)}
              className={inputClassName}
            >
              <option value="">選択しない</option>
              {PLAY_TIME_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
            <div>
              <p className="text-sm font-medium text-zinc-400">
                テスターのアクセス方法
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                テスターがゲームに触れる方法を選んでください
              </p>
            </div>
            <div className="space-y-2">
              {distributionOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
                    distribution === option.value
                      ? "border-orange-500/40 bg-orange-500/5"
                      : "border-zinc-800 bg-zinc-900/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="distribution"
                    required
                    checked={distribution === option.value}
                    onChange={() => setDistribution(option.value)}
                    className="mt-0.5 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-300">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-600">
                      {option.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {getAccessUrlField(distribution) && (
              <div>
                <label htmlFor="playUrl" className="text-sm font-medium text-zinc-400">
                  {getAccessUrlField(distribution)!.label}
                </label>
                <p className="mt-1 text-xs text-zinc-600">
                  {getAccessUrlField(distribution)!.hint}
                </p>
                <input
                  id="playUrl"
                  type="url"
                  required
                  value={playUrl}
                  onChange={(event) => setPlayUrl(event.target.value)}
                  className={inputClassName}
                  placeholder={getAccessUrlField(distribution)!.placeholder}
                />
              </div>
            )}
          </div>

          <VersionPromptEditor
            mode={testerNotesMode}
            onModeChange={setTesterNotesMode}
            drafts={promptDrafts}
            onDraftsChange={setPromptDrafts}
            showValidation={showPromptValidation}
            versionLabel="初回のプレイ可能版"
          />

          <div>
            <p className="text-sm font-medium text-zinc-400">特徴タグ</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {featureTags.map((tag) => (
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
          </div>

          <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
            <div>
              <p className="text-sm font-medium text-zinc-400">
                関連リンク{" "}
                <span className="font-normal text-zinc-600">（任意）</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                上のアクセスURLとは別に、作品ページに載せたいリンクです。Discord（コミュニティ用）や
                GitHub（開発リポジトリ）など、テスター向けの補助情報に使います。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {externalLinkOptions.map((option) => (
                <label
                  key={option.key}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    enabledExternalLinks.includes(option.key)
                      ? "border-orange-500/40 bg-orange-500/5 text-orange-300"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={enabledExternalLinks.includes(option.key)}
                    onChange={() => toggleExternalLink(option.key)}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {enabledExternalLinks.map((key) => {
              const label =
                externalLinkOptions.find((option) => option.key === key)
                  ?.label ?? key;
              return (
                <div key={key}>
                  <label
                    htmlFor={`external-${key}`}
                    className="text-sm text-zinc-500"
                  >
                    {label} URL
                  </label>
                  <input
                    id={`external-${key}`}
                    type="url"
                    value={getExternalLinkUrl(key)}
                    onChange={(event) =>
                      setExternalLinkUrl(key, event.target.value)
                    }
                    className={inputClassName}
                    placeholder={externalLinkPlaceholders[key]}
                  />
                </div>
              );
            })}
          </div>

          <div>
            <label htmlFor="thumbnail" className="text-sm font-medium text-zinc-400">
              サムネイル画像（推奨）
            </label>
            <p className="mt-1 text-sm text-zinc-500">
              作品一覧で目立ちやすくなります。未設定でもForgeが仮サムネイルを自動生成します。
            </p>
            <input
              id="thumbnail"
              key={fileInputKey}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="mt-3 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-200 hover:file:bg-zinc-700"
            />
            <p className="mt-3 inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-500">
              AIで仮サムネ生成（Coming Soon）
            </p>
            {thumbnailPreview ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-zinc-700">
                <img
                  src={thumbnailPreview}
                  alt="サムネイルプレビュー"
                  className="aspect-video w-full object-cover"
                />
              </div>
            ) : title.trim() ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-zinc-700">
                <div className="aspect-video">
                  <GeneratedThumbnailPoster
                    projectId="submit-preview"
                    title={title}
                    genre={genre || "Indie"}
                    phase={phase}
                  />
                </div>
                <p className="border-t border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-500">
                  自動生成プレビュー（投稿後も同様の仮サムネイルが表示されます）
                </p>
              </div>
            ) : null}
          </div>

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
