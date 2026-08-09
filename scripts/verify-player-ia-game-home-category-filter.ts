/**
 * Regression for Codex round-2 finding 4: /home/game FB-gathering and
 * meaningful-updates shelves must rank/limit within category=game in the
 * DB (RPC `p_category`), not client-filter an already-limited whole-platform
 * top-N. A mock Supabase client only returns game-category rows when the
 * caller passes `p_category: "game"` — mirroring the real RPC's WHERE-level
 * category filter — so if the client code regresses to omitting p_category,
 * this test fails with an empty game shelf (exactly the bug being fixed).
 *
 * Usage: npx tsx scripts/verify-player-ia-game-home-category-filter.ts
 */
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchPlayerIaGameHome,
  fetchPlayerIaHome,
  type HomeFeedbackGatheringRow,
  type HomeMeaningfulUpdateRow,
  type HomeNewestProjectRow,
} from "../lib/supabase/player-ia-home-db";

const GAME_FEEDBACK_ROWS: HomeFeedbackGatheringRow[] = Array.from(
  { length: 6 },
  (_, i) => ({
    project_id: `game-fb-${i}`,
    title: `Game FB ${i}`,
    category: "game",
    description: "",
    thumbnail_url: null,
    window_days: 30,
    distinct_author_count: 3,
    feedback_count: 5,
    has_creator_reply: false,
    last_feedback_at: "2026-08-01T00:00:00Z",
    empathy_count: 1,
  }),
);

// Simulates the real-world bug: other categories dominate the whole-platform
// top-N, so an unfiltered (p_category=null) call returns zero game rows.
const AUDIO_ONLY_FEEDBACK_ROWS: HomeFeedbackGatheringRow[] = Array.from(
  { length: 6 },
  (_, i) => ({
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
  }),
);

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

function createMockSupabase(): SupabaseClient {
  const rpc = async (fn: string, params: Record<string, unknown>) => {
    switch (fn) {
      case "get_home_feedback_gathering_projects":
        return {
          data: params.p_category === "game" ? GAME_FEEDBACK_ROWS : AUDIO_ONLY_FEEDBACK_ROWS,
          error: null,
        };
      case "get_home_meaningful_updates":
        return {
          data: params.p_category === "game" ? GAME_UPDATE_ROWS : AUDIO_ONLY_UPDATE_ROWS,
          error: null,
        };
      case "get_home_newest_projects":
        return { data: NEWEST_ROWS, error: null };
      case "get_public_project_usage_relations":
        return { data: [], error: null };
      case "get_public_platform_announcements":
        return { data: [], error: null };
      default:
        throw new Error(`unexpected rpc: ${fn}`);
    }
  };
  return { rpc } as unknown as SupabaseClient;
}

async function main() {
  const supabase = createMockSupabase();

  // 1. Game category Home: must send p_category="game" so the game shelf
  //    fills even when the whole-platform top-N is dominated by other
  //    categories (the exact scenario the mock's AUDIO_ONLY_* rows model).
  const gameHome = await fetchPlayerIaGameHome(supabase);
  assert.ok(
    gameHome.feedbackGathering.length > 0,
    "game home feedbackGathering must not be empty when DB-side category filter is applied",
  );
  assert.ok(
    gameHome.feedbackGathering.every((item) => item.category === "game"),
    "game home feedbackGathering must be all category=game",
  );
  assert.ok(
    gameHome.meaningfulUpdates.length > 0,
    "game home meaningfulUpdates must not be empty when DB-side category filter is applied",
  );
  assert.ok(
    gameHome.meaningfulUpdates.every((item) => item.category === "game"),
    "game home meaningfulUpdates must be all category=game",
  );
  console.log("OK  /home/game feedbackGathering + meaningfulUpdates fill via p_category=game");

  // 2. Whole-platform Home: must keep p_category=null (no accidental "game"
  //    scoping regression) — the mock's audio-only rows should flow through.
  const wholeHome = await fetchPlayerIaHome(supabase);
  assert.ok(
    wholeHome.feedbackGathering.some((item) => item.category === "audio"),
    "whole-platform home must not scope feedbackGathering to a single category",
  );
  assert.ok(
    wholeHome.meaningfulUpdates.some((item) => item.category === "audio"),
    "whole-platform home must not scope meaningfulUpdates to a single category",
  );
  console.log("OK  whole-platform home keeps p_category=null (unscoped)");

  console.log("player-ia-game-home-category-filter ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
