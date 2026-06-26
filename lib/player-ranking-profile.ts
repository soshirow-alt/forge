/** 月間影響度ランキング上のプレイヤープロフィール URL（v0 mock） */
export function playerRankingProfileHref(handle: string): string {
  if (handle === "shaneco" || handle === "player_you") {
    return "/mypage/profile";
  }
  return `/players/${encodeURIComponent(handle)}`;
}
