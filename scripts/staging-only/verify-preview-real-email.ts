/**
 * Preview/Staging real transactional email smoke (1 mail).
 *
 * Default path (production-equivalent Preview runtime):
 *   Preview API auth → create_collab_consultation → notification → outbox
 *   → after()/worker on Preview → Resend (Preview env secrets)
 *
 * Flags:
 *   --through-outbox   Stop after business event + outbox + builder asserts
 *   --local-resend     Process one outbox row with local RESEND_* (not preferred)
 *
 * Secrets: .env.preview-e2e.local (gitignored). Never prints credentials.
 * Do not copy Preview Resend secrets locally — default path uses Preview runtime.
 */

import { randomUUID } from "node:crypto";
import {
  assertAllowedRecipient,
  assertStagingOnly,
  DEFAULT_OPERATION_EMAIL,
  loadPreviewE2EEnv,
  PREVIEW_ALIAS,
  requireEnv,
  requireResend,
  siteUrl,
} from "./lib/preview-e2e-env";
import {
  authedClient,
  ensureAuthUser,
  ensureDeveloperProfile,
  serviceClient,
  signInPassword,
} from "./lib/ensure-preview-e2e-users";
import { buildPreviewAuthCookieHeader } from "./lib/preview-api-session";
import {
  ensureOperationMessengerFixture,
} from "./lib/operation-messenger-fixture";
import { processSingleOutboxRow } from "./lib/process-single-outbox-row";
import {
  assertTransactionalMailContent,
  refreshGmailAccessToken,
  waitForGmailMessage,
} from "./lib/gmail-e2e";
import { buildTransactionalEmail } from "@/lib/transactional-email";

const MARKER = "preview-real-email-v1";
const ACTOR_EMAIL_DEFAULT = "forge.e2e.actor.staging@example.invalid";

type StepResult = { name: string; ok: boolean; detail?: string };

function log(step: string, detail?: string) {
  console.log(`[preview-real-email] ${step}${detail ? ` — ${detail}` : ""}`);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForOutboxStatus(input: {
  admin: ReturnType<typeof serviceClient>;
  outboxId: string;
  timeoutMs: number;
}): Promise<{ status: string; sent_at: string | null }> {
  const deadline = Date.now() + input.timeoutMs;
  let last = "pending";
  while (Date.now() < deadline) {
    const { data, error } = await input.admin
      .from("transactional_email_outbox")
      .select("status,sent_at")
      .eq("id", input.outboxId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    last = String(data?.status || "missing");
    if (last === "sent" || last === "failed" || last === "dead" || last === "suppressed") {
      return { status: last, sent_at: data?.sent_at ?? null };
    }
    await sleep(1500);
  }
  throw new Error(`outbox status timeout (last=${last})`);
}

async function main() {
  const env = loadPreviewE2EEnv();
  const steps: StepResult[] = [];
  const startedAt = Date.now();
  const runId = `premail-${startedAt.toString(36)}-${randomUUID().slice(0, 8)}`;
  const throughOutboxOnly = process.argv.includes("--through-outbox");
  const forceLocalResend = process.argv.includes("--local-resend");

  let consultationId: string | null = null;
  let outboxId: string | null = null;
  let privateBody = "";
  const admin = serviceClient(env);

  try {
    assertStagingOnly(env);
    steps.push({ name: "staging_guard", ok: true });

    const operationEmail = (
      env.FORGE_PREVIEW_E2E_EMAIL || DEFAULT_OPERATION_EMAIL
    )
      .trim()
      .toLowerCase();
    const operationPassword = requireEnv(env, "FORGE_PREVIEW_E2E_PASSWORD");
    assertAllowedRecipient(operationEmail, env);

    const actorEmail = (env.FORGE_PREVIEW_E2E_ACTOR_EMAIL || ACTOR_EMAIL_DEFAULT)
      .trim()
      .toLowerCase();
    const actorPassword =
      env.FORGE_PREVIEW_E2E_ACTOR_PASSWORD?.trim() ||
      `Actor!${MARKER}!${operationPassword.slice(0, 4)}Aa1`;

    const operation = await ensureAuthUser({
      env,
      email: operationEmail,
      password: operationPassword,
      displayName: "Forge Operation",
      marker: MARKER,
    });
    await ensureDeveloperProfile({
      env,
      userId: operation.userId,
      publicName: "Forge Operation",
      profile: "Staging/Preview恒久E2E operation account（自動テスト専用）",
      activityTags: ["game_creator", "audio_creator"],
      marker: MARKER,
    });
    log("operation_user", operation.created ? "created" : "reused");
    steps.push({
      name: "operation_user",
      ok: true,
      detail: operation.created ? "created" : "reused",
    });

    const actor = await ensureAuthUser({
      env,
      email: actorEmail,
      password: actorPassword,
      displayName: "Forge E2E Actor",
      marker: `${MARKER}-actor`,
    });
    await ensureDeveloperProfile({
      env,
      userId: actor.userId,
      publicName: "Forge E2E Actor",
      profile: "Staging E2E actor（自動テスト専用）",
      activityTags: ["game_creator"],
      marker: `${MARKER}-actor`,
    });
    log("actor_user", actor.created ? "created" : "reused");
    steps.push({
      name: "actor_user",
      ok: true,
      detail: actor.created ? "created" : "reused",
    });

    const opSession = await signInPassword({
      env,
      email: operationEmail,
      password: operationPassword,
    });
    const actorSession = await signInPassword({
      env,
      email: actorEmail,
      password: actorPassword,
    });
    log("login", "operation+actor ok");
    steps.push({ name: "login", ok: true });

    const actorDbEarly = authedClient(env, actorSession.accessToken);
    const operationDbEarly = authedClient(env, opSession.accessToken);
    const fixture = await ensureOperationMessengerFixture({
      actorDb: actorDbEarly,
      operationDb: operationDbEarly,
      operationUserId: operation.userId,
    });
    log("messenger_fixture", fixture.reused ? "reused" : "created");
    steps.push({
      name: "messenger_fixture",
      ok: true,
      detail: fixture.reused ? "reused" : "created",
    });

    // Ensure email prefs allow messages_collab (own-row RLS; not service_role).
    {
      const operationDb = authedClient(env, opSession.accessToken);
      const notifyEmail = {
        master: true,
        messages_collab: true,
        usage_relation: true,
        feedback_reciprocity: true,
      };
      const { data: existingSettings } = await operationDb
        .from("user_settings")
        .select("user_id")
        .eq("user_id", operation.userId)
        .maybeSingle();
      if (existingSettings) {
        const { error: prefError } = await operationDb
          .from("user_settings")
          .update({ notify_email: notifyEmail })
          .eq("user_id", operation.userId);
        if (prefError) throw new Error(prefError.message);
      } else {
        const { error: prefError } = await operationDb.from("user_settings").insert({
          user_id: operation.userId,
          notify_email: notifyEmail,
        });
        if (prefError) throw new Error(prefError.message);
      }
    }

    for (const path of ["/notifications", "/messages", "/mypage/profile"]) {
      const response = await fetch(`${PREVIEW_ALIAS}${path}`, {
        redirect: "manual",
        headers: { "user-agent": "forge-preview-real-email/1" },
      });
      if (![200, 307, 302, 401, 403].includes(response.status)) {
        throw new Error(`Preview ${path} unexpected HTTP ${response.status}`);
      }
    }
    steps.push({ name: "preview_routes", ok: true });

    privateBody = `E2E private body ${runId} must-not-appear-in-email`;
    const cookieHeader = await buildPreviewAuthCookieHeader({
      env,
      accessToken: actorSession.accessToken,
      refreshToken: actorSession.refreshToken,
    });

    const createResponse = await fetch(`${PREVIEW_ALIAS}/api/collab/consultations`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: cookieHeader,
        "user-agent": "forge-preview-real-email/1",
      },
      body: JSON.stringify({
        counterpartId: operation.userId,
        purpose: "other",
        firstMessage: privateBody,
        initiatorProjectId: null,
        counterpartProjectId: null,
      }),
    });
    const createText = await createResponse.text();
    if (!createResponse.ok) {
      throw new Error(
        `Preview create consultation HTTP ${createResponse.status}: ${createText.slice(0, 240)}`,
      );
    }
    let createJson: { consultationId?: string };
    try {
      createJson = JSON.parse(createText) as { consultationId?: string };
    } catch {
      throw new Error("Preview create consultation returned non-JSON");
    }
    if (!createJson.consultationId) {
      throw new Error("Preview create consultation missing consultationId");
    }
    consultationId = String(createJson.consultationId);
    log("business_event", `preview_api consultation=${consultationId.slice(0, 8)}…`);
    steps.push({
      name: "business_event",
      ok: true,
      detail: "preview_api_collab_consultation",
    });

    const operationDb = authedClient(env, opSession.accessToken);
    const { data: notif, error: notifError } = await operationDb
      .from("user_notifications")
      .select("id,type,consultation_id")
      .eq("user_id", operation.userId)
      .eq("consultation_id", consultationId)
      .eq("type", "consultation_new")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (notifError || !notif) {
      throw new Error(notifError?.message || "notification missing");
    }
    steps.push({ name: "notification", ok: true });

    const { data: outboxRows, error: outboxError } = await admin
      .from("transactional_email_outbox")
      .select("id,to_email,template_key,status,payload,created_at")
      .eq("user_id", operation.userId)
      .eq("template_key", "collab_consultation_new")
      .order("created_at", { ascending: false })
      .limit(10);
    if (outboxError) throw new Error(outboxError.message);
    const outbox = (outboxRows || []).find((row) => {
      const payload = row.payload as { consultation_id?: string } | null;
      return payload?.consultation_id === consultationId;
    });
    if (!outbox) throw new Error("outbox row missing");
    outboxId = String(outbox.id);
    assertAllowedRecipient(String(outbox.to_email), env);
    steps.push({ name: "outbox_enqueued", ok: true, detail: outboxId });

    process.env.NEXT_PUBLIC_SITE_URL = siteUrl(env);
    const built = buildTransactionalEmail("collab_consultation_new", {
      consultation_id: consultationId,
    });
    if (!built.text.includes(`${siteUrl(env)}/messages/${consultationId}`)) {
      throw new Error("built email CTA missing thread deep-link");
    }
    if (built.text.includes(privateBody) || built.html.includes(privateBody)) {
      throw new Error("builder leaked private consultation body");
    }
    if (!built.text.includes("settings#email-notifications")) {
      throw new Error("builder missing settings footer");
    }
    steps.push({ name: "builder_privacy_cta", ok: true });

    if (throughOutboxOnly) {
      log("resend", "SKIPPED — --through-outbox");
      steps.push({
        name: "resend_sent",
        ok: true,
        detail: "skipped_through_outbox",
      });
      console.log(
        JSON.stringify({ ok: true, mode: "through_outbox", runId, steps }, null, 2),
      );
      return;
    }

    const sendStarted = Date.now();
    let sendPath: "preview_runtime_after" | "local_resend" = "preview_runtime_after";

    if (forceLocalResend) {
      sendPath = "local_resend";
      const resend = requireResend(env);
      process.env.RESEND_API_KEY = resend.apiKey;
      process.env.RESEND_FROM_EMAIL = resend.fromEmail;
      await processSingleOutboxRow({ env, outboxId });
      log("resend", "local_resend path");
    } else {
      // Preview route already scheduled after(); wait for worker claim + provider send.
      log("resend", "waiting for Preview after()/worker");
      const final = await waitForOutboxStatus({
        admin,
        outboxId,
        timeoutMs: 120_000,
      });
      if (final.status !== "sent") {
        throw new Error(
          `Preview runtime did not mark outbox sent (status=${final.status})`,
        );
      }
      log("resend", "preview_runtime_after ok");
    }

    steps.push({ name: "resend_sent", ok: true, detail: sendPath });

    const { data: sentRow } = await admin
      .from("transactional_email_outbox")
      .select("status,sent_at")
      .eq("id", outboxId)
      .maybeSingle();
    if (sentRow?.status !== "sent") {
      throw new Error(`outbox not marked sent (status=${sentRow?.status})`);
    }
    steps.push({ name: "outbox_sent_status", ok: true });

    // CTA target must remain loadable for Owner eyeball (do not delete consultation).
    const { data: stillThere, error: stillError } = await operationDb
      .from("collab_consultations")
      .select("id,status")
      .eq("id", consultationId)
      .maybeSingle();
    if (stillError || !stillThere) {
      throw new Error(stillError?.message || "CTA consultation missing after send");
    }
    const { data: stillMsgs, error: stillMsgError } = await operationDb
      .from("collab_consultation_messages")
      .select("id")
      .eq("consultation_id", consultationId);
    if (stillMsgError || !stillMsgs?.length) {
      throw new Error(stillMsgError?.message || "CTA messages missing after send");
    }
    steps.push({
      name: "cta_target_alive",
      ok: true,
      detail: `/messages/${consultationId}`,
    });

    const gmailReady =
      Boolean(env.GMAIL_E2E_CLIENT_ID?.trim()) &&
      Boolean(env.GMAIL_E2E_CLIENT_SECRET?.trim()) &&
      Boolean(env.GMAIL_E2E_REFRESH_TOKEN?.trim());

    if (gmailReady) {
      const accessToken = await refreshGmailAccessToken({
        clientId: requireEnv(env, "GMAIL_E2E_CLIENT_ID"),
        clientSecret: requireEnv(env, "GMAIL_E2E_CLIENT_SECRET"),
        refreshToken: requireEnv(env, "GMAIL_E2E_REFRESH_TOKEN"),
      });
      const message = await waitForGmailMessage({
        accessToken,
        newerThanMs: sendStarted,
        timeoutMs: 120_000,
        query: [
          `to:${operationEmail}`,
          `subject:新しいメッセージ`,
          `after:${Math.floor(sendStarted / 1000) - 30}`,
        ].join(" "),
      });
      assertTransactionalMailContent({
        message,
        expectedRecipient: operationEmail,
        expectedSubjectIncludes: "新しいメッセージ",
        runId,
        previewHostNeedle: "preview-landing-01",
        forbiddenBodySnippets: [privateBody, "must-not-appear-in-email"],
      });
      const body = `${message.bodyText}\n${message.bodyHtml}`;
      if (
        body.includes("forge-games.net/messages") ||
        body.includes("forgeplace.app/messages") ||
        body.includes("forge-flame-gamma.vercel.app/messages")
      ) {
        throw new Error("Gmail body CTA points at Production");
      }
      log("gmail", `message_id=${message.id}`);
      steps.push({ name: "gmail_inbox", ok: true });
    } else {
      log(
        "gmail",
        "NOT ASSERTED — OAuth not configured (Owner one-time bootstrap required)",
      );
      steps.push({
        name: "gmail_inbox",
        ok: true,
        detail: "not_asserted_oauth_missing",
      });
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          sendPath,
          providerSendVerified: true,
          gmailInboxVerified: gmailReady,
          recipient: operationEmail,
          consultationId,
          ctaPath: `/messages/${consultationId}`,
          ctaUrl: `${siteUrl(env)}/messages/${consultationId}`,
          outboxId,
          steps,
        },
        null,
        2,
      ),
    );
  } finally {
    // Pair identity reuses the fixture thread — never delete the consultation.
    // Remove only this run's message body (and outbox row).
    if (consultationId && privateBody) {
      await admin
        .from("collab_consultation_messages")
        .delete()
        .eq("consultation_id", consultationId)
        .ilike("body", `%${runId}%`);
    }
    if (outboxId) {
      await admin.from("transactional_email_outbox").delete().eq("id", outboxId);
    }
  }
}

main().catch((cause) => {
  console.error(
    "[preview-real-email] FAIL",
    cause instanceof Error ? cause.message : cause,
  );
  process.exit(1);
});
