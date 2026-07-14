"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CreatorFollowButton } from "@/components/creator-follow-button";
import { CreatorCommunityJoinButton } from "@/components/creator-community-join-button";
import { ContentReportButton } from "@/components/content-report-button";
import { DiscoveryCardStatPills } from "@/components/discovery-card-stat-pills";
import { PlayerShell } from "@/components/player-shell";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { PublicXLink } from "@/components/public-x-link";
import { useGames } from "@/components/games-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import type { CreatorProfileResolved } from "@/hooks/use-creator-profile";
import {
  buildCreatorProfileTabHref,
  parseCreatorProfileTab,
  type CreatorProfileTab,
} from "@/lib/creator-profile-tabs";
import { buildGameDetailTabHref } from "@/lib/game-detail-tabs";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import { MoreHorizontal } from "lucide-react";

type CreatorTab = CreatorProfileTab;

const tabs: { id: CreatorTab; label: string }[] = [
  { id: "games", label: "作品" },
  { id: "devlog", label: "開発ログ" },
];

function websiteHref(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

function CreatorSocialLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-violet-300 transition-colors hover:text-violet-200"
    >
      {label}
    </a>
  );
}

function ProfileMoreMenu({
  developerUserId,
  name,
  routeId,
}: {
  developerUserId: string;
  name: string;
  routeId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="その他"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="メニューを閉じる"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-zinc-700 bg-zinc-950 p-2 shadow-xl">
            <div className="px-2 py-1.5">
              <CreatorCommunityJoinButton developerUserId={developerUserId} />
            </div>
            <div className="px-2 py-1.5">
              <ContentReportButton
                target={{
                  targetType: "developer",
                  targetId: developerUserId,
                  contextLabel: name,
                }}
                returnPath={`/creators/${routeId}`}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function CreatorProfileRealView({
  profile,
  isSelf,
}: {
  profile: CreatorProfileResolved;
  isSelf: boolean;
}) {
  useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    getFollowerCount,
    refreshFollowerCount,
    getPublicProjectStats,
    publicCatalogReady,
  } = useGames();
  const activeTab = parseCreatorProfileTab(searchParams.get("tab"));
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const followerCount = getFollowerCount(profile.routeId, 0);

  const setTab = useCallback(
    (tab: CreatorTab) => {
      router.replace(buildCreatorProfileTabHref(profile.routeId, tab));
    },
    [profile.routeId, router],
  );

  useEffect(() => {
    let cancelled = false;
    setFollowersLoaded(false);
    void refreshFollowerCount(profile.userId).finally(() => {
      if (!cancelled) {
        setFollowersLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profile.userId, refreshFollowerCount]);

  return (
    <PlayerShell activeNav="creator-search">
      <div className="space-y-4">
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <ProfileAvatar
              src={profile.avatar}
              userId={profile.userId}
              className="mx-auto size-16 shrink-0 sm:mx-0 sm:size-20"
              size={80}
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-start justify-center gap-2 sm:justify-between">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-white">{profile.name}</h1>
                  <p className="mt-0.5 text-sm text-zinc-500">@{profile.handle}</p>
                </div>
                {!isSelf ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <CreatorFollowButton
                      creatorRouteKey={profile.routeId}
                      developerUserId={profile.userId}
                      showFollowerCount={false}
                    />
                    <ProfileMoreMenu
                      developerUserId={profile.userId}
                      name={profile.name}
                      routeId={profile.routeId}
                    />
                  </div>
                ) : null}
              </div>

              {profile.bio ? (
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-400">
                  {profile.bio}
                </p>
              ) : null}

              {(profile.xAccount ||
                profile.website ||
                profile.discordUrl ||
                profile.youtubeUrl) ? (
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500 sm:justify-start">
                  <PublicXLink accountOrUrl={profile.xAccount} />
                  {profile.website ? (
                    <CreatorSocialLink
                      href={websiteHref(profile.website)}
                      label="Webサイト"
                    />
                  ) : null}
                  {profile.discordUrl ? (
                    <CreatorSocialLink href={profile.discordUrl} label="Discord" />
                  ) : null}
                  {profile.youtubeUrl ? (
                    <CreatorSocialLink href={profile.youtubeUrl} label="YouTube" />
                  ) : null}
                </div>
              ) : null}

              <dl className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm sm:justify-start">
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-zinc-500">作品</dt>
                  <dd className="font-semibold text-white">
                    {profile.stats.gameCount}
                  </dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-zinc-500">開発ログ</dt>
                  <dd className="font-semibold text-white">
                    {profile.stats.devlogCount}
                  </dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-zinc-500">フォロワー</dt>
                  <dd className="font-semibold text-white">
                    {followersLoaded ? (
                      followerCount.toLocaleString()
                    ) : (
                      <span className="inline-block h-4 w-10 animate-pulse rounded bg-zinc-800/80 align-middle" />
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <div className="border-b border-zinc-800/80">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-violet-500 text-violet-200"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "games" ? (
          <section>
            {profile.games.length === 0 ? (
              <p className="text-sm text-zinc-500">まだ公開中の作品がありません。</p>
            ) : (
              <ul className="grid justify-items-stretch gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),380px))]">
                {profile.games.map((game) => {
                  const stats = getPublicProjectStats(game.id);
                  return (
                    <li key={game.id} className="w-full max-w-[380px]">
                      <Link href={gameDetailHref(game.id)} className="block">
                        <article>
                          <ProjectThumbnail
                            projectId={game.id}
                            title={game.title}
                            genre={game.tags[0]}
                            version={game.phaseLabel}
                            variant="profile"
                          />
                          <h3 className="mt-2 truncate text-sm font-semibold text-white">
                            {game.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {game.phaseLabel}
                            {game.lastUpdated
                              ? ` · 最終更新 ${game.lastUpdated}`
                              : null}
                          </p>
                          {game.description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                              {game.description}
                            </p>
                          ) : null}
                          <div className="mt-1.5">
                            {publicCatalogReady ? (
                              <DiscoveryCardStatPills
                                feedbackCount={stats.feedbackParticipantCount}
                                watchCount={stats.watchCount}
                                compact
                              />
                            ) : (
                              <div className="h-4 w-28 animate-pulse rounded bg-zinc-800/80" />
                            )}
                          </div>
                        </article>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}

        {activeTab === "devlog" ? (
          profile.recentDevlogs.length === 0 ? (
            <p className="text-sm text-zinc-500">開発ログはまだありません。</p>
          ) : (
            <ul className="space-y-3">
              {profile.recentDevlogs.map((log) => (
                <li key={log.id}>
                  <Link
                    href={buildGameDetailTabHref(log.gameId, "devlog")}
                    className="block rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-4 transition-colors hover:border-zinc-700"
                  >
                    <p className="text-xs text-zinc-500">
                      {log.date} · {log.gameTitle}
                    </p>
                    <p className="mt-1 font-medium text-white">{log.title}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">
                      {log.excerpt}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </PlayerShell>
  );
}
