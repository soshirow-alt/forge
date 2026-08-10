/**
 * Deterministic guards for Preview real-email E2E (no network / no secrets required).
 */

import assert from "node:assert/strict";
import {
  assertAllowedRecipient,
  assertStagingOnly,
  isPreviewHost,
} from "./lib/preview-e2e-env.ts";
import { assertTransactionalMailContent } from "./lib/gmail-e2e.ts";

function throws(fn: () => void, needle: string) {
  assert.throws(fn, (err: unknown) => {
    assert.ok(err instanceof Error);
    assert.match(err.message, new RegExp(needle));
    return true;
  });
}

// Staging URL / Production ref guard
throws(
  () =>
    assertStagingOnly({
      NEXT_PUBLIC_SUPABASE_URL: "https://bpnisgzxuwdxelhnduuf.supabase.co",
    }),
  "BLOCKED",
);
throws(
  () =>
    assertStagingOnly({
      NEXT_PUBLIC_SUPABASE_URL: "https://vuqpwvjvgyxffmvpfrxo.supabase.co",
      FORGE_PRODUCTION_SUPABASE_REF: "vuqpwvjvgyxffmvpfrxo",
    }),
  "BLOCKED",
);
assert.doesNotThrow(() =>
  assertStagingOnly({
    NEXT_PUBLIC_SUPABASE_URL: "https://vuqpwvjvgyxffmvpfrxo.supabase.co",
    FORGE_PRODUCTION_SUPABASE_REF: "bpnisgzxuwdxelhnduuf",
  }),
);

// Recipient allowlist
assert.doesNotThrow(() =>
  assertAllowedRecipient("forge.operation@gmail.com", {
    FORGE_PREVIEW_E2E_ALLOWED_RECIPIENT: "forge.operation@gmail.com",
  }),
);
throws(
  () =>
    assertAllowedRecipient("someone.else@example.com", {
      FORGE_PREVIEW_E2E_ALLOWED_RECIPIENT: "forge.operation@gmail.com",
    }),
  "BLOCKED",
);
throws(
  () =>
    assertAllowedRecipient("a@x.com,b@y.com", {
      FORGE_PREVIEW_E2E_ALLOWED_RECIPIENT: "a@x.com,b@y.com",
    }),
  "multiple",
);

assert.equal(
  isPreviewHost(
    "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/messages",
  ),
  true,
);
assert.equal(isPreviewHost("https://forge-games.net/messages"), false);

// Content / privacy / CTA assertions
assert.doesNotThrow(() =>
  assertTransactionalMailContent({
    message: {
      subject: "[Forge] 新しいメッセージが届きました",
      from: "Forge <notify@example.com>",
      to: "forge.operation@gmail.com",
      bodyText:
        "Forge に新しいメッセージが届きました。\nhttps://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/messages/abc\n※ プライベートなメッセージ本文はメールに掲載していません。",
      bodyHtml: "<p>ok</p>",
      snippet: "Forge に新しいメッセージ",
    },
    expectedRecipient: "forge.operation@gmail.com",
    expectedSubjectIncludes: "新しいメッセージ",
    runId: "run1",
    previewHostNeedle: "preview-landing-01",
    forbiddenBodySnippets: ["must-not-appear-in-email"],
  }),
);

throws(
  () =>
    assertTransactionalMailContent({
      message: {
        subject: "[Forge] 新しいメッセージが届きました",
        from: "Forge <notify@example.com>",
        to: "forge.operation@gmail.com",
        bodyText: "secret must-not-appear-in-email leaked",
        bodyHtml: "",
        snippet: "",
      },
      expectedRecipient: "forge.operation@gmail.com",
      expectedSubjectIncludes: "新しいメッセージ",
      runId: "run1",
      previewHostNeedle: "preview-landing-01",
      forbiddenBodySnippets: ["must-not-appear-in-email"],
    }),
  "leaked",
);

throws(
  () =>
    assertTransactionalMailContent({
      message: {
        subject: "[Forge] 新しいメッセージが届きました",
        from: "Forge <notify@example.com>",
        to: "forge.operation@gmail.com",
        bodyText: "see https://forge-games.net/messages/x",
        bodyHtml: "",
        snippet: "",
      },
      expectedRecipient: "forge.operation@gmail.com",
      expectedSubjectIncludes: "新しいメッセージ",
      runId: "run1",
      previewHostNeedle: "preview-landing-01",
      forbiddenBodySnippets: [],
    }),
  "Production",
);

// Old-mail false positive: wrong recipient
throws(
  () =>
    assertTransactionalMailContent({
      message: {
        subject: "[Forge] 新しいメッセージが届きました",
        from: "Forge <notify@example.com>",
        to: "other@example.com",
        bodyText:
          "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/messages/abc",
        bodyHtml: "",
        snippet: "",
      },
      expectedRecipient: "forge.operation@gmail.com",
      expectedSubjectIncludes: "新しいメッセージ",
      runId: "run1",
      previewHostNeedle: "preview-landing-01",
      forbiddenBodySnippets: [],
    }),
  "recipient",
);

console.log("verify-preview-real-email-guards: PASS");
