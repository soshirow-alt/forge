"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
export type { ProjectEditFormData, SubmitFormData } from "@/lib/project-form";
import {
  sortDevlogsNewestFirst,
  type DevlogEntry,
} from "@/lib/devlogs";
import {
  createNotificationMessage,
  createVersionPublishedMessage,
  sortNotificationsNewestFirst,
  type Notification,
  type NotificationType,
} from "@/lib/notifications";
import {
  findDeveloperProfileByUserId,
  findDeveloperProfileByCreatorId,
  findDeveloperProfileByPublicName,
  type DeveloperProfile,
  type DeveloperProfileInput,
} from "@/lib/developer-profiles";
import {
  getCreatorById as getMockCreatorById,
  getCreatorId as getMockCreatorId,
  type Creator,
} from "@/lib/creators";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { mergeGameWithExtras, saveGameExtra } from "@/lib/game-extra-storage";
import { upsertDeveloperProfile, fetchDeveloperProfiles } from "@/lib/supabase/developer-profiles-db";
import {
  deleteProjectInDb,
  fetchProjects,
  insertProject,
  updateProjectDetailsInDb,
  updateProjectFromSubmitForm,
  updateProjectPlayableVersion,
} from "@/lib/supabase/projects";
import { resolvePlayableVersion } from "@/lib/playable-version";

import {
  addProjectBookmark,
  addProjectSupport,
  addProjectWatch,
  fetchProjectFeedback,
  fetchFeedbackForProjects,
  fetchSupportCounts,
  fetchUserEngagement,
  fetchUserFeedbackForVersion,
  fetchUserLatestFeedbackVersionKey,
  insertProjectFeedback,
  recordProjectPlay,
  removeProjectWatch,
  updateProjectFeedback,
  type UserEngagementState,
} from "@/lib/supabase/user-engagement";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";
import type { GameFeedbackItem } from "@/lib/game-feedback-storage";
import {
  fetchOwnerVoiceAggregates,
  fetchPublicVoiceAggregates,
  fetchDeveloperVersionPrompts,
  fetchUserVoiceResponses as fetchUserVoiceResponsesDb,
  fetchVersionPrompts,
  saveDeveloperVersionPrompts,
  upsertVoiceResponses,
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
import {
  fetchUserNotifications,
  insertDevlogNotifications,
  insertVersionPublishedNotifications,
  isDatabaseNotificationId,
  markAllUserNotificationsAsRead,
  markUserNotificationAsRead,
  notificationRowToNotification,
} from "@/lib/supabase/user-notifications-db";

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

type GamesContextValue = {
  submittedGames: Game[];
  dataReady: boolean;
  addSubmittedGame: (
    data: SubmitFormData,
    owner: { ownerId: string; ownerName: string },
  ) => Promise<Game>;
  updateSubmittedGame: (id: string, data: SubmitFormData) => Promise<void>;
  updateProjectDetails: (id: string, data: ProjectEditFormData) => Promise<void>;
  deleteSubmittedGame: (id: string) => Promise<void>;
  getSubmittedGameById: (id: string) => Game | undefined;
  getGameById: (id: string) => Game | undefined;
  getGamesBySection: (section: Game["section"]) => Game[];
  getSupportCount: (id: string, defaultCount?: number) => number;
  isSupported: (gameId: string) => boolean;
  supportGame: (gameId: string) => Promise<void>;
  hasPlayedGame: (gameId: string) => boolean;
  recordPlay: (gameId: string) => Promise<void>;
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
  getProjectFeedback: (gameId: string) => Promise<GameFeedbackItem[]>;
  getOwnedProjectFeedback: (
    userId: string | undefined,
  ) => Promise<ProjectFeedbackEntry[]>;
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
  getApplicantCount: (id: string, defaultCount?: number) => number;
  incrementApplicantCount: (id: string, defaultCount?: number) => number;
  isSubmittedGame: (id: string) => boolean;
  isProjectOwner: (projectId: string, userId: string | undefined) => boolean;
  getOwnedProjects: (userId: string | undefined) => Game[];
  getGamesByCreator: (creatorName: string) => Game[];
  getFollowerCount: (creatorId: string, defaultCount?: number) => number;
  isFollowing: (creatorId: string) => boolean;
  followCreator: (creatorId: string) => void;
  isBookmarked: (gameId: string) => boolean;
  bookmarkGame: (gameId: string) => void;
  getBookmarkedGames: () => Game[];
  getSupportedGames: () => Game[];
  getWatchedGames: () => Game[];
  isWatching: (gameId: string) => boolean;
  watchGame: (gameId: string) => void;
  unwatchGame: (gameId: string) => void;
  getDevlogsByProject: (projectId: string) => DevlogEntry[];
  hasDevlogs: (projectId: string) => boolean;
  addDevlog: (
    projectId: string,
    title: string,
    content: string,
    options?: { publishPlayableVersion?: string },
  ) => Promise<void>;
  getNotifications: () => Notification[];
  getUnreadNotificationCount: () => number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (type: NotificationType, projectId: string) => void;
  reloadNotifications: () => Promise<void>;
  reloadFromStorage: () => Promise<void>;
  getDeveloperProfileByUserId: (userId: string) => DeveloperProfile | undefined;
  saveDeveloperProfile: (
    userId: string,
    input: DeveloperProfileInput,
  ) => Promise<DeveloperProfile>;
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
  const [submittedGames, setSubmittedGames] = useState<Game[]>([]);
  const [supportCounts, setSupportCounts] = useState<Counts>({});
  const [userEngagement, setUserEngagement] =
    useState<UserEngagementState>(EMPTY_USER_ENGAGEMENT);
  const [applicantCounts, setApplicantCounts] = useState<Counts>({});
  const [followerCounts, setFollowerCounts] = useState<Counts>({});
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [devlogs, setDevlogs] = useState<DevlogEntry[]>([]);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(
    [],
  );
  const [dbNotifications, setDbNotifications] = useState<Notification[]>([]);
  const [developerProfiles, setDeveloperProfiles] = useState<DeveloperProfile[]>(
    [],
  );
  const [hydrated, setHydrated] = useState(false);

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

  useEffect(() => {
    setApplicantCounts(loadCounts(APPLICANT_STORAGE_KEY));
    setFollowerCounts(loadCounts(FOLLOWERS_STORAGE_KEY));
    setFollowedCreators(loadFollowing());
    setLocalNotifications(loadLocalNotifications());
    setHydrated(true);

    const supabase = getOptionalSupabaseClient();
    if (supabase) {
      void fetchSupportCounts(supabase)
        .then(setSupportCounts)
        .catch(() => setSupportCounts({}));
      void fetchAllProjectDevlogs(supabase)
        .then(setDevlogs)
        .catch(() => setDevlogs([]));
    }
  }, []);

  useEffect(() => {
    if (!authHydrated) {
      return;
    }

    if (!user) {
      setUserEngagement(EMPTY_USER_ENGAGEMENT);
      setDbNotifications([]);
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      return;
    }

    void fetchUserEngagement(supabase, user.id)
      .then(setUserEngagement)
      .catch(() => setUserEngagement(EMPTY_USER_ENGAGEMENT));

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

    void reloadFromStorage().catch(() => {
      setSubmittedGames([]);
      setDeveloperProfiles([]);
    });
  }, [authHydrated, user?.id, reloadFromStorage]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(APPLICANT_STORAGE_KEY, JSON.stringify(applicantCounts));
  }, [applicantCounts, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(FOLLOWERS_STORAGE_KEY, JSON.stringify(followerCounts));
  }, [followerCounts, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(FOLLOWING_STORAGE_KEY, JSON.stringify(followedCreators));
  }, [followedCreators, hydrated]);

  useEffect(() => {
    if (!hydrated) {
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
      const enriched = mergeGameWithExtras({
        ...game,
        estimatedPlayTime: data.estimatedPlayTime,
        focusNotes: data.focusNotes,
      });
      if (data.estimatedPlayTime || data.focusNotes) {
        saveGameExtra(game.id, {
          estimatedPlayTime: data.estimatedPlayTime,
          focusNotes: data.focusNotes,
        });
      }
      setSubmittedGames((prev) => [
        enriched,
        ...prev.filter((item) => item.id !== game.id),
      ]);
      return enriched;
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
    },
    [],
  );

  const updateProjectDetails = useCallback(
    async (id: string, data: ProjectEditFormData) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const current = submittedGames.find((item) => item.id === id);
      const game = await updateProjectDetailsInDb(
        supabase,
        id,
        data,
        current?.phase ?? "",
      );
      setSubmittedGames((prev) =>
        prev.map((item) => (item.id === id ? game : item)),
      );
    },
    [submittedGames],
  );

  const deleteSubmittedGame = useCallback(async (id: string) => {
    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    await deleteProjectInDb(supabase, id);
    await deleteProjectDevlogsByProjectId(supabase, id);
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
  }, []);

  const getSubmittedGameById = useCallback(
    (id: string) => submittedGames.find((game) => game.id === id),
    [submittedGames],
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

  const getGameById = useCallback(
    (id: string) => {
      const game = getSubmittedGameById(id) ?? getMockGameById(id);
      return game ? mergeGameWithExtras(game) : undefined;
    },
    [getSubmittedGameById],
  );

  const addNotification = useCallback(
    (type: NotificationType, projectId: string) => {
      if (type === "devlog") {
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

  const getNotifications = useCallback(
    () =>
      sortNotificationsNewestFirst([...dbNotifications, ...localNotifications]),
    [dbNotifications, localNotifications],
  );

  const getUnreadNotificationCount = useCallback(
    () =>
      [...dbNotifications, ...localNotifications].filter(
        (notification) => !notification.read,
      ).length,
    [dbNotifications, localNotifications],
  );

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
    async (gameId: string) => {
      if (!user || hasPlayedGame(gameId)) {
        return;
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return;
      }

      await recordProjectPlay(supabase, user.id, gameId);
      setUserEngagement((prev) => ({
        ...prev,
        playedProjectIds: [...prev.playedProjectIds, gameId],
      }));
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

      if (!existing) {
        addNotification("feedback", gameId);
      }

      return item;
    },
    [user, addNotification, getSubmittedGameById],
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

      if (saved.length > 0) {
        addNotification("feedback", gameId);
      }

      return saved;
    },
    [user, addNotification],
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

      return fetchFeedbackForProjects(supabase, ownedIds);
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
    (creatorId: string, defaultCount = 0) =>
      followerCounts[creatorId] ?? defaultCount,
    [followerCounts],
  );

  const isFollowing = useCallback(
    (creatorId: string) => followedCreators.includes(creatorId),
    [followedCreators],
  );

  const followCreator = useCallback(
    (creatorId: string) => {
      if (followedCreators.includes(creatorId)) {
        return;
      }

      setFollowedCreators((prev) => [...prev, creatorId]);
      setFollowerCounts((prev) => ({
        ...prev,
        [creatorId]: (prev[creatorId] ?? 0) + 1,
      }));
    },
    [followedCreators],
  );

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

  const getBookmarkedGames = useCallback(() => {
    return userEngagement.bookmarkedProjectIds
      .map((id) => getSubmittedGameById(id) ?? getMockGameById(id))
      .filter((game): game is Game => game !== undefined)
      .map((game) => mergeGameWithExtras(game));
  }, [userEngagement.bookmarkedProjectIds, getSubmittedGameById]);

  const resolveEngagementGames = useCallback(
    (projectIds: string[]) =>
      projectIds
        .map((id) => getSubmittedGameById(id) ?? getMockGameById(id))
        .filter((game): game is Game => game !== undefined)
        .map((game) => mergeGameWithExtras(game)),
    [getSubmittedGameById],
  );

  const getSupportedGames = useCallback(
    () => resolveEngagementGames(userEngagement.supportedProjectIds),
    [resolveEngagementGames, userEngagement.supportedProjectIds],
  );

  const getWatchedGames = useCallback(
    () => resolveEngagementGames(userEngagement.watchedProjectIds),
    [resolveEngagementGames, userEngagement.watchedProjectIds],
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

  const addDevlog = useCallback(
    async (
      projectId: string,
      title: string,
      content: string,
      options?: { publishPlayableVersion?: string },
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
      }

      const watcherIds = await fetchWatcherUserIds(supabase, projectId);
      const recipientIds = watcherIds.filter((watcherId) => watcherId !== user.id);

      if (recipientIds.length === 0) {
        return;
      }

      if (publishVersion) {
        const message = createVersionPublishedMessage(projectTitle, publishVersion);
        await insertVersionPublishedNotifications(supabase, {
          recipientUserIds: recipientIds,
          projectId,
          devlogId: entry.id,
          publishedVersion: publishVersion,
          message,
        });
        return;
      }

      const message = createNotificationMessage("devlog", projectTitle);
      await insertDevlogNotifications(supabase, {
        recipientUserIds: recipientIds,
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
      const stored = findDeveloperProfileByCreatorId(developerProfiles, id);
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
      dataReady: hydrated,
      addSubmittedGame,
      updateSubmittedGame,
      updateProjectDetails,
      deleteSubmittedGame,
      getSubmittedGameById,
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
      getProjectFeedback,
      getOwnedProjectFeedback,
      getVersionPrompts,
      getDeveloperVersionPrompts,
      saveDeveloperVersionPrompts: saveDeveloperVersionPromptsFn,
      getMyVoiceResponses,
      submitVoiceResponses,
      getPublicVoiceAggregates,
      getOwnerVoiceAggregates,
      getApplicantCount,
      incrementApplicantCount,
      isSubmittedGame,
      isProjectOwner,
      getOwnedProjects,
      getGamesByCreator,
      getFollowerCount,
      isFollowing,
      followCreator,
      isBookmarked,
      bookmarkGame,
      getBookmarkedGames,
      getSupportedGames,
      getWatchedGames,
      isWatching,
      watchGame,
      unwatchGame,
      getDevlogsByProject,
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
      saveDeveloperProfile,
      getCreatorIdForName,
      resolveCreatorById,
    }),
    [
      submittedGames,
      hydrated,
      addSubmittedGame,
      updateSubmittedGame,
      updateProjectDetails,
      deleteSubmittedGame,
      getSubmittedGameById,
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
      getProjectFeedback,
      getOwnedProjectFeedback,
      getVersionPrompts,
      getDeveloperVersionPrompts,
      saveDeveloperVersionPromptsFn,
      getMyVoiceResponses,
      submitVoiceResponses,
      getPublicVoiceAggregates,
      getOwnerVoiceAggregates,
      getApplicantCount,
      incrementApplicantCount,
      isSubmittedGame,
      isProjectOwner,
      getOwnedProjects,
      getGamesByCreator,
      getFollowerCount,
      isFollowing,
      followCreator,
      isBookmarked,
      bookmarkGame,
      getBookmarkedGames,
      getSupportedGames,
      getWatchedGames,
      isWatching,
      watchGame,
      unwatchGame,
      getDevlogsByProject,
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
      saveDeveloperProfile,
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
