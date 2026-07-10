"use client";

import { useEffect } from "react";
import { useGames } from "@/components/games-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { shouldHideV0MockContent } from "@/lib/production-mode";

type CreatorFollowButtonProps = {
  /** `/creators/[id]` route key or developer user UUID */
  creatorRouteKey: string;
  /** Resolved developer auth user id (Supabase 正本).未設定時は Preview mock のみ */
  developerUserId?: string | null;
  compact?: boolean;
};

export function CreatorFollowButton({
  creatorRouteKey,
  developerUserId,
  compact = false,
}: CreatorFollowButtonProps) {
  const { isFollowing, toggleFollowCreator, getFollowerCount, refreshFollowerCount } =
    useGames();
  const { requireAuth } = useRequireAuth();
  const hideV0Mock = shouldHideV0MockContent();

  useEffect(() => {
    if (!developerUserId) {
      return;
    }
    void refreshFollowerCount(developerUserId);
  }, [developerUserId, refreshFollowerCount]);

  if (hideV0Mock && !developerUserId) {
    return null;
  }

  const following = isFollowing(creatorRouteKey);
  const followerCount = getFollowerCount(creatorRouteKey, 0);

  function handleToggle() {
    requireAuth(
      () => {
        void toggleFollowCreator(creatorRouteKey);
      },
      `/creators/${creatorRouteKey}`,
      { variant: "follow" },
    );
  }

  return (
    <div className={compact ? "mt-4" : "mt-5"}>
      <p className={compact ? "text-sm text-zinc-400" : "text-lg text-zinc-300"}>
        フォロワー {followerCount.toLocaleString()}人
      </p>
      <button
        type="button"
        onClick={handleToggle}
        className={
          following
            ? compact
              ? "mt-3 w-full rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition-colors hover:border-rose-500/60"
              : "mt-4 rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-600"
            : compact
              ? "mt-3 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
              : "mt-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        }
      >
        {following ? "フォロー中" : "フォローする"}
      </button>
    </div>
  );
}
