import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePlayableVersion } from "@/lib/playable-version";

export type PublicFeedbackCardKind = "voice_supplement" | "short_text" | "detailed";

export type PublicFeedbackAuthorKind = "guest" | "registered";

export type PublicFeedbackCard = {
  cardId: string;
  cardKind: PublicFeedbackCardKind;
  createdAt: string;
  authorKind: PublicFeedbackAuthorKind;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  promptText: string | null;
  bodyText: string | null;
  goodPoints: string | null;
  concerns: string | null;
  bugs: string | null;
  otherNotes: string | null;
  empathyCount: number;
};

type PublicFeedbackCardRow = {
  card_id: string;
  card_kind: string;
  created_at: string;
  author_kind: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  prompt_text: string | null;
  body_text: string | null;
  good_points: string | null;
  concerns: string | null;
  bugs: string | null;
  other_notes: string | null;
  empathy_count: number | string;
};

function isPublicFeedbackCardKind(value: string): value is PublicFeedbackCardKind {
  return value === "voice_supplement" || value === "short_text" || value === "detailed";
}

function isPublicFeedbackAuthorKind(value: string): value is PublicFeedbackAuthorKind {
  return value === "guest" || value === "registered";
}

function rowToCard(row: PublicFeedbackCardRow): PublicFeedbackCard | null {
  if (!isPublicFeedbackCardKind(row.card_kind)) {
    return null;
  }
  if (!isPublicFeedbackAuthorKind(row.author_kind)) {
    return null;
  }

  return {
    cardId: row.card_id,
    cardKind: row.card_kind,
    createdAt: row.created_at,
    authorKind: row.author_kind,
    authorDisplayName: row.author_display_name,
    authorAvatarUrl: row.author_avatar_url,
    promptText: row.prompt_text,
    bodyText: row.body_text,
    goodPoints: row.good_points,
    concerns: row.concerns,
    bugs: row.bugs,
    otherNotes: row.other_notes,
    empathyCount: Number(row.empathy_count) || 0,
  };
}

export async function fetchPublicFeedbackCards(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  options?: { limit?: number; offset?: number; includeGuest?: boolean },
): Promise<PublicFeedbackCard[]> {
  const version = resolvePlayableVersion(versionKey);
  const rpcArgs: {
    p_project_id: string;
    p_version_key: string;
    p_include_guest?: boolean;
    p_limit?: number;
    p_offset?: number;
  } = {
    p_project_id: projectId,
    p_version_key: version,
    p_limit: options?.limit ?? 50,
    p_offset: options?.offset ?? 0,
  };

  if (options?.includeGuest === false) {
    rpcArgs.p_include_guest = false;
  }

  const { data, error } = await supabase.rpc("get_public_feedback_cards", rpcArgs);

  if (error) {
    return [];
  }

  return ((data ?? []) as PublicFeedbackCardRow[])
    .map(rowToCard)
    .filter((card): card is PublicFeedbackCard => card !== null);
}
