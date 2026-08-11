/**
 * Production transactional email sender readiness (static + env semantics).
 * Does not send mail. Does not touch business mutations.
 *
 * Usage: npm run verify:production-email-sender
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertTransactionalFromAllowed,
  DEFAULT_PRODUCTION_SENDING_DOMAIN,
  extractEmailAddress,
  extractEmailDomain,
  getExpectedProductionSendingDomain,
  isExpectedProductionSendingDomain,
  isResendDevSender,
} from "../lib/resend-from-address";

assert.equal(DEFAULT_PRODUCTION_SENDING_DOMAIN, "mail.forgeplace.app");
assert.equal(getExpectedProductionSendingDomain(), "mail.forgeplace.app");

assert.equal(isResendDevSender("Forge <onboarding@resend.dev>"), true);
assert.equal(
  isResendDevSender("Forge <notifications@mail.forgeplace.app>"),
  false,
);
assert.equal(
  extractEmailAddress("Forge <notifications@mail.forgeplace.app>"),
  "notifications@mail.forgeplace.app",
);
assert.equal(
  extractEmailDomain("Forge <notifications@mail.forgeplace.app>"),
  "mail.forgeplace.app",
);
assert.equal(
  isExpectedProductionSendingDomain("Forge <notifications@mail.forgeplace.app>"),
  true,
);
assert.equal(
  isExpectedProductionSendingDomain("Forge <notifications@forge-games.net>"),
  false,
);

assert.doesNotThrow(() =>
  assertTransactionalFromAllowed({
    fromHeader: "Forge <onboarding@resend.dev>",
    vercelEnv: "preview",
  }),
);
assert.throws(
  () =>
    assertTransactionalFromAllowed({
      fromHeader: "Forge <onboarding@resend.dev>",
      vercelEnv: "production",
    }),
  /@resend\.dev/,
);
assert.throws(
  () =>
    assertTransactionalFromAllowed({
      fromHeader: "Forge <noreply@example.com>",
      vercelEnv: "production",
    }),
  /mail\.forgeplace\.app/,
);
assert.doesNotThrow(() =>
  assertTransactionalFromAllowed({
    fromHeader: "Forge <notifications@mail.forgeplace.app>",
    vercelEnv: "production",
  }),
);

const tx = readFileSync(join(process.cwd(), "lib/transactional-email.ts"), "utf8");
assert.match(tx, /assertTransactionalFromAllowed/);

const fromHelper = readFileSync(
  join(process.cwd(), "lib/resend-from-address.ts"),
  "utf8",
);
assert.match(fromHelper, /vercelEnv !== \"production\"/);
assert.match(fromHelper, /VERCEL_ENV/);
assert.match(fromHelper, /mail\.forgeplace\.app/);
assert.match(fromHelper, /FORGE_PRODUCTION_SENDING_DOMAIN/);

console.log("verify-production-email-sender: PASS");
console.log(
  JSON.stringify(
    {
      ok: true,
      note:
        "Vercel Production RESEND_FROM_EMAIL must use the verified sending domain (default mail.forgeplace.app) and must not use @resend.dev. Override later via FORGE_PRODUCTION_SENDING_DOMAIN. Preview may use the verified sender.",
      expectedSendingDomain: DEFAULT_PRODUCTION_SENDING_DOMAIN,
    },
    null,
    2,
  ),
);
