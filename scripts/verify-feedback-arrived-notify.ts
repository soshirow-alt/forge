/**
 * Static + staging matrix notes for Feedback-arrived notify (104/105).
 * Runtime matrix against Staging is recorded in .agent/runtime when MCP verifies.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createNotificationMessage,
  getNotificationActionHint,
  getNotificationTypeLabel,
  type Notification,
} from "../lib/notifications";
import { notificationTargetHref } from "../lib/project-nurture-links";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const m104 = read("supabase/migrations/104_feedback_arrived_owner_notify.sql");
assert.match(m104, /notify_owner_feedback_arrived/);
assert.match(m104, /project_feedback_notify_owner/);
assert.match(m104, /trg_notify_owner_on_project_feedback/);
assert.match(m104, /フィードバックが届きました/);
assert.match(m104, /type = 'voice_received'/);
assert.match(m104, /p_actor_id = v_owner_id/);
assert.match(m104, /AFTER INSERT ON public\.project_feedback/);
assert.match(m104, /notify_owner_on_voice_response/);
assert.match(m104, /Owner Dashboard|must not execute/i);
assert.doesNotMatch(m104, /authorized MCP/i);
assert.doesNotMatch(m104, /feedback_reciprocity/);

const m105 = read(
  "supabase/migrations/105_feedback_arrived_notify_concurrency.sql",
);
assert.match(m105, /pg_advisory_xact_lock/);
assert.match(m105, /unique_violation/);
assert.match(m105, /notify_owner_on_voice_response/);
assert.match(m105, /EXCEPTION WHEN OTHERS/);

const rollout104 = read(
  "scripts/production-rollout/2026-08/apply_feedback_arrived_owner_notify_104.sql",
);
assert.match(rollout104, /NEVER execute/i);
assert.doesNotMatch(rollout104, /unless Owner GO/i);

const rollout105 = read(
  "scripts/production-rollout/2026-08/apply_feedback_arrived_notify_105.sql",
);
assert.match(rollout105, /NEVER execute/i);
assert.match(rollout105, /pg_advisory_xact_lock/);

const m093 = read("supabase/migrations/093_feedback_reciprocity_notifications.sql");
assert.match(m093, /project_feedback_reciprocity_notify/);
assert.match(m093, /project_voice_responses_reciprocity_notify/);

const doc = read("docs/feedback-reciprocity-current.md");
assert.match(doc, /detailed-only/);
assert.match(doc, /104/);
assert.match(doc, /1件に合流/);
assert.match(doc, /本体 Feedback 通知/);

assert.equal(getNotificationTypeLabel("voice_received"), "フィードバック");
assert.match(
  createNotificationMessage("voice_received", "作品A"),
  /フィードバックが届きました/,
);
assert.match(getNotificationActionHint("voice_received"), /フィードバック/);

const bodyNotif = {
  id: "n-body",
  type: "voice_received" as const,
  message: "x",
  date: new Date().toISOString(),
  projectId: "proj-1",
  projectTitle: "p",
  read: false,
} satisfies Notification;
assert.match(notificationTargetHref(bodyNotif), /^\/projects\/proj-1\/studio#/);

const reciprocity = {
  id: "n-rec",
  type: "feedback_reciprocity" as const,
  message: "x",
  date: new Date().toISOString(),
  projectId: "proj-1",
  projectTitle: "p",
  read: false,
  relatedUserId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
} satisfies Notification;
assert.equal(
  notificationTargetHref(reciprocity),
  "/creators/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
);

const matrixSql = read(
  "scripts/staging-only/verify-feedback-arrived-matrix.sql",
);
assert.match(matrixSql, /4_coalesce|detailed INSERT \+ helper|coalesce detailed/i);
assert.match(matrixSql, /reciprocity/);
assert.match(matrixSql, /self/);
assert.match(matrixSql, /Never Production/i);

console.log("PASS verify-feedback-arrived-notify");
