"use client";

import Link from "next/link";
import { useState } from "react";
import { PlayerShell } from "@/components/player-shell";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ProfileAvatarPicker } from "@/components/profile-avatar-picker";
import { V0SimpleModal } from "@/components/v0-simple-modal";
import { FORGE_GENRE_OPTIONS } from "@/lib/forge-genre-options";
import { profileSelfMock } from "@/lib/profile-v0-mock-data";
import { Pencil, Sparkles } from "lucide-react";

export function ProfileSelfV0Page() {
  const [profile, setProfile] = useState(profileSelfMock);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    displayName: profile.displayName,
    bio: profile.bio,
    avatar: profile.avatar,
    favoriteGenres: [...profile.favoriteGenres],
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function openEdit() {
    setDraft({
      displayName: profile.displayName,
      bio: profile.bio,
      avatar: profile.avatar,
      favoriteGenres: [...profile.favoriteGenres],
    });
    setEditing(true);
  }

  function toggleGenre(genre: string) {
    setDraft((current) => ({
      ...current,
      favoriteGenres: current.favoriteGenres.includes(genre)
        ? current.favoriteGenres.filter((value) => value !== genre)
        : [...current.favoriteGenres, genre],
    }));
  }

  function saveProfile() {
    const displayName = draft.displayName.trim();
    if (!displayName) {
      return;
    }
    setProfile((current) => ({
      ...current,
      displayName,
      bio: draft.bio.trim() || current.bio,
      avatar: draft.avatar,
      favoriteGenres: draft.favoriteGenres.length > 0 ? draft.favoriteGenres : current.favoriteGenres,
    }));
    setEditing(false);
    setSaveMessage("プロフィールを更新しました（preview mock）。");
  }

  return (
    <PlayerShell>
      {editing && (
        <V0SimpleModal title="プロフィールを編集" onClose={() => setEditing(false)} size="lg">
          <div className="space-y-4">
            <ProfileAvatarPicker
              value={draft.avatar}
              onChange={(avatar) => setDraft((current) => ({ ...current, avatar }))}
            />
            <div>
              <label className="block text-xs font-medium text-zinc-500" htmlFor="profile-name">
                表示名
              </label>
              <input
                id="profile-name"
                type="text"
                value={draft.displayName}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, displayName: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500" htmlFor="profile-bio">
                自己紹介
              </label>
              <textarea
                id="profile-bio"
                rows={4}
                value={draft.bio}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, bio: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
              />
            </div>
            <fieldset>
              <legend className="text-xs font-medium text-zinc-500">好きなジャンル</legend>
              <div className="mt-2 max-h-32 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-2">
                <div className="flex flex-wrap gap-2">
                {FORGE_GENRE_OPTIONS.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      draft.favoriteGenres.includes(genre)
                        ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                        : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
                </div>
              </div>
            </fieldset>
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={saveProfile}
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:border-zinc-600"
            >
              キャンセル
            </button>
          </div>
        </V0SimpleModal>
      )}

      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-violet-300">プレイヤー・プロフィール</p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">マイプロフィール</h1>
            <p className="mt-2 text-sm text-zinc-500">プレイヤーとして公開される自己紹介です。</p>
          </div>
          <button
            type="button"
            onClick={openEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
          >
            <Pencil className="size-4" aria-hidden="true" />
            プロフィールを編集
          </button>
        </div>

        {saveMessage && (
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {saveMessage}
          </p>
        )}

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <ProfileAvatar src={profile.avatar} className="mx-auto size-24 sm:mx-0 sm:size-28" size={112} />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">{profile.displayName}</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{profile.bio}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-500 sm:justify-start">
                <span>Forge参加 {profile.joinedAt}</span>
                <span>最終ログイン {profile.lastLogin}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "送ったFB", value: profile.stats.feedbackCount },
              { label: "共感された回数", value: profile.stats.voicesReceived },
              { label: "フォロー中開発者", value: profile.stats.followingDevelopers },
              { label: "見届け中", value: profile.stats.witnessingGames },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3 text-center"
              >
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h3 className="text-sm font-semibold text-white">自己紹介</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{profile.bio}</p>
          </section>
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h3 className="text-sm font-semibold text-white">好きなジャンル</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.favoriteGenres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300"
                >
                  {genre}
                </span>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h3 className="text-sm font-semibold text-white">ハイライト実績</h3>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {profile.highlightBadges.map((badge) => (
                <div key={badge.id} className="text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/60 text-lg">
                    {badge.emoji}
                  </span>
                  <p className="mt-2 text-[10px] leading-tight text-zinc-500">{badge.label}</p>
                </div>
              ))}
            </div>
            <Link
              href="/mypage?tab=achievements"
              className="mt-4 inline-block text-xs text-violet-400 transition-colors hover:text-violet-300"
            >
              すべて見る →
            </Link>
          </section>
        </div>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">最近の活動</h3>
            <Link
              href="/mypage?tab=feedback"
              className="text-xs text-violet-400 transition-colors hover:text-violet-300"
            >
              すべて見る
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-zinc-800/80">
            {profile.recentActivity.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <Sparkles className="mt-0.5 size-4 shrink-0 text-violet-400" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-300">{entry.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-600">{entry.relativeTime}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PlayerShell>
  );
}
