"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import type { CommunityJoinRequest, CommunityMember } from "@/lib/community-join-v0-store";
import {
  membershipToJoinRequest,
  membershipToMember,
} from "@/lib/community-member-display";
import {
  isMockCommunityId,
  isMockCommunityName,
  isSafeDeveloperCommunityProfile,
  resolveCommunityDisplayName,
} from "@/lib/community-mock-guards";
import {
  communityIdFromUser,
  type DeveloperCommunityProfile,
} from "@/lib/developer-community-v0-store";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import {
  applyCommunityMembership,
  countApprovedCommunityMembers,
  ensureDeveloperCommunity,
  fetchCommunityMembershipStatus,
  fetchCommunityMemberships,
  fetchDeveloperCommunityById,
  fetchDeveloperCommunityByOwner,
  fetchJoinedCommunitiesForUser,
  setCommunityMembershipStatus,
  type JoinedCommunitySummary,
} from "@/lib/supabase/community-db";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { defaultPublicAvatarSrc } from "@/lib/public-profile-display";

function toProfile(
  record: NonNullable<Awaited<ReturnType<typeof fetchDeveloperCommunityByOwner>>>,
  memberCount: number,
): DeveloperCommunityProfile {
  return {
    id: record.id,
    name: record.name,
    avatar: record.avatarUrl?.trim() || defaultPublicAvatarSrc(record.ownerId || record.id),
    handle: record.handle ?? record.id,
    description: record.description,
    memberCountLabel: memberCount,
  };
}

export function useCommunityHubSupabase(isDeveloper: boolean) {
  const { user, hydrated } = useAuth();
  const { getDeveloperProfileByUserId } = useGames();
  const userId = user?.id;
  const userName = user?.name ?? "";
  const enabled = shouldHideV0MockContent();
  const [developerProfile, setDeveloperProfile] = useState<DeveloperCommunityProfile | null>(
    null,
  );
  const [joinedCommunities, setJoinedCommunities] = useState<JoinedCommunitySummary[]>([]);
  const [pending, setPending] = useState<CommunityJoinRequest[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [membershipStatus, setMembershipStatus] = useState<
    "none" | "pending" | "approved" | "rejected"
  >("none");
  const [loaded, setLoaded] = useState(false);

  const reloadMembershipData = useCallback(
    async (communityId: string) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase || !communityId) {
        return;
      }

      const community = await fetchDeveloperCommunityById(supabase, communityId);
      const communityName = community?.name ?? "コミュニティ";

      if (userId) {
        const status = await fetchCommunityMembershipStatus(supabase, communityId, userId);
        setMembershipStatus(status);
      }

      const [pendingRows, approvedRows] = await Promise.all([
        fetchCommunityMemberships(supabase, communityId, "pending"),
        fetchCommunityMemberships(supabase, communityId, "approved"),
      ]);

      const profileList = [
        ...new Set(
          [...pendingRows, ...approvedRows].map((row) => row.userId),
        ),
      ]
        .map((id) => getDeveloperProfileByUserId(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));

      setPending(
        pendingRows.map((row) =>
          membershipToJoinRequest(row, communityName, profileList),
        ),
      );
      setMembers(approvedRows.map((row) => membershipToMember(row, profileList)));

      if (isDeveloper && developerProfile?.id === communityId) {
        const count = approvedRows.length;
        setDeveloperProfile((prev) =>
          prev ? { ...prev, memberCountLabel: count } : prev,
        );
      }
    },
    [userId, isDeveloper, developerProfile?.id, getDeveloperProfileByUserId],
  );

  useEffect(() => {
    if (!enabled || !hydrated || !userId) {
      setLoaded(true);
      return;
    }

    let cancelled = false;
    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setLoaded(true);
      return;
    }

    void (async () => {
      try {
        if (isDeveloper) {
          const id = communityIdFromUser(userId, userName);
          if (isMockCommunityId(id)) {
            return;
          }

          const developerProfileRecord = getDeveloperProfileByUserId(userId);
          const communityName = resolveCommunityDisplayName({
            user,
            publicName: developerProfileRecord?.publicName,
            forCommunityName: true,
          });

          let record = await fetchDeveloperCommunityByOwner(supabase, userId);
          if (
            record &&
            !isSafeDeveloperCommunityProfile({
              id: record.id,
              name: record.name,
            })
          ) {
            record = null;
          }
          if (!record) {
            if (isMockCommunityName(communityName)) {
              return;
            }
            await ensureDeveloperCommunity(supabase, {
              id,
              ownerId: userId,
              name: communityName,
              description: "フォロワーと交流し、一緒にゲームを育てましょう",
              avatarUrl: defaultPublicAvatarSrc(userId),
              handle: id,
            });
            record = await fetchDeveloperCommunityByOwner(supabase, userId);
          }
          if (
            record &&
            isSafeDeveloperCommunityProfile({ id: record.id, name: record.name }) &&
            !cancelled
          ) {
            const count = await countApprovedCommunityMembers(supabase, record.id);
            const profile = toProfile(record, count);
            setDeveloperProfile(profile);
            await reloadMembershipData(record.id);
          }
        } else {
          const joined = await fetchJoinedCommunitiesForUser(supabase, userId);
          if (!cancelled) {
            setJoinedCommunities(
              joined.filter(
                (community) =>
                  !isMockCommunityId(community.id) &&
                  !isMockCommunityName(community.name),
              ),
            );
          }
        }
      } catch {
        // RLS / network errors should not leave the hub stuck on "読み込み中..."
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, hydrated, userId, userName, user, isDeveloper, reloadMembershipData, getDeveloperProfileByUserId]);

  const applyToCommunity = useCallback(
    async (communityId: string) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase || !user) {
        return;
      }
      await applyCommunityMembership(supabase, communityId, user.id);
      setMembershipStatus("pending");
    },
    [user],
  );

  const approveJoin = useCallback(
    async (request: CommunityJoinRequest) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return;
      }
      await setCommunityMembershipStatus(
        supabase,
        request.communityId,
        request.playerId,
        "approved",
      );
      await reloadMembershipData(request.communityId);
    },
    [reloadMembershipData],
  );

  const rejectJoin = useCallback(
    async (request: CommunityJoinRequest) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return;
      }
      await setCommunityMembershipStatus(
        supabase,
        request.communityId,
        request.playerId,
        "rejected",
      );
      await reloadMembershipData(request.communityId);
    },
    [reloadMembershipData],
  );

  return {
    enabled,
    loaded,
    developerProfile,
    joinedCommunities,
    pending,
    members,
    membershipStatus,
    reloadMembershipData,
    applyToCommunity,
    approveJoin,
    rejectJoin,
  };
}
