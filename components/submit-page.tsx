"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { DeveloperProfileSetup } from "@/components/developer-profile-setup";
import { ForgeHeader } from "@/components/forge-header";
import { useGames } from "@/components/games-provider";
import { AVAILABLE_TAGS } from "@/lib/game-tags";

const phaseOptions = [
  "企画段階",
  "プロトタイプ",
  "試作版",
  "初期開発",
  "α版",
  "β版",
];

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

  const { addSubmittedGame, getDeveloperProfileByUserId, saveDeveloperProfile } =
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
  const [phase, setPhase] = useState(phaseOptions[0]);
  const [lookingForTesters, setLookingForTesters] = useState(false);
  const [testerSlots, setTesterSlots] = useState(10);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [playUrl, setPlayUrl] = useState("");
  const [steamUrl, setSteamUrl] = useState("");
  const [itchUrl, setItchUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | undefined>();
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    if (editId) {
      router.replace(`/projects/${editId}/edit`);
    }
  }, [editId, router]);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login?redirect=/submit");
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    if (developerProfile) {
      setShowProjectForm(true);
    }
  }, [developerProfile]);

  if (!hydrated) {
    return (
      <div className="min-h-full bg-zinc-950 text-zinc-100">
        <ForgeHeader />
        <main className="mx-auto max-w-2xl px-6 py-12">
          <p className="text-zinc-500">読み込み中...</p>
        </main>
      </div>
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

    if (!user) {
      router.push("/login?redirect=/submit");
      return;
    }

    const profile = getDeveloperProfileByUserId(user.id);
    if (!profile) {
      setShowProjectForm(false);
      return;
    }

    const data = {
      title,
      creator: profile.publicName,
      genre,
      description,
      phase,
      thumbnailUrl,
      lookingForTesters,
      testerSlots: lookingForTesters ? testerSlots : undefined,
      tags: selectedTags,
      playUrl,
      steamUrl: steamUrl || undefined,
      itchUrl: itchUrl || undefined,
      githubUrl: githubUrl || undefined,
      discordUrl: discordUrl || undefined,
      officialUrl: officialUrl || undefined,
    };

    const game = await addSubmittedGame(data, {
      ownerId: user.id,
      ownerName: user.name,
    });

    setSubmittedGameId(game.id);
    setSuccess(true);
    setTitle("");
    setGenre("");
    setDescription("");
    setPhase(phaseOptions[0]);
    setLookingForTesters(false);
    setTesterSlots(10);
    setSelectedTags([]);
    setPlayUrl("");
    setSteamUrl("");
    setItchUrl("");
    setGithubUrl("");
    setDiscordUrl("");
    setOfficialUrl("");
    setThumbnailUrl(undefined);
    setThumbnailPreview(undefined);
    setFileInputKey((key) => key + 1);
  }

  function handleSubmitAnother() {
    setSuccess(false);
    setSubmittedGameId(null);
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <ForgeHeader />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
        >
          ← 作品一覧に戻る
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
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
              >
                ホームへ戻る
              </Link>
              {submittedGameId && (
                <Link
                  href={`/games/${submittedGameId}`}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-orange-500/50 hover:text-orange-400"
                >
                  投稿した作品を見る
                </Link>
              )}
              <Link
                href="/my-projects"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-orange-500/50 hover:text-orange-400"
              >
                ダッシュボードを見る
              </Link>
              <button
                type="button"
                onClick={handleSubmitAnother}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-orange-500/50 hover:text-orange-400"
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
            <label htmlFor="phase" className="text-sm font-medium text-zinc-400">
              開発フェーズ
            </label>
            <select
              id="phase"
              required
              value={phase}
              onChange={(event) => setPhase(event.target.value)}
              className={inputClassName}
            >
              {phaseOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={lookingForTesters}
                onChange={(event) => setLookingForTesters(event.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
              />
              <span className="text-sm font-medium text-zinc-300">
                テスターを募集する
              </span>
            </label>

            {lookingForTesters && (
              <div>
                <label
                  htmlFor="testerSlots"
                  className="text-sm font-medium text-zinc-400"
                >
                  募集人数
                </label>
                <input
                  id="testerSlots"
                  type="number"
                  min={1}
                  required
                  value={testerSlots}
                  onChange={(event) =>
                    setTesterSlots(Number(event.target.value))
                  }
                  className={inputClassName}
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="playUrl" className="text-sm font-medium text-zinc-400">
              プレイURL
            </label>
            <input
              id="playUrl"
              type="url"
              required
              value={playUrl}
              onChange={(event) => setPlayUrl(event.target.value)}
              className={inputClassName}
              placeholder="https://example.com"
            />
          </div>

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
              {AVAILABLE_TAGS.map((tag) => (
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

          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-semibold text-zinc-950 transition-opacity hover:opacity-90"
          >
            投稿する
          </button>
        </form>
        )}
      </main>
    </div>
  );
}
