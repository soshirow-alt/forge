import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isEmailOutboxRequestAuthorized } from "../lib/email-outbox-auth";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const sqlGatePath = "scripts/staging-only/local-sql-gate-collab-suite.mjs";
const migration = read("supabase/migrations/087_collab_consultations.sql");
const db = read("lib/supabase/collab-consultations-db.ts");
const thread = read("components/consultation-thread.tsx");
const startButton = read("components/start-consultation-button.tsx");
const readRoute = read("app/api/collab/consultations/[id]/read/route.ts");
const outboxRoute = read("app/api/internal/process-email-outbox/route.ts");
const vercel = JSON.parse(read("vercel.json")) as {
  crons?: { path?: string; schedule?: string }[];
};
const packageJson = JSON.parse(read("package.json")) as {
  scripts?: Record<string, string>;
};

for (const value of [
  "create_collab_consultation",
  "send_collab_consultation_message",
  "mark_collab_consultation_read",
  "list_my_collab_consultations",
  "collab_consultation_messages",
  "consultation_message",
]) {
  assert.match(migration, new RegExp(value));
}
assert.match(db, /create_collab_consultation/);
assert.match(db, /list_my_collab_consultations/);

// Ack sequencing (aligned with verify-consultation-ack-lifecycle):
// detailOk via recordDetailOkAndScheduleAck after setConsultation/setMessages;
// Realtime uses scheduleAckOnlyIfDetailAlreadyOk (must not promote detailOk);
// ack effect gates on ackToken === 0; lifecycle machine decides shouldStartAck; no eager /read.
assert.match(thread, /setAckToken/);
assert.match(thread, /ackToken === 0/);
assert.match(thread, /recordDetailOkAndScheduleAck/);
assert.match(thread, /scheduleAckOnlyIfDetailAlreadyOk/);
assert.doesNotMatch(thread, /scheduleAckAfterUiCommit/);
assert.match(
  thread,
  /setConsultation\(result\.consultation\);\s*\n\s*setMessages[\s\S]*?recordDetailOkAndScheduleAck\(\)/,
);
assert.match(
  thread,
  /useEffect\(\(\) => \{\s*\n\s*if \(ackToken === 0\) return;/,
);
assert.match(thread, /markConsultationAcknowledged/);
assert.match(thread, /再読み込み/);
assert.match(thread, /既読を再試行/);
assert.doesNotMatch(
  thread,
  /void fetch\(`\/api\/collab\/consultations\/\$\{consultationId\}\/read`/,
);
// Eager load must not fire ack; only the ackToken effect + explicit retry button may.
assert.doesNotMatch(
  thread,
  /setConsultation\(result\.consultation\);[\s\S]{0,120}?void\s+markConsultationAcknowledged/,
);

assert.match(startButton, /isLoggedIn/);
assert.match(startButton, /\/messages\/new/);
assert.match(startButton, /params\.set\("to", counterpartId\)/);
assert.match(readRoute, /acknowledgeNotificationsByCoalesceKey/);
assert.doesNotMatch(
  readRoute,
  /supabase\.rpc\("acknowledge_notifications_by_coalesce_key"/,
);
assert.match(outboxRoute, /export async function GET/);
assert.equal(
  vercel.crons?.some(
    (cron) => cron.path === "/api/internal/process-email-outbox" && cron.schedule,
  ),
  true,
);
assert.equal(packageJson.scripts?.["ops:email-outbox"], "node scripts/process-email-outbox.mjs");
assert.equal(existsSync(join(process.cwd(), sqlGatePath)), true, `${sqlGatePath} is missing`);
assert.equal(
  packageJson.scripts?.["verify:collab-suite-sql-gate"],
  "node scripts/staging-only/local-sql-gate-collab-suite.mjs",
);

const request = (secret: string, header = "authorization") =>
  new Request("https://forge.invalid/api/internal/process-email-outbox", {
    headers:
      header === "authorization"
        ? { authorization: `Bearer ${secret}` }
        : { "x-email-outbox-secret": secret },
  });
assert.equal(
  isEmailOutboxRequestAuthorized(request("cron-only"), {
    cronSecret: "cron-only",
  }),
  true,
);
assert.equal(
  isEmailOutboxRequestAuthorized(request("manual-only", "x-email-outbox-secret"), {
    emailOutboxSecret: "manual-only",
  }),
  true,
);
assert.equal(
  isEmailOutboxRequestAuthorized(request("cron-with-both"), {
    emailOutboxSecret: "manual-with-both",
    cronSecret: "cron-with-both",
  }),
  true,
);
assert.equal(
  isEmailOutboxRequestAuthorized(request("manual-with-both"), {
    emailOutboxSecret: "manual-with-both",
    cronSecret: "cron-with-both",
  }),
  true,
);
assert.equal(
  isEmailOutboxRequestAuthorized(request("wrong"), {
    emailOutboxSecret: "manual-with-both",
    cronSecret: "cron-with-both",
  }),
  false,
);

assert.match(thread, /applyConsultationAckEvent/);
assert.match(thread, /createConsultationAckState/);
assert.match(thread, /consultation-ack-lifecycle/);
assert.equal(
  packageJson.scripts?.["verify:consultation-ack-lifecycle"],
  "npx --yes tsx scripts/verify-consultation-ack-lifecycle.ts",
);
assert.equal(
  existsSync(join(process.cwd(), "lib/collab/consultation-ack-lifecycle.ts")),
  true,
);
assert.equal(
  existsSync(join(process.cwd(), "scripts/verify-consultation-ack-lifecycle.ts")),
  true,
);

// Execute lifecycle machine sequences (Codex required behavioral coverage without RTL).
execFileSync("npm", ["run", "verify:consultation-ack-lifecycle"], {
  stdio: "inherit",
  cwd: process.cwd(),
  shell: true,
});

console.log("PASS verify-collab-consultations-contract");
