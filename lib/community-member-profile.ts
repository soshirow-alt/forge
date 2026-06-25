const CURRENT_PLAYER_HANDLE = "player_you";

/** コミュニティ参加者のプロフィール URL（v0 mock） */
export function communityMemberProfileHref(member: { handle: string }): string {
  if (member.handle === CURRENT_PLAYER_HANDLE) {
    return "/mypage/profile";
  }
  return `/players/${encodeURIComponent(member.handle)}`;
}

export function communityJoinRequestProfileHref(request: { playerHandle: string }): string {
  if (request.playerHandle === CURRENT_PLAYER_HANDLE) {
    return "/mypage/profile";
  }
  return `/players/${encodeURIComponent(request.playerHandle)}`;
}
