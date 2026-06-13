export type ProjectRow = {
  id: string;
  owner_id: string;
  owner_name: string;
  title: string;
  creator: string;
  genre: string;
  description: string;
  phase: string;
  status: string;
  looking_for_testers: boolean;
  tester_slots: number | null;
  section: "new" | "testers" | "beta";
  thumbnail_url: string | null;
  tags: string[];
  play_url: string;
  steam_url: string | null;
  itch_url: string | null;
  github_url: string | null;
  discord_url: string | null;
  official_url: string | null;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
};

export type ProjectSupportRow = {
  user_id: string;
  project_id: string;
  created_at: string;
};

export type ProjectBookmarkRow = {
  user_id: string;
  project_id: string;
  created_at: string;
};

export type ProjectWatchRow = {
  user_id: string;
  project_id: string;
  created_at: string;
};

export type ProjectPlayRow = {
  user_id: string;
  project_id: string;
  created_at: string;
};

export type ProjectFeedbackRow = {
  id: string;
  user_id: string;
  project_id: string;
  good_points: string | null;
  concerns: string | null;
  bugs: string | null;
  focus_response: string | null;
  would_replay: "yes" | "maybe" | "no" | null;
  created_at: string;
};

export type ProjectDevlogRow = {
  id: string;
  project_id: string;
  author_id: string;
  title: string;
  content: string;
  created_at: string;
};

export type UserNotificationRow = {
  id: string;
  user_id: string;
  type: "devlog";
  project_id: string;
  devlog_id: string | null;
  message: string;
  read_at: string | null;
  created_at: string;
};

export type DeveloperProfileRow = {
  user_id: string;
  creator_id: string;
  public_name: string;
  profile: string;
  x_account: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
};
