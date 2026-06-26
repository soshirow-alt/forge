const CURRENT_PLAYER_HANDLE = "player_you";

/** コミュニティ参加者のプロフィール URL（v0 mock） */
export function communityMemberProfileHref(
  member: { handle: string },
  options?: { returnTo?: string },
): string {
  if (member.handle === CURRENT_PLAYER_HANDLE) {
    return "/mypage/profile";
  }
  const base = `/players/${encodeURIComponent(member.handle)}`;
  if (!options?.returnTo) {
    return base;
  }
  return `${base}?return=${encodeURIComponent(options.returnTo)}`;
}

export function communityJoinRequestProfileHref(
  request: { playerHandle: string },
  options?: { returnTo?: string },
): string {
  if (request.playerHandle === CURRENT_PLAYER_HANDLE) {
    return "/mypage/profile";
  }
  const base = `/players/${encodeURIComponent(request.playerHandle)}`;
  if (!options?.returnTo) {
    return base;
  }
  return `${base}?return=${encodeURIComponent(options.returnTo)}`;
}
