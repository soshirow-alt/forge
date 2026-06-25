"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  applyToCommunity,
  approveJoinRequest,
  getCommunityJoinState,
  getCommunityMembers,
  getPendingRequests,
  getPlayerCommunityStatus,
  rejectJoinRequest,
  subscribeCommunityJoin,
  type CommunityJoinStatus,
} from "@/lib/community-join-v0-store";

function getSnapshot() {
  return getCommunityJoinState();
}

function getServerSnapshot() {
  return getCommunityJoinState();
}

export function useCommunityJoinV0() {
  const state = useSyncExternalStore(subscribeCommunityJoin, getSnapshot, getServerSnapshot);

  const getStatus = useCallback(
    (communityId: string): CommunityJoinStatus =>
      state.playerStatusByCommunity[communityId] ?? "none",
    [state.playerStatusByCommunity],
  );

  const pendingFor = useCallback(
    (communityId: string) =>
      state.requests.filter((r) => r.communityId === communityId && r.status === "pending"),
    [state.requests],
  );

  const membersFor = useCallback(
    (communityId: string) => state.members.filter((m) => m.communityId === communityId),
    [state.members],
  );

  return {
    state,
    getStatus,
    getPlayerCommunityStatus,
    getPendingRequests,
    getCommunityMembers,
    pendingFor,
    membersFor,
    applyToCommunity,
    approveJoinRequest,
    rejectJoinRequest,
  };
}
