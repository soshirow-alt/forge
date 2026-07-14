import type {
  CommunityJoinRequest,
  CommunityMember,
} from "@/lib/community-join-v0-store";
import type { DeveloperProfile } from "@/lib/developer-profiles";
import { resolvePublicProfileDisplay } from "@/lib/public-profile-display";
import type { CommunityMembershipRecord } from "@/lib/supabase/community-db";

export function memberDisplayFromUserId(
  userId: string,
  profiles: DeveloperProfile[] = [],
): {
  name: string;
  handle: string;
  avatar: string;
} {
  const profile = profiles.find((item) => item.userId === userId);
  const display = resolvePublicProfileDisplay(profile, {
    userId,
    fallbackName: "メンバー",
  });
  return {
    name: display.displayName,
    handle: display.handle,
    avatar: display.avatarSrc,
  };
}

export function membershipToJoinRequest(
  record: CommunityMembershipRecord,
  communityName: string,
  profiles: DeveloperProfile[] = [],
): CommunityJoinRequest {
  const display = memberDisplayFromUserId(record.userId, profiles);
  return {
    id: record.id,
    communityId: record.communityId,
    communityName,
    playerId: record.userId,
    playerName: display.name,
    playerHandle: display.handle,
    playerAvatar: display.avatar,
    requestedAt: formatJoinedLabel(record.joinedAt),
    status: "pending",
  };
}

export function membershipToMember(
  record: CommunityMembershipRecord,
  profiles: DeveloperProfile[] = [],
): CommunityMember {
  const display = memberDisplayFromUserId(record.userId, profiles);
  return {
    id: `${record.userId}-${record.communityId}`,
    communityId: record.communityId,
    name: display.name,
    handle: display.handle,
    avatar: display.avatar,
    joinedAt: formatJoinedLabel(record.joinedAt),
  };
}

function formatJoinedLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "たった今";
  }
  if (minutes < 60) {
    return `${minutes}分前`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}時間前`;
  }
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}
