"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { CreatorFollowButton } from "@/components/creator-follow-button";
import { CreatorCommunityJoinButton } from "@/components/creator-community-join-button";
import { ContentReportButton } from "@/components/content-report-button";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { PlayerShell, GameThumbnail } from "@/components/player-shell";
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
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { BadgeCheck, MapPin } from "lucide-react";

type CreatorTab = CreatorProfileTab;

const tabs: { id: CreatorTab; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "devlog", label: "開発ログ" },
  { id: "achievements", label: "実績" },
];

function xProfileHref(account: string): string {
  if (account.startsWith("http")) {
    return account;
  }
  return `https://x.com/${account.replace(/^@/, "")}`;
}

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

export function CreatorProfileRealView({
  profile,
  isSelf,
}: {
  profile: CreatorProfileResolved;
  isSelf: boolean;
}) {
  const hideV0Mock = shouldHideV0MockContent();
  useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getFollowerCount, refreshFollowerCount } = useGames();
  const activeTab = parseCreatorProfileTab(searchParams.get("tab"));
  const followerCount = getFollowerCount(profile.routeId, 0);

  const setTab = useCallback(
    (tab: CreatorTab) => {
      router.replace(buildCreatorProfileTabHref(profile.routeId, tab));
    },
    [profile.routeId, router],
  );

  useEffect(() => {
    void refreshFollowerCount(profile.userId);
  }, [profile.userId, refreshFollowerCount]);

  const inDevGames = profile.games.filter((game) => game.status === "in-dev");
  const completedGames = profile.games.filter((game) => game.status === "completed");

  return (
    <PlayerShell activeNav="creator-search">
      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <span className="relative mx-auto size-24 shrink-0 overflow-hidden rounded-full bg-zinc-800 sm:mx-0">
                <Image src={profile.avatar} alt="" fill className="object-cover" />
              </span>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                  <BadgeCheck className="size-5 text-violet-400" aria-hidden="true" />
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  @{profile.handle}
                  <span className="mx-2 text-zinc-700" aria-hidden="true">
                    ·
                  </span>
                  フォロワー {followerCount.toLocaleString()}人
                </p>
                {profile.bio ? (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{profile.bio}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500 sm:justify-start">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    日本
                  </span>
                  {profile.xAccount ? (
                    <CreatorSocialLink
                      href={xProfileHref(profile.xAccount)}
                      label="X"
                    />
                  ) : null}
                  {profile.website ? (
                    <CreatorSocialLink href={websiteHref(profile.website)} label="公式サイト" />
                  ) : null}
                  {profile.discordUrl ? (
                    <CreatorSocialLink href={profile.discordUrl} label="Discord" />
                  ) : null}
                  {profile.youtubeUrl ? (
                    <CreatorSocialLink href={profile.youtubeUrl} label="YouTube" />
                  ) : null}
                </div>
                {!isSelf ? (
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <CreatorFollowButton
                      creatorRouteKey={profile.routeId}
                      developerUserId={profile.userId}
                    />
                    <CreatorCommunityJoinButton developerUserId={profile.userId} />
                    <ContentReportButton
                      target={{
                        targetType: "developer",
                        targetId: profile.userId,
                        contextLabel: profile.name,
                      }}
                      returnPath={`/creators/${profile.routeId}`}
                    />
                  </div>
                ) : null}
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
                  className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium ${
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

          {activeTab === "overview" && (
            <div className="space-y-8">
              <section>
                <h2 className="text-base font-semibold text-white">
                  公開中の作品（{profile.games.length}）
                </h2>
                {profile.games.length === 0 ? (
                  <p className="mt-4 text-sm text-zinc-500">まだ公開中の作品がありません。</p>
                ) : (
                  <ul className="mt-4 space-y-4">
                    {inDevGames.map((game) => (
                      <li key={game.id}>
                        <Link
                          href={gameDetailHref(game.id)}
                          className="flex gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700"
                        >
                          <GameThumbnail
                            src={game.image}
                            alt={game.title}
                            className="size-24 shrink-0"
                          />
                          <div>
                            <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-300">
                              開発中
                            </span>
                            <h3 className="mt-2 font-semibold text-white">{game.title}</h3>
                            <p className="mt-1 text-sm text-zinc-400">{game.description}</p>
                            <p className="mt-2 text-xs text-zinc-500">最終更新 {game.lastUpdated}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                    {completedGames.map((game) => (
                      <li key={game.id}>
                        <Link
                          href={gameDetailHref(game.id)}
                          className="flex gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700"
                        >
                          <GameThumbnail
                            src={game.image}
                            alt={game.title}
                            className="size-24 shrink-0"
                          />
                          <div>
                            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
                              完成品
                            </span>
                            <h3 className="mt-2 font-semibold text-white">{game.title}</h3>
                            <p className="mt-1 text-sm text-zinc-400">{game.description}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {activeTab === "devlog" &&
            (profile.recentDevlogs.length === 0 ? (
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
                      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{log.excerpt}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}

          {activeTab === "achievements" &&
            (hideV0Mock ? (
              <FeatureComingSoonPanel
                title="開発者の実績"
                description="開発者バッジの表示は準備中です。"
              />
            ) : (
              <FeatureComingSoonPanel title="開発者の実績" />
            ))}

        </div>

        <aside className="w-full shrink-0 space-y-5 xl:w-72">
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-white">開発者の実績</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-center">
              {[
                ["公開中", profile.stats.inDevelopment + profile.stats.completed],
                ["開発中", profile.stats.inDevelopment],
                ["完成", profile.stats.completed],
                ["開発ログ", profile.recentDevlogs.length],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg bg-zinc-950/40 px-2 py-3">
                  <dt className="text-xs text-zinc-500">{label}</dt>
                  <dd className="mt-1 text-lg font-bold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </PlayerShell>
  );
}
