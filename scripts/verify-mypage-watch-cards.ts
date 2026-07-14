/**
 * Pure unit checks for mypage watch-card status (no network).
 */
import assert from "node:assert/strict";
import {
  isUpdatedSinceLastPlay,
  resolveMeaningfulUpdateByProject,
} from "../lib/meaningful-update-signals";
import {
  buildMypageWatchCards,
  filterMypageWatchCards,
  MYPAGE_WATCH_STATUS_LABEL,
} from "../lib/mypage-watch-cards";
import type { Game } from "../lib/mock-games";
import type { ProjectPlaySession } from "../lib/supabase/play-sessions-db";
import type { VoiceAdoptionRow } from "../lib/voice-adoption/types";

function game(id: string, title: string, version = "1.0"): Game {
  return {
    id,
    title,
    genre: "テスト",
    status: "公開",
    creator: "dev",
    phase: "試作ver",
    description: "desc",
    lookingForTesters: false,
    lastUpdated: "2026-01-01",
    section: "new",
    tags: [],
    playUrl: "https://example.com",
    playableVersion: version,
  };
}

function session(
  projectId: string,
  playedAt: string,
  versionKey = "0.9",
): ProjectPlaySession {
  return {
    id: `s-${projectId}-${playedAt}`,
    userId: "u1",
    projectId,
    versionKey,
    playedAt,
    context: "general",
    adoptionId: null,
    createdAt: playedAt,
  };
}

let passed = 0;

function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

check("meaningful update ignores events at/before first publish", () => {
  const map = resolveMeaningfulUpdateByProject({
    signals: [
      { projectId: "p1", at: "2026-01-01T00:00:00.000Z", kind: "devlog" },
      { projectId: "p1", at: "2026-01-10T00:00:00.000Z", kind: "version" },
    ],
    firstPublishedAtByProject: new Map([
      ["p1", "2026-01-05T00:00:00.000Z"],
    ]),
  });
  assert.equal(map.get("p1")?.at, "2026-01-10T00:00:00.000Z");
  assert.equal(map.get("p1")?.hasVersionEvent, true);
});

check("前回プレイ後は meaningful > last_played のみ", () => {
  assert.equal(
    isUpdatedSinceLastPlay({
      meaningfulUpdateAt: "2026-02-01T00:00:00.000Z",
      lastPlayedAt: "2026-01-01T00:00:00.000Z",
    }),
    true,
  );
  assert.equal(
    isUpdatedSinceLastPlay({
      meaningfulUpdateAt: "2026-01-01T00:00:00.000Z",
      lastPlayedAt: "2026-02-01T00:00:00.000Z",
    }),
    false,
  );
  assert.equal(
    isUpdatedSinceLastPlay({
      meaningfulUpdateAt: "2026-02-01T00:00:00.000Z",
      lastPlayedAt: null,
    }),
    false,
  );
});

check("one card per watched game + no duplicate project ids", () => {
  const meaningful = resolveMeaningfulUpdateByProject({
    signals: [
      { projectId: "a", at: "2026-03-01T00:00:00.000Z", kind: "devlog" },
      { projectId: "b", at: "2026-03-02T00:00:00.000Z", kind: "version" },
    ],
    firstPublishedAtByProject: new Map([
      ["a", "2026-01-01T00:00:00.000Z"],
      ["b", "2026-01-01T00:00:00.000Z"],
    ]),
  });

  const cards = buildMypageWatchCards({
    watchedGames: [game("a", "Alpha"), game("b", "Beta"), game("c", "Quiet")],
    sessions: [
      session("a", "2026-02-01T00:00:00.000Z"),
      session("b", "2026-02-01T00:00:00.000Z", "1.0"),
    ],
    meaningfulByProject: meaningful,
    adoptionsByProject: new Map(),
  });

  assert.equal(cards.length, 3);
  assert.equal(new Set(cards.map((c) => c.projectId)).size, 3);
  assert.equal(cards[0]?.hasUpdate, true);
  assert.ok(cards.some((c) => c.primaryStatus === "updated_since_play"));
  assert.ok(cards.some((c) => c.primaryStatus === "none"));
});

check("FB reflected only when adoption row present", () => {
  const adoption: VoiceAdoptionRow = {
    id: "ad1",
    projectId: "a",
    userId: "u1",
    voiceResponseId: "v1",
    devlogId: "d1",
    voiceVersionKey: "0.9",
    publishedVersion: "1.0",
    playerQuote: "quote",
    updateSummary: "操作を改善",
    promptText: null,
    confidence: 0.9,
    model: "test",
    modelVersion: null,
    matcherRunId: "m1",
    status: "active",
    suppressionReason: null,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  };

  const cards = buildMypageWatchCards({
    watchedGames: [game("a", "Alpha")],
    sessions: [session("a", "2026-02-01T00:00:00.000Z")],
    meaningfulByProject: new Map(),
    adoptionsByProject: new Map([["a", adoption]]),
  });

  assert.equal(cards[0]?.fbReflected, true);
  assert.equal(
    cards[0]?.statusChips[0]?.label,
    MYPAGE_WATCH_STATUS_LABEL.fb_reflected,
  );
  assert.equal(filterMypageWatchCards(cards, "fb_reflected").length, 1);
  assert.equal(filterMypageWatchCards(cards, "no_update").length, 0);
});

check("empty filter does not backfill unrelated cards", () => {
  const cards = buildMypageWatchCards({
    watchedGames: [game("q", "Quiet")],
    sessions: [],
    meaningfulByProject: new Map(),
    adoptionsByProject: new Map(),
  });
  assert.equal(filterMypageWatchCards(cards, "has_update").length, 0);
  assert.equal(filterMypageWatchCards(cards, "fb_reflected").length, 0);
});

console.log(`\nverify:mypage-watch-cards ${passed} checks passed`);
