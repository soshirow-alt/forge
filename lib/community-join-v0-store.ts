import type { NotificationV0Item } from "@/lib/notifications-v0-mock-data";
import type { StudioNotificationItem } from "@/lib/studio-notifications-v0-mock-data";

export type CommunityJoinStatus = "none" | "pending" | "approved" | "rejected";

export type CommunityJoinRequest = {
  id: string;
  communityId: string;
  communityName: string;
  playerId: string;
  playerName: string;
  playerHandle: string;
  playerAvatar: string;
  requestedAt: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
};

export type CommunityMember = {
  id: string;
  communityId: string;
  name: string;
  handle: string;
  avatar: string;
  joinedAt: string;
};

type CommunityJoinState = {
  requests: CommunityJoinRequest[];
  members: CommunityMember[];
  /** 現在プレイヤー（v0 mock）のコミュニティ別ステータス */
  playerStatusByCommunity: Record<string, CommunityJoinStatus>;
};

const JOIN_STORAGE_KEY = "forge-v0-community-join";
const PLAYER_NOTIF_KEY = "forge-v0-player-notif-extra";
const STUDIO_NOTIF_KEY = "forge-v0-studio-notif-extra";

const CURRENT_PLAYER_ID = "player_you";

const initialMembers: CommunityMember[] = [
  {
    id: "m-sora",
    communityId: "shaneco",
    name: "そら",
    handle: "sora_player",
    avatar: "/images/landing/game-2.png",
    joinedAt: "2025/06/10",
  },
  {
    id: "m-yuki",
    communityId: "shaneco",
    name: "ゆき",
    handle: "yuki_plays",
    avatar: "/images/landing/game-4.png",
    joinedAt: "2025/06/08",
  },
  {
    id: "m-umi",
    communityId: "shaneco",
    name: "うみ",
    handle: "umi_game",
    avatar: "/images/landing/game-3.png",
    joinedAt: "2025/06/05",
  },
  {
    id: "m-ren",
    communityId: "sora-games",
    name: "レン",
    handle: "ren_voice",
    avatar: "/images/landing/game-4.png",
    joinedAt: "2025/05/20",
  },
];

const initialRequests: CommunityJoinRequest[] = [
  {
    id: "req-hikari",
    communityId: "shaneco",
    communityName: "しゃねこ",
    playerId: "hikari_7",
    playerName: "星野ひかり",
    playerHandle: "hikari_7",
    playerAvatar: "/images/landing/game-5.png",
    requestedAt: "30分前",
    message: "しゃねこさんのゲームが大好きです！コミュニティに参加させてください。",
    status: "pending",
  },
];

const initialPlayerStatus: Record<string, CommunityJoinStatus> = {
  shaneco: "none",
  "sora-games": "approved",
  greensmith: "approved",
};

function defaultState(): CommunityJoinState {
  return {
    requests: [...initialRequests],
    members: [...initialMembers],
    playerStatusByCommunity: { ...initialPlayerStatus },
  };
}

const serverSnapshot: CommunityJoinState = defaultState();

/** SSR / hydration 用。localStorage を読まない固定スナップショット */
export function getCommunityJoinServerSnapshot(): CommunityJoinState {
  return serverSnapshot;
}

function readState(): CommunityJoinState {
  if (typeof window === "undefined") {
    return defaultState();
  }
  try {
    const raw = localStorage.getItem(JOIN_STORAGE_KEY);
    if (!raw) {
      return defaultState();
    }
    const parsed = JSON.parse(raw) as Partial<CommunityJoinState>;
    const fallback = defaultState();
    return {
      requests: Array.isArray(parsed.requests) ? parsed.requests : fallback.requests,
      members: Array.isArray(parsed.members) ? parsed.members : fallback.members,
      playerStatusByCommunity:
        parsed.playerStatusByCommunity && typeof parsed.playerStatusByCommunity === "object"
          ? parsed.playerStatusByCommunity
          : fallback.playerStatusByCommunity,
    };
  } catch {
    return defaultState();
  }
}

function writeState(state: CommunityJoinState) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(JOIN_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("forge-community-join-change"));
}

function readExtraJson<T>(key: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function appendExtra<T>(key: string, item: T) {
  if (typeof window === "undefined") {
    return;
  }
  const list = readExtraJson<T>(key);
  localStorage.setItem(key, JSON.stringify([item, ...list]));
  window.dispatchEvent(new Event("forge-v0-notifications-change"));
}

export function getExtraPlayerNotifications(): NotificationV0Item[] {
  return readExtraJson<NotificationV0Item>(PLAYER_NOTIF_KEY);
}

export function getExtraStudioNotifications(): StudioNotificationItem[] {
  return readExtraJson<StudioNotificationItem>(STUDIO_NOTIF_KEY);
}

export function getCommunityJoinState(): CommunityJoinState {
  return readState();
}

export function getPlayerCommunityStatus(communityId: string): CommunityJoinStatus {
  return readState().playerStatusByCommunity[communityId] ?? "none";
}

export function getPendingRequests(communityId: string): CommunityJoinRequest[] {
  return readState().requests.filter(
    (r) => r.communityId === communityId && r.status === "pending",
  );
}

export function getCommunityMembers(communityId: string): CommunityMember[] {
  return readState().members.filter((m) => m.communityId === communityId);
}

export function applyToCommunity(input: {
  communityId: string;
  communityName: string;
  communityAvatar?: string;
}): CommunityJoinStatus {
  const state = readState();
  const current = state.playerStatusByCommunity[input.communityId] ?? "none";
  if (current === "pending" || current === "approved") {
    return current;
  }

  state.requests = state.requests.filter(
    (r) =>
      !(
        r.communityId === input.communityId &&
        r.playerId === CURRENT_PLAYER_ID &&
        r.status === "rejected"
      ),
  );

  const request: CommunityJoinRequest = {
    id: `req-${Date.now()}`,
    communityId: input.communityId,
    communityName: input.communityName,
    playerId: CURRENT_PLAYER_ID,
    playerName: "あなた",
    playerHandle: "player_you",
    playerAvatar: "/images/landing/game-4.png",
    requestedAt: "たった今",
    status: "pending",
  };

  state.requests = [request, ...state.requests];
  state.playerStatusByCommunity[input.communityId] = "pending";
  writeState(state);

  if (input.communityId === "shaneco") {
    appendExtra<StudioNotificationItem>(STUDIO_NOTIF_KEY, {
      id: `sn-join-${request.id}`,
      kind: "community_join_request",
      title: "コミュニティ参加申請がありました",
      body: `${request.playerName}（@${request.playerHandle}）がマイコミュニティへの参加を申請しました。`,
      projectTitle: "マイコミュニティ",
      projectId: "shaneco",
      timeLabel: "たった今",
      unread: true,
      tab: "members",
    });
  }

  return "pending";
}

export function approveJoinRequest(requestId: string): void {
  const state = readState();
  const request = state.requests.find((r) => r.id === requestId);
  if (!request || request.status !== "pending") {
    return;
  }

  request.status = "approved";
  const member: CommunityMember = {
    id: `m-${request.playerId}-${request.communityId}`,
    communityId: request.communityId,
    name: request.playerName,
    handle: request.playerHandle,
    avatar: request.playerAvatar,
    joinedAt: "たった今",
  };
  if (!state.members.some((m) => m.id === member.id)) {
    state.members = [member, ...state.members];
  }
  if (request.playerId === CURRENT_PLAYER_ID) {
    state.playerStatusByCommunity[request.communityId] = "approved";
  }
  writeState(state);

  if (request.playerId === CURRENT_PLAYER_ID) {
    appendExtra<NotificationV0Item>(PLAYER_NOTIF_KEY, {
      id: `pn-join-ok-${request.id}`,
      kind: "community_join_approved",
      title: "コミュニティ参加が承認されました",
      body: `「${request.communityName}」コミュニティへの参加申請が承認されました。掲示板で交流できます。`,
      timeLabel: "たった今",
      read: false,
      href: `/mypage/community?community=${request.communityId}`,
      avatar: request.playerAvatar,
    });
  }
}

export function rejectJoinRequest(requestId: string): void {
  const state = readState();
  const request = state.requests.find((r) => r.id === requestId);
  if (!request || request.status !== "pending") {
    return;
  }

  request.status = "rejected";
  if (request.playerId === CURRENT_PLAYER_ID) {
    state.playerStatusByCommunity[request.communityId] = "rejected";
  }
  writeState(state);

  if (request.playerId === CURRENT_PLAYER_ID) {
    appendExtra<NotificationV0Item>(PLAYER_NOTIF_KEY, {
      id: `pn-join-ng-${request.id}`,
      kind: "community_join_rejected",
      title: "コミュニティ参加は承認されませんでした",
      body: `「${request.communityName}」コミュニティへの参加申請は今回は承認されませんでした。`,
      timeLabel: "たった今",
      read: false,
      href: `/creators/${request.communityId}`,
      avatar: request.playerAvatar,
    });
  }
}

export function subscribeCommunityJoin(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("forge-community-join-change", listener);
  return () => window.removeEventListener("forge-community-join-change", listener);
}

export function subscribeV0Notifications(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("forge-v0-notifications-change", listener);
  return () => window.removeEventListener("forge-v0-notifications-change", listener);
}

/** 開発者プロフィールのコミュニティ ID（handle ベース） */
export function communityIdFromDeveloperId(developerId: string): string {
  if (developerId === "sora-games") {
    return "sora-games";
  }
  return developerId;
}
