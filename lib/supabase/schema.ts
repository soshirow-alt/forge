export type ProjectRow = {
  id: string;
  owner_id: string;
  owner_name: string;
  title: string;
  creator: string;
  genre: string;
  description: string;
  overview_introduction?: string | null;
  overview_features?: unknown;
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
  x_url?: string | null;
  youtube_url?: string | null;
  visibility: "public" | "private";
  playable_version?: string;
  release_status?: "in_development" | "released" | "release_reopened";
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
  other_notes: string | null;
  focus_response: string | null;
  would_replay: "yes" | "maybe" | "no" | null;
  version_key: string;
  updated_at: string | null;
  created_at: string;
};

export type ProjectDevlogRow = {
  id: string;
  project_id: string;
  author_id: string;
  title: string;
  content: string;
  published_version: string | null;
  published_at?: string | null;
  content_hash?: string | null;
  created_at: string;
};

export type VoiceAdoptionMatcherRunRow = {
  id: string;
  devlog_id: string;
  project_id: string;
  trigger_type: "devlog_published" | "backfill" | "model_upgrade";
  trigger_version: string;
  status: "queued" | "running" | "completed" | "failed" | "skipped";
  candidate_count: number;
  evaluated_count: number;
  adopted_count: number;
  skipped_below_threshold: number;
  devlog_content_hash: string | null;
  model: string;
  prompt_version: string;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type VoiceAdoptionRow = {
  id: string;
  project_id: string;
  user_id: string;
  voice_response_id: string;
  devlog_id: string;
  voice_version_key: string;
  published_version: string;
  player_quote: string;
  update_summary: string;
  prompt_text: string | null;
  confidence: number;
  model: string;
  model_version: string | null;
  matcher_run_id: string;
  status: "active" | "suppressed";
  suppression_reason: "player_dispute" | "devlog_retracted" | "admin" | null;
  created_at: string;
  updated_at: string;
};

export type VoiceAdoptionDisputeRow = {
  id: string;
  adoption_id: string;
  user_id: string;
  note: string | null;
  created_at: string;
};

export type UserNotificationRow = {
  id: string;
  user_id: string;
  type: "devlog" | "version_published";
  project_id: string;
  devlog_id: string | null;
  published_version: string | null;
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
