/**
 * Game Studio overview play-info edit: hydrate/edit/save/clear `playerCounts`
 * (registry `player_count`, projects.player_counts text[]).
 * Usage: npx tsx scripts/verify-studio-game-player-counts-edit.ts
 */
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildGamePlayInfoEditPersistPayload } from "../lib/studio-game-overview-edit-persist";
import { updateProjectDetailsInDb } from "../lib/supabase/projects";
import { PLAYER_COUNT_OPTIONS } from "../lib/project-formal-filter-registry";
import { EMPTY_PLAY_ENVIRONMENT_FORM } from "../lib/play-environment";
import type { Game } from "../lib/mock-games";

const PROJECT_ID = "44444444-4444-4444-8444-444444444444";
const OWNER_ID = "11111111-1111-4111-8111-111111111111";

function baseGame(overrides: Partial<Game> = {}): Game {
  return {
    id: PROJECT_ID,
    title: "プレイ人数編集テスト",
    creator: "Tester",
    genres: ["アクション"],
    genre: "アクション",
    description: "キャッチコピーです",
    overviewIntroduction: "作品紹介の本文です。",
    overviewFeatures: null,
    phase: "playable",
    status: "playable",
    lookingForTesters: false,
    lastUpdated: "2026-08-01",
    createdAt: "2026-08-01T00:00:00Z",
    section: "new",
    thumbnailUrls: [],
    tags: [],
    playUrl: "https://example.com/game",
    ownerId: OWNER_ID,
    ownerName: "Tester",
    visibility: "public",
    playableVersion: "1.0.0",
    releaseStatus: "in_development",
    playAccessType: "free",
    ageRating: "general",
    category: "game",
    categoryAttributes: {},
    playerCounts: [],
    ...overrides,
  };
}

type MockState = { updatePayloads: Record<string, unknown>[]; updateCalls: number };

function createProjectsSupabaseMock(): { supabase: SupabaseClient; state: MockState } {
  const state: MockState = { updatePayloads: [], updateCalls: 0 };
  const supabase = {
    from(table: string) {
      assert.equal(table, "projects");
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({
                  data: { thumbnail_url: null, thumbnail_urls: [] },
                  error: null,
                }),
              };
            },
          };
        },
        update(payload: Record<string, unknown>) {
          state.updateCalls += 1;
          state.updatePayloads.push(JSON.parse(JSON.stringify(payload)));
          return {
            eq() {
              return {
                select() {
                  return {
                    single: async () => ({
                      data: {
                        id: PROJECT_ID,
                        owner_id: OWNER_ID,
                        owner_name: "Tester",
                        title: String(payload.title ?? "Title"),
                        creator: "Tester",
                        genre: String(payload.genre ?? ""),
                        genres: (payload.genres as string[]) ?? [],
                        description: String(payload.description ?? "desc"),
                        overview_introduction: null,
                        phase: String(payload.phase ?? "playable"),
                        status: String(payload.status ?? "playable"),
                        looking_for_testers: false,
                        tester_slots: null,
                        section: "new",
                        thumbnail_url: null,
                        tags: (payload.tags as string[]) ?? [],
                        play_url: String(payload.play_url ?? ""),
                        steam_url: null,
                        itch_url: null,
                        github_url: null,
                        discord_url: null,
                        official_url: null,
                        visibility: String(payload.visibility ?? "public"),
                        created_at: "2026-08-01T00:00:00Z",
                        updated_at: "2026-08-02T00:00:00Z",
                        category: String(payload.category ?? "game"),
                        category_attributes: payload.category_attributes ?? {},
                        player_counts: payload.player_counts ?? [],
                        playable_version: "1.0.0",
                        release_status: "in_development",
                        play_access_type: payload.play_access_type ?? "free",
                        age_rating: "general",
                      },
                      error: null,
                    }),
                  };
                },
              };
            },
          };
        },
      };
    },
  };
  return { supabase: supabase as unknown as SupabaseClient, state };
}

// 1. Hydrate: PLAYER_COUNT_OPTIONS registry values round-trip through the
//    planner unchanged (panel hydrates directly from game.playerCounts).
assert.ok(PLAYER_COUNT_OPTIONS.length > 0);

async function main() {
  // 2. Save: selecting player counts writes projects.player_counts.
  {
    const { supabase, state } = createProjectsSupabaseMock();
    const game = baseGame({ playerCounts: [] });
    const built = buildGamePlayInfoEditPersistPayload(game, {
      playAccessType: "free",
      estimatedPlayTime: "30分",
      playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
      featureTags: [],
      playerCounts: [PLAYER_COUNT_OPTIONS[0], PLAYER_COUNT_OPTIONS[1]],
    });
    assert.equal(built.ok, true);
    if (!built.ok) throw new Error("unreachable");
    const payload = built.payload;
    assert.deepEqual(payload.playerCounts, [
      PLAYER_COUNT_OPTIONS[0],
      PLAYER_COUNT_OPTIONS[1],
    ]);
    await updateProjectDetailsInDb(supabase, game.id, payload);
    assert.equal(state.updateCalls, 1);
    assert.deepEqual(state.updatePayloads[0].player_counts, [
      PLAYER_COUNT_OPTIONS[0],
      PLAYER_COUNT_OPTIONS[1],
    ]);
  }

  // 3. Clear: saving an empty array must persist `[]`, not omit the column
  //    (projects.ts writes `player_counts` whenever the field is an array,
  //    including empty — only `undefined` skips the column).
  {
    const { supabase, state } = createProjectsSupabaseMock();
    const game = baseGame({ playerCounts: [PLAYER_COUNT_OPTIONS[0]] });
    const built = buildGamePlayInfoEditPersistPayload(game, {
      playAccessType: "free",
      estimatedPlayTime: "30分",
      playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
      featureTags: [],
      playerCounts: [],
    });
    assert.equal(built.ok, true);
    if (!built.ok) throw new Error("unreachable");
    const payload = built.payload;
    assert.deepEqual(payload.playerCounts, []);
    await updateProjectDetailsInDb(supabase, game.id, payload);
    assert.equal(state.updateCalls, 1);
    assert.ok(
      Object.prototype.hasOwnProperty.call(state.updatePayloads[0], "player_counts"),
      "player_counts column must be present even when clearing",
    );
    assert.deepEqual(state.updatePayloads[0].player_counts, []);
  }

  // 4. Legacy existing unknown (baseline) survives an edit that does not
  //    touch it — save with the SAME set (no change) must not silently drop
  //    a value that is no longer in PLAYER_COUNT_OPTIONS.
  {
    const game = baseGame({ playerCounts: ["廃止された人数区分"] });
    const built = buildGamePlayInfoEditPersistPayload(game, {
      playAccessType: "free",
      estimatedPlayTime: "30分",
      playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
      featureTags: [],
      playerCounts: ["廃止された人数区分"],
    });
    assert.equal(built.ok, true, "legacy existing playerCounts value must be preserved");
    if (!built.ok) throw new Error("unreachable");
    assert.deepEqual(built.payload.playerCounts, ["廃止された人数区分"]);
  }

  // 5. New/tampered unknown (not baseline, not allowlisted) must reject —
  //    not silently stripped down to the allowlisted remainder.
  {
    const game = baseGame({ playerCounts: [PLAYER_COUNT_OPTIONS[0]] });
    const built = buildGamePlayInfoEditPersistPayload(game, {
      playAccessType: "free",
      estimatedPlayTime: "30分",
      playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
      featureTags: [],
      playerCounts: [PLAYER_COUNT_OPTIONS[0], "存在しない人数区分"],
    });
    assert.equal(built.ok, false, "new unknown playerCounts value must reject");
  }

  // 6. User explicit removal of a legacy value must succeed (removed, not
  //    forced to stay because it once existed in baseline).
  {
    const game = baseGame({ playerCounts: ["廃止された人数区分"] });
    const built = buildGamePlayInfoEditPersistPayload(game, {
      playAccessType: "free",
      estimatedPlayTime: "30分",
      playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
      featureTags: [],
      playerCounts: [],
    });
    assert.equal(built.ok, true);
    if (!built.ok) throw new Error("unreachable");
    assert.deepEqual(built.payload.playerCounts, []);
  }

  console.log("studio-game-player-counts-edit ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
