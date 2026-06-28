"use client";

import Link from "next/link";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useStudioFollowers } from "@/hooks/use-studio-followers";

const DEFAULT_AVATAR = "/images/landing/game-1.png";

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
  displayName,
  followedAt,
  creatorRouteId,
}: {
  displayName: string;
  followedAt: string;
  creatorRouteId: string | null;
}) {
  const body = (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700">
      <ProfileAvatar
        src={DEFAULT_AVATAR}
        alt=""
        className="size-14 shrink-0"
        size={56}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{displayName}</p>
        <p className="mt-1 text-sm text-zinc-500">
          {formatFollowedAt(followedAt)} にフォロー
        </p>
        {creatorRouteId ? (
          <p className="mt-1 text-xs text-violet-400">開発者プロフィールあり</p>
        ) : null}
      </div>
    </div>
  );

  if (creatorRouteId) {
    return (
      <li>
        <Link href={`/creators/${encodeURIComponent(creatorRouteId)}`}>{body}</Link>
      </li>
    );
  }

  return <li>{body}</li>;
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
        <p className="font-medium text-amber-200">フォロワー一覧の準備が未完了です</p>
        <p className="mt-2 leading-relaxed text-amber-100/80">
          Supabase Dashboard で migration 028（
          <code className="text-xs">028_developer_followers_list_for_owner.sql</code>
          ）を適用すると、フォロワー一覧が表示されます。
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
