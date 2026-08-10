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
  extractEmailAddress,
  isResendDevSender,
} from "../lib/resend-from-address";

assert.equal(isResendDevSender("Forge <onboarding@resend.dev>"), true);
assert.equal(isResendDevSender("Forge <notifications@forge-games.net>"), false);
assert.equal(
  extractEmailAddress("Forge <notifications@forge-games.net>"),
  "notifications@forge-games.net",
);

assert.doesNotThrow(() =>
  assertTransactionalFromAllowed({
    fromHeader: "Forge <onboarding@resend.dev>",
    deploymentMode: "preview",
  }),
);
assert.throws(
  () =>
    assertTransactionalFromAllowed({
      fromHeader: "Forge <onboarding@resend.dev>",
      deploymentMode: "production",
    }),
  /@resend\.dev/,
);
assert.doesNotThrow(() =>
  assertTransactionalFromAllowed({
    fromHeader: "Forge <noreply@example.com>",
    deploymentMode: "production",
  }),
);

const tx = readFileSync(join(process.cwd(), "lib/transactional-email.ts"), "utf8");
assert.match(tx, /assertTransactionalFromAllowed/);
assert.match(tx, /getForgeDeploymentModeForServer/);
assert.match(tx, /onboarding@resend\.dev/);

const fromHelper = readFileSync(
  join(process.cwd(), "lib/resend-from-address.ts"),
  "utf8",
);
assert.match(fromHelper, /deploymentMode !== \"production\"/);

console.log("verify-production-email-sender: PASS");
console.log(
  JSON.stringify(
    {
      ok: true,
      note:
        "Production RESEND_FROM_EMAIL must be a verified custom-domain address (not @resend.dev). Domain provisioning is Owner one-time in Resend+DNS.",
      knownSiteDomainHint: "forge-games.net (site host; mailbox not invented here)",
    },
    null,
    2,
  ),
);
