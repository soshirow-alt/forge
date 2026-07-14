"use client";

import Link from "next/link";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useGames } from "@/components/games-provider";
import { useStudioFollowers } from "@/hooks/use-studio-followers";
import { resolvePublicProfileDisplay } from "@/lib/public-profile-display";

function formatFollowedAt(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return iso;
  }
  return new Date(parsed).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StudioFollowerCard({
  followerId,
  displayName,
  followedAt,
  creatorRouteId,
}: {
  followerId: string;
  displayName: string;
  followedAt: string;
  creatorRouteId: string | null;
}) {
  const { getDeveloperProfileByUserId } = useGames();
  const profile = getDeveloperProfileByUserId(followerId);
  const display = resolvePublicProfileDisplay(profile, {
    userId: followerId,
    fallbackName: displayName,
  });

  const body = (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700">
      <ProfileAvatar
        src={display.avatarSrc}
        userId={followerId}
        className="size-14 shrink-0"
        size={56}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{display.displayName}</p>
        <p className="mt-1 text-sm text-zinc-500">
          {formatFollowedAt(followedAt)} にフォロー
        </p>
      </div>
    </div>
  );

  const href = creatorRouteId ?? display.routeId;
  return (
    <li>
      <Link href={`/creators/${encodeURIComponent(href)}`}>{body}</Link>
    </li>
  );
}

export function StudioFollowersTabPanel() {
  const { followers, totalCount, loaded, error, migrationMissing } =
    useStudioFollowers();

  if (!loaded) {
    return <p className="text-sm text-zinc-500">読み込み中…</p>;
  }

  if (migrationMissing) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-sm text-amber-100/90">
        <p className="font-medium text-amber-200">フォロワー一覧は Coming Soon です</p>
        <p className="mt-2 leading-relaxed text-amber-100/80">
          フォロワー一覧は Coming Soon です。
        </p>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-400/90">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">フォロワー</h2>
        <p className="mt-1 text-sm text-zinc-500">
          あなたをフォローしている {totalCount.toLocaleString()} 人
        </p>
      </div>

      {followers.length === 0 ? (
        <p className="text-sm text-zinc-500">
          まだフォロワーはいません。作品を公開し、プレイヤーにフォローしてもらいましょう。
        </p>
      ) : (
        <ul className="space-y-3">
          {followers.map((follower) => (
            <StudioFollowerCard
              key={follower.followerId}
              followerId={follower.followerId}
              displayName={follower.displayName}
              followedAt={follower.followedAt}
              creatorRouteId={follower.creatorRouteId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
