import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CollabConsultation,
  CollabConsultationContext,
  CollabConsultationMessage,
  CollabConsultationPurpose,
  CollabConsultationSummary,
} from "@/lib/collab/consultation-types";

function mapConsultation(row: Record<string, unknown>): CollabConsultation {
  return {
    id: String(row.id),
    initiatorId: String(row.initiator_id),
    counterpartId: String(row.counterpart_id),
    purpose: row.purpose as CollabConsultationPurpose,
    initiatorProjectId: row.initiator_project_id
      ? String(row.initiator_project_id)
      : null,
    counterpartProjectId: row.counterpart_project_id
      ? String(row.counterpart_project_id)
      : null,
    status: row.status as CollabConsultation["status"],
    lastMessageAt: row.last_message_at ? String(row.last_message_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapContext(row: Record<string, unknown>): CollabConsultationContext {
  return {
    consultationId: String(row.id),
    purpose: row.purpose as CollabConsultationPurpose,
    initiatorProjectId: row.initiator_project_id
      ? String(row.initiator_project_id)
      : null,
    counterpartProjectId: row.counterpart_project_id
      ? String(row.counterpart_project_id)
      : null,
    createdAt: String(row.created_at),
  };
}

function mapMessage(message: Record<string, unknown>): CollabConsultationMessage {
  return {
    id: String(message.id),
    consultationId: String(message.consultation_id),
    senderId: String(message.sender_id),
    body: String(message.body),
    createdAt: String(message.created_at),
  };
}

export async function createCollabConsultation(
  supabase: SupabaseClient,
  input: {
    counterpartId: string;
    purpose: CollabConsultationPurpose;
    firstMessage: string;
    initiatorProjectId?: string | null;
    counterpartProjectId?: string | null;
  },
): Promise<string> {
  const { data, error } = await supabase.rpc("create_collab_consultation", {
    p_counterpart_id: input.counterpartId,
    p_purpose: input.purpose,
    p_first_message: input.firstMessage,
    p_initiator_project_id: input.initiatorProjectId ?? null,
    p_counterpart_project_id: input.counterpartProjectId ?? null,
  });
  if (error) throw error;
  return String(data);
}

export async function sendCollabConsultationMessage(
  supabase: SupabaseClient,
  consultationId: string,
  body: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("send_collab_consultation_message", {
    p_consultation_id: consultationId,
    p_body: body,
  });
  if (error) throw error;
  return String(data);
}

export async function listMyCollabConsultations(
  supabase: SupabaseClient,
): Promise<CollabConsultationSummary[]> {
  const { data, error } = await supabase.rpc("list_my_collab_consultations");
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    consultationId: String(row.consultation_id),
    counterpartId: String(row.counterpart_id),
    purpose: row.purpose as CollabConsultationPurpose,
    initiatorProjectId: row.initiator_project_id
      ? String(row.initiator_project_id)
      : null,
    counterpartProjectId: row.counterpart_project_id
      ? String(row.counterpart_project_id)
      : null,
    status: row.status as CollabConsultationSummary["status"],
    lastMessageBody: row.last_message_body ? String(row.last_message_body) : null,
    lastMessageSenderId: row.last_message_sender_id
      ? String(row.last_message_sender_id)
      : null,
    lastMessageAt: row.last_message_at ? String(row.last_message_at) : null,
    unreadCount: Number(row.unread_count ?? 0),
    createdAt: String(row.created_at),
  }));
}

/** All consultation ids for the unordered participant pair of the seed row. */
export async function listPairConsultationIds(
  supabase: SupabaseClient,
  consultation: Pick<CollabConsultation, "initiatorId" | "counterpartId">,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("collab_consultations")
    .select("id")
    .or(
      `and(initiator_id.eq.${consultation.initiatorId},counterpart_id.eq.${consultation.counterpartId}),and(initiator_id.eq.${consultation.counterpartId},counterpart_id.eq.${consultation.initiatorId})`,
    );
  if (error) throw error;
  return (data ?? []).map((row) => String(row.id));
}

export async function fetchCollabConsultationDetail(
  supabase: SupabaseClient,
  consultationId: string,
): Promise<{
  consultation: CollabConsultation;
  messages: CollabConsultationMessage[];
  pairConsultationIds: string[];
  pairContexts: CollabConsultationContext[];
} | null> {
  const consultationResult = await supabase
    .from("collab_consultations")
    .select("*")
    .eq("id", consultationId)
    .maybeSingle();
  if (consultationResult.error) throw consultationResult.error;
  if (!consultationResult.data) return null;

  const seed = mapConsultation(
    consultationResult.data as Record<string, unknown>,
  );
  const pairConsultationIds = await listPairConsultationIds(supabase, seed);
  const ids = pairConsultationIds.length ? pairConsultationIds : [seed.id];

  const pairRowsResult = await supabase
    .from("collab_consultations")
    .select(
      "id, purpose, initiator_project_id, counterpart_project_id, created_at, status, initiator_id, counterpart_id, last_message_at, updated_at",
    )
    .in("id", ids)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (pairRowsResult.error) throw pairRowsResult.error;

  const pairRows = (pairRowsResult.data ?? []) as Record<string, unknown>[];
  const pairContexts = pairRows.map(mapContext);
  const openRow = pairRows.find((row) => row.status === "open");
  const consultation = openRow ? mapConsultation(openRow) : seed;

  const messagesResult = await supabase
    .from("collab_consultation_messages")
    .select("*")
    .in("consultation_id", ids)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (messagesResult.error) throw messagesResult.error;

  return {
    consultation,
    pairConsultationIds: ids,
    pairContexts,
    messages: (messagesResult.data ?? []).map((message) =>
      mapMessage(message as Record<string, unknown>),
    ),
  };
}

export async function markCollabConsultationRead(
  supabase: SupabaseClient,
  consultationId: string,
): Promise<void> {
  const { error } = await supabase.rpc("mark_collab_consultation_read", {
    p_consultation_id: consultationId,
  });
  if (error) throw error;
}

export async function closeCollabConsultation(
  supabase: SupabaseClient,
  consultationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("collab_consultations")
    .update({ status: "closed" })
    .eq("id", consultationId);
  if (error) throw error;
}
