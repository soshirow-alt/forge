"use client";

import { useGames } from "@/components/games-provider";

export function CreatorFollowButton({ creatorId }: { creatorId: string }) {
  const { isFollowing, followCreator, getFollowerCount } = useGames();
  const following = isFollowing(creatorId);
  const followerCount = getFollowerCount(creatorId, 0);

  function handleFollow() {
    if (!following) {
      followCreator(creatorId);
    }
  }

  return (
    <div>
      <p className="text-lg text-zinc-300">
        フォロワー数: {followerCount}人
      </p>
      <button
        type="button"
        onClick={handleFollow}
        disabled={following}
        className={
          following
            ? "mt-4 rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-400"
            : "mt-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        }
      >
        {following ? "フォロー中" : "フォローする"}
      </button>
    </div>
  );
}
