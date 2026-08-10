/**
 * Staging-only: ensure forge.operation can open a complete /messages example thread.
 * Tag: forge-msg-fixture-operation-v1
 * Uses SECURITY DEFINER RPCs (service_role has no table DML on collab_*).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createCollabConsultation,
  fetchCollabConsultationDetail,
  listMyCollabConsultations,
  sendCollabConsultationMessage,
} from "@/lib/supabase/collab-consultations-db";

export const OPERATION_MESSENGER_FIXTURE_MARKER = "forge-msg-fixture-operation-v1";

export async function ensureOperationMessengerFixture(input: {
  actorDb: SupabaseClient;
  operationDb: SupabaseClient;
  operationUserId: string;
}): Promise<{ consultationId: string; reused: boolean }> {
  const existing = await listMyCollabConsultations(input.actorDb);
  for (const row of existing) {
    if (row.counterpartId !== input.operationUserId) continue;
    const detail = await fetchCollabConsultationDetail(
      input.actorDb,
      row.consultationId,
    );
    if (!detail) continue;
    if (
      detail.messages.some((message) =>
        message.body.includes(OPERATION_MESSENGER_FIXTURE_MARKER),
      )
    ) {
      return { consultationId: row.consultationId, reused: true };
    }
  }

  const consultationId = await createCollabConsultation(input.actorDb, {
    counterpartId: input.operationUserId,
    purpose: "other",
    firstMessage: `[${OPERATION_MESSENGER_FIXTURE_MARKER}] Preview QA用のサンプルです。利用条件について相談できますか？`,
  });
  await sendCollabConsultationMessage(
    input.operationDb,
    consultationId,
    "もちろんです。用途と期間を教えてください。",
  );
  await sendCollabConsultationMessage(
    input.actorDb,
    consultationId,
    "個人制作のデモ向けです。詳細はメッセージで詰めましょう。",
  );
  return { consultationId, reused: false };
}
