"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { WATCH_STAT_LABEL } from "@/lib/watch-ui-labels";
import { PlayerShell } from "@/components/player-shell";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ProfileAvatarPicker } from "@/components/profile-avatar-picker";
import { V0SimpleModal } from "@/components/v0-simple-modal";
import { FORGE_GENRE_OPTIONS } from "@/lib/forge-genre-options";
import { profileAvatarPresets } from "@/lib/profile-avatar-presets";
import { profileSelfMock } from "@/lib/profile-v0-mock-data";
import {
  publicBioForDisplay,
  publicProfileFromDeveloperRow,
  toDeveloperProfileInput,
} from "@/lib/public-profile";
import { defaultPublicAvatarSrc } from "@/lib/public-profile-display";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { Pencil, Sparkles } from "lucide-react";

export function ProfileSelfV0Page() {
  const hideV0Mock = shouldHideV0MockContent();
  const { user, hydrated, updateDisplayName } = useAuth();
  const {
    getFollowedDevelopers,
    getWatchedGames,
    getDeveloperProfileByUserId,
    saveDeveloperProfile,
    syncOwnedProjectDisplayNames,
  } = useGames();
  const developerProfile = user ? getDeveloperProfileByUserId(user.id) : undefined;
  const [profile, setProfile] = useState(profileSelfMock);
  const displayProfile = useMemo(() => {
    if (!user) {
      if (!hideV0Mock) {
        return profile;
      }
      return null;
    }

    if (!hideV0Mock) {
      return profile;
    }

    const shared = publicProfileFromDeveloperRow(developerProfile, user.name);
    return {
      ...profile,
      displayName: shared.displayName,
      avatar: shared.avatarUrl || defaultPublicAvatarSrc(user.id),
      bio: shared.bio,
      website: shared.website ?? "",
      joinedAt: "",
      lastLogin: "",
      stats: {
        feedbackCount: 0,
        voicesReceived: 0,
        followingDevelopers: getFollowedDevelopers().length,
        witnessingGames: getWatchedGames().length,
      },
      favoriteGenres: [],
      highlightBadges: [],
      recentActivity: [],
    };
  }, [
    developerProfile,
    getFollowedDevelopers,
    getWatchedGames,
    hideV0Mock,
    profile,
    user,
  ]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    displayName: profile.displayName,
    bio: profile.bio,
    avatar: profile.avatar,
    website: "",
    favoriteGenres: [...profile.favoriteGenres],
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openEdit() {
    if (!displayProfile) {
      return;
    }
    setDraft({
      displayName: displayProfile.displayName,
      bio: publicBioForDisplay(displayProfile.bio),
      avatar: displayProfile.avatar,
      website: "website" in displayProfile ? String(displayProfile.website ?? "") : "",
      favoriteGenres: [...displayProfile.favoriteGenres],
    });
    setSaveError(null);
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

  async function saveProfile() {
    const displayName = draft.displayName.trim();
    if (!displayName) {
      return;
    }

    setSaveError(null);
    setSaveMessage(null);

    if (hideV0Mock) {
      if (!user) {
        return;
      }

      setSaving(true);
      try {
        const previousName = publicProfileFromDeveloperRow(developerProfile, user.name)
          .displayName;
        await updateDisplayName(displayName);
        await saveDeveloperProfile(
          user.id,
          toDeveloperProfileInput(
            {
              displayName,
              bio: draft.bio,
              avatarUrl: draft.avatar.trim() || null,
              website: draft.website.trim() || undefined,
              xAccount: developerProfile?.xAccount,
            },
            developerProfile,
          ),
        );
        if (previousName !== displayName) {
          await syncOwnedProjectDisplayNames(user.id, displayName);
        }
        setEditing(false);
        setSaveMessage("プロフィールを更新しました。");
      } catch {
        setSaveError("保存に失敗しました。時間をおいて再度お試しください。");
      } finally {
        setSaving(false);
      }
      return;
    }

    setProfile((current) => ({
      ...current,
      displayName,
      bio: draft.bio.trim() || current.bio,
      avatar: draft.avatar,
      favoriteGenres:
        draft.favoriteGenres.length > 0 ? draft.favoriteGenres : current.favoriteGenres,
    }));
    setEditing(false);
    setSaveMessage("表示を更新しました（確認用データです）。");
  }

  if (hideV0Mock && hydrated && !user) {
    return (
      <PlayerShell>
        <p className="text-sm text-zinc-500">読み込み中…</p>
      </PlayerShell>
    );
  }

  if (!displayProfile) {
    return (
      <PlayerShell>
        <p className="text-sm text-zinc-500">読み込み中…</p>
      </PlayerShell>
    );
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
            {hideV0Mock ? (
              <div>
                <label
                  className="block text-xs font-medium text-zinc-500"
                  htmlFor="profile-website"
                >
                  Webサイト
                </label>
                <input
                  id="profile-website"
                  type="url"
                  value={draft.website}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, website: event.target.value }))
                  }
                  placeholder="https://"
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
                />
              </div>
            ) : (
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
            )}
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => void saveProfile()}
              disabled={saving}
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "保存中…" : "保存"}
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
            <h1 className="text-2xl font-bold text-white sm:text-3xl">プロフィール</h1>
            <p className="mt-2 text-sm text-zinc-500">
              プレイヤー・開発者で共通の公開プロフィールです。
            </p>
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

        {saveError && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {saveError}
          </p>
        )}

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <ProfileAvatar
              src={displayProfile.avatar}
              className="mx-auto size-24 sm:mx-0 sm:size-28"
              size={112}
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">{displayProfile.displayName}</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                {displayProfile.bio ||
                  (hideV0Mock ? "自己紹介はまだ未設定です。" : displayProfile.bio)}
              </p>
              {hideV0Mock && "website" in displayProfile && displayProfile.website ? (
                <p className="mt-2 truncate text-xs text-zinc-500">
                  {String(displayProfile.website)}
                </p>
              ) : null}
              {!hideV0Mock && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-500 sm:justify-start">
                  <span>Forge参加 {displayProfile.joinedAt}</span>
                  <span>最終ログイン {displayProfile.lastLogin}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {(hideV0Mock
              ? [
                  {
                    label: "フォロー中開発者",
                    value: displayProfile.stats.followingDevelopers,
                  },
                  {
                    label: WATCH_STAT_LABEL,
                    value: displayProfile.stats.witnessingGames,
                  },
                ]
              : [
                  {
                    label: "送ったFB",
                    value: displayProfile.stats.feedbackCount,
                  },
                  {
                    label: "共感された回数",
                    value: displayProfile.stats.voicesReceived,
                  },
                  {
                    label: "フォロー中開発者",
                    value: displayProfile.stats.followingDevelopers,
                  },
                  {
                    label: WATCH_STAT_LABEL,
                    value: displayProfile.stats.witnessingGames,
                  },
                ]
            ).map((stat) => (
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

        {!hideV0Mock ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
              <h3 className="text-sm font-semibold text-white">自己紹介</h3>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-400">
                {displayProfile.bio}
              </p>
            </section>
            <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
              <h3 className="text-sm font-semibold text-white">好きなジャンル</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {displayProfile.favoriteGenres.map((genre) => (
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
                {displayProfile.highlightBadges.map((badge) => (
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
        ) : null}

        {!hideV0Mock ? (
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
              {displayProfile.recentActivity.map((entry) => (
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
        ) : null}
      </div>
    </PlayerShell>
  );
}
