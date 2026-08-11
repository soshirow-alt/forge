"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ProfileAvatarPicker } from "@/components/profile-avatar-picker";
import { ProfilePublicXCard } from "@/components/profile-public-x-card";
import { PublicXLink } from "@/components/public-x-link";
import { V0SimpleModal } from "@/components/v0-simple-modal";
import { useCommunityHubSupabase } from "@/hooks/use-community-hub-supabase";
import { creatorProfileHref } from "@/lib/mypage-navigation";
import { isGamePublic } from "@/lib/project-visibility";
import {
  cleanupUploadedProfileAvatar,
  mapProfileSaveError,
  resolveAvatarUrlForSave,
} from "@/lib/profile-avatar-client";
import {
  publicBioForDisplay,
  publicProfileFromDeveloperRow,
  toDeveloperProfileInput,
} from "@/lib/public-profile";
import {
  resolvePublicProfileDisplay,
} from "@/lib/public-profile-display";
import { normalizePublicXHandle } from "@/lib/public-x-link";
import { WATCH_STAT_LABEL } from "@/lib/watch-ui-labels";
import {
  CREATOR_CAPABILITY_TAG_IDS,
  creatorCapabilityTagLabel,
} from "@/lib/creator-activity-categories";
import type { ActivityTagId } from "@/lib/project-categories";
import { Pencil } from "lucide-react";

export type SharedSelfProfileShell = "player" | "studio";

type Draft = {
  displayName: string;
  bio: string;
  avatar: string;
  website: string;
  publicX: string;
  activityTags: ActivityTagId[];
};

function websiteHref(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

function RoleStatRow({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
  if (!href) return content;
  return (
    <Link href={href} className="block transition-colors hover:bg-zinc-900/40">
      {content}
    </Link>
  );
}

function RoleColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-2 divide-y divide-zinc-800/80">{children}</div>
    </section>
  );
}

/**
 * Canonical self profile — identical top SoT for Player and Studio.
 * Role activity columns sit below; shells wrap this component.
 */
export function SharedSelfProfile({
  shell,
}: {
  shell: SharedSelfProfileShell;
}) {
  const { user, hydrated, updateDisplayName } = useAuth();
  const {
    getFollowedDevelopers,
    getWatchedGames,
    getOwnedProjects,
    getDeveloperProfileByUserId,
    saveDeveloperProfile,
    syncOwnedProjectDisplayNames,
    getDevlogsByProject,
    getFollowerCount,
    refreshFollowerCount,
  } = useGames();
  const { joinedCommunities } = useCommunityHubSupabase(false);

  const developerProfile = user ? getDeveloperProfileByUserId(user.id) : undefined;
  const display = useMemo(() => {
    if (!user) return null;
    return resolvePublicProfileDisplay(developerProfile, {
      userId: user.id,
      fallbackName: user.name,
    });
  }, [developerProfile, user]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    displayName: "",
    bio: "",
    avatar: "",
    website: "",
    publicX: "",
    activityTags: [],
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [followersLoadedForUser, setFollowersLoadedForUser] = useState<string | null>(null);

  const owned = user ? getOwnedProjects(user.id) : [];
  const publicOwned = owned.filter(isGamePublic);
  const isDeveloper = publicOwned.length > 0 || owned.length > 0;
  const devlogCount = publicOwned.reduce(
    (sum, game) => sum + getDevlogsByProject(game.id).length,
    0,
  );
  const followedCount = getFollowedDevelopers().length;
  const watchedCount = getWatchedGames().length;
  const communityCount = joinedCommunities.length;
  const followersLoaded = Boolean(user && followersLoadedForUser === user.id);
  const followerCount =
    display && followersLoaded ? getFollowerCount(display.routeId, 0) : null;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void refreshFollowerCount(user.id).finally(() => {
      if (!cancelled) setFollowersLoadedForUser(user.id);
    });
    return () => {
      cancelled = true;
    };
  }, [user, refreshFollowerCount]);

  function openEdit() {
    if (!display || !user) return;
    const shared = publicProfileFromDeveloperRow(developerProfile, user.name);
    const tags = (developerProfile?.activityTags ?? []).filter(
      (tag): tag is ActivityTagId =>
        CREATOR_CAPABILITY_TAG_IDS.includes(tag as ActivityTagId),
    );
    setDraft({
      displayName: shared.displayName,
      bio: publicBioForDisplay(shared.bio),
      avatar: display.avatarSrc,
      website: shared.website ?? "",
      publicX: normalizePublicXHandle(shared.xAccount) ?? "",
      activityTags: tags,
    });
    setSaveError(null);
    setEditing(true);
  }

  async function persistFields(next: {
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    website: string | null;
    xAccount: string | null;
    activityTags?: string[] | null;
  }) {
    if (!user) return;
    const previousName = publicProfileFromDeveloperRow(
      developerProfile,
      user.name,
    ).displayName;
    await updateDisplayName(next.displayName);
    await saveDeveloperProfile(
      user.id,
      toDeveloperProfileInput(
        {
          displayName: next.displayName,
          bio: next.bio,
          avatarUrl: next.avatarUrl,
          website: next.website,
          xAccount: next.xAccount,
          activityTags: next.activityTags,
        },
        developerProfile,
      ),
    );
    if (previousName !== next.displayName) {
      await syncOwnedProjectDisplayNames(user.id, next.displayName);
    }
  }

  async function saveProfile() {
    const displayName = draft.displayName.trim();
    if (!displayName || !user) return;

    setSaveError(null);
    setSaveMessage(null);
    setSaving(true);
    let uploadedObjectPath: string | null = null;
    const previousAvatarUrl =
      publicProfileFromDeveloperRow(developerProfile, user.name).avatarUrl;
    try {
      const xRaw = draft.publicX.trim();
      const xNormalized = normalizePublicXHandle(xRaw);
      if (xRaw && !xNormalized) {
        setSaveError("公開Xは有効な@handleのみ設定できます。");
        return;
      }

      const resolvedAvatar = await resolveAvatarUrlForSave(
        draft.avatar,
        previousAvatarUrl,
      );
      uploadedObjectPath = resolvedAvatar.uploadedObjectPath;

      await persistFields({
        displayName,
        bio: draft.bio,
        avatarUrl: resolvedAvatar.avatarUrl,
        website: draft.website.trim() || null,
        xAccount: xNormalized,
        activityTags: draft.activityTags,
      });
      setEditing(false);
      setSaveMessage("プロフィールを更新しました。");
    } catch (error) {
      console.error("[shared-self-profile] save failed", error);
      if (uploadedObjectPath) {
        await cleanupUploadedProfileAvatar(uploadedObjectPath);
      }
      setSaveError(mapProfileSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handlePublicXPublish(publish: boolean, linkedHandle: string | null) {
    if (!user || !display) return;
    const shared = publicProfileFromDeveloperRow(developerProfile, user.name);
    const handle = normalizePublicXHandle(linkedHandle);
    if (publish && !handle) {
      throw new Error("linked handle required");
    }
    await persistFields({
      displayName: shared.displayName,
      bio: shared.bio,
      avatarUrl: shared.avatarUrl,
      website: shared.website ?? null,
      xAccount: publish ? handle : null,
    });
  }

  if (!hydrated || !user || !display) {
    return <p className="text-sm text-zinc-500">読み込み中…</p>;
  }

  const hasPlayerActivity =
    followedCount > 0 || watchedCount > 0 || communityCount > 0;
  const publicCreatorHref = creatorProfileHref(display.routeId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {editing ? (
        <V0SimpleModal title="プロフィールを編集" onClose={() => setEditing(false)} size="lg">
          <div className="space-y-4">
            <ProfileAvatarPicker
              value={draft.avatar}
              onChange={(avatar) => setDraft((current) => ({ ...current, avatar }))}
            />
            <div>
              <label className="block text-xs font-medium text-zinc-500" htmlFor="shared-profile-name">
                表示名
              </label>
              <input
                id="shared-profile-name"
                type="text"
                value={draft.displayName}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, displayName: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500" htmlFor="shared-profile-bio">
                自己紹介
              </label>
              <textarea
                id="shared-profile-bio"
                rows={4}
                value={draft.bio}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, bio: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
              />
            </div>
            <fieldset>
              <legend className="text-xs font-medium text-zinc-500">制作領域</legend>
              <p className="mt-1 text-[11px] text-zinc-600">
                5カテゴリのクリエイターとして、得意な制作領域を選べます（任意）。
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CREATOR_CAPABILITY_TAG_IDS.map((tagId) => {
                  const selected = draft.activityTags.includes(tagId);
                  return (
                    <button
                      key={tagId}
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          activityTags: selected
                            ? current.activityTags.filter((id) => id !== tagId)
                            : [...current.activityTags, tagId],
                        }))
                      }
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        selected
                          ? "border-violet-500/50 bg-violet-500/15 text-violet-200"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      {creatorCapabilityTagLabel(tagId)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div>
              <label className="block text-xs font-medium text-zinc-500" htmlFor="shared-profile-x">
                公開X（@handle）
              </label>
              <p className="mt-1 text-[11px] text-zinc-600">
                連携済みアカウントの公開ONでも設定できます。空で公開OFFになります。
              </p>
              <input
                id="shared-profile-x"
                type="text"
                value={draft.publicX}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, publicX: event.target.value }))
                }
                placeholder="handle"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium text-zinc-500"
                htmlFor="shared-profile-website"
              >
                Webサイト
              </label>
              <input
                id="shared-profile-website"
                type="url"
                value={draft.website}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, website: event.target.value }))
                }
                placeholder="https://"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
              />
            </div>
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
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">プロフィール</h1>
          <p className="mt-2 text-sm text-zinc-500">
            プレイヤー・クリエイターで共通の公開プロフィールです。
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

      {saveMessage ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {saveMessage}
        </p>
      ) : null}
      {saveError ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {saveError}
        </p>
      ) : null}

      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <ProfileAvatar
            src={display.avatarSrc}
            userId={display.userId}
            className="mx-auto size-20 shrink-0 sm:mx-0 sm:size-24"
            size={96}
          />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-white">{display.displayName}</h2>
            <p className="mt-0.5 text-sm text-zinc-500">@{display.handle}</p>
            {display.bio ? (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-400">
                {display.bio}
              </p>
            ) : (
              <p className="mt-3 text-sm text-zinc-600">自己紹介はまだ未設定です。</p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500 sm:justify-start">
              <PublicXLink accountOrUrl={display.xAccount} />
              {display.website ? (
                <a
                  href={websiteHref(display.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-violet-300 transition-colors hover:text-violet-200"
                >
                  {display.website}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <ProfilePublicXCard
          publicXAccount={display.xAccount}
          busy={saving}
          oauthReturnPath={shell === "studio" ? "/studio/profile" : "/mypage/profile"}
          onPublicPublishChange={handlePublicXPublish}
        />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2">
        <RoleColumn title="プレイヤーとして">
          {hasPlayerActivity ? (
            <>
              <RoleStatRow
                label="フォロー中のクリエイター"
                value={followedCount}
                href={shell === "studio" ? undefined : "/mypage?tab=following"}
              />
              <RoleStatRow
                label={WATCH_STAT_LABEL}
                value={watchedCount}
                href={shell === "studio" ? undefined : "/mypage"}
              />
              <RoleStatRow
                label="参加コミュニティ"
                value={communityCount}
                href={shell === "studio" ? undefined : "/mypage/community"}
              />
              {shell === "studio" ? (
                <div className="pt-3">
                  <Link
                    href="/mypage/profile"
                    className="text-xs text-violet-400 transition-colors hover:text-violet-300"
                  >
                    Player画面で見る →
                  </Link>
                </div>
              ) : null}
            </>
          ) : (
            <p className="py-2 text-sm text-zinc-600">まだプレイヤー活動はありません。</p>
          )}
        </RoleColumn>

        {isDeveloper ? (
          <RoleColumn title="クリエイターとして">
            <RoleStatRow
              label="公開作品"
              value={publicOwned.length}
              href={publicCreatorHref}
            />
            <RoleStatRow label="開発ログ" value={devlogCount} href={publicCreatorHref} />
            <RoleStatRow
              label="フォロワー"
              value={followerCount === null ? "…" : followerCount}
            />
            <div className="pt-3">
              <Link
                href={publicCreatorHref}
                className="text-xs text-violet-400 transition-colors hover:text-violet-300"
              >
                公開プロフィールを見る →
              </Link>
            </div>
          </RoleColumn>
        ) : (
          <RoleColumn title="クリエイターとして">
            <p className="py-2 text-sm text-zinc-600">
              まだ公開作品はありません。{" "}
              <Link
                href="/studio"
                className="text-violet-400 transition-colors hover:text-violet-300"
              >
                作品を投稿する
              </Link>
            </p>
          </RoleColumn>
        )}
      </div>
    </div>
  );
}
