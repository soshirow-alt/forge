/**
 * Staging-only: ensure forge.operation can open a complete /messages example thread.
 * Tag: forge-msg-fixture-operation-v1
 * Does not touch Production.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const OPERATION_MESSENGER_FIXTURE_ID =
  "cccccccc-cccc-4ccc-8ccc-00000000e001";
export const OPERATION_MESSENGER_FIXTURE_MARKER = "forge-msg-fixture-operation-v1";

const FIXED_MSG_IDS = [
  "dddddddd-dddd-4ddd-8ddd-00000000e101",
  "dddddddd-dddd-4ddd-8ddd-00000000e102",
  "dddddddd-dddd-4ddd-8ddd-00000000e103",
] as const;

export async function ensureOperationMessengerFixture(input: {
  admin: SupabaseClient;
  operationUserId: string;
  actorUserId: string;
}): Promise<{ consultationId: string; createdOrRefreshed: boolean }> {
  const consultationId = OPERATION_MESSENGER_FIXTURE_ID;
  const { operationUserId, actorUserId, admin } = input;

  // Remove prior messages/reads for idempotent refresh.
  await admin
    .from("collab_consultation_reads")
    .delete()
    .eq("consultation_id", consultationId);
  await admin
    .from("collab_consultation_messages")
    .delete()
    .eq("consultation_id", consultationId);
  await admin.from("collab_consultations").delete().eq("id", consultationId);

  const { error: consultError } = await admin.from("collab_consultations").insert({
    id: consultationId,
    initiator_id: actorUserId,
    counterpart_id: operationUserId,
    purpose: "other",
    status: "open",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    last_message_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  });
  if (consultError) throw new Error(consultError.message);

  const bodies = [
    `[${OPERATION_MESSENGER_FIXTURE_MARKER}] Preview QA用のサンプルです。利用条件について相談できますか？`,
    "もちろんです。用途と期間を教えてください。",
    "個人制作のデモ向けです。詳細はメッセージで詰めましょう。",
  ];
  const now = Date.now();
  const rows = FIXED_MSG_IDS.map((id, index) => ({
    id,
    consultation_id: consultationId,
    sender_id: index === 1 ? operationUserId : actorUserId,
    body: bodies[index],
    created_at: new Date(now - (120 - index * 40) * 60 * 1000).toISOString(),
  }));
  const { error: msgError } = await admin
    .from("collab_consultation_messages")
    .insert(rows);
  if (msgError) throw new Error(msgError.message);

  const { error: readError } = await admin.from("collab_consultation_reads").insert({
    consultation_id: consultationId,
    user_id: actorUserId,
    last_read_at: rows[2].created_at,
    last_read_message_id: FIXED_MSG_IDS[2],
  });
  if (readError) throw new Error(readError.message);

  return { consultationId, createdOrRefreshed: true };
}

/** Delete actor↔operation ephemeral smoke threads; keep fixture + optional keepIds. */
export async function pruneEphemeralOperationThreads(input: {
  admin: SupabaseClient;
  operationUserId: string;
  actorUserId: string;
  keepIds?: string[];
}): Promise<number> {
  const keep = new Set([
    OPERATION_MESSENGER_FIXTURE_ID,
    ...(input.keepIds || []),
  ]);
  const { data, error } = await input.admin
    .from("collab_consultations")
    .select("id,initiator_id,counterpart_id")
    .or(
      `and(initiator_id.eq.${input.actorUserId},counterpart_id.eq.${input.operationUserId}),and(initiator_id.eq.${input.operationUserId},counterpart_id.eq.${input.actorUserId})`,
    );
  if (error) throw new Error(error.message);
  const targets = (data || [])
    .map((row) => String(row.id))
    .filter((id) => !keep.has(id));
  for (const id of targets) {
    await input.admin
      .from("collab_consultation_messages")
      .delete()
      .eq("consultation_id", id);
    await input.admin
      .from("collab_consultation_reads")
      .delete()
      .eq("consultation_id", id);
    await input.admin.from("user_notifications").delete().eq("consultation_id", id);
    await input.admin.from("collab_consultations").delete().eq("id", id);
  }
  return targets.length;
}
