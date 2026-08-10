/**
 * Preview/Staging real transactional email smoke (1 mail).
 *
 * Business path: actor → create_collab_consultation → operation user
 * → notification + outbox → Resend → (optional) Gmail readonly poll.
 *
 * Secrets: .env.preview-e2e.local (gitignored). Never prints credentials.
 *
 * Flags:
 *   --through-outbox  Stop after business event + outbox + builder asserts
 *                     (no Resend / Gmail). Used when local Resend secrets are
 *                     unavailable; full command still requires real send.
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
} from "./lib/preview-e2e-env.ts";
import {
  authedClient,
  ensureAuthUser,
  ensureDeveloperProfile,
  serviceClient,
  signInPassword,
} from "./lib/ensure-preview-e2e-users.ts";
import { processSingleOutboxRow } from "./lib/process-single-outbox-row.ts";
import {
  assertTransactionalMailContent,
  refreshGmailAccessToken,
  waitForGmailMessage,
} from "./lib/gmail-e2e.ts";
import { buildTransactionalEmail } from "@/lib/transactional-email";

const MARKER = "preview-real-email-v1";
const ACTOR_EMAIL_DEFAULT = "forge.e2e.actor.staging@example.invalid";

type StepResult = { name: string; ok: boolean; detail?: string };

function log(step: string, detail?: string) {
  console.log(`[preview-real-email] ${step}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const env = loadPreviewE2EEnv();
  const steps: StepResult[] = [];
  const startedAt = Date.now();
  const runId = `premail-${startedAt.toString(36)}-${randomUUID().slice(0, 8)}`;
  const throughOutboxOnly = process.argv.includes("--through-outbox");

  let consultationId: string | null = null;
  let outboxId: string | null = null;
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

    const privateBody = `E2E private body ${runId} must-not-appear-in-email`;
    const actorDb = authedClient(env, actorSession.accessToken);
    const { data: createdConsultationId, error: createError } = await actorDb.rpc(
      "create_collab_consultation",
      {
        p_counterpart_id: operation.userId,
        p_purpose: "other",
        p_first_message: privateBody,
        p_counterpart_project_id: null,
        p_initiator_project_id: null,
      },
    );
    if (createError || !createdConsultationId) {
      throw new Error(createError?.message || "create_collab_consultation failed");
    }
    consultationId = String(createdConsultationId);
    log("business_event", `consultation=${consultationId.slice(0, 8)}…`);
    steps.push({ name: "business_event", ok: true });

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
    if (!built.text.includes(siteUrl(env)) && !built.html.includes("/messages/")) {
      throw new Error("built email missing Preview CTA");
    }
    if (built.text.includes(privateBody) || built.html.includes(privateBody)) {
      throw new Error("builder leaked private consultation body");
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

    const resend = requireResend(env);
    process.env.RESEND_API_KEY = resend.apiKey;
    process.env.RESEND_FROM_EMAIL = resend.fromEmail;
    const sendStarted = Date.now();
    const sent = await processSingleOutboxRow({
      env,
      outboxId,
    });
    log("resend", `template=${sent.templateKey}`);
    steps.push({ name: "resend_sent", ok: true });

    const { data: sentRow } = await admin
      .from("transactional_email_outbox")
      .select("status,sent_at")
      .eq("id", outboxId)
      .maybeSingle();
    if (sentRow?.status !== "sent") {
      throw new Error(`outbox not marked sent (status=${sentRow?.status})`);
    }
    steps.push({ name: "outbox_sent_status", ok: true });

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
      if (body.includes("forge-games.net/messages")) {
        throw new Error("Gmail body CTA points at Production");
      }
      log("gmail", `message_id=${message.id}`);
      steps.push({ name: "gmail_inbox", ok: true });
    } else {
      log(
        "gmail",
        "SKIPPED — OAuth not configured (Owner one-time bootstrap required)",
      );
      steps.push({
        name: "gmail_inbox",
        ok: true,
        detail: "skipped_oauth_missing",
      });
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          gmailVerified: gmailReady,
          steps,
        },
        null,
        2,
      ),
    );
  } finally {
    if (consultationId) {
      await admin
        .from("collab_consultation_messages")
        .delete()
        .eq("consultation_id", consultationId);
      await admin
        .from("collab_consultation_reads")
        .delete()
        .eq("consultation_id", consultationId);
      await admin.from("collab_consultations").delete().eq("id", consultationId);
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
