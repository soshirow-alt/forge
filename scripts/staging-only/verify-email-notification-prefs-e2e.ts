/**
 * Staging preference E2E for transactional email (DB/outbox assertions).
 *
 * Scenarios:
 * A ON → outbox
 * B master OFF → in-app yes, outbox no
 * C category OFF → only that category suppressed
 * D enqueue then OFF → send-time suppressed (row kept)
 * E re-ON → new event can enqueue; D row stays suppressed (no backfill)
 *
 * Real Resend delivery is covered by verify:preview-real-email after Preview deploy
 * (Preview Vercel already has RESEND_*). Uses forge.operation + actor.
 */

import {
  assertStagingOnly,
  DEFAULT_OPERATION_EMAIL,
  loadPreviewE2EEnv,
  requireEnv,
} from "./lib/preview-e2e-env";
import {
  authedClient,
  ensureAuthUser,
  ensureDeveloperProfile,
  serviceClient,
  signInPassword,
} from "./lib/ensure-preview-e2e-users";

const MARKER = "preview-email-pref-v1";
const ACTOR_EMAIL_DEFAULT = "forge.e2e.actor.staging@example.invalid";

async function setNotifyEmail(
  client: ReturnType<typeof authedClient>,
  userId: string,
  notifyEmail: Record<string, boolean>,
) {
  const { error } = await client.from("user_settings").upsert(
    {
      user_id: userId,
      notify_email: notifyEmail,
      notify_player: {
        "watch-updates": true,
        "developer-follow": true,
        community: true,
        system: false,
      },
      notify_studio: {
        witness: true,
        "version-play": true,
        community: true,
      },
      privacy: { profile: true, activity: true, ranking: true },
      studio_public: { "dev-profile": true },
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}

async function createConsultation(input: {
  env: Record<string, string>;
  actorToken: string;
  counterpartId: string;
  body: string;
}): Promise<string> {
  const db = authedClient(input.env, input.actorToken);
  const { data, error } = await db.rpc("create_collab_consultation", {
    p_counterpart_id: input.counterpartId,
    p_purpose: "other",
    p_first_message: input.body,
    p_counterpart_project_id: null,
    p_initiator_project_id: null,
  });
  if (error || !data) throw new Error(error?.message || "create failed");
  return String(data);
}

async function findOutbox(
  admin: ReturnType<typeof serviceClient>,
  userId: string,
  consultationId: string,
  createdAfterIso?: string,
) {
  const { data, error } = await admin
    .from("transactional_email_outbox")
    .select("id,status,template_key,to_email,payload,last_error,created_at")
    .eq("user_id", userId)
    .in("template_key", [
      "collab_consultation_new",
      "collab_consultation_message",
    ])
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw new Error(error.message);
  const afterMs = createdAfterIso
    ? Date.parse(createdAfterIso)
    : Number.NEGATIVE_INFINITY;
  return (data || []).find((row) => {
    const payload = row.payload as { consultation_id?: string } | null;
    if (payload?.consultation_id !== consultationId) return false;
    if (!Number.isFinite(afterMs)) return true;
    return Date.parse(String(row.created_at)) >= afterMs;
  });
}

async function cleanupConsultation(
  admin: ReturnType<typeof serviceClient>,
  consultationId: string,
  outboxId?: string,
  messageNeedle?: string,
) {
  // Pair identity reuses one consultation — never delete the thread itself.
  if (messageNeedle) {
    await admin
      .from("collab_consultation_messages")
      .delete()
      .eq("consultation_id", consultationId)
      .ilike("body", `%${messageNeedle}%`);
  }
  if (outboxId) {
    await admin.from("transactional_email_outbox").delete().eq("id", outboxId);
  }
  // Wipe leftover outbox rows for this consultation (pair reuse shares ids).
  const { data: allOutbox } = await admin
    .from("transactional_email_outbox")
    .select("id,payload")
    .in("template_key", [
      "collab_consultation_new",
      "collab_consultation_message",
    ])
    .limit(80);
  const ids = (allOutbox || [])
    .filter((row) => {
      const payload = row.payload as { consultation_id?: string } | null;
      return payload?.consultation_id === consultationId;
    })
    .map((row) => String(row.id));
  if (ids.length > 0) {
    await admin.from("transactional_email_outbox").delete().in("id", ids);
  }
}

async function main() {
  const env = loadPreviewE2EEnv();
  assertStagingOnly(env);
  const admin = serviceClient(env);
  const operationEmail = (
    env.FORGE_PREVIEW_E2E_EMAIL || DEFAULT_OPERATION_EMAIL
  )
    .trim()
    .toLowerCase();
  const operationPassword = requireEnv(env, "FORGE_PREVIEW_E2E_PASSWORD");
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
    marker: "preview-real-email-v1",
  });
  await ensureDeveloperProfile({
    env,
    userId: operation.userId,
    publicName: "Forge Operation",
    profile: "Staging E2E operation",
    marker: "preview-real-email-v1",
  });
  const actor = await ensureAuthUser({
    env,
    email: actorEmail,
    password: actorPassword,
    displayName: "Forge E2E Actor",
    marker: "preview-real-email-v1-actor",
  });
  const actorSession = await signInPassword({
    env,
    email: actorEmail,
    password: actorPassword,
  });
  const opSession = await signInPassword({
    env,
    email: operationEmail,
    password: operationPassword,
  });

  const results: Array<{ name: string; ok: boolean; detail?: string }> = [];
  const runId = `pref-${Date.now().toString(36)}`;

  const opDb = authedClient(env, opSession.accessToken);

  // A: ON → outbox
  await setNotifyEmail(opDb, operation.userId, {
    master: true,
    messages_collab: true,
    usage_relation: true,
    feedback_reciprocity: true,
  });
  const aBefore = new Date(Date.now() - 2500).toISOString();
  const aId = await createConsultation({
    env,
    actorToken: actorSession.accessToken,
    counterpartId: operation.userId,
    body: `${runId}-A private`,
  });
  const aOutbox = await findOutbox(admin, operation.userId, aId, aBefore);
  if (!aOutbox) throw new Error("A: expected outbox");
  const { data: aNotif } = await opDb
    .from("user_notifications")
    .select("id,type")
    .eq("consultation_id", aId)
    .in("type", ["consultation_new", "consultation_message"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!aNotif) throw new Error("A: expected in-app notification");
  results.push({ name: "A_on_enqueue", ok: true, detail: String(aOutbox.id) });
  await cleanupConsultation(admin, aId, String(aOutbox.id), `${runId}-A`);

  // B: master OFF → in-app yes, outbox no
  await setNotifyEmail(opDb, operation.userId, {
    master: false,
    messages_collab: true,
    usage_relation: true,
    feedback_reciprocity: true,
  });
  const bBefore = new Date(Date.now() - 2500).toISOString();
  const bId = await createConsultation({
    env,
    actorToken: actorSession.accessToken,
    counterpartId: operation.userId,
    body: `${runId}-B private`,
  });
  const bOutbox = await findOutbox(admin, operation.userId, bId, bBefore);
  const { data: bNotif } = await opDb
    .from("user_notifications")
    .select("id")
    .eq("consultation_id", bId)
    .in("type", ["consultation_new", "consultation_message"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!bNotif) throw new Error("B: expected in-app notification");
  if (bOutbox) throw new Error("B: outbox must not enqueue when master OFF");
  results.push({ name: "B_master_off", ok: true });
  await cleanupConsultation(admin, bId, undefined, `${runId}-B`);

  // C: messages category OFF
  await setNotifyEmail(opDb, operation.userId, {
    master: true,
    messages_collab: false,
    usage_relation: true,
    feedback_reciprocity: true,
  });
  const cBefore = new Date(Date.now() - 2500).toISOString();
  const cId = await createConsultation({
    env,
    actorToken: actorSession.accessToken,
    counterpartId: operation.userId,
    body: `${runId}-C private`,
  });
  const cOutbox = await findOutbox(admin, operation.userId, cId, cBefore);
  if (cOutbox) throw new Error("C: messages category OFF must not enqueue");
  results.push({ name: "C_category_off", ok: true });
  await cleanupConsultation(admin, cId, undefined, `${runId}-C`);

  // D: enqueue ON then OFF before send → suppressed
  await setNotifyEmail(opDb, operation.userId, {
    master: true,
    messages_collab: true,
    usage_relation: true,
    feedback_reciprocity: true,
  });
  const dBefore = new Date(Date.now() - 2500).toISOString();
  const dId = await createConsultation({
    env,
    actorToken: actorSession.accessToken,
    counterpartId: operation.userId,
    body: `${runId}-D private`,
  });
  const dOutbox = await findOutbox(admin, operation.userId, dId, dBefore);
  if (!dOutbox) throw new Error("D: expected pending outbox");
  await setNotifyEmail(opDb, operation.userId, {
    master: false,
    messages_collab: true,
    usage_relation: true,
    feedback_reciprocity: true,
  });
  // Prefer evaluate path without Resend when keys redacted
  const { data: evalRows, error: evalError } = await admin.rpc(
    "evaluate_transactional_email_outbox_row",
    { p_outbox_id: dOutbox.id },
  );
  if (evalError) throw new Error(evalError.message);
  const evaluation = Array.isArray(evalRows) ? evalRows[0] : evalRows;
  if (evaluation?.allowed) throw new Error("D: expected send blocked");
  const { data: dAfter } = await admin
    .from("transactional_email_outbox")
    .select("status,last_error")
    .eq("id", dOutbox.id)
    .maybeSingle();
  if (dAfter?.status !== "suppressed") {
    throw new Error(`D: expected suppressed got ${dAfter?.status}`);
  }
  results.push({ name: "D_send_time_suppress", ok: true });
  // Keep suppressed row through E to prove no backfill on re-ON.
  const dSuppressedId = String(dOutbox.id);

  // E: re-ON → new event enqueues (no backfill of suppressed)
  await setNotifyEmail(opDb, operation.userId, {
    master: true,
    messages_collab: true,
    usage_relation: true,
    feedback_reciprocity: true,
  });
  const { data: dStill } = await admin
    .from("transactional_email_outbox")
    .select("status")
    .eq("id", dSuppressedId)
    .maybeSingle();
  if (dStill?.status !== "suppressed") {
    throw new Error(`E: D row must remain suppressed, got ${dStill?.status}`);
  }
  const eBefore = new Date(Date.now() - 2500).toISOString();
  const eId = await createConsultation({
    env,
    actorToken: actorSession.accessToken,
    counterpartId: operation.userId,
    body: `${runId}-E private`,
  });
  const eOutbox = await findOutbox(admin, operation.userId, eId, eBefore);
  if (!eOutbox) throw new Error("E: expected outbox after re-ON");
  if (String(eOutbox.id) === dSuppressedId) {
    throw new Error("E: must not reuse suppressed outbox id");
  }
  results.push({ name: "E_reon_new_event", ok: true, detail: String(eOutbox.id) });
  await cleanupConsultation(admin, dId, dSuppressedId, `${runId}-D`);
  await cleanupConsultation(admin, eId, String(eOutbox.id), `${runId}-E`);

  // Restore defaults ON for operation user
  await setNotifyEmail(opDb, operation.userId, {
    master: true,
    messages_collab: true,
    usage_relation: true,
    feedback_reciprocity: true,
  });

  void actor;

  console.log(JSON.stringify({ ok: true, runId, results }, null, 2));
}

main().catch((cause) => {
  console.error(
    "[email-pref-e2e] FAIL",
    cause instanceof Error ? cause.message : cause,
  );
  process.exit(1);
});
