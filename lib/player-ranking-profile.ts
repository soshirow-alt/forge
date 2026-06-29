import { shouldHideV0MockContent } from "@/lib/production-mode";

/** Public player profile from ranking is preview-only until real profile ships. */
export function isPlayerRankingProfileLinkEnabled(): boolean {
  return !shouldHideV0MockContent();
}

/** 月間影響度ランキング上のプレイヤープロフィール URL（v0 mock） */
export function playerRankingProfileHref(handle: string): string {
  if (handle === "shaneco" || handle === "player_you") {
    return "/mypage/profile";
  }
  return `/players/${encodeURIComponent(handle)}`;
}
