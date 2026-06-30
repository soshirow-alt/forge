import {
  devHintCards,
  studioActivities,
  type DevHintCard,
  type StudioActivityItem,
} from "@/lib/studio-home-v0-mock-data";
import {
  countStudioUnread,
  studioNotifications,
} from "@/lib/studio-notifications-v0-mock-data";
import {
  studioHomeGrowthRankings,
  type StudioDeveloperGrowthSnippet,
  type StudioWorkGrowthSnippet,
} from "@/lib/studio-rankings-v0-mock-data";

export type StudioHomeGrowthRankings = {
  witnessGrowthWorks: StudioWorkGrowthSnippet[];
  feedbackGrowthWorks: StudioWorkGrowthSnippet[];
  followerGrowthDevelopers: StudioDeveloperGrowthSnippet[];
};

export type StudioHomeRecentActivitySectionVM = {
  id: "recent-activity";
  status: "hidden" | "content";
  headerTitle: string;
  headerHref: string;
  activities: StudioActivityItem[];
};

export type StudioHomeWeeklyGrowthSectionVM =
  | {
      id: "weekly-growth";
      status: "coming-soon";
      comingSoonTitle: string;
      comingSoonDescription: string;
    }
  | {
      id: "weekly-growth";
      status: "content";
      rankings: StudioHomeGrowthRankings;
    };

export type StudioHomeDevHintsSectionVM = {
  id: "dev-hints";
  status: "content";
  cards: DevHintCard[];
};

export type StudioHomeSectionVM =
  | StudioHomeRecentActivitySectionVM
  | StudioHomeWeeklyGrowthSectionVM
  | StudioHomeDevHintsSectionVM;

export type StudioHomeViewModel = {
  notificationBadge: number;
  sections: StudioHomeSectionVM[];
};

const WEEKLY_GROWTH_COMING_SOON_DESCRIPTION =
  "週次ランキングの集計・表示は Coming Soon です。";

export function buildStudioHomeViewModel(hideV0Mock: boolean): StudioHomeViewModel {
  const notificationBadge = hideV0Mock ? 0 : countStudioUnread(studioNotifications);

  const recentActivity: StudioHomeRecentActivitySectionVM = {
    id: "recent-activity",
    status: hideV0Mock ? "hidden" : "content",
    headerTitle: "最近の動き",
    headerHref: "/studio/notifications",
    activities: studioActivities,
  };

  const weeklyGrowth: StudioHomeWeeklyGrowthSectionVM = hideV0Mock
    ? {
        id: "weekly-growth",
        status: "coming-soon",
        comingSoonTitle: "今週の伸び",
        comingSoonDescription: WEEKLY_GROWTH_COMING_SOON_DESCRIPTION,
      }
    : {
        id: "weekly-growth",
        status: "content",
        rankings: studioHomeGrowthRankings,
      };

  const devHints: StudioHomeDevHintsSectionVM = {
    id: "dev-hints",
    status: "content",
    cards: devHintCards,
  };

  return {
    notificationBadge,
    sections: [recentActivity, weeklyGrowth, devHints],
  };
}
