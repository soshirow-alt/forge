/**
 * Staging-only hygiene: prune ephemeral actor↔operation message noise.
 * Keeps forge-msg-fixture-operation-v1 thread only (or recreates it).
 *
 * Usage:
 *   npx --yes tsx scripts/staging-only/cleanup-operation-messenger-ephemeral.ts
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
import {
  ensureOperationMessengerFixture,
  OPERATION_MESSENGER_FIXTURE_MARKER,
} from "./lib/operation-messenger-fixture";
import { listMyCollabConsultations } from "@/lib/supabase/collab-consultations-db";

const MARKER = "preview-real-email-v1";
const ACTOR_EMAIL_DEFAULT = "forge.e2e.actor.staging@example.invalid";

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
  const opDb = authedClient(env, opSession.accessToken);
  const actorDb = authedClient(env, actorSession.accessToken);

  const before = await listMyCollabConsultations(opDb);
  const pairRows = before.filter((row) => row.counterpartId === actor.userId);

  // Soft-close is not enough for list hygiene after 099 aggregation —
  // delete ephemeral pair consultations except fixture (via postgres MCP ideally).
  // Here: use admin only if grants allow; otherwise report ids for MCP.
  const fixture = await ensureOperationMessengerFixture({
    actorDb,
    operationDb: opDb,
    operationUserId: operation.userId,
  });

  const keepIds = new Set<string>([fixture.consultationId]);
  const { data: allPair, error } = await admin
    .from("collab_consultations")
    .select("id")
    .or(
      `and(initiator_id.eq.${actor.userId},counterpart_id.eq.${operation.userId}),and(initiator_id.eq.${operation.userId},counterpart_id.eq.${actor.userId})`,
    );
  if (error) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          reason: "admin_select_denied",
          message: error.message,
          pairCountBefore: pairRows.length,
          fixtureId: fixture.consultationId,
          hint: "Use Staging MCP DELETE for ephemeral pair consultations except fixture",
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  let deleted = 0;
  for (const row of allPair || []) {
    const id = String(row.id);
    if (keepIds.has(id)) continue;
    await admin.from("user_notifications").delete().eq("consultation_id", id);
    await admin.from("collab_consultation_messages").delete().eq("consultation_id", id);
    await admin.from("collab_consultation_reads").delete().eq("consultation_id", id);
    await admin.from("collab_consultations").delete().eq("id", id);
    deleted += 1;
  }

  // Clear old unread notifications for operation on kept fixture only partially —
  // dismiss non-fixture consultation notifications already deleted by cascade/delete.

  const after = await listMyCollabConsultations(opDb);
  console.log(
    JSON.stringify(
      {
        ok: true,
        marker: OPERATION_MESSENGER_FIXTURE_MARKER,
        pairCountBefore: pairRows.length,
        deleted,
        fixtureId: fixture.consultationId,
        listCountAfter: after.length,
      },
      null,
      2,
    ),
  );
}

main().catch((cause) => {
  console.error(
    "[cleanup-operation-messenger] FAIL",
    cause instanceof Error ? cause.message : cause,
  );
  process.exit(1);
});
