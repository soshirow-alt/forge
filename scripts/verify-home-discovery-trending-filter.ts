/**
 * Unit: trending partition drops play-only (feedback+watch == 0).
 * Run: npx --yes tsx scripts/verify-home-discovery-trending-filter.ts
 */
import { partitionHomeDiscoveryFeed } from "../lib/supabase/home-discovery-db";
import type { HomeDiscoveryFeedRow } from "../lib/supabase/home-discovery-db";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function row(
  partial: Partial<HomeDiscoveryFeedRow> &
    Pick<HomeDiscoveryFeedRow, "section" | "rank" | "project_id" | "title">,
): HomeDiscoveryFeedRow {
  return {
    description: "",
    playable_version: "0.1",
    thumbnail_url: null,
    genre: null,
    first_published_at: "2026-07-01T00:00:00Z",
    meaningful_update_at: null,
    feedback_users_7d: 0,
    watchers_7d: 0,
    players_7d: 0,
    last_engagement_at: null,
    card_time_at: null,
    feedback_participant_count: 0,
    watch_count: 0,
    ...partial,
  };
}

const feed = partitionHomeDiscoveryFeed([
  row({
    section: "trending",
    rank: 1,
    project_id: "a",
    title: "FB",
    feedback_users_7d: 2,
    watchers_7d: 1,
    players_7d: 3,
  }),
  row({
    section: "trending",
    rank: 2,
    project_id: "b",
    title: "Play only",
    players_7d: 5,
    feedback_participant_count: 0,
    watch_count: 0,
  }),
  row({
    section: "trending",
    rank: 3,
    project_id: "c",
    title: "Watch only",
    watchers_7d: 1,
  }),
  row({
    section: "newest",
    rank: 1,
    project_id: "n1",
    title: "New",
  }),
]);

assert(feed.trending.map((t) => t.id).join(",") === "a,c", "play-only dropped");
assert(feed.newest.length === 1, "newest untouched");
console.log("verify-home-discovery-trending-filter: PASS");
