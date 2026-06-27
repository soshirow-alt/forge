"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import type { CommunityJoinRequest, CommunityMember } from "@/lib/community-join-v0-store";
import {
  membershipToJoinRequest,
  membershipToMember,
} from "@/lib/community-member-display";
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

const DEFAULT_AVATAR = "/images/landing/game-1.png";

function toProfile(
  record: NonNullable<Awaited<ReturnType<typeof fetchDeveloperCommunityByOwner>>>,
  memberCount: number,
): DeveloperCommunityProfile {
  return {
    id: record.id,
    name: record.name,
    avatar: record.avatarUrl?.trim() || DEFAULT_AVATAR,
    handle: record.handle ?? record.id,
    description: record.description,
    memberCountLabel: memberCount,
  };
}

export function useCommunityHubSupabase(isDeveloper: boolean) {
  const { user, hydrated } = useAuth();
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

      if (user) {
        const status = await fetchCommunityMembershipStatus(supabase, communityId, user.id);
        setMembershipStatus(status);
      }

      const [pendingRows, approvedRows] = await Promise.all([
        fetchCommunityMemberships(supabase, communityId, "pending"),
        fetchCommunityMemberships(supabase, communityId, "approved"),
      ]);

      setPending(pendingRows.map((row) => membershipToJoinRequest(row, communityName)));
      setMembers(approvedRows.map(membershipToMember));

      if (isDeveloper && developerProfile?.id === communityId) {
        const count = approvedRows.length;
        setDeveloperProfile((prev) =>
          prev ? { ...prev, memberCountLabel: count } : prev,
        );
      }
    },
    [user, isDeveloper, developerProfile?.id],
  );

  useEffect(() => {
    if (!enabled || !hydrated || !user) {
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
      if (isDeveloper) {
        const id = communityIdFromUser(user.id, user.name);
        let record = await fetchDeveloperCommunityByOwner(supabase, user.id);
        if (!record) {
          await ensureDeveloperCommunity(supabase, {
            id,
            ownerId: user.id,
            name: `${user.name}コミュニティ`,
            description: "フォロワーと交流し、一緒にゲームを育てましょう",
            avatarUrl: DEFAULT_AVATAR,
            handle: id,
          });
          record = await fetchDeveloperCommunityByOwner(supabase, user.id);
        }
        if (record && !cancelled) {
          const count = await countApprovedCommunityMembers(supabase, record.id);
          const profile = toProfile(record, count);
          setDeveloperProfile(profile);
          await reloadMembershipData(record.id);
        }
      } else {
        const joined = await fetchJoinedCommunitiesForUser(supabase, user.id);
        if (!cancelled) {
          setJoinedCommunities(joined);
        }
      }
      if (!cancelled) {
        setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, hydrated, user, isDeveloper, reloadMembershipData]);

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
