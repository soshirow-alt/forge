/**
 * /home/game must use Production featured-hero RPC (get_home_featured_hero)
 * soft-filtered to category=game — not the feedback-gathering shelf.
 * Updates/newest stay RPC-scoped with p_category=game.
 *
 * Usage: npx tsx scripts/verify-player-ia-game-home-category-filter.ts
 */
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchPlayerIaGameHome,
  fetchPlayerIaHome,
  type HomeMeaningfulUpdateRow,
  type HomeNewestProjectRow,
} from "../lib/supabase/player-ia-home-db";

const HERO_ROWS = [
  {
    featured_type: "reaction",
    slot_rank: 1,
    axis_rank: 1,
    project_id: "game-hero-1",
    owner_id: "owner-a",
    title: "Game Hero 1",
    description: "d",
    playable_version: "0.1",
    thumbnail_url: null,
    genre: "アクション",
    first_published_at: "2026-07-01T00:00:00Z",
    meaningful_update_at: null,
    update_kind: null,
    feedback_users_7d: 3,
    watchers_7d: 2,
    players_7d: 4,
    players_prev_7d: 1,
    player_delta_7d: 3,
    last_play_at: "2026-08-01T00:00:00Z",
    last_engagement_at: "2026-08-01T00:00:00Z",
    card_time_at: "2026-08-01T00:00:00Z",
    feedback_participant_count: 5,
    watch_count: 2,
  },
  {
    featured_type: "newest",
    slot_rank: 3,
    axis_rank: 1,
    project_id: "audio-hero-1",
    owner_id: "owner-b",
    title: "Audio Hero",
    description: "d",
    playable_version: "0.1",
    thumbnail_url: null,
    genre: null,
    first_published_at: "2026-08-01T00:00:00Z",
    meaningful_update_at: null,
    update_kind: null,
    feedback_users_7d: 0,
    watchers_7d: 0,
    players_7d: 0,
    players_prev_7d: 0,
    player_delta_7d: 0,
    last_play_at: null,
    last_engagement_at: null,
    card_time_at: "2026-08-01T00:00:00Z",
    feedback_participant_count: 0,
    watch_count: 0,
  },
  {
    featured_type: "updated",
    slot_rank: 4,
    axis_rank: 1,
    project_id: "game-hero-2",
    owner_id: "owner-c",
    title: "Game Hero 2",
    description: "d",
    playable_version: "0.2",
    thumbnail_url: null,
    genre: "パズル",
    first_published_at: "2026-06-01T00:00:00Z",
    meaningful_update_at: "2026-08-01T00:00:00Z",
    update_kind: "devlog",
    feedback_users_7d: 0,
    watchers_7d: 0,
    players_7d: 1,
    players_prev_7d: 0,
    player_delta_7d: 1,
    last_play_at: null,
    last_engagement_at: null,
    card_time_at: "2026-08-01T00:00:00Z",
    feedback_participant_count: 0,
    watch_count: 0,
  },
];

const GAME_UPDATE_ROWS: HomeMeaningfulUpdateRow[] = Array.from(
  { length: 6 },
  (_, i) => ({
    project_id: `game-up-${i}`,
    title: `Game Update ${i}`,
    category: "game",
    thumbnail_url: null,
    update_kind: "devlog",
    update_label: "開発ログ",
    update_summary: "summary",
    published_version: null,
    meaningful_update_at: "2026-08-01T00:00:00Z",
  }),
);

const AUDIO_ONLY_UPDATE_ROWS: HomeMeaningfulUpdateRow[] = Array.from(
  { length: 6 },
  (_, i) => ({
    project_id: `audio-up-${i}`,
    title: `Audio Update ${i}`,
    category: "audio",
    thumbnail_url: null,
    update_kind: "devlog",
    update_label: "開発ログ",
    update_summary: "summary",
    published_version: null,
    meaningful_update_at: "2026-08-01T00:00:00Z",
  }),
);

const NEWEST_ROWS: HomeNewestProjectRow[] = Array.from({ length: 4 }, (_, i) => ({
  project_id: `newest-${i}`,
  title: `Newest ${i}`,
  category: "game",
  description: "",
  thumbnail_url: null,
  first_published_at: "2026-08-01T00:00:00Z",
  creator: "Dev",
}));

const AUDIO_FEEDBACK_ROWS = Array.from({ length: 4 }, (_, i) => ({
  project_id: `audio-fb-${i}`,
  title: `Audio FB ${i}`,
  category: "audio",
  description: "",
  thumbnail_url: null,
  window_days: 30,
  distinct_author_count: 3,
  feedback_count: 5,
  has_creator_reply: false,
  last_feedback_at: "2026-08-01T00:00:00Z",
  empathy_count: 1,
}));

function createMockSupabase(options?: {
  statsFail?: boolean;
}): SupabaseClient {
  const rpc = async (fn: string, params: Record<string, unknown>) => {
    switch (fn) {
      case "get_home_featured_hero":
        return { data: HERO_ROWS, error: null };
      case "get_home_feedback_gathering_projects":
        return {
          data: params.p_category == null ? AUDIO_FEEDBACK_ROWS : [],
          error: null,
        };
      case "get_home_meaningful_updates":
        return {
          data:
            params.p_category === "game"
              ? GAME_UPDATE_ROWS
              : AUDIO_ONLY_UPDATE_ROWS,
          error: null,
        };
      case "get_home_newest_projects":
        return { data: NEWEST_ROWS, error: null };
      case "get_public_project_usage_relations":
        return { data: [], error: null };
      case "get_public_platform_announcements":
        return { data: [], error: null };
      case "get_public_project_stats":
        if (options?.statsFail) {
          return { data: null, error: { message: "stats down" } };
        }
        return {
          data: [
            { project_id: "game-hero-1", play_player_count: 42 },
            { project_id: "game-hero-2", play_player_count: 7 },
          ],
          error: null,
        };
      default:
        throw new Error(`unexpected rpc: ${fn}`);
    }
  };

  const from = (table: string) => {
    if (table !== "projects") {
      throw new Error(`unexpected from: ${table}`);
    }
    return {
      select() {
        return {
          in(_col: string, ids: string[]) {
            const data = ids.map((id) => ({
              id,
              category: id.startsWith("game-") ? "game" : "audio",
            }));
            return Promise.resolve({ data, error: null });
          },
        };
      },
    };
  };

  return { rpc, from } as unknown as SupabaseClient;
}

async function main() {
  const supabase = createMockSupabase();

  const gameHome = await fetchPlayerIaGameHome(supabase);
  assert.ok(
    !("feedbackGathering" in gameHome),
    "game home must not expose feedbackGathering shelf",
  );
  assert.equal(gameHome.featuredHero.length, 2);
  assert.deepEqual(
    gameHome.featuredHero.map((c) => c.id),
    ["game-hero-1", "game-hero-2"],
  );
  assert.equal(gameHome.featuredHero[0]?.playPlayerCount, 42);
  assert.equal(gameHome.featuredHero[1]?.playPlayerCount, 7);
  assert.equal(gameHome.heroWorks.length, 4);
  assert.deepEqual(
    gameHome.heroWorks.slice(0, 2).map((work) => work.projectId),
    ["game-hero-1", "game-hero-2"],
  );
  assert.ok(
    gameHome.heroWorks.every((work) => work.category === "game"),
    "game home heroWorks must stay game-only",
  );
  assert.ok(
    gameHome.meaningfulUpdates.length > 0,
    "game home meaningfulUpdates must fill via p_category=game",
  );
  assert.ok(
    gameHome.meaningfulUpdates.every((item) => item.category === "game"),
  );
  assert.ok(gameHome.newestProjects.length > 0);
  console.log("OK  /home/game featuredHero (game-filtered) + playPlayerCount merge");

  const gameHomeStatsFail = await fetchPlayerIaGameHome(
    createMockSupabase({ statsFail: true }),
  );
  assert.equal(gameHomeStatsFail.featuredHero.length, 2);
  assert.equal(gameHomeStatsFail.featuredHero[0]?.playPlayerCount, null);
  assert.ok(gameHomeStatsFail.meaningfulUpdates.length > 0);
  console.log("OK  stats RPC failure does not fail game Home payload");

  const wholeHome = await fetchPlayerIaHome(supabase);
  assert.ok(
    wholeHome.feedbackGathering.some((item) => item.category === "audio"),
    "whole-platform home must keep unscoped feedbackGathering",
  );
  assert.ok(
    wholeHome.meaningfulUpdates.some((item) => item.category === "audio"),
  );
  console.log("OK  whole-platform home keeps p_category=null (unscoped)");

  console.log("player-ia-game-home-category-filter ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
