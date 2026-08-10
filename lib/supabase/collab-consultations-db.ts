import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CollabConsultation,
  CollabConsultationMessage,
  CollabConsultationPurpose,
  CollabConsultationSummary,
} from "@/lib/collab/consultation-types";

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

export async function fetchCollabConsultationDetail(
  supabase: SupabaseClient,
  consultationId: string,
): Promise<{
  consultation: CollabConsultation;
  messages: CollabConsultationMessage[];
} | null> {
  const [consultationResult, messagesResult] = await Promise.all([
    supabase
      .from("collab_consultations")
      .select("*")
      .eq("id", consultationId)
      .maybeSingle(),
    supabase
      .from("collab_consultation_messages")
      .select("*")
      .eq("consultation_id", consultationId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
  ]);
  if (consultationResult.error) throw consultationResult.error;
  if (messagesResult.error) throw messagesResult.error;
  if (!consultationResult.data) return null;
  const row = consultationResult.data as Record<string, unknown>;
  return {
    consultation: {
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
    },
    messages: (messagesResult.data ?? []).map((message) => ({
      id: String(message.id),
      consultationId: String(message.consultation_id),
      senderId: String(message.sender_id),
      body: String(message.body),
      createdAt: String(message.created_at),
    })),
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
