"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { PlayerShell } from "@/components/player-shell";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCommunityJoinV0 } from "@/hooks/use-community-join-v0";
import { communityIdFromDeveloperId, applyToCommunity } from "@/lib/community-join-v0-store";
import { hasDeveloperOpenCommunity } from "@/lib/developer-community-v0-store";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import {
  buildCreatorProfileTabHref,
  parseCreatorProfileTab,
  type CreatorProfileTab,
} from "@/lib/creator-profile-tabs";
import {
  developerDevlogHref,
  getDeveloperProfileV0,
} from "@/lib/developer-profile-v0-mock-data";
import { Globe, MoreHorizontal, UserPlus, Users } from "lucide-react";

type DevTab = CreatorProfileTab;

const tabs: { id: DevTab; label: string }[] = [
  { id: "games", label: "作品" },
  { id: "devlog", label: "開発ログ" },
];

function ProfileMoreMenu({
  hasOpenCommunity,
  communityStatus,
  onCommunityJoin,
  communityId,
}: {
  hasOpenCommunity: boolean;
  communityStatus: string;
  onCommunityJoin: () => void;
  communityId: string;
}) {
  const [open, setOpen] = useState(false);

  if (!hasOpenCommunity) {
    return null;
  }

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
              {communityStatus === "approved" ? (
                <Link
                  href={`/mypage/community?community=${communityId}`}
                  className="inline-flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-emerald-300 hover:bg-zinc-900"
                  onClick={() => setOpen(false)}
                >
                  <Users className="size-4" aria-hidden="true" />
                  コミュニティ参加中
                </Link>
              ) : communityStatus === "pending" ? (
                <span className="inline-flex w-full items-center gap-2 px-2 py-2 text-sm text-amber-300">
                  <Users className="size-4" aria-hidden="true" />
                  参加申請中
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onCommunityJoin();
                    setOpen(false);
                  }}
                  className="inline-flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-900"
                >
                  <Users className="size-4" aria-hidden="true" />
                  {communityStatus === "rejected" ? "再申請する" : "コミュニティの参加申請"}
                </button>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function DeveloperProfileV0Page({ id }: { id: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-[#0a0a0a] text-zinc-500">
          読み込み中...
        </div>
      }
    >
      <DeveloperProfileV0PageContent id={id} />
    </Suspense>
  );
}

function DeveloperProfileV0PageContent({ id }: { id: string }) {
  const dev = getDeveloperProfileV0(id);
  const { requireAuth } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnPath = `/creators/${id}`;
  const activeTab = parseCreatorProfileTab(searchParams.get("tab"));
  const [following, setFollowing] = useState(dev.following);
  const { getStatus } = useCommunityJoinV0();
  const communityId = communityIdFromDeveloperId(id);
  const communityStatus = getStatus(communityId);
  const hasOpenCommunity = hasDeveloperOpenCommunity(id);
  const publicGames = [...dev.inDevGames, ...dev.completedGames].filter(
    (game) => Boolean(game.title?.trim()),
  );
  const publicGameCount = publicGames.length;

  const setTab = useCallback(
    (tab: DevTab) => {
      router.replace(buildCreatorProfileTabHref(id, tab));
    },
    [id, router],
  );

  const handleFollow = useCallback(() => {
    requireAuth(() => setFollowing((value) => !value), returnPath, { variant: "follow" });
  }, [requireAuth, returnPath]);

  const handleCommunityJoin = useCallback(() => {
    requireAuth(
      () => {
        applyToCommunity({
          communityId,
          communityName: dev.name,
          communityAvatar: dev.avatar,
        });
      },
      returnPath,
      { variant: "default" },
    );
  }, [requireAuth, returnPath, communityId, dev.name, dev.avatar]);

  return (
    <PlayerShell activeNav="creator-search">
      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <ProfileAvatar
              src={dev.avatar}
              userId={dev.id}
              className="mx-auto size-20 shrink-0 sm:mx-0 sm:size-24"
              size={96}
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-start justify-center gap-3 sm:justify-between">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-white sm:text-2xl">{dev.name}</h1>
                  <p className="mt-1 text-sm text-zinc-500">
                    @{dev.handle}
                    <span className="mx-2 text-zinc-700" aria-hidden="true">
                      ·
                    </span>
                    フォロワー {dev.followers.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFollow}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                      following
                        ? "border border-rose-500/40 bg-rose-500/10 text-rose-300"
                        : "bg-violet-600 text-white hover:bg-violet-500"
                    }`}
                  >
                    <UserPlus className="size-4" aria-hidden="true" />
                    {following ? "フォロー中" : "フォロー"}
                  </button>
                  <ProfileMoreMenu
                    hasOpenCommunity={hasOpenCommunity}
                    communityStatus={communityStatus}
                    onCommunityJoin={handleCommunityJoin}
                    communityId={communityId}
                  />
                </div>
              </div>

              {dev.bio ? (
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-400">
                  {dev.bio}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500 sm:justify-start">
                {dev.website ? (
                  <a
                    href={dev.website.startsWith("http") ? dev.website : `https://${dev.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-violet-300 transition-colors hover:text-violet-200"
                  >
                    <Globe className="size-3.5" aria-hidden="true" />
                    Webサイト
                  </a>
                ) : null}
              </div>

              <dl className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm sm:justify-start">
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-zinc-500">作品</dt>
                  <dd className="font-semibold text-white">{publicGameCount}</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-zinc-500">開発ログ</dt>
                  <dd className="font-semibold text-white">{dev.recentDevlogs.length}</dd>
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

        {activeTab === "games" ? (
          publicGames.length === 0 ? (
            <p className="text-sm text-zinc-500">まだ公開中の作品がありません。</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publicGames.map((game) => (
                <li key={game.id}>
                  <Link href={gameDetailHref(game.id)} className="block">
                    <article>
                      <ProjectThumbnail
                        projectId={game.id}
                        title={game.title}
                        genre={game.tags[0]}
                        variant="card"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <h3 className="mt-2 truncate text-sm font-semibold text-white">
                        {game.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {game.lastUpdated ? `最終更新 ${game.lastUpdated}` : null}
                      </p>
                    </article>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {activeTab === "devlog" ? (
          <ul className="space-y-3">
            {dev.recentDevlogs.map((log) => (
              <li key={log.id}>
                <Link
                  href={developerDevlogHref(log)}
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
        ) : null}
      </div>
    </PlayerShell>
  );
}
