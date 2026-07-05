"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";
import {
  getGameById as getMockGameById,
  getGamesBySection as getMockGamesBySection,
  games as mockGames,
  type Game,
} from "@/lib/mock-games";
import { isGamePublic } from "@/lib/project-visibility";
import type { ProjectEditFormData, SubmitFormData } from "@/lib/project-form";
import {
  sortDevlogsNewestFirst,
  type DevlogEntry,
} from "@/lib/devlogs";
import {
  buildInitialProjectDevlogContent,
  INITIAL_PROJECT_DEVLOG_PUBLISHED_VERSION,
  INITIAL_PROJECT_DEVLOG_TITLE,
} from "@/lib/initial-project-devlog";
import {
  createNotificationMessage,
  createVersionPublishedMessage,
  sortNotificationsNewestFirst,
  type Notification,
  type NotificationType,
} from "@/lib/notifications";
import { invokeAdoptionMatcherAfterPublish } from "@/lib/voice-adoption/invoke-client";
import {
  findDeveloperProfileByUserId,
  findDeveloperProfileByCreatorId,
  findDeveloperProfileByPublicName,
  findDeveloperProfileByRouteId,
  type DeveloperProfile,
  type DeveloperProfileInput,
} from "@/lib/developer-profiles";
import {
  buildFollowedDeveloperSummaries,
  resolveDeveloperUserIdForFollow,
  type FollowedDeveloperSummary,
} from "@/lib/developer-follows";
import {
  getCreatorById as getMockCreatorById,
  getCreatorId as getMockCreatorId,
  type Creator,
} from "@/lib/creators";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  countDeveloperFollowersInDb,
  fetchFollowingDeveloperUserIds,
  followDeveloperInDb,
  unfollowDeveloperInDb,
} from "@/lib/supabase/developer-follows-db";
import { mergeGameWithExtras } from "@/lib/game-extra-storage";
import { useForgeDeploymentMode } from "@/lib/forge-deployment-context";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { resolveStudioMypageOwnedProjects } from "@/lib/studio-mypage-owned-projects";
import {
  fetchDeveloperProfiles,
  mergeDeveloperProfileSocialLinks,
  upsertDeveloperProfile,
} from "@/lib/supabase/developer-profiles-db";
import {
  deleteProjectInDb,
  fetchProjects,
  fetchPublicProjects,
  insertProject,
  updateProjectDetailsInDb,
  updateProjectFromSubmitForm,
  updateProjectOverviewInDb,
  updateProjectPlayableVersion,
  updateProjectsOwnerDisplayName,
  type ProjectOverviewUpdate,
} from "@/lib/supabase/projects";
import { resolvePlayableVersion } from "@/lib/playable-version";
import type { ProjectVoiceNurtureSignal } from "@/lib/project-voice-nurture";

import {
  addProjectBookmark,
  removeProjectBookmark,
  addProjectSupport,
  addProjectWatch,
  fetchProjectFeedback,
  fetchFeedbackForProjects,
  fetchSupportCounts,
  fetchUserEngagement,
  fetchUserFeedbackForVersion,
  fetchUserLatestFeedbackVersionKey,
  insertProjectFeedback,
  recordProjectPlayWithSession,
  removeProjectWatch,
  updateProjectFeedback,
  type PlaySessionContext,
  type UserEngagementState,
} from "@/lib/supabase/user-engagement";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";
import type { GameFeedbackItem } from "@/lib/game-feedback-storage";
import { fetchGuestFeedbackForProjects } from "@/lib/supabase/guest-feedback-db";
import {
  fetchOwnerVoiceAggregates,
  fetchOwnerStudioVoiceResponseCount,
  fetchOwnerVoiceResponseDetails,
  fetchPublicVoiceAggregates,
  fetchDeveloperVersionPrompts,
  fetchUserVoiceResponses as fetchUserVoiceResponsesDb,
  fetchVersionPrompts,
  fetchVoiceNurtureSignalsForProjects,
  saveDeveloperVersionPrompts,
  upsertVoiceResponses,
  type OwnerVoiceResponseDetail,
} from "@/lib/supabase/voice-engagement";
import type { DeveloperPromptInput } from "@/lib/version-prompt-form";
import type { VoiceAnswerDraft, VersionPrompt, VoiceResponse } from "@/lib/version-prompt-types";
import type { PublicVoiceAggregateRow } from "@/lib/voice-aggregates";
import {
  deleteProjectDevlogsByProjectId,
  fetchAllProjectDevlogs,
  fetchWatcherUserIds,
  insertProjectDevlog,
} from "@/lib/supabase/project-devlogs";
import { insertConfirmationRequest, linkedPriorityIds } from "@/lib/supabase/confirmation-requests-db";
import {
  hasConfirmationRequestContent,
  shouldPersistConfirmationRequest,
  type ConfirmationRequestDraft,
} from "@/lib/confirmation-request-draft";
import { createConfirmationRequestNotificationMessage } from "@/lib/confirmation-request-messages";
import { fetchConfirmationNotifyRecipientIds } from "@/lib/supabase/confirmation-request-targeting-db";
import { resolveChangeCheckState } from "@/lib/change-check-state";
import type { ChangeCheckState } from "@/lib/change-check-types";
import {
  helpfulMarkKey,
  type HelpfulMarkSourceType,
} from "@/lib/developer-helpful-mark";
import {
  fetchHelpfulMarksForProject,
  markFeedbackHelpful,
  unmarkFeedbackHelpful,
} from "@/lib/supabase/developer-feedback-helpful-db";
import {
  fetchAllProjectReleaseEvents,
  insertProjectReleaseEvent,
} from "@/lib/supabase/project-release-events-db";
import {
  validateReleasedDeclaration,
  validateReleaseReopenedDeclaration,
  type ProjectReleaseEvent,
} from "@/lib/project-release-state";
import {
  fetchUserNotifications,
  insertDevlogNotifications,
  insertConfirmationRequestNotifications,
  insertVersionPublishedNotifications,
  isDatabaseNotificationId,
  markAllUserNotificationsAsRead,
  markUserNotificationAsRead,
  notificationRowToNotification,
} from "@/lib/supabase/user-notifications-db";
import { filterUsersByPlayerNotificationPref } from "@/lib/supabase/user-settings-db";

export type RecordPlayOptions = {
  context?: PlaySessionContext;
  adoptionId?: string | null;
};

const APPLICANT_STORAGE_KEY = "forge-applicant-counts";
const FOLLOWERS_STORAGE_KEY = "forge-follower-counts";
const FOLLOWING_STORAGE_KEY = "forge-following-creators";
const NOTIFICATIONS_STORAGE_KEY = "forge-notifications";

const EMPTY_USER_ENGAGEMENT: UserEngagementState = {
  supportedProjectIds: [],
  bookmarkedProjectIds: [],
  watchedProjectIds: [],
  playedProjectIds: [],
};

type Counts = Record<string, number>;

/** submittedGames / publicGames 更新用 — id 未存在時は先頭に追加 */
function upsertGameInList(prev: Game[], merged: Game): Game[] {
  if (prev.some((item) => item.id === merged.id)) {
    return prev.map((item) => (item.id === merged.id ? merged : item));
  }
  return [merged, ...prev];
}

/** dev only — DB返却と保存payloadのズレを即分かるようにする */
function warnProjectDetailsDbPayloadMismatch(
  projectId: string,
  payload: ProjectEditFormData,
  returned: Game,
): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const mismatches: string[] = [];
  if (returned.title !== payload.title) {
    mismatches.push(
      `title payload="${payload.title}" returned="${returned.title}"`,
    );
  }
  const payloadDescription = payload.description?.trim() ?? "";
  if (returned.description !== payloadDescription) {
    mismatches.push(
      `description payload="${payloadDescription}" returned="${returned.description}"`,
    );
  }
  if (returned.phase !== payload.phase) {
    mismatches.push(
      `phase payload="${payload.phase}" returned="${returned.phase}"`,
    );
  }

  if (mismatches.length > 0) {
    console.warn(
      `[Forge] updateProjectDetails DB/payload mismatch (${projectId}): ${mismatches.join("; ")}`,
    );
  }
}

/** DB成功後の provider upsert 用 — 基本情報は保存payloadを正とする */
function applyProjectDetailsPayloadToGame(
  merged: Game,
  data: ProjectEditFormData,
): Game {
  return {
    ...merged,
    title: data.title,
    description:
      data.description !== undefined
        ? data.description.trim()
        : merged.description,
    phase: data.phase,
    status: data.lookingForTesters ? "テスター募集中" : data.phase,
  };
}

type GamesContextValue = {
  submittedGames: Game[];
  /** visibility=public のみ — /home・検索用（auth 非依存） */
  publicGames: Game[];
  publicCatalogReady: boolean;
  dataReady: boolean;
  /** Supabase project_devlogs の初回取得完了（実作品 devlog タブ用） */
  devlogsReady: boolean;
  addSubmittedGame: (
    data: SubmitFormData,
    owner: { ownerId: string; ownerName: string },
  ) => Promise<Game>;
  createInitialProjectDevlog: (
    projectId: string,
    authorId: string,
    introduction: string,
  ) => Promise<DevlogEntry>;
  updateSubmittedGame: (id: string, data: SubmitFormData) => Promise<void>;
  updateProjectDetails: (id: string, data: ProjectEditFormData) => Promise<void>;
  updateProjectOverview: (id: string, data: ProjectOverviewUpdate) => Promise<void>;
  deleteSubmittedGame: (id: string) => Promise<void>;
  getSubmittedGameById: (id: string) => Game | undefined;
  /** Studio 編集用 — submittedGames のみ（publicGames フォールバックなし） */
  getOwnedProjectById: (id: string) => Game | undefined;
  getGameById: (id: string) => Game | undefined;
  getGamesBySection: (section: Game["section"]) => Game[];
  getSupportCount: (id: string, defaultCount?: number) => number;
  isSupported: (gameId: string) => boolean;
  supportGame: (gameId: string) => Promise<void>;
  hasPlayedGame: (gameId: string) => boolean;
  recordPlay: (gameId: string, options?: RecordPlayOptions) => Promise<void>;
  submitProjectFeedback: (
    gameId: string,
    feedback: Omit<GameFeedbackItem, "id" | "createdAt" | "versionKey" | "updatedAt">,
  ) => Promise<GameFeedbackItem>;
  getMyFeedbackForProject: (gameId: string) => Promise<GameFeedbackItem | null>;
  getNewPlayableVersionBannerState: (gameId: string) => Promise<{
    show: boolean;
    priorVersion?: string;
    currentVersion?: string;
  }>;
  getChangeCheckState: (gameId: string) => Promise<ChangeCheckState | null>;
  loadHelpfulMarksForProject: (projectId: string) => Promise<void>;
  getHelpfulMarksForProject: (projectId: string) => Set<string>;
  toggleFeedbackHelpful: (
    projectId: string,
    sourceType: HelpfulMarkSourceType,
    sourceId: string,
    marked: boolean,
  ) => Promise<void>;
  getProjectFeedback: (gameId: string) => Promise<GameFeedbackItem[]>;
  getOwnedProjectFeedback: (
    userId: string | undefined,
  ) => Promise<ProjectFeedbackEntry[]>;
  getOwnedProjectVoiceSignals: (
    userId: string | undefined,
  ) => Promise<ProjectVoiceNurtureSignal[]>;
  getVersionPrompts: (gameId: string, versionKey: string) => Promise<VersionPrompt[]>;
  getDeveloperVersionPrompts: (
    gameId: string,
    versionKey: string,
  ) => Promise<VersionPrompt[]>;
  saveDeveloperVersionPrompts: (
    gameId: string,
    versionKey: string,
    prompts: DeveloperPromptInput[],
  ) => Promise<VersionPrompt[]>;
  getMyVoiceResponses: (
    gameId: string,
    versionKey: string,
  ) => Promise<VoiceResponse[]>;
  submitVoiceResponses: (
    gameId: string,
    versionKey: string,
    answers: VoiceAnswerDraft[],
  ) => Promise<VoiceResponse[]>;
  getPublicVoiceAggregates: (
    gameId: string,
    versionKey: string,
  ) => Promise<PublicVoiceAggregateRow[]>;
  getOwnerVoiceAggregates: (
    gameId: string,
    versionKey: string,
  ) => Promise<PublicVoiceAggregateRow[]>;
  getOwnerVoiceResponseDetails: (
    gameId: string,
    versionKey: string,
  ) => Promise<OwnerVoiceResponseDetail[]>;
  getOwnerStudioVoiceResponseCount: (
    gameId: string,
    versionKey: string,
  ) => Promise<number>;
  getApplicantCount: (id: string, defaultCount?: number) => number;
  incrementApplicantCount: (id: string, defaultCount?: number) => number;
  isSubmittedGame: (id: string) => boolean;
  isProjectOwner: (projectId: string, userId: string | undefined) => boolean;
  getOwnedProjects: (userId: string | undefined) => Game[];
  /** `/studio/mypage` — 実データ + Preview/local のみデータ層 mock 注入 */
  getStudioMypageOwnedProjects: (userId: string | undefined) => Game[];
  getGamesByCreator: (creatorName: string) => Game[];
  getFollowerCount: (creatorId: string, defaultCount?: number) => number;
  refreshFollowerCount: (developerUserId: string) => Promise<void>;
  isFollowing: (creatorId: string) => boolean;
  toggleFollowCreator: (creatorId: string) => Promise<void>;
  getFollowedDevelopers: () => FollowedDeveloperSummary[];
  isBookmarked: (gameId: string) => boolean;
  bookmarkGame: (gameId: string) => void;
  unbookmarkGame: (gameId: string) => void;
  getBookmarkedGames: () => Game[];
  getPlayedGames: () => Game[];
  getSupportedGames: () => Game[];
  getWatchedGames: () => Game[];
  isWatching: (gameId: string) => boolean;
  watchGame: (gameId: string) => void;
  unwatchGame: (gameId: string) => void;
  getDevlogsByProject: (projectId: string) => DevlogEntry[];
  getReleaseEventsForProject: (projectId: string) => ProjectReleaseEvent[];
  declareProjectReleased: (projectId: string, note?: string) => Promise<void>;
  declareProjectReleaseReopened: (projectId: string, note?: string) => Promise<void>;
  hasDevlogs: (projectId: string) => boolean;
  addDevlog: (
    projectId: string,
    title: string,
    content: string,
    options?: {
      publishPlayableVersion?: string;
      confirmationRequest?: ConfirmationRequestDraft;
    },
  ) => Promise<void>;
  getNotifications: () => Notification[];
  getUnreadNotificationCount: () => number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (type: NotificationType, projectId: string) => void;
  reloadNotifications: () => Promise<void>;
  reloadFromStorage: () => Promise<void>;
  getDeveloperProfileByUserId: (userId: string) => DeveloperProfile | undefined;
  getDeveloperProfileByRouteId: (routeId: string) => DeveloperProfile | undefined;
  saveDeveloperProfile: (
    userId: string,
    input: DeveloperProfileInput,
  ) => Promise<DeveloperProfile>;
  syncOwnedProjectDisplayNames: (
    userId: string,
    displayName: string,
  ) => Promise<void>;
  getCreatorIdForName: (name: string) => string;
  resolveCreatorById: (id: string) => Creator;
};

const GamesContext = createContext<GamesContextValue | null>(null);

function loadCounts(key: string): Counts {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as Counts) : {};
  } catch {
    return {};
  }
}

function loadFollowing(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(FOLLOWING_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

function loadLocalNotifications(): Notification[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notifications = stored ? (JSON.parse(stored) as Notification[]) : [];
    return notifications
      .filter((notification) => notification.type !== "devlog")
      .map((notification) => ({
        ...notification,
        read: notification.read ?? false,
      }));
  } catch {
    return [];
  }
}

export function GamesProvider({ children }: { children: ReactNode }) {
  const { user, hydrated: authHydrated } = useAuth();
  const deploymentMode = useForgeDeploymentMode();
  const hideV0MockForMypage = deploymentMode === "production";
  const [submittedGames, setSubmittedGames] = useState<Game[]>([]);
  const [publicGames, setPublicGames] = useState<Game[]>([]);
  const [publicCatalogReady, setPublicCatalogReady] = useState(false);
  const [supportCounts, setSupportCounts] = useState<Counts>({});
  const [userEngagement, setUserEngagement] =
    useState<UserEngagementState>(EMPTY_USER_ENGAGEMENT);
  const [applicantCounts, setApplicantCounts] = useState<Counts>({});
  const [followerCounts, setFollowerCounts] = useState<Counts>({});
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [followedDeveloperUserIds, setFollowedDeveloperUserIds] = useState<string[]>(
    [],
  );
  const [followerCountByDeveloperUserId, setFollowerCountByDeveloperUserId] =
    useState<Counts>({});
  const [devlogs, setDevlogs] = useState<DevlogEntry[]>([]);
  const [devlogsReady, setDevlogsReady] = useState(false);
  const [helpfulMarksByProject, setHelpfulMarksByProject] = useState<
    Record<string, string[]>
  >({});
  const [releaseEvents, setReleaseEvents] = useState<ProjectReleaseEvent[]>([]);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(
    [],
  );
  const [dbNotifications, setDbNotifications] = useState<Notification[]>([]);
  const [developerProfiles, setDeveloperProfiles] = useState<DeveloperProfile[]>(
    [],
  );
  const [hydrated, setHydrated] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);
  const catalogUserIdRef = useRef<string | undefined>(undefined);

  const reloadFromStorage = useCallback(async () => {
    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setSubmittedGames([]);
      setDeveloperProfiles([]);
      return;
    }

    const [projects, profiles] = await Promise.all([
      fetchProjects(supabase),
      fetchDeveloperProfiles(supabase),
    ]);

    setSubmittedGames(projects.map((game) => mergeGameWithExtras(game)));
    setDeveloperProfiles(profiles);
  }, []);

  const reloadPublicCatalog = useCallback(async () => {
    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setPublicGames([]);
      return;
    }

    const projects = await fetchPublicProjects(supabase);
    setPublicGames(projects.map((game) => mergeGameWithExtras(game)));
  }, []);

  const resolveDeveloperUserId = useCallback(
    (key: string) => resolveDeveloperUserIdForFollow(key, developerProfiles),
    [developerProfiles],
  );

  useEffect(() => {
    setApplicantCounts(loadCounts(APPLICANT_STORAGE_KEY));
    if (!shouldHideV0MockContent()) {
      setFollowerCounts(loadCounts(FOLLOWERS_STORAGE_KEY));
      setFollowedCreators(loadFollowing());
      setLocalNotifications(loadLocalNotifications());
    }
    setHydrated(true);

    const supabase = getOptionalSupabaseClient();
    if (supabase) {
      void reloadPublicCatalog()
        .catch(() => setPublicGames([]))
        .finally(() => setPublicCatalogReady(true));
      void fetchSupportCounts(supabase)
        .then(setSupportCounts)
        .catch(() => setSupportCounts({}));
      void fetchAllProjectDevlogs(supabase)
        .then(setDevlogs)
        .catch(() => setDevlogs([]))
        .finally(() => setDevlogsReady(true));
      void fetchAllProjectReleaseEvents(supabase)
        .then(setReleaseEvents)
        .catch(() => setReleaseEvents([]));
    } else {
      setPublicCatalogReady(true);
      setDevlogsReady(true);
    }
  }, [reloadPublicCatalog]);

  useEffect(() => {
    if (!authHydrated) {
      return;
    }

    if (!user) {
      setUserEngagement(EMPTY_USER_ENGAGEMENT);
      setDbNotifications([]);
      setFollowedDeveloperUserIds([]);
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      return;
    }

    void fetchUserEngagement(supabase, user.id)
      .then(setUserEngagement)
      .catch(() => setUserEngagement(EMPTY_USER_ENGAGEMENT));

    void fetchFollowingDeveloperUserIds(supabase, user.id)
      .then(setFollowedDeveloperUserIds)
      .catch(() => setFollowedDeveloperUserIds([]));

    void fetchUserNotifications(supabase, user.id)
      .then((rows) =>
        rows.map((row) =>
          notificationRowToNotification(
            row,
            submittedGames.find((game) => game.id === row.project_id)?.title ??
              getMockGameById(row.project_id)?.title ??
              "作品",
          ),
        ),
      )
      .then(setDbNotifications)
      .catch(() => setDbNotifications([]));
  }, [authHydrated, user?.id, submittedGames]);

  useEffect(() => {
    if (!authHydrated) {
      return;
    }

    if (!user) {
      catalogUserIdRef.current = undefined;
      setCatalogReady(true);
      setSubmittedGames([]);
      setDeveloperProfiles([]);
      return;
    }

    const userChanged = catalogUserIdRef.current !== user.id;
    catalogUserIdRef.current = user.id;
    if (userChanged) {
      setCatalogReady(false);
    }

    let cancelled = false;

    void reloadFromStorage()
      .catch(() => {
        if (!cancelled) {
          setSubmittedGames([]);
          setDeveloperProfiles([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCatalogReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authHydrated, user?.id, reloadFromStorage]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(APPLICANT_STORAGE_KEY, JSON.stringify(applicantCounts));
  }, [applicantCounts, hydrated]);

  useEffect(() => {
    if (!hydrated || shouldHideV0MockContent()) {
      return;
    }

    localStorage.setItem(FOLLOWERS_STORAGE_KEY, JSON.stringify(followerCounts));
  }, [followerCounts, hydrated]);

  useEffect(() => {
    if (!hydrated || shouldHideV0MockContent()) {
      return;
    }

    localStorage.setItem(FOLLOWING_STORAGE_KEY, JSON.stringify(followedCreators));
  }, [followedCreators, hydrated]);

  useEffect(() => {
    if (!hydrated || shouldHideV0MockContent()) {
      return;
    }

    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(localNotifications),
    );
  }, [localNotifications, hydrated]);

  const addSubmittedGame = useCallback(
    async (
      data: SubmitFormData,
      owner: { ownerId: string; ownerName: string },
    ) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const game = await insertProject(supabase, data, owner);
      setSubmittedGames((prev) => [
        game,
        ...prev.filter((item) => item.id !== game.id),
      ]);
      if (game.visibility !== "private") {
        void reloadPublicCatalog().catch(() => undefined);
      }
      try {
        await mergeDeveloperProfileSocialLinks(supabase, owner.ownerId, {
          discordUrl: data.discordUrl,
          youtubeUrl: data.youtubeUrl,
          xUrl: data.xUrl,
          officialUrl: data.officialUrl,
        });
      } catch {
        // Project post succeeded; developer-wide social defaults are best-effort.
      }
      return game;
    },
    [reloadPublicCatalog],
  );

  const createInitialProjectDevlog = useCallback(
    async (projectId: string, authorId: string, introduction: string) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const entry = await insertProjectDevlog(
        supabase,
        authorId,
        projectId,
        INITIAL_PROJECT_DEVLOG_TITLE,
        buildInitialProjectDevlogContent(introduction),
        { publishedVersion: INITIAL_PROJECT_DEVLOG_PUBLISHED_VERSION },
      );
      setDevlogs((prev) => [entry, ...prev]);
      return entry;
    },
    [],
  );

  const updateSubmittedGame = useCallback(
    async (id: string, data: SubmitFormData) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const game = await updateProjectFromSubmitForm(supabase, id, data);
      setSubmittedGames((prev) =>
        prev.map((item) => (item.id === id ? game : item)),
      );
      void reloadPublicCatalog().catch(() => undefined);
    },
    [reloadPublicCatalog],
  );

  const updateProjectDetails = useCallback(
    async (id: string, data: ProjectEditFormData) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const game = await updateProjectDetailsInDb(supabase, id, data);
      warnProjectDetailsDbPayloadMismatch(id, data, game);
      const merged = applyProjectDetailsPayloadToGame(
        mergeGameWithExtras(game),
        data,
      );
      setSubmittedGames((prev) => upsertGameInList(prev, merged));
      setPublicGames((prev) => {
        if (merged.visibility !== "public") {
          return prev.filter((item) => item.id !== id);
        }
        return upsertGameInList(prev, merged);
      });
      void reloadPublicCatalog().catch(() => undefined);

      const ownerId = game.ownerId;
      if (ownerId) {
        void (async () => {
          try {
            await mergeDeveloperProfileSocialLinks(supabase, ownerId, {
              discordUrl: data.discordUrl,
              youtubeUrl: data.youtubeUrl,
              xUrl: data.xUrl,
              officialUrl: data.officialUrl,
            });
            const profiles = await fetchDeveloperProfiles(supabase);
            setDeveloperProfiles(profiles);
          } catch {
            // Project save succeeded; developer profile sync is best-effort.
          }
        })();
      }
    },
    [reloadPublicCatalog],
  );

  const updateProjectOverview = useCallback(
    async (id: string, data: ProjectOverviewUpdate) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const game = await updateProjectOverviewInDb(supabase, id, data);
      const merged = mergeGameWithExtras(game);
      setSubmittedGames((prev) => upsertGameInList(prev, merged));
      setPublicGames((prev) => {
        if (merged.visibility !== "public") {
          return prev.filter((item) => item.id !== id);
        }
        return upsertGameInList(prev, merged);
      });
      void reloadPublicCatalog().catch(() => undefined);
    },
    [reloadPublicCatalog],
  );

  const deleteSubmittedGame = useCallback(async (id: string) => {
    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    await deleteProjectDevlogsByProjectId(supabase, id);
    await deleteProjectInDb(supabase, id);
    setSubmittedGames((prev) => prev.filter((game) => game.id !== id));
    setSupportCounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setApplicantCounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setUserEngagement((prev) => ({
      ...prev,
      bookmarkedProjectIds: prev.bookmarkedProjectIds.filter(
        (gameId) => gameId !== id,
      ),
      watchedProjectIds: prev.watchedProjectIds.filter((gameId) => gameId !== id),
      supportedProjectIds: prev.supportedProjectIds.filter(
        (gameId) => gameId !== id,
      ),
      playedProjectIds: prev.playedProjectIds.filter((gameId) => gameId !== id),
    }));
    setDevlogs((prev) => prev.filter((entry) => entry.projectId !== id));
    setLocalNotifications((prev) => prev.filter((entry) => entry.projectId !== id));
    setDbNotifications((prev) => prev.filter((entry) => entry.projectId !== id));
    setPublicGames((prev) => prev.filter((game) => game.id !== id));
    void reloadPublicCatalog().catch(() => undefined);
  }, [reloadPublicCatalog]);

  const getSubmittedGameById = useCallback(
    (id: string) => {
      const submitted = submittedGames.find((game) => game.id === id);
      if (submitted) {
        return submitted;
      }
      // オーナー作品 catalog 読込前に publicGames へフォールバックすると
      // Studio 編集で古いデータ表示・誤リダイレクトの原因になる
      if (!catalogReady || !publicCatalogReady) {
        return undefined;
      }
      return publicGames.find((game) => game.id === id);
    },
    [submittedGames, publicGames, catalogReady, publicCatalogReady],
  );

  const getOwnedProjectById = useCallback(
    (id: string) => {
      if (!catalogReady) {
        return undefined;
      }
      return submittedGames.find((game) => game.id === id);
    },
    [submittedGames, catalogReady],
  );

  const isSubmittedGame = useCallback(
    (id: string) => submittedGames.some((game) => game.id === id),
    [submittedGames],
  );

  const isProjectOwner = useCallback(
    (projectId: string, userId: string | undefined) => {
      if (!userId) {
        return false;
      }

      const game = submittedGames.find((item) => item.id === projectId);
      return game?.ownerId === userId;
    },
    [submittedGames],
  );

  const getOwnedProjects = useCallback(
    (userId: string | undefined) => {
      if (!userId) {
        return [];
      }

      return submittedGames.filter((game) => game.ownerId === userId);
    },
    [submittedGames],
  );

  const getStudioMypageOwnedProjects = useCallback(
    (userId: string | undefined) => {
      const realOwned = userId ? getOwnedProjects(userId) : [];
      return resolveStudioMypageOwnedProjects(realOwned, hideV0MockForMypage);
    },
    [getOwnedProjects, hideV0MockForMypage],
  );

  const getGameById = useCallback(
    (id: string) => {
      const submitted = getSubmittedGameById(id);
      if (submitted) {
        return mergeGameWithExtras(submitted);
      }
      if (shouldHideV0MockContent()) {
        return undefined;
      }
      const mock = getMockGameById(id);
      return mock ? mergeGameWithExtras(mock) : undefined;
    },
    [getSubmittedGameById],
  );

  const addNotification = useCallback(
    (type: NotificationType, projectId: string) => {
      if (type === "devlog" || shouldHideV0MockContent()) {
        return;
      }

      const game = getSubmittedGameById(projectId) ?? getMockGameById(projectId);
      if (!game) {
        return;
      }

      const notification: Notification = {
        id: `notification-${Date.now()}`,
        type,
        message: createNotificationMessage(type, game.title),
        date: new Date().toISOString(),
        projectId,
        projectTitle: game.title,
        read: false,
      };

      setLocalNotifications((prev) => [notification, ...prev]);
    },
    [getSubmittedGameById],
  );

  const getNotifications = useCallback(() => {
    if (shouldHideV0MockContent()) {
      return sortNotificationsNewestFirst(dbNotifications);
    }
    return sortNotificationsNewestFirst([...dbNotifications, ...localNotifications]);
  }, [dbNotifications, localNotifications]);

  const getUnreadNotificationCount = useCallback(() => {
    const notifications = shouldHideV0MockContent()
      ? dbNotifications
      : [...dbNotifications, ...localNotifications];
    return notifications.filter((notification) => !notification.read).length;
  }, [dbNotifications, localNotifications]);

  const markNotificationAsRead = useCallback(
    (id: string) => {
      if (isDatabaseNotificationId(id)) {
        if (!user) {
          return;
        }

        const supabase = getOptionalSupabaseClient();
        if (!supabase) {
          return;
        }

        setDbNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification,
          ),
        );
        void markUserNotificationAsRead(supabase, user.id, id);
        return;
      }

      setLocalNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      );
    },
    [user],
  );

  const markAllNotificationsAsRead = useCallback(() => {
    setLocalNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );

    if (!user) {
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      return;
    }

    setDbNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
    void markAllUserNotificationsAsRead(supabase, user.id);
  }, [user]);

  const reloadNotifications = useCallback(async () => {
    if (!user) {
      setDbNotifications([]);
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      return;
    }

    const rows = await fetchUserNotifications(supabase, user.id);
    setDbNotifications(
      rows.map((row) =>
        notificationRowToNotification(
          row,
          submittedGames.find((game) => game.id === row.project_id)?.title ??
            getMockGameById(row.project_id)?.title ??
            "作品",
        ),
      ),
    );
  }, [user, submittedGames]);

  const getGamesBySection = useCallback(
    (section: Game["section"]) => {
      const publicSubmitted = submittedGames.filter(isGamePublic);

      if (section === "new") {
        const seen = new Set<string>();
        const combined: Game[] = [];
        for (const game of [
          ...publicSubmitted,
          ...getMockGamesBySection("new"),
          ...getMockGamesBySection("testers"),
        ]) {
          if (!seen.has(game.id)) {
            seen.add(game.id);
            combined.push(game);
          }
        }
        return combined;
      }

      return getMockGamesBySection(section);
    },
    [submittedGames],
  );

  const getSupportCount = useCallback(
    (id: string, defaultCount = 0) => {
      const dbCount = supportCounts[id];
      if (dbCount !== undefined && dbCount > 0) {
        return dbCount;
      }
      return defaultCount;
    },
    [supportCounts],
  );

  const isSupported = useCallback(
    (gameId: string) => userEngagement.supportedProjectIds.includes(gameId),
    [userEngagement.supportedProjectIds],
  );

  const supportGame = useCallback(
    async (gameId: string) => {
      if (!user || isSupported(gameId)) {
        return;
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return;
      }

      const added = await addProjectSupport(supabase, user.id, gameId);
      if (!added) {
        return;
      }

      setUserEngagement((prev) => ({
        ...prev,
        supportedProjectIds: [...prev.supportedProjectIds, gameId],
      }));
      setSupportCounts((prev) => ({
        ...prev,
        [gameId]: (prev[gameId] ?? 0) + 1,
      }));
      addNotification("support", gameId);
    },
    [user, isSupported, addNotification],
  );

  const hasPlayedGame = useCallback(
    (gameId: string) => userEngagement.playedProjectIds.includes(gameId),
    [userEngagement.playedProjectIds],
  );

  const recordPlay = useCallback(
    async (gameId: string, options?: RecordPlayOptions) => {
      if (!user) {
        return;
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return;
      }

      const game = getSubmittedGameById(gameId) ?? getMockGameById(gameId);
      const versionKey = resolvePlayableVersion(game?.playableVersion);
      const alreadyPlayed = hasPlayedGame(gameId);
      const context: PlaySessionContext =
        options?.context ?? (alreadyPlayed ? "new_version" : "general");

      await recordProjectPlayWithSession(supabase, user.id, {
        projectId: gameId,
        versionKey,
        context,
        adoptionId: options?.adoptionId,
      });

      if (!alreadyPlayed) {
        setUserEngagement((prev) => ({
          ...prev,
          playedProjectIds: [...prev.playedProjectIds, gameId],
        }));
      }
    },
    [user, hasPlayedGame],
  );

  const submitProjectFeedback = useCallback(
    async (
      gameId: string,
      feedback: Omit<GameFeedbackItem, "id" | "createdAt" | "versionKey" | "updatedAt">,
    ) => {
      if (!user) {
        throw new Error("Login required");
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const game = getSubmittedGameById(gameId) ?? getMockGameById(gameId);
      const versionKey = resolvePlayableVersion(game?.playableVersion);
      const existing = await fetchUserFeedbackForVersion(
        supabase,
        user.id,
        gameId,
        versionKey,
      );

      const item = existing
        ? await updateProjectFeedback(supabase, existing.id, user.id, feedback)
        : await insertProjectFeedback(
            supabase,
            user.id,
            gameId,
            versionKey,
            feedback,
          );

      return item;
    },
    [user, getSubmittedGameById],
  );

  const getMyFeedbackForProject = useCallback(
    async (gameId: string) => {
      if (!user) {
        return null;
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return null;
      }

      const game = getSubmittedGameById(gameId) ?? getMockGameById(gameId);
      const versionKey = resolvePlayableVersion(game?.playableVersion);

      return fetchUserFeedbackForVersion(
        supabase,
        user.id,
        gameId,
        versionKey,
      );
    },
    [user, getSubmittedGameById],
  );

  const getNewPlayableVersionBannerState = useCallback(
    async (gameId: string) => {
      if (!user || !userEngagement.watchedProjectIds.includes(gameId)) {
        return { show: false };
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return { show: false };
      }

      const game = getSubmittedGameById(gameId) ?? getMockGameById(gameId);
      const currentVersion = resolvePlayableVersion(game?.playableVersion);

      const currentFeedback = await fetchUserFeedbackForVersion(
        supabase,
        user.id,
        gameId,
        currentVersion,
      );
      const currentVoice = await fetchUserVoiceResponsesDb(
        supabase,
        user.id,
        gameId,
        currentVersion,
      );
      if (currentFeedback || currentVoice.length > 0) {
        return { show: false };
      }

      const latestVersion = await fetchUserLatestFeedbackVersionKey(
        supabase,
        user.id,
        gameId,
      );
      if (!latestVersion || latestVersion === currentVersion) {
        return { show: false };
      }

      return {
        show: true,
        priorVersion: latestVersion,
        currentVersion,
      };
    },
    [user, userEngagement.watchedProjectIds, getSubmittedGameById],
  );

  const getChangeCheckState = useCallback(
    async (gameId: string): Promise<ChangeCheckState | null> => {
      if (!user || !userEngagement.playedProjectIds.includes(gameId)) {
        return null;
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return null;
      }

      const game = getSubmittedGameById(gameId) ?? getMockGameById(gameId);
      const currentVersion = resolvePlayableVersion(game?.playableVersion);

      return resolveChangeCheckState(supabase, {
        userId: user.id,
        projectId: gameId,
        currentVersion,
        hasPlayed: true,
        devlogs,
      });
    },
    [user, userEngagement.playedProjectIds, getSubmittedGameById, devlogs],
  );

  const loadHelpfulMarksForProject = useCallback(
    async (projectId: string) => {
      if (!user || !isProjectOwner(projectId, user.id)) {
        return;
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return;
      }

      const marks = await fetchHelpfulMarksForProject(supabase, user.id, projectId);
      setHelpfulMarksByProject((prev) => ({
        ...prev,
        [projectId]: [...marks],
      }));
    },
    [user, isProjectOwner],
  );

  const getHelpfulMarksForProject = useCallback(
    (projectId: string) => new Set(helpfulMarksByProject[projectId] ?? []),
    [helpfulMarksByProject],
  );

  const toggleFeedbackHelpful = useCallback(
    async (
      projectId: string,
      sourceType: HelpfulMarkSourceType,
      sourceId: string,
      marked: boolean,
    ) => {
      if (!user || !isProjectOwner(projectId, user.id)) {
        return;
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return;
      }

      const key = helpfulMarkKey(sourceType, sourceId);

      if (marked) {
        await markFeedbackHelpful(supabase, {
          developerId: user.id,
          projectId,
          sourceType,
          sourceId,
        });
        setHelpfulMarksByProject((prev) => {
          const current = new Set(prev[projectId] ?? []);
          current.add(key);
          return { ...prev, [projectId]: [...current] };
        });
        return;
      }

      await unmarkFeedbackHelpful(supabase, {
        developerId: user.id,
        sourceType,
        sourceId,
      });
      setHelpfulMarksByProject((prev) => ({
        ...prev,
        [projectId]: (prev[projectId] ?? []).filter((entry) => entry !== key),
      }));
    },
    [user, isProjectOwner],
  );

  const getProjectFeedback = useCallback(async (gameId: string) => {
    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      return [];
    }

    return fetchProjectFeedback(supabase, gameId);
  }, []);

  const getVersionPrompts = useCallback(
    async (gameId: string, versionKey: string) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return [];
      }

      return fetchVersionPrompts(supabase, gameId, versionKey);
    },
    [],
  );

  const getDeveloperVersionPrompts = useCallback(
    async (gameId: string, versionKey: string) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return [];
      }

      return fetchDeveloperVersionPrompts(supabase, gameId, versionKey);
    },
    [],
  );

  const saveDeveloperVersionPromptsFn = useCallback(
    async (
      gameId: string,
      versionKey: string,
      prompts: DeveloperPromptInput[],
    ) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      return saveDeveloperVersionPrompts(
        supabase,
        gameId,
        versionKey,
        prompts,
      );
    },
    [],
  );

  const getMyVoiceResponses = useCallback(
    async (gameId: string, versionKey: string) => {
      if (!user) {
        return [];
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return [];
      }

      return fetchUserVoiceResponsesDb(
        supabase,
        user.id,
        gameId,
        versionKey,
      );
    },
    [user],
  );

  const submitVoiceResponses = useCallback(
    async (
      gameId: string,
      versionKey: string,
      answers: VoiceAnswerDraft[],
    ) => {
      if (!user) {
        throw new Error("Login required");
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const saved = await upsertVoiceResponses(
        supabase,
        user.id,
        gameId,
        versionKey,
        answers,
      );

      return saved;
    },
    [user],
  );

  const getPublicVoiceAggregates = useCallback(
    async (gameId: string, versionKey: string) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return [];
      }

      return fetchPublicVoiceAggregates(supabase, gameId, versionKey);
    },
    [],
  );

  const getOwnerVoiceAggregates = useCallback(
    async (gameId: string, versionKey: string) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return [];
      }

      return fetchOwnerVoiceAggregates(supabase, gameId, versionKey);
    },
    [],
  );

  const getOwnerVoiceResponseDetails = useCallback(
    async (gameId: string, versionKey: string) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return [];
      }

      return fetchOwnerVoiceResponseDetails(supabase, gameId, versionKey);
    },
    [],
  );

  const getOwnerStudioVoiceResponseCount = useCallback(
    async (gameId: string, versionKey: string) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return 0;
      }

      return fetchOwnerStudioVoiceResponseCount(supabase, gameId, versionKey);
    },
    [],
  );

  const getOwnedProjectFeedback = useCallback(
    async (userId: string | undefined) => {
      if (!userId) {
        return [];
      }

      const ownedIds = getOwnedProjects(userId).map((game) => game.id);
      if (ownedIds.length === 0) {
        return [];
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return [];
      }

      const [registered, guest] = await Promise.all([
        fetchFeedbackForProjects(supabase, ownedIds),
        fetchGuestFeedbackForProjects(supabase, ownedIds).catch(() => []),
      ]);

      return [...registered, ...guest].sort(
        (a, b) =>
          new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime(),
      );
    },
    [getOwnedProjects],
  );

  const getOwnedProjectVoiceSignals = useCallback(
    async (userId: string | undefined) => {
      if (!userId) {
        return [];
      }

      const ownedGames = getOwnedProjects(userId);
      if (ownedGames.length === 0) {
        return [];
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return [];
      }

      return fetchVoiceNurtureSignalsForProjects(
        supabase,
        ownedGames.map((game) => ({
          projectId: game.id,
          playableVersion: resolvePlayableVersion(game.playableVersion),
        })),
      );
    },
    [getOwnedProjects],
  );

  const getApplicantCount = useCallback(
    (id: string, defaultCount = 0) => applicantCounts[id] ?? defaultCount,
    [applicantCounts],
  );

  const incrementApplicantCount = useCallback(
    (id: string, defaultCount = 0) => {
      const current = applicantCounts[id] ?? defaultCount;
      const next = current + 1;
      setApplicantCounts((prev) => ({ ...prev, [id]: next }));
      addNotification("tester_apply", id);
      return next;
    },
    [applicantCounts, addNotification],
  );

  const getGamesByCreator = useCallback(
    (creatorName: string) => {
      const submitted = submittedGames.filter(
        (game) => game.creator === creatorName,
      );
      const mock = mockGames.filter((game) => game.creator === creatorName);
      return [...submitted, ...mock];
    },
    [submittedGames],
  );

  const getFollowerCount = useCallback(
    (creatorId: string, defaultCount = 0) => {
      const developerUserId = resolveDeveloperUserId(creatorId);
      if (developerUserId) {
        return followerCountByDeveloperUserId[developerUserId] ?? defaultCount;
      }
      return followerCounts[creatorId] ?? defaultCount;
    },
    [followerCountByDeveloperUserId, followerCounts, resolveDeveloperUserId],
  );

  const refreshFollowerCount = useCallback(
    async (developerUserId: string) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return;
      }

      const count = await countDeveloperFollowersInDb(supabase, developerUserId);
      setFollowerCountByDeveloperUserId((prev) => ({
        ...prev,
        [developerUserId]: count,
      }));
    },
    [],
  );

  const isFollowing = useCallback(
    (creatorId: string) => {
      const developerUserId = resolveDeveloperUserId(creatorId);
      if (developerUserId) {
        return followedDeveloperUserIds.includes(developerUserId);
      }
      return followedCreators.includes(creatorId);
    },
    [followedCreators, followedDeveloperUserIds, resolveDeveloperUserId],
  );

  const toggleFollowCreator = useCallback(
    async (creatorId: string) => {
      const developerUserId = resolveDeveloperUserId(creatorId);
      if (developerUserId && user) {
        if (developerUserId === user.id) {
          return;
        }

        const supabase = getOptionalSupabaseClient();
        if (!supabase) {
          return;
        }

        const currentlyFollowing = followedDeveloperUserIds.includes(developerUserId);
        if (currentlyFollowing) {
          await unfollowDeveloperInDb(supabase, user.id, developerUserId);
          setFollowedDeveloperUserIds((prev) =>
            prev.filter((id) => id !== developerUserId),
          );
          setFollowerCountByDeveloperUserId((prev) => ({
            ...prev,
            [developerUserId]: Math.max(0, (prev[developerUserId] ?? 1) - 1),
          }));
        } else {
          await followDeveloperInDb(supabase, user.id, developerUserId);
          setFollowedDeveloperUserIds((prev) => [...prev, developerUserId]);
          setFollowerCountByDeveloperUserId((prev) => ({
            ...prev,
            [developerUserId]: (prev[developerUserId] ?? 0) + 1,
          }));
        }
        return;
      }

      if (shouldHideV0MockContent()) {
        return;
      }

      if (followedCreators.includes(creatorId)) {
        setFollowedCreators((prev) => prev.filter((id) => id !== creatorId));
        setFollowerCounts((prev) => ({
          ...prev,
          [creatorId]: Math.max(0, (prev[creatorId] ?? 1) - 1),
        }));
        return;
      }

      setFollowedCreators((prev) => [...prev, creatorId]);
      setFollowerCounts((prev) => ({
        ...prev,
        [creatorId]: (prev[creatorId] ?? 0) + 1,
      }));
    },
    [
      followedCreators,
      followedDeveloperUserIds,
      resolveDeveloperUserId,
      user,
    ],
  );

  const getFollowedDevelopers = useCallback((): FollowedDeveloperSummary[] => {
    return buildFollowedDeveloperSummaries(
      followedDeveloperUserIds,
      developerProfiles,
      (ownerId) =>
        submittedGames
          .filter((game) => game.ownerId === ownerId && isGamePublic(game))
          .map((game) => ({
            title: game.title,
            thumbnailUrl: game.thumbnailUrl,
            ownerName: game.ownerName,
          })),
    );
  }, [followedDeveloperUserIds, developerProfiles, submittedGames]);

  const isBookmarked = useCallback(
    (gameId: string) => userEngagement.bookmarkedProjectIds.includes(gameId),
    [userEngagement.bookmarkedProjectIds],
  );

  const bookmarkGame = useCallback(
    async (gameId: string) => {
      if (!user || isBookmarked(gameId)) {
        return;
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return;
      }

      await addProjectBookmark(supabase, user.id, gameId);
      setUserEngagement((prev) => ({
        ...prev,
        bookmarkedProjectIds: [...prev.bookmarkedProjectIds, gameId],
      }));
    },
    [user, isBookmarked],
  );

  const unbookmarkGame = useCallback(
    async (gameId: string) => {
      if (!user || !isBookmarked(gameId)) {
        return;
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return;
      }

      await removeProjectBookmark(supabase, user.id, gameId);
      setUserEngagement((prev) => ({
        ...prev,
        bookmarkedProjectIds: prev.bookmarkedProjectIds.filter((id) => id !== gameId),
      }));
    },
    [user, isBookmarked],
  );

  const resolveEngagementGameById = useCallback(
    (id: string): Game | undefined => {
      const submitted = getSubmittedGameById(id);
      if (submitted) {
        return mergeGameWithExtras(submitted);
      }
      if (shouldHideV0MockContent()) {
        return undefined;
      }
      const mock = getMockGameById(id);
      return mock ? mergeGameWithExtras(mock) : undefined;
    },
    [getSubmittedGameById],
  );

  const getBookmarkedGames = useCallback(() => {
    return userEngagement.bookmarkedProjectIds
      .map((id) => resolveEngagementGameById(id))
      .filter((game): game is Game => game !== undefined);
  }, [userEngagement.bookmarkedProjectIds, resolveEngagementGameById]);

  const resolveEngagementGames = useCallback(
    (projectIds: string[]) =>
      projectIds
        .map((id) => resolveEngagementGameById(id))
        .filter((game): game is Game => game !== undefined),
    [resolveEngagementGameById],
  );

  const getSupportedGames = useCallback(
    () => resolveEngagementGames(userEngagement.supportedProjectIds),
    [resolveEngagementGames, userEngagement.supportedProjectIds],
  );

  const getWatchedGames = useCallback(
    () => resolveEngagementGames(userEngagement.watchedProjectIds),
    [resolveEngagementGames, userEngagement.watchedProjectIds],
  );

  const getPlayedGames = useCallback(
    () =>
      resolveEngagementGames([...userEngagement.playedProjectIds].reverse()),
    [resolveEngagementGames, userEngagement.playedProjectIds],
  );

  const isWatching = useCallback(
    (gameId: string) => userEngagement.watchedProjectIds.includes(gameId),
    [userEngagement.watchedProjectIds],
  );

  const watchGame = useCallback(
    async (gameId: string) => {
      if (!user || isWatching(gameId)) {
        return;
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return;
      }

      await addProjectWatch(supabase, user.id, gameId);
      setUserEngagement((prev) => ({
        ...prev,
        watchedProjectIds: [...prev.watchedProjectIds, gameId],
      }));
    },
    [user, isWatching],
  );

  const unwatchGame = useCallback(
    async (gameId: string) => {
      if (!user || !isWatching(gameId)) {
        return;
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return;
      }

      await removeProjectWatch(supabase, user.id, gameId);
      setUserEngagement((prev) => ({
        ...prev,
        watchedProjectIds: prev.watchedProjectIds.filter((id) => id !== gameId),
      }));
    },
    [user, isWatching],
  );

  const getDevlogsByProject = useCallback(
    (projectId: string) =>
      sortDevlogsNewestFirst(
        devlogs.filter((entry) => entry.projectId === projectId),
      ),
    [devlogs],
  );

  const hasDevlogs = useCallback(
    (projectId: string) =>
      devlogs.some((entry) => entry.projectId === projectId),
    [devlogs],
  );

  const getReleaseEventsForProject = useCallback(
    (projectId: string) =>
      releaseEvents.filter((event) => event.projectId === projectId),
    [releaseEvents],
  );

  const declareProjectReleased = useCallback(
    async (projectId: string, note?: string) => {
      if (!user || !isProjectOwner(projectId, user.id)) {
        throw new Error("Owner only");
      }

      const game = getSubmittedGameById(projectId);
      const validation = validateReleasedDeclaration({
        devlogCount: getDevlogsByProject(projectId).length,
        playableVersion: game?.playableVersion,
        currentStatus: game?.releaseStatus ?? "in_development",
      });

      if (!validation.ok) {
        throw new Error(validation.reason);
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const event = await insertProjectReleaseEvent(supabase, {
        projectId,
        eventType: "released",
        actorUserId: user.id,
        note,
      });

      setReleaseEvents((prev) => [...prev, event]);
      setSubmittedGames((prev) =>
        prev.map((entry) =>
          entry.id === projectId ? { ...entry, releaseStatus: "released" } : entry,
        ),
      );
    },
    [getDevlogsByProject, getSubmittedGameById, isProjectOwner, user],
  );

  const declareProjectReleaseReopened = useCallback(
    async (projectId: string, note?: string) => {
      if (!user || !isProjectOwner(projectId, user.id)) {
        throw new Error("Owner only");
      }

      const game = getSubmittedGameById(projectId);
      const validation = validateReleaseReopenedDeclaration({
        currentStatus: game?.releaseStatus ?? "in_development",
      });

      if (!validation.ok) {
        throw new Error(validation.reason);
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const event = await insertProjectReleaseEvent(supabase, {
        projectId,
        eventType: "release_reopened",
        actorUserId: user.id,
        note,
      });

      setReleaseEvents((prev) => [...prev, event]);
      setSubmittedGames((prev) =>
        prev.map((entry) =>
          entry.id === projectId
            ? { ...entry, releaseStatus: "release_reopened" }
            : entry,
        ),
      );
    },
    [getSubmittedGameById, isProjectOwner, user],
  );

  const addDevlog = useCallback(
    async (
      projectId: string,
      title: string,
      content: string,
      options?: {
        publishPlayableVersion?: string;
        confirmationRequest?: ConfirmationRequestDraft;
      },
    ) => {
      if (!user) {
        throw new Error("Login required");
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const game = getSubmittedGameById(projectId) ?? getMockGameById(projectId);
      const projectTitle = game?.title ?? "作品";
      const publishVersion = options?.publishPlayableVersion?.trim();

      const entry = await insertProjectDevlog(
        supabase,
        user.id,
        projectId,
        title,
        content,
        publishVersion
          ? { publishedVersion: publishVersion }
          : undefined,
      );
      setDevlogs((prev) => [entry, ...prev]);

      const confirmationDraft = options?.confirmationRequest;
      const persistConfirmation =
        confirmationDraft && shouldPersistConfirmationRequest(confirmationDraft);

      let confirmationRecord = null;
      if (persistConfirmation && confirmationDraft) {
        confirmationRecord = await insertConfirmationRequest(supabase, {
          devlogId: entry.id,
          projectId,
          publishedVersion: publishVersion ?? null,
          draft: confirmationDraft,
        });
      }

      if (publishVersion && isSubmittedGame(projectId)) {
        const updated = await updateProjectPlayableVersion(
          supabase,
          projectId,
          publishVersion,
        );
        setSubmittedGames((prev) =>
          prev.map((item) =>
            item.id === projectId
              ? mergeGameWithExtras(updated)
              : item,
          ),
        );
        invokeAdoptionMatcherAfterPublish(entry.id);
      }

      const hasConfirmationPayload =
        confirmationDraft && hasConfirmationRequestContent(confirmationDraft);
      const useConfirmationNotifications =
        Boolean(confirmationRecord) &&
        confirmationDraft?.notifyEnabled !== false &&
        hasConfirmationPayload;

      if (useConfirmationNotifications && confirmationRecord && confirmationDraft) {
        const recipientIds = (
          await fetchConfirmationNotifyRecipientIds(supabase, {
            projectId,
            notifyAudience: confirmationDraft.notifyAudience,
            versionKey: publishVersion ?? game?.playableVersion ?? null,
            linkedPriorityIds: linkedPriorityIds(confirmationDraft),
          })
        ).filter((recipientId) => recipientId !== user.id);

        const enabledRecipients = await filterUsersByPlayerNotificationPref(
          supabase,
          recipientIds,
          "watch-updates",
        );

        if (enabledRecipients.length > 0) {
          const message = createConfirmationRequestNotificationMessage(
            projectTitle,
            confirmationDraft,
          );
          await insertConfirmationRequestNotifications(supabase, {
            recipientUserIds: enabledRecipients,
            projectId,
            devlogId: entry.id,
            confirmationRequestId: confirmationRecord.id,
            publishedVersion: publishVersion ?? null,
            message,
          });
        }
        return;
      }

      if (confirmationDraft?.notifyEnabled === false) {
        return;
      }

      const watcherIds = await fetchWatcherUserIds(supabase, projectId);
      const recipientIds = watcherIds.filter((watcherId) => watcherId !== user.id);
      const enabledRecipients = await filterUsersByPlayerNotificationPref(
        supabase,
        recipientIds,
        "watch-updates",
      );

      if (enabledRecipients.length === 0) {
        return;
      }

      if (publishVersion) {
        const message = createVersionPublishedMessage(projectTitle, publishVersion);
        await insertVersionPublishedNotifications(supabase, {
          recipientUserIds: enabledRecipients,
          projectId,
          devlogId: entry.id,
          publishedVersion: publishVersion,
          message,
        });
        return;
      }

      const message = createNotificationMessage("devlog", projectTitle);
      await insertDevlogNotifications(supabase, {
        recipientUserIds: enabledRecipients,
        projectId,
        devlogId: entry.id,
        message,
      });
    },
    [user, getSubmittedGameById, isSubmittedGame],
  );

  const getDeveloperProfileByUserId = useCallback(
    (userId: string) =>
      findDeveloperProfileByUserId(developerProfiles, userId),
    [developerProfiles],
  );

  const getDeveloperProfileByRouteId = useCallback(
    (routeId: string) =>
      findDeveloperProfileByRouteId(developerProfiles, routeId),
    [developerProfiles],
  );

  const saveDeveloperProfile = useCallback(
    async (userId: string, input: DeveloperProfileInput) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const profile = await upsertDeveloperProfile(supabase, userId, input);
      setDeveloperProfiles((prev) => [
        ...prev.filter((item) => item.userId !== userId),
        profile,
      ]);
      return profile;
    },
    [],
  );

  const syncOwnedProjectDisplayNames = useCallback(
    async (userId: string, displayName: string) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const trimmed = displayName.trim();
      if (!trimmed) {
        return;
      }

      await updateProjectsOwnerDisplayName(supabase, userId, trimmed);
      setSubmittedGames((prev) =>
        prev.map((game) =>
          game.ownerId === userId
            ? { ...game, ownerName: trimmed, creator: trimmed }
            : game,
        ),
      );
    },
    [],
  );

  const getCreatorIdForName = useCallback(
    (name: string) => {
      const stored = findDeveloperProfileByPublicName(developerProfiles, name);
      if (stored) {
        return stored.creatorId;
      }

      return getMockCreatorId(name);
    },
    [developerProfiles],
  );

  const resolveCreatorById = useCallback(
    (id: string) => {
      const stored = findDeveloperProfileByRouteId(developerProfiles, id);
      if (stored) {
        return {
          id: stored.creatorId,
          name: stored.publicName,
          profile: stored.profile,
          xAccount: stored.xAccount,
          website: stored.website,
        };
      }

      return getMockCreatorById(id);
    },
    [developerProfiles],
  );

  const value = useMemo(
    () => ({
      submittedGames,
      publicGames,
      publicCatalogReady,
      dataReady: authHydrated && catalogReady,
      devlogsReady,
      addSubmittedGame,
      createInitialProjectDevlog,
      updateSubmittedGame,
      updateProjectDetails,
      updateProjectOverview,
      deleteSubmittedGame,
      getSubmittedGameById,
      getOwnedProjectById,
      getGameById,
      getGamesBySection,
      getSupportCount,
      isSupported,
      supportGame,
      hasPlayedGame,
      recordPlay,
      submitProjectFeedback,
      getMyFeedbackForProject,
      getNewPlayableVersionBannerState,
      getChangeCheckState,
      loadHelpfulMarksForProject,
      getHelpfulMarksForProject,
      toggleFeedbackHelpful,
      getProjectFeedback,
      getOwnedProjectFeedback,
      getOwnedProjectVoiceSignals,
      getVersionPrompts,
      getDeveloperVersionPrompts,
      saveDeveloperVersionPrompts: saveDeveloperVersionPromptsFn,
      getMyVoiceResponses,
      submitVoiceResponses,
      getPublicVoiceAggregates,
      getOwnerVoiceAggregates,
      getOwnerVoiceResponseDetails,
      getOwnerStudioVoiceResponseCount,
      getApplicantCount,
      incrementApplicantCount,
      isSubmittedGame,
      isProjectOwner,
      getOwnedProjects,
      getStudioMypageOwnedProjects,
      getGamesByCreator,
      getFollowerCount,
      refreshFollowerCount,
      isFollowing,
      toggleFollowCreator,
      getFollowedDevelopers,
      isBookmarked,
      bookmarkGame,
      unbookmarkGame,
      getBookmarkedGames,
      getPlayedGames,
      getSupportedGames,
      getWatchedGames,
      isWatching,
      watchGame,
      unwatchGame,
      getDevlogsByProject,
      getReleaseEventsForProject,
      declareProjectReleased,
      declareProjectReleaseReopened,
      hasDevlogs,
      addDevlog,
      getNotifications,
      getUnreadNotificationCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      addNotification,
      reloadNotifications,
      reloadFromStorage,
      getDeveloperProfileByUserId,
      getDeveloperProfileByRouteId,
      saveDeveloperProfile,
      syncOwnedProjectDisplayNames,
      getCreatorIdForName,
      resolveCreatorById,
    }),
  [
      submittedGames,
      publicGames,
      publicCatalogReady,
      authHydrated,
      catalogReady,
      devlogsReady,
      hydrated,
      addSubmittedGame,
      createInitialProjectDevlog,
      updateSubmittedGame,
      updateProjectDetails,
      updateProjectOverview,
      deleteSubmittedGame,
      getSubmittedGameById,
      getOwnedProjectById,
      getGameById,
      getGamesBySection,
      getSupportCount,
      isSupported,
      supportGame,
      hasPlayedGame,
      recordPlay,
      submitProjectFeedback,
      getMyFeedbackForProject,
      getNewPlayableVersionBannerState,
      getChangeCheckState,
      loadHelpfulMarksForProject,
      getHelpfulMarksForProject,
      toggleFeedbackHelpful,
      getProjectFeedback,
      getOwnedProjectFeedback,
      getOwnedProjectVoiceSignals,
      getVersionPrompts,
      getDeveloperVersionPrompts,
      saveDeveloperVersionPromptsFn,
      getMyVoiceResponses,
      submitVoiceResponses,
      getPublicVoiceAggregates,
      getOwnerVoiceAggregates,
      getOwnerVoiceResponseDetails,
      getOwnerStudioVoiceResponseCount,
      getApplicantCount,
      incrementApplicantCount,
      isSubmittedGame,
      isProjectOwner,
      getOwnedProjects,
      getStudioMypageOwnedProjects,
      getGamesByCreator,
      getFollowerCount,
      refreshFollowerCount,
      isFollowing,
      toggleFollowCreator,
      getFollowedDevelopers,
      isBookmarked,
      bookmarkGame,
      unbookmarkGame,
      getBookmarkedGames,
      getPlayedGames,
      getSupportedGames,
      getWatchedGames,
      isWatching,
      watchGame,
      unwatchGame,
      getDevlogsByProject,
      getReleaseEventsForProject,
      declareProjectReleased,
      declareProjectReleaseReopened,
      hasDevlogs,
      addDevlog,
      getNotifications,
      getUnreadNotificationCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      addNotification,
      reloadNotifications,
      reloadFromStorage,
      getDeveloperProfileByUserId,
      getDeveloperProfileByRouteId,
      saveDeveloperProfile,
      syncOwnedProjectDisplayNames,
      getCreatorIdForName,
      resolveCreatorById,
    ],
  );

  return (
    <GamesContext.Provider value={value}>{children}</GamesContext.Provider>
  );
}

export function useGames() {
  const context = useContext(GamesContext);
  if (!context) {
    throw new Error("useGames must be used within a GamesProvider");
  }
  return context;
}
