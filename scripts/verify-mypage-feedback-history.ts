/**
 * Pure checks for mypage FB history building + migration 068 contract notes.
 */
import assert from "node:assert/strict";
import { buildFeedbackHistoryEntries } from "../lib/mypage-feedback-history";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

check("deep feedback: one row one entry, newest first", () => {
  const entries = buildFeedbackHistoryEntries({
    deepFeedback: [
      {
        id: "f1",
        projectId: "p1",
        createdAt: "2026-01-02T00:00:00.000Z",
        goodPoints: "良い",
        versionKey: "1.0",
      },
      {
        id: "f2",
        projectId: "p1",
        createdAt: "2026-01-03T00:00:00.000Z",
        concerns: "気になる",
        versionKey: "1.1",
      },
    ],
    voiceRows: [],
    reflectedProjectIds: new Set(),
  });
  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.id, "deep:f2");
  assert.equal(entries[1]?.id, "deep:f1");
  assert.equal(new Set(entries.map((e) => e.id)).size, 2);
});

check("voice responses group by project+version as one send", () => {
  const entries = buildFeedbackHistoryEntries({
    deepFeedback: [],
    voiceRows: [
      {
        id: "v1",
        projectId: "p1",
        versionKey: "1.0",
        promptId: "a",
        answerValue: "yes",
        answerLabel: "はい",
        optionalComment: "コメント",
        createdAt: "2026-02-01T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
        moderationStatus: "visible",
      },
      {
        id: "v2",
        projectId: "p1",
        versionKey: "1.0",
        promptId: "b",
        answerValue: "no",
        answerLabel: "いいえ",
        optionalComment: null,
        createdAt: "2026-02-01T00:00:01.000Z",
        updatedAt: "2026-02-01T00:00:01.000Z",
        moderationStatus: "visible",
      },
      {
        id: "v3",
        projectId: "p1",
        versionKey: "2.0",
        promptId: "a",
        answerValue: "yes",
        answerLabel: "はい",
        optionalComment: null,
        createdAt: "2026-03-01T00:00:00.000Z",
        updatedAt: "2026-03-01T00:00:00.000Z",
        moderationStatus: "visible",
      },
    ],
    reflectedProjectIds: new Set(["p1"]),
  });
  assert.equal(entries.length, 2);
  assert.ok(entries.every((e) => e.kind === "voice"));
  assert.equal(entries.filter((e) => e.reflected).length, 2);
  assert.equal(new Set(entries.map((e) => e.id)).size, 2);
});

check("no reflection without adoption evidence", () => {
  const entries = buildFeedbackHistoryEntries({
    deepFeedback: [
      {
        id: "f1",
        projectId: "p9",
        createdAt: "2026-01-01T00:00:00.000Z",
        goodPoints: "ok",
        versionKey: "1.0",
      },
    ],
    voiceRows: [],
    reflectedProjectIds: new Set(),
  });
  assert.equal(entries[0]?.reflected, false);
});

check("068 migration drops then recreates with DISTINCT play count", () => {
  const sql = readFileSync(
    resolve("supabase/migrations/068_public_project_stats_play_player_count.sql"),
    "utf8",
  );
  assert.match(sql, /DROP FUNCTION IF EXISTS public\.get_public_project_stats\(uuid\[\]\);/);
  assert.doesNotMatch(sql, /DROP FUNCTION[\s\S]{0,80}CASCADE/i);
  assert.match(sql, /COUNT\(DISTINCT pp\.user_id\)/);
  assert.doesNotMatch(sql, /COUNT\(pp\.\*\)/);
  assert.match(sql, /GRANT EXECUTE[\s\S]*TO anon/);
  assert.match(sql, /GRANT EXECUTE[\s\S]*TO authenticated/);
  assert.match(sql, /GRANT EXECUTE[\s\S]*TO service_role/);
  const dropIdx = sql.indexOf("DROP FUNCTION");
  const createIdx = sql.indexOf("CREATE FUNCTION");
  assert.ok(dropIdx >= 0 && createIdx > dropIdx);
  assert.match(sql, /play_player_count bigint/);
  assert.match(sql, /feedback_participant_count/);
  assert.match(sql, /watch_count/);
  assert.match(sql, /witness_grant_count/);
  assert.match(sql, /latest_devlog_at/);
});

console.log(`\nverify:mypage-feedback-history ${passed} checks passed`);
