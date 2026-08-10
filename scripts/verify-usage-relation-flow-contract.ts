import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DECIDED_USAGE_RELATIONS_LIMIT,
  parseUsageRelationFocusId,
} from "../lib/supabase/usage-relations-write-db";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const migration = read("supabase/migrations/088_usage_relation_requests.sql");
const hooksMigration = read("supabase/migrations/091_collab_notification_email_hooks.sql");
const db = read("lib/supabase/usage-relations-write-db.ts");
const nurture = read("lib/project-nurture-links.ts");
const ui = read("components/usage-relation-button.tsx");
const list = read("components/consultations-list-page.tsx");

for (const rpc of [
  "request_project_usage_relation",
  "decide_project_usage_relation",
  "withdraw_project_usage_relation",
  "remove_project_usage_relation",
]) {
  assert.match(migration, new RegExp(rpc));
  assert.match(db, new RegExp(rpc));
}
assert.match(migration, /status IN \('pending', 'accepted', 'rejected', 'withdrawn', 'removed'\)/);
assert.match(migration, /WHERE r\.status = 'accepted'/);
assert.match(ui, /→ 使用 →/);
assert.match(ui, /使用関係を登録/);
assert.match(ui, /selectedCandidateId/);
assert.match(ui, /goToLogin\(\)/);
assert.match(db, /\.neq\("requested_by", currentUserId\)/);
assert.match(db, /fetchMyDecidedUsageRelations/);
assert.match(db, /fetchUsageRelationByIdForRequester/);
assert.match(db, /DECIDED_USAGE_RELATIONS_LIMIT = 100/);
assert.match(db, /parseUsageRelationFocusId/);
assert.match(db, /\.in\("status", \["accepted", "rejected"\]\)/);
assert.match(db, /\.eq\("requested_by", currentUserId\)/);
assert.equal(DECIDED_USAGE_RELATIONS_LIMIT, 100);

const focusId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
assert.equal(
  parseUsageRelationFocusId(`#usage-relation-${focusId}`),
  focusId,
);
assert.equal(parseUsageRelationFocusId(`usage-relation-${focusId}`), focusId);
assert.equal(parseUsageRelationFocusId("#usage-relations"), null);
assert.equal(parseUsageRelationFocusId(""), null);

assert.match(
  nurture,
  /usage_relation_accepted[\s\S]*usage-relation-\$\{notification\.usageRelationId\}/,
);
assert.match(
  nurture,
  /usage_relation_rejected[\s\S]*usage-relation-\$\{notification\.usageRelationId\}/,
);

assert.match(list, /fetchMyDecidedUsageRelations/);
assert.match(list, /fetchUsageRelationByIdForRequester/);
assert.match(list, /parseUsageRelationFocusId/);
assert.match(list, /focusedAckRelationId/);
assert.match(list, /最近の結果/);
assert.match(list, /decidedAckToken/);
assert.match(list, /setDecidedAckToken/);
assert.match(list, /decidedAckToken === 0/);
assert.match(list, /acknowledgeNotificationsByCoalesceKey/);
assert.match(list, /usage-relation:\$\{focusedAckRelationId\}/);
assert.match(list, /usage-relation:\$\{relation\.id\}/);
assert.match(list, /catch \(cause\)/);
assert.match(list, /id=\{`usage-relation-\$\{relation\.id\}`\}/);
assert.match(hooksMigration, /type = 'usage_relation_request'/);
assert.match(hooksMigration, /acknowledged_at = coalesce\(acknowledged_at, now\(\)\)/);
console.log("PASS verify-usage-relation-flow-contract");
