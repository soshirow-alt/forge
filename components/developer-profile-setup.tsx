"use client";

import { useState, type FormEvent } from "react";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

type DeveloperProfileSetupProps = {
  onComplete: (input: {
    publicName: string;
    profile: string;
    xAccount?: string;
    website?: string;
    discordUrl?: string;
    youtubeUrl?: string;
  }) => void;
};

export function DeveloperProfileSetup({ onComplete }: DeveloperProfileSetupProps) {
  const [publicName, setPublicName] = useState("");
  const [profile, setProfile] = useState("");
  const [xAccount, setXAccount] = useState("");
  const [website, setWebsite] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onComplete({
      publicName,
      profile,
      xAccount: xAccount || undefined,
      website: website || undefined,
      discordUrl: discordUrl || undefined,
      youtubeUrl: youtubeUrl || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8"
    >
      <div>
        <p className="text-sm text-zinc-400">
          作品を投稿する前に、開発者として公開されるプロフィールを作成してください。
        </p>
      </div>

      <div>
        <label htmlFor="publicName" className="text-sm font-medium text-zinc-400">
          開発者名（公開）
        </label>
        <input
          id="publicName"
          type="text"
          required
          value={publicName}
          onChange={(event) => setPublicName(event.target.value)}
          className={inputClassName}
          placeholder="スタジオ名または開発者名"
        />
      </div>

      <div>
        <label htmlFor="profile" className="text-sm font-medium text-zinc-400">
          プロフィール
        </label>
        <textarea
          id="profile"
          required
          rows={4}
          value={profile}
          onChange={(event) => setProfile(event.target.value)}
          className={`${inputClassName} resize-y`}
          placeholder="制作スタイルや得意ジャンルなどを紹介してください"
        />
      </div>

      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-sm font-medium text-zinc-400">コミュニティ・広報（任意）</p>
        <p className="text-xs text-zinc-600">
          `/creators/` の開発者プロフィールにも表示されます。作品ごとのリンクとは別に、開発者共通の URL を登録できます。
        </p>
        <div>
          <label htmlFor="discordUrl" className="text-sm font-medium text-zinc-400">
            Discord
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
          <label htmlFor="youtubeUrl" className="text-sm font-medium text-zinc-400">
            YouTube
          </label>
          <input
            id="youtubeUrl"
            type="url"
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            className={inputClassName}
            placeholder="https://www.youtube.com/..."
          />
        </div>
      </div>

      <div>
        <label htmlFor="xAccount" className="text-sm font-medium text-zinc-400">
          Xアカウント（任意）
        </label>
        <input
          id="xAccount"
          type="text"
          value={xAccount}
          onChange={(event) => setXAccount(event.target.value)}
          className={inputClassName}
          placeholder="@username"
        />
      </div>

      <div>
        <label htmlFor="website" className="text-sm font-medium text-zinc-400">
          Webサイト（任意）
        </label>
        <input
          id="website"
          type="url"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          className={inputClassName}
          placeholder="https://example.com"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-semibold text-zinc-950 transition-opacity hover:opacity-90"
      >
        開発者プロフィールを作成して続ける
      </button>
    </form>
  );
}
