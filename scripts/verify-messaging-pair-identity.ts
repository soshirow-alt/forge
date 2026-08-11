/**
 * Messaging pair identity + context cards + sample thread guards.
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
assert.equal(MESSAGES_SAMPLE_THREAD.messages[0]?.sender, "self");
assert.match(MESSAGES_SAMPLE_THREAD.listBadge, /サンプル/);
assert.match(MESSAGES_SAMPLE_THREAD.counterpartAvatarSrc, /messages-sample/);
assert.match(MESSAGES_SAMPLE_THREAD.selfAvatarSrc, /messages-sample/);
assert.ok(MESSAGES_SAMPLE_THREAD.context.projectTitle);
assert.equal(
  "projectThumbnailSrc" in MESSAGES_SAMPLE_THREAD.context,
  false,
  "sample context must be text-only (no thumb)",
);
assert.match(
  MESSAGES_SAMPLE_THREAD.composerNote,
  /利用・コラボについてメッセージ/,
);

const migration099 = readFileSync(
  join(process.cwd(), "supabase/migrations/099_messaging_pair_identity.sql"),
  "utf8",
);
assert.match(migration099, /collab_consultations_one_open_pair_uidx/);
assert.match(migration099, /DISTINCT ON \(m\.pair_a, m\.pair_b\)/);

const migration100 = readFileSync(
  join(process.cwd(), "supabase/migrations/100_messaging_context_segments.sql"),
  "utf8",
);
assert.match(migration100, /v_pair_existed/);
assert.match(migration100, /status = 'closed'/);

const migration101 = readFileSync(
  join(process.cwd(), "supabase/migrations/101_messaging_pair_email_read_harden.sql"),
  "utf8",
);
assert.match(migration101, /v_recipient_already_unread/);
assert.match(migration101, /FOR UPDATE/);


const db = readFileSync(
  join(process.cwd(), "lib/supabase/collab-consultations-db.ts"),
  "utf8",
);
assert.match(db, /listPairConsultationIds/);
assert.match(db, /pairContexts/);

const inbox = readFileSync(
  join(process.cwd(), "components/messages-inbox-page.tsx"),
  "utf8",
);
assert.match(inbox, /MESSAGES_SAMPLE_THREAD/);
assert.doesNotMatch(inbox, /利用・コラボについてのやり取り/);
assert.doesNotMatch(inbox, /listTimeLabel/);

const thread = readFileSync(
  join(process.cwd(), "components/consultation-thread.tsx"),
  "utf8",
);
assert.match(thread, /max-w-\[/);
assert.match(thread, /プロフィールを見る/);
assert.match(thread, /ConsultationContextCard/);
assert.match(thread, /ConsultationStartForm/);
assert.match(thread, /pairContexts/);
assert.match(thread, /returnPath=\{\`\$\{basePath\}\/\$\{consultationId\}\`\}/);
assert.match(thread, /\$\{basePath\}\?notice=unavailable/);
assert.match(thread, /\$\{basePath\}\/\$\{nextId\}/);
assert.doesNotMatch(thread, /consultationPurposeLabel/);
assert.doesNotMatch(thread, /returnPath=\{\`\/messages\//);

const draft = readFileSync(
  join(process.cwd(), "components/messages-draft-room.tsx"),
  "utf8",
);
assert.match(draft, /counterpartId === counterpartId/);
assert.match(draft, /start:\s*"1"/);
assert.match(draft, /ConsultationStartForm/);

const samplePane = readFileSync(
  join(process.cwd(), "components/messages-sample-thread-pane.tsx"),
  "utf8",
);
assert.match(samplePane, /composerNote/);
assert.match(samplePane, /ConsultationContextCard/);
assert.match(samplePane, /counterpartAvatarSrc/);

const types = readFileSync(
  join(process.cwd(), "lib/collab/consultation-types.ts"),
  "utf8",
);
assert.match(types, /COLLAB_CONSULTATION_START_PURPOSES/);
assert.match(types, /consultationPurposeStartLabel/);

console.log("verify-messaging-pair-identity: PASS");
