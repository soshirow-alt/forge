/**
 * Immediate best-effort email outbox kick + recovery contract tests.
 * No network / no remote DB. Worker claim semantics reuse processEmailOutboxRows.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  kickEmailOutboxBestEffort,
  scheduleEmailOutboxKickBestEffort,
  type EmailOutboxKickDeps,
} from "../lib/email-outbox-kick";
import {
  processEmailOutboxRows,
  type EmailOutboxRow,
} from "../lib/email-outbox-worker";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

function row(partial: Partial<EmailOutboxRow> & { id: string }): EmailOutboxRow {
  return {
    to_email: "user@example.com",
    template_key: "collab_consultation_new",
    payload: {},
    attempts: 0,
    ...partial,
  };
}

async function run() {
  const kickSrc = read("lib/email-outbox-kick.ts");
  assert.match(kickSrc, /kickEmailOutboxBestEffort/);
  assert.match(kickSrc, /scheduleEmailOutboxKickBestEffort/);
  assert.match(kickSrc, /processEmailOutboxRows/);
  assert.match(kickSrc, /import \{ after \} from "next\/server"/);
  assert.match(kickSrc, /schedule: \(task: \(\) => void \| Promise<unknown>\) => void = after/);
  assert.match(kickSrc, /schedule\(\(\) => kickEmailOutboxBestEffort\(options\)\)/);
  assert.match(kickSrc, /Never throws|never throw/i);
  assert.doesNotMatch(
    kickSrc,
    /console\.error\([^\n]*(to_email|payload|message body)/i,
  );
  assert.doesNotMatch(kickSrc, /fetch\(|FORGE_APP_URL|process-email-outbox/);

  const createRoute = read("app/api/collab/consultations/route.ts");
  const messageRoute = read("app/api/collab/consultations/[id]/messages/route.ts");
  const requestRoute = read("app/api/usage-relations/request/route.ts");
  const decideRoute = read("app/api/usage-relations/decide/route.ts");
  for (const source of [createRoute, messageRoute, requestRoute, decideRoute]) {
    assert.match(source, /scheduleEmailOutboxKickBestEffort/);
    assert.doesNotMatch(source, /await kickEmailOutboxBestEffort/);
  }
  assert.match(
    createRoute,
    /createCollabConsultation[\s\S]*scheduleEmailOutboxKickBestEffort[\s\S]*status: 201/,
  );
  assert.match(
    messageRoute,
    /sendCollabConsultationMessage[\s\S]*scheduleEmailOutboxKickBestEffort[\s\S]*status: 201/,
  );
  assert.match(
    requestRoute,
    /requestProjectUsageRelation[\s\S]*scheduleEmailOutboxKickBestEffort[\s\S]*status: 201/,
  );
  assert.match(
    decideRoute,
    /decideProjectUsageRelation[\s\S]*scheduleEmailOutboxKickBestEffort[\s\S]*\{ ok: true \}/,
  );

  const button = read("components/usage-relation-button.tsx");
  const list = read("components/usage-relations-page.tsx");
  assert.match(button, /\/api\/usage-relations\/request/);
  assert.doesNotMatch(button, /requestProjectUsageRelation/);
  assert.match(list, /\/api\/usage-relations\/decide/);
  assert.doesNotMatch(list, /decideProjectUsageRelation/);

  const migration092 = read(
    "supabase/migrations/092_consultation_message_email_read_to_unread.sql",
  );
  assert.match(migration092, /v_recipient_already_unread/);
  assert.match(migration092, /IF NOT coalesce\(v_recipient_already_unread, false\)/);
  assert.match(migration092, /collab_consultation_message/);
  assert.match(migration092, /FOR UPDATE/);
  assert.match(migration092, /mark_collab_consultation_read/);
  assert.doesNotMatch(migration092, /090_|091_/);

  const migration091 = read(
    "supabase/migrations/091_collab_notification_email_hooks.sql",
  );
  assert.doesNotMatch(migration091, /v_recipient_already_unread/);

  const vercel = read("vercel.json");
  assert.match(vercel, /0 15 \* \* \*/);
  assert.doesNotMatch(vercel, /\*\/10/);

  // --- injectable kick: success ---
  const ok = await kickEmailOutboxBestEffort({
    deps: {
      async loadRows() {
        return [row({ id: "k1" })];
      },
      async process(rows) {
        return processEmailOutboxRows(rows, {
          async claimRow() {
            return { claimed: true };
          },
          async markSent() {},
          async markFailed() {},
          async send() {},
        });
      },
      logError() {
        throw new Error("should not log");
      },
    },
  });
  assert.deepEqual(ok, {
    attempted: true,
    processed: 1,
    sent: 1,
    failed: 0,
    skipped: 0,
  });

  // --- load failure → mutation-safe (no throw) ---
  const loadFail = await kickEmailOutboxBestEffort({
    deps: {
      async loadRows() {
        throw new Error("load boom");
      },
      async process() {
        throw new Error("process should not run");
      },
      logError() {},
    },
  });
  assert.deepEqual(loadFail, { attempted: false });

  // --- provider failure preserves retryable path via process ---
  const providerFail = await kickEmailOutboxBestEffort({
    deps: {
      async loadRows() {
        return [row({ id: "k2" })];
      },
      async process(rows) {
        return processEmailOutboxRows(rows, {
          async claimRow() {
            return { claimed: true };
          },
          async markSent() {
            throw new Error("no");
          },
          async markFailed(_id, input) {
            assert.equal(input.dead, false);
            assert.equal(input.attempts, 1);
          },
          async send() {
            throw new Error("provider down");
          },
        });
      },
      logError() {},
    },
  });
  assert.equal(providerFail.attempted, true);
  assert.equal(providerFail.failed, 1);
  assert.equal(providerFail.sent, 0);

  // --- service role unavailable ---
  const noSr = await kickEmailOutboxBestEffort({
    deps: {
      async loadRows() {
        return null;
      },
      async process() {
        throw new Error("no");
      },
      logError() {},
    },
  });
  assert.deepEqual(noSr, { attempted: false });

  // --- concurrent claim skip ---
  let claimWins = 0;
  const concurrent = await Promise.all([
    processEmailOutboxRows([row({ id: "race" })], {
      async claimRow() {
        if (claimWins === 0) {
          claimWins = 1;
          return { claimed: true };
        }
        return { claimed: false };
      },
      async markSent() {},
      async markFailed() {},
      async send() {},
    }),
    processEmailOutboxRows([row({ id: "race" })], {
      async claimRow() {
        if (claimWins === 0) {
          claimWins = 1;
          return { claimed: true };
        }
        return { claimed: false };
      },
      async markSent() {},
      async markFailed() {},
      async send() {},
    }),
  ]);
  assert.equal(concurrent.reduce((n, r) => n + r.sent, 0), 1);
  assert.equal(concurrent.reduce((n, r) => n + r.skipped, 0), 1);

  // --- already claimed / already sent ---
  const skipped = await processEmailOutboxRows([row({ id: "claimed" })], {
    async claimRow() {
      return { claimed: false };
    },
    async markSent() {
      throw new Error("no");
    },
    async markFailed() {
      throw new Error("no");
    },
    async send() {
      throw new Error("no");
    },
  });
  assert.deepEqual(skipped, { processed: 1, sent: 0, failed: 0, skipped: 1 });

  // --- daily recovery still processes pending ---
  const recovery = await processEmailOutboxRows(
    [row({ id: "recover", attempts: 2, template_key: "usage_relation_request" })],
    {
      async claimRow(_r, next) {
        assert.equal(next, 3);
        return { claimed: true };
      },
      async markSent() {},
      async markFailed() {
        throw new Error("no");
      },
      async send() {},
    },
  );
  assert.equal(recovery.sent, 1);

  // --- schedule returns a pending Promise that settles with the kick ---
  let scheduled: (() => void | Promise<unknown>) | null = null;
  scheduleEmailOutboxKickBestEffort(
    {
      deps: {
        async loadRows() {
          await new Promise((resolve) => setTimeout(resolve, 20));
          return [row({ id: "sched" })];
        },
        async process(rows) {
          return processEmailOutboxRows(rows, {
            async claimRow() {
              return { claimed: true };
            },
            async markSent() {},
            async markFailed() {},
            async send() {},
          });
        },
        logError() {},
      },
    },
    (task) => {
      scheduled = task;
    },
  );
  assert.ok(scheduled);
  const scheduledTask = scheduled as () => void | Promise<unknown>;
  const pending = scheduledTask();
  assert.ok(pending && typeof (pending as Promise<unknown>).then === "function");
  const settled = await pending;
  assert.deepEqual(settled, {
    attempted: true,
    processed: 1,
    sent: 1,
    failed: 0,
    skipped: 0,
  });

  // --- kick failure still resolves (mutation response already sent) ---
  let failTask: (() => void | Promise<unknown>) | null = null;
  scheduleEmailOutboxKickBestEffort(
    {
      deps: {
        async loadRows() {
          throw new Error("post-response load fail");
        },
        async process() {
          throw new Error("no");
        },
        logError() {},
      },
    },
    (task) => {
      failTask = task;
    },
  );
  assert.ok(failTask);
  const failResult = await (failTask as () => Promise<unknown>)();
  assert.deepEqual(failResult, { attempted: false });

  // --- throwing scheduler must not escape (mutation already committed) ---
  assert.doesNotThrow(() => {
    scheduleEmailOutboxKickBestEffort({}, () => {
      throw new Error("after registration failed");
    });
  });

  void (null as unknown as EmailOutboxKickDeps);
  console.log("verify-email-outbox-immediate-kick: PASS");
}

void run();
