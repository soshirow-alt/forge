/**
 * Messaging pair identity + sample thread + CTA reuse guards.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isMessagesSampleThreadId,
  MESSAGES_SAMPLE_THREAD,
  MESSAGES_SAMPLE_THREAD_ID,
} from "../lib/messages-sample-thread";

assert.equal(isMessagesSampleThreadId(MESSAGES_SAMPLE_THREAD_ID), true);
assert.equal(isMessagesSampleThreadId("real-uuid"), false);
assert.ok(MESSAGES_SAMPLE_THREAD.messages.length >= 3);
assert.match(MESSAGES_SAMPLE_THREAD.listBadge, /サンプル/);

const migration099 = readFileSync(
  join(process.cwd(), "supabase/migrations/099_messaging_pair_identity.sql"),
  "utf8",
);
assert.match(migration099, /collab_consultations_one_open_pair_uidx/);
assert.match(migration099, /DISTINCT ON \(m\.pair_a, m\.pair_b\)/);
assert.match(migration099, /v_consultation_id IS NOT NULL/);

const db = readFileSync(
  join(process.cwd(), "lib/supabase/collab-consultations-db.ts"),
  "utf8",
);
assert.match(db, /listPairConsultationIds/);
assert.match(db, /pairConsultationIds/);

const inbox = readFileSync(
  join(process.cwd(), "components/messages-inbox-page.tsx"),
  "utf8",
);
assert.match(inbox, /MESSAGES_SAMPLE_THREAD/);
assert.doesNotMatch(inbox, /利用・コラボについてのやり取り/);

const thread = readFileSync(
  join(process.cwd(), "components/consultation-thread.tsx"),
  "utf8",
);
assert.match(thread, /max-w-\[/);
assert.match(thread, /プロフィールを見る/);
assert.match(thread, /pairConsultationIds/);

const draft = readFileSync(
  join(process.cwd(), "components/messages-draft-room.tsx"),
  "utf8",
);
assert.match(draft, /counterpartId === counterpartId/);
assert.doesNotMatch(draft, /projectIdsEqual\(item\.counterpartProjectId/);

const samplePane = readFileSync(
  join(process.cwd(), "components/messages-sample-thread-pane.tsx"),
  "utf8",
);
assert.match(samplePane, /composerNote/);
assert.match(samplePane, /headerBadge|メッセージ例|サンプル機能/);

console.log("verify-messaging-pair-identity: PASS");
