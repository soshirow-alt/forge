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
  mockDevlogs,
  sortDevlogsNewestFirst,
  type DevlogEntry,
} from "@/lib/devlogs";
import {
  createNotificationMessage,
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
} from "@/lib/supabase/projects";

const SUPPORT_STORAGE_KEY = "forge-support-counts";
const APPLICANT_STORAGE_KEY = "forge-applicant-counts";
const FOLLOWERS_STORAGE_KEY = "forge-follower-counts";
const FOLLOWING_STORAGE_KEY = "forge-following-creators";
const BOOKMARKS_STORAGE_KEY = "forge-bookmarks";
const WATCHED_STORAGE_KEY = "forge-watched-games";
const DEVLOGS_STORAGE_KEY = "forge-devlogs";
const NOTIFICATIONS_STORAGE_KEY = "forge-notifications";

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
  incrementSupportCount: (id: string, defaultCount?: number) => number;
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
  isWatching: (gameId: string) => boolean;
  watchGame: (gameId: string) => void;
  unwatchGame: (gameId: string) => void;
  getDevlogsByProject: (projectId: string) => DevlogEntry[];
  hasDevlogs: (projectId: string) => boolean;
  addDevlog: (projectId: string, title: string, content: string) => void;
  getNotifications: () => Notification[];
  getUnreadNotificationCount: () => number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (type: NotificationType, projectId: string) => void;
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

function loadDevlogs(): DevlogEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(DEVLOGS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as DevlogEntry[]) : mockDevlogs;
  } catch {
    return mockDevlogs;
  }
}

function loadBookmarks(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

function loadWatchedGames(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(WATCHED_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

function loadNotifications(): Notification[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notifications = stored ? (JSON.parse(stored) as Notification[]) : [];
    return notifications.map((notification) => ({
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
  const [applicantCounts, setApplicantCounts] = useState<Counts>({});
  const [followerCounts, setFollowerCounts] = useState<Counts>({});
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [bookmarkedGameIds, setBookmarkedGameIds] = useState<string[]>([]);
  const [watchedGameIds, setWatchedGameIds] = useState<string[]>([]);
  const [devlogs, setDevlogs] = useState<DevlogEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
    setSupportCounts(loadCounts(SUPPORT_STORAGE_KEY));
    setApplicantCounts(loadCounts(APPLICANT_STORAGE_KEY));
    setFollowerCounts(loadCounts(FOLLOWERS_STORAGE_KEY));
    setFollowedCreators(loadFollowing());
    setBookmarkedGameIds(loadBookmarks());
    setWatchedGameIds(loadWatchedGames());
    setDevlogs(loadDevlogs());
    setNotifications(loadNotifications());
    setHydrated(true);
  }, []);

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

    localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(supportCounts));
  }, [supportCounts, hydrated]);

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

    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedGameIds));
  }, [bookmarkedGameIds, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify(watchedGameIds));
  }, [watchedGameIds, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(DEVLOGS_STORAGE_KEY, JSON.stringify(devlogs));
  }, [devlogs, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notifications),
    );
  }, [notifications, hydrated]);

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
    setBookmarkedGameIds((prev) => prev.filter((gameId) => gameId !== id));
    setDevlogs((prev) => prev.filter((entry) => entry.projectId !== id));
    setNotifications((prev) => prev.filter((entry) => entry.projectId !== id));
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

      setNotifications((prev) => [notification, ...prev]);
    },
    [getSubmittedGameById],
  );

  const getNotifications = useCallback(
    () => sortNotificationsNewestFirst(notifications),
    [notifications],
  );

  const getUnreadNotificationCount = useCallback(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
  }, []);

  const getGamesBySection = useCallback(
    (section: Game["section"]) => {
      const publicSubmitted = submittedGames.filter(isGamePublic);

      if (section === "testers") {
        const submitted = publicSubmitted.filter((game) => game.lookingForTesters);
        const mock = getMockGamesBySection("testers").filter(
          (game) => game.lookingForTesters,
        );
        return [...submitted, ...mock];
      }

      if (section === "new") {
        const submitted = publicSubmitted.filter((game) => !game.lookingForTesters);
        const mock = getMockGamesBySection("new");
        return [...submitted, ...mock];
      }

      return getMockGamesBySection(section);
    },
    [submittedGames],
  );

  const getSupportCount = useCallback(
    (id: string, defaultCount = 124) => supportCounts[id] ?? defaultCount,
    [supportCounts],
  );

  const incrementSupportCount = useCallback(
    (id: string, defaultCount = 124) => {
      const current = supportCounts[id] ?? defaultCount;
      const next = current + 1;
      setSupportCounts((prev) => ({ ...prev, [id]: next }));
      addNotification("support", id);
      return next;
    },
    [supportCounts, addNotification],
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
    (gameId: string) => bookmarkedGameIds.includes(gameId),
    [bookmarkedGameIds],
  );

  const bookmarkGame = useCallback((gameId: string) => {
    setBookmarkedGameIds((prev) =>
      prev.includes(gameId) ? prev : [...prev, gameId],
    );
  }, []);

  const getBookmarkedGames = useCallback(() => {
    return bookmarkedGameIds
      .map((id) => getSubmittedGameById(id) ?? getMockGameById(id))
      .filter((game): game is Game => game !== undefined)
      .map((game) => mergeGameWithExtras(game));
  }, [bookmarkedGameIds, getSubmittedGameById]);

  const isWatching = useCallback(
    (gameId: string) => watchedGameIds.includes(gameId),
    [watchedGameIds],
  );

  const watchGame = useCallback((gameId: string) => {
    setWatchedGameIds((prev) =>
      prev.includes(gameId) ? prev : [...prev, gameId],
    );
  }, []);

  const unwatchGame = useCallback((gameId: string) => {
    setWatchedGameIds((prev) => prev.filter((id) => id !== gameId));
  }, []);

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
    (projectId: string, title: string, content: string) => {
      const entry: DevlogEntry = {
        id: `devlog-${Date.now()}`,
        projectId,
        title,
        content,
        date: new Date().toISOString().split("T")[0],
      };

      setDevlogs((prev) => [entry, ...prev]);
      addNotification("devlog", projectId);
    },
    [addNotification],
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
      incrementSupportCount,
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
      incrementSupportCount,
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
