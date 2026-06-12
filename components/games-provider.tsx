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
import {
  getGameById as getMockGameById,
  getGamesBySection as getMockGamesBySection,
  games as mockGames,
  type Game,
} from "@/lib/mock-games";
import { mergeTagsWithRecruitment } from "@/lib/game-tags";
import { isGamePublic } from "@/lib/project-visibility";
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
  createDeveloperProfile,
  loadDeveloperProfiles,
  findDeveloperProfileByUserId,
  findDeveloperProfileByCreatorId,
  findDeveloperProfileByPublicName,
  type DeveloperProfile,
  type DeveloperProfileInput,
  DEVELOPER_PROFILES_STORAGE_KEY,
} from "@/lib/developer-profiles";
import {
  getCreatorById as getMockCreatorById,
  getCreatorId as getMockCreatorId,
  type Creator,
} from "@/lib/creators";

const GAMES_STORAGE_KEY = "forge-submitted-games";
const SUPPORT_STORAGE_KEY = "forge-support-counts";
const APPLICANT_STORAGE_KEY = "forge-applicant-counts";
const FOLLOWERS_STORAGE_KEY = "forge-follower-counts";
const FOLLOWING_STORAGE_KEY = "forge-following-creators";
const BOOKMARKS_STORAGE_KEY = "forge-bookmarks";
const DEVLOGS_STORAGE_KEY = "forge-devlogs";
const NOTIFICATIONS_STORAGE_KEY = "forge-notifications";

export type SubmitFormData = {
  title: string;
  creator: string;
  genre: string;
  description: string;
  phase: string;
  thumbnailUrl?: string;
  lookingForTesters: boolean;
  testerSlots?: number;
  tags: string[];
  playUrl: string;
  steamUrl?: string;
  itchUrl?: string;
  githubUrl?: string;
  discordUrl?: string;
  officialUrl?: string;
};

export type ProjectEditFormData = {
  title: string;
  genre: string;
  description: string;
  tags: string[];
  lookingForTesters: boolean;
  testerSlots?: number;
  thumbnailUrl?: string;
  steamUrl?: string;
  itchUrl?: string;
  githubUrl?: string;
  discordUrl?: string;
  officialUrl?: string;
  visibility: "public" | "private";
};

type Counts = Record<string, number>;

type GamesContextValue = {
  submittedGames: Game[];
  addSubmittedGame: (
    data: SubmitFormData,
    owner: { ownerId: string; ownerName: string },
  ) => Game;
  updateSubmittedGame: (id: string, data: SubmitFormData) => void;
  updateProjectDetails: (id: string, data: ProjectEditFormData) => void;
  deleteSubmittedGame: (id: string) => void;
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
  getDevlogsByProject: (projectId: string) => DevlogEntry[];
  hasDevlogs: (projectId: string) => boolean;
  addDevlog: (projectId: string, title: string, content: string) => void;
  getNotifications: () => Notification[];
  getUnreadNotificationCount: () => number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (type: NotificationType, projectId: string) => void;
  reloadFromStorage: () => void;
  getDeveloperProfileByUserId: (userId: string) => DeveloperProfile | undefined;
  saveDeveloperProfile: (
    userId: string,
    input: DeveloperProfileInput,
  ) => DeveloperProfile;
  getCreatorIdForName: (name: string) => string;
  resolveCreatorById: (id: string) => Creator;
};

const GamesContext = createContext<GamesContextValue | null>(null);

function loadSubmittedGames(): Game[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(GAMES_STORAGE_KEY);
    const games = stored ? (JSON.parse(stored) as Game[]) : [];
    return games.map((game) => ({
      ...game,
      tags: game.tags ?? [],
      playUrl: game.playUrl ?? "https://example.com",
      visibility: game.visibility ?? "public",
    }));
  } catch {
    return [];
  }
}

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
  const [submittedGames, setSubmittedGames] = useState<Game[]>([]);
  const [supportCounts, setSupportCounts] = useState<Counts>({});
  const [applicantCounts, setApplicantCounts] = useState<Counts>({});
  const [followerCounts, setFollowerCounts] = useState<Counts>({});
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [bookmarkedGameIds, setBookmarkedGameIds] = useState<string[]>([]);
  const [devlogs, setDevlogs] = useState<DevlogEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [developerProfiles, setDeveloperProfiles] = useState<DeveloperProfile[]>(
    [],
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSubmittedGames(loadSubmittedGames());
    setSupportCounts(loadCounts(SUPPORT_STORAGE_KEY));
    setApplicantCounts(loadCounts(APPLICANT_STORAGE_KEY));
    setFollowerCounts(loadCounts(FOLLOWERS_STORAGE_KEY));
    setFollowedCreators(loadFollowing());
    setBookmarkedGameIds(loadBookmarks());
    setDevlogs(loadDevlogs());
    setNotifications(loadNotifications());
    setDeveloperProfiles(loadDeveloperProfiles());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(submittedGames));
  }, [submittedGames, hydrated]);

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

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(
      DEVELOPER_PROFILES_STORAGE_KEY,
      JSON.stringify(developerProfiles),
    );
  }, [developerProfiles, hydrated]);

  const addSubmittedGame = useCallback(
    (
      data: SubmitFormData,
      owner: { ownerId: string; ownerName: string },
    ) => {
      const game: Game = {
        id: `user-${Date.now()}`,
        title: data.title,
        creator: data.creator,
        genre: data.genre,
        description: data.description,
        phase: data.phase,
        status: data.lookingForTesters ? "テスター募集中" : data.phase,
        lookingForTesters: data.lookingForTesters,
        testerSlots: data.lookingForTesters ? data.testerSlots : undefined,
        lastUpdated: new Date().toISOString().split("T")[0],
        section: "new",
        thumbnailUrl: data.thumbnailUrl,
        tags: mergeTagsWithRecruitment(data.tags, data.lookingForTesters),
        playUrl: data.playUrl,
        steamUrl: data.steamUrl || undefined,
        itchUrl: data.itchUrl || undefined,
        githubUrl: data.githubUrl || undefined,
        discordUrl: data.discordUrl || undefined,
        officialUrl: data.officialUrl || undefined,
        ownerId: owner.ownerId,
        ownerName: owner.ownerName,
        visibility: "public",
      };

      setSubmittedGames((prev) => [game, ...prev]);
      return game;
    },
    [],
  );

  const updateSubmittedGame = useCallback((id: string, data: SubmitFormData) => {
    setSubmittedGames((prev) =>
      prev.map((game) =>
        game.id === id
          ? {
              ...game,
              title: data.title,
              creator: data.creator,
              genre: data.genre,
              description: data.description,
              phase: data.phase,
              status: data.lookingForTesters ? "テスター募集中" : data.phase,
              lookingForTesters: data.lookingForTesters,
              testerSlots: data.lookingForTesters ? data.testerSlots : undefined,
              thumbnailUrl: data.thumbnailUrl ?? game.thumbnailUrl,
              lastUpdated: new Date().toISOString().split("T")[0],
              tags: mergeTagsWithRecruitment(data.tags, data.lookingForTesters),
              playUrl: data.playUrl,
              steamUrl: data.steamUrl || undefined,
              itchUrl: data.itchUrl || undefined,
              githubUrl: data.githubUrl || undefined,
              discordUrl: data.discordUrl || undefined,
              officialUrl: data.officialUrl || undefined,
            }
          : game,
      ),
    );
  }, []);

  const updateProjectDetails = useCallback(
    (id: string, data: ProjectEditFormData) => {
      setSubmittedGames((prev) =>
        prev.map((game) =>
          game.id === id
            ? {
                ...game,
                title: data.title,
                genre: data.genre,
                description: data.description,
                status: data.lookingForTesters ? "テスター募集中" : game.phase,
                lookingForTesters: data.lookingForTesters,
                testerSlots: data.lookingForTesters ? data.testerSlots : undefined,
                thumbnailUrl: data.thumbnailUrl ?? game.thumbnailUrl,
                lastUpdated: new Date().toISOString().split("T")[0],
                tags: mergeTagsWithRecruitment(data.tags, data.lookingForTesters),
                steamUrl: data.steamUrl || undefined,
                itchUrl: data.itchUrl || undefined,
                githubUrl: data.githubUrl || undefined,
                discordUrl: data.discordUrl || undefined,
                officialUrl: data.officialUrl || undefined,
                visibility: data.visibility,
              }
            : game,
        ),
      );
    },
    [],
  );

  const deleteSubmittedGame = useCallback((id: string) => {
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
      return getSubmittedGameById(id) ?? getMockGameById(id);
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
      .filter((game): game is Game => game !== undefined);
  }, [bookmarkedGameIds, getSubmittedGameById]);

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

  const reloadFromStorage = useCallback(() => {
    setSubmittedGames(loadSubmittedGames());
    setSupportCounts(loadCounts(SUPPORT_STORAGE_KEY));
    setApplicantCounts(loadCounts(APPLICANT_STORAGE_KEY));
    setFollowerCounts(loadCounts(FOLLOWERS_STORAGE_KEY));
    setFollowedCreators(loadFollowing());
    setBookmarkedGameIds(loadBookmarks());
    setDevlogs(loadDevlogs());
    setNotifications(loadNotifications());
    setDeveloperProfiles(loadDeveloperProfiles());
  }, []);

  const getDeveloperProfileByUserId = useCallback(
    (userId: string) =>
      findDeveloperProfileByUserId(developerProfiles, userId),
    [developerProfiles],
  );

  const saveDeveloperProfile = useCallback(
    (userId: string, input: DeveloperProfileInput) => {
      const profile = createDeveloperProfile(userId, input);
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
