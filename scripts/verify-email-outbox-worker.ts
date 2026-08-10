/**
 * Isolated email outbox worker state-machine tests (no network / no DB).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  processEmailOutboxRows,
  type EmailOutboxDeps,
  type EmailOutboxRow,
} from "../lib/email-outbox-worker";

function row(partial: Partial<EmailOutboxRow> & { id: string }): EmailOutboxRow {
  return {
    to_email: "user@example.com",
    template_key: "collab_consultation_new",
    payload: { counterpartName: "A" },
    attempts: 0,
    ...partial,
  };
}

async function run() {
  const events: string[] = [];
  const depsSuccess: EmailOutboxDeps = {
    async claimRow(r) {
      events.push(`claim:${r.id}`);
      return { claimed: true };
    },
    async markSent(id, claimedAttempts) {
      events.push(`sent:${id}:${claimedAttempts}`);
    },
    async markFailed(id, input) {
      events.push(`failed:${id}:${input.dead ? "dead" : "retry"}`);
    },
    async send(input) {
      events.push(`send-key:${input.idempotencyKey}`);
    },
  };
  const ok = await processEmailOutboxRows([row({ id: "a" })], depsSuccess);
  assert.deepEqual(ok, { processed: 1, sent: 1, failed: 0, skipped: 0 });
  assert.deepEqual(events, ["claim:a", "send-key:forge-outbox-a", "sent:a:1"]);

  events.length = 0;
  let attemptsSeen = 0;
  const depsFailThenDead: EmailOutboxDeps = {
    async claimRow(_r, nextAttempts) {
      attemptsSeen = nextAttempts;
      return { claimed: true };
    },
    async markSent() {
      throw new Error("should not mark sent");
    },
    async markFailed(id, input) {
      events.push(`${id}:${input.dead ? "dead" : "failed"}:${input.attempts}`);
    },
    async send() {
      throw new Error("boom");
    },
  };
  const fail = await processEmailOutboxRows(
    [row({ id: "b", attempts: 4 })],
    depsFailThenDead,
  );
  assert.equal(fail.failed, 1);
  assert.equal(attemptsSeen, 5);
  assert.deepEqual(events, ["b:dead:5"]);

  events.length = 0;
  const depsRetry: EmailOutboxDeps = {
    async claimRow() {
      return { claimed: true };
    },
    async markSent() {},
    async markFailed(id, input) {
      events.push(`${id}:${input.dead ? "dead" : "failed"}:${input.attempts}`);
    },
    async send() {
      throw new Error("transient");
    },
  };
  const retry = await processEmailOutboxRows(
    [row({ id: "d", attempts: 1 })],
    depsRetry,
  );
  assert.equal(retry.failed, 1);
  assert.deepEqual(events, ["d:failed:2"]);

  const depsSkip: EmailOutboxDeps = {
    async claimRow() {
      return { claimed: false };
    },
    async markSent() {},
    async markFailed() {},
    async send() {},
  };
  const skipped = await processEmailOutboxRows([row({ id: "c" })], depsSkip);
  assert.deepEqual(skipped, { processed: 1, sent: 0, failed: 0, skipped: 1 });

  await assert.rejects(
    () =>
      processEmailOutboxRows([row({ id: "e" })], {
        async claimRow() {
          throw new Error("claim db down");
        },
        async markSent() {},
        async markFailed() {},
        async send() {},
      }),
    /claim db down/,
  );

  // --- Stale worker generation guard (in-memory row store) ---
  type StoreRow = {
    id: string;
    attempts: number;
    status: "pending" | "failed" | "sent" | "dead";
  };
  const store: StoreRow = { id: "race", attempts: 0, status: "pending" };
  const markSentGuard = async (id: string, claimedAttempts: number) => {
    if (
      store.id === id &&
      store.attempts === claimedAttempts &&
      (store.status === "pending" || store.status === "failed")
    ) {
      store.status = "sent";
    }
  };
  const markFailedGuard = async (
    id: string,
    input: { attempts: number; lastError: string; dead: boolean },
  ) => {
    if (
      store.id === id &&
      store.attempts === input.attempts &&
      (store.status === "pending" || store.status === "failed")
    ) {
      store.status = input.dead ? "dead" : "failed";
    }
  };

  // Worker A claims attempts=1, Worker B claims attempts=2 and marks sent.
  store.attempts = 1;
  store.status = "pending";
  // B reclaims:
  store.attempts = 2;
  await markSentGuard("race", 2);
  assert.equal(store.status, "sent");
  assert.equal(store.attempts, 2);
  // Stale A markFailed with generation 1 must be a no-op (cannot revert sent).
  await markFailedGuard("race", {
    attempts: 1,
    lastError: "stale A",
    dead: false,
  });
  assert.equal(store.status, "sent");
  assert.equal(store.attempts, 2);

  // Concurrent claim skip still works.
  const claimSkipEvents: string[] = [];
  const skipResult = await processEmailOutboxRows([row({ id: "skip-race" })], {
    async claimRow() {
      claimSkipEvents.push("miss");
      return { claimed: false };
    },
    async markSent() {
      claimSkipEvents.push("sent");
    },
    async markFailed() {
      claimSkipEvents.push("failed");
    },
    async send() {
      claimSkipEvents.push("send");
    },
  });
  assert.deepEqual(skipResult, {
    processed: 1,
    sent: 0,
    failed: 0,
    skipped: 1,
  });
  assert.deepEqual(claimSkipEvents, ["miss"]);

  // Idempotency key remains forge-outbox-${id} even after markSent failure + retry.
  const idemKeys: string[] = [];
  let markSentCalls = 0;
  const depsIdempotentRetry: EmailOutboxDeps = {
    async claimRow() {
      return { claimed: true };
    },
    async markSent(id, claimedAttempts) {
      markSentCalls += 1;
      idemKeys.push(`mark:${id}:${claimedAttempts}`);
      if (markSentCalls === 1) throw new Error("markSent flaky");
    },
    async markFailed() {},
    async send(input) {
      idemKeys.push(input.idempotencyKey);
    },
  };
  const first = await processEmailOutboxRows(
    [row({ id: "idem" })],
    depsIdempotentRetry,
  );
  assert.equal(first.failed, 1);
  const second = await processEmailOutboxRows(
    [row({ id: "idem", attempts: 1 })],
    depsIdempotentRetry,
  );
  assert.equal(second.sent, 1);
  assert.deepEqual(idemKeys, [
    "forge-outbox-idem",
    "mark:idem:1",
    "forge-outbox-idem",
    "mark:idem:2",
  ]);

  const worker = readFileSync(
    join(process.cwd(), "lib/email-outbox-worker.ts"),
    "utf8",
  );
  assert.match(worker, /if \(claim\.error\)/);
  assert.match(worker, /claimed: Boolean\(claim\.data\)/);
  assert.match(worker, /idempotencyKey: `forge-outbox-\$\{row\.id\}`/);
  assert.match(worker, /idempotencyKey: input\.idempotencyKey/);
  assert.match(worker, /markSent\(id, claimedAttempts\)/);
  assert.match(worker, /\.eq\("attempts", claimedAttempts\)/);
  assert.match(worker, /\.eq\("attempts", input\.attempts\)/);
  assert.match(worker, /\.in\("status", \["pending", "failed"\]\)/);
  assert.match(worker, /markSent affected 0 rows/);
  assert.match(worker, /\.select\("id"\)/);
  assert.match(worker, /\.maybeSingle\(\)/);

  const migration090 = readFileSync(
    join(process.cwd(), "supabase/migrations/090_transactional_email_outbox.sql"),
    "utf8",
  );
  assert.match(migration090, /NEW\.status = 'failed' AND NEW\.attempts >= 5/);
  assert.doesNotMatch(
    migration090,
    /NEW\.attempts >= 5 AND NEW\.status IN \('pending', 'failed'\)/,
  );

  // Final attempt success path through processEmailOutboxRows (attempts 4 → claim 5 → sent).
  const finalEvents: string[] = [];
  const finalOk = await processEmailOutboxRows([row({ id: "final-ok", attempts: 4 })], {
    async claimRow(_r, nextAttempts) {
      finalEvents.push(`claim:${nextAttempts}`);
      return { claimed: true };
    },
    async markSent(id, claimedAttempts) {
      finalEvents.push(`sent:${id}:${claimedAttempts}`);
    },
    async markFailed() {
      finalEvents.push("failed");
    },
    async send() {
      finalEvents.push("send");
    },
  });
  assert.deepEqual(finalOk, { processed: 1, sent: 1, failed: 0, skipped: 0 });
  assert.deepEqual(finalEvents, ["claim:5", "send", "sent:final-ok:5"]);

  const transactional = readFileSync(
    join(process.cwd(), "lib/transactional-email.ts"),
    "utf8",
  );
  assert.match(transactional, /idempotencyKey\?: string/);
  assert.match(transactional, /idempotencyKey: input\.idempotencyKey/);

  const thread = readFileSync(
    join(process.cwd(), "components/consultation-thread.tsx"),
    "utf8",
  );
  assert.match(thread, /setAckToken/);
  assert.match(thread, /ackToken === 0/);
  assert.match(thread, /再読み込み/);
  assert.doesNotMatch(
    thread,
    /await markConsultationAcknowledged\(\);\s*\n\s*if \(active\) setAckError/,
  );

  const gamesProvider = readFileSync(
    join(process.cwd(), "components/games-provider.tsx"),
    "utf8",
  );
  assert.match(gamesProvider, /requiresAcknowledgement/);
  assert.match(
    gamesProvider,
    /Important notifications ack only after target detail/,
  );

  console.log("verify-email-outbox-worker: PASS");
}

void run();
