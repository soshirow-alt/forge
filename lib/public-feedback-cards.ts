import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePlayableVersion } from "@/lib/playable-version";

export type PublicFeedbackCardKind = "voice_supplement" | "short_text" | "detailed";

export type PublicFeedbackAuthorKind = "guest" | "registered";

export type PublicFeedbackCard = {
  cardId: string;
  cardKind: PublicFeedbackCardKind;
  versionKey: string;
  createdAt: string;
  authorKind: PublicFeedbackAuthorKind;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  authorXUsername: string | null;
  promptText: string | null;
  bodyText: string | null;
  /** voice_supplement — related choice answer label (not the card body) */
  choiceAnswerLabel?: string | null;
  goodPoints: string | null;
  concerns: string | null;
  bugs: string | null;
  otherNotes: string | null;
  empathyCount: number;
};

export type PublicFeedbackCardsResult = {
  cards: PublicFeedbackCard[];
  playableVersion: string;
  availableVersions: string[];
};

type PublicFeedbackCardRow = {
  card_id: string;
  card_kind: string;
  created_at: string;
  author_kind: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  author_x_username?: string | null;
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

function rowToCard(row: PublicFeedbackCardRow, versionKey: string): PublicFeedbackCard | null {
  if (!isPublicFeedbackCardKind(row.card_kind)) {
    return null;
  }
  if (!isPublicFeedbackAuthorKind(row.author_kind)) {
    return null;
  }

  return {
    cardId: row.card_id,
    cardKind: row.card_kind,
    versionKey,
    createdAt: row.created_at,
    authorKind: row.author_kind,
    authorDisplayName: row.author_display_name,
    authorAvatarUrl: row.author_avatar_url,
    authorXUsername: row.author_x_username?.trim() || null,
    promptText: row.prompt_text,
    bodyText: row.body_text,
    goodPoints: row.good_points,
    concerns: row.concerns,
    bugs: row.bugs,
    otherNotes: row.other_notes,
    empathyCount: Number(row.empathy_count) || 0,
  };
}

/** Legacy direct-RPC fetch — prefer fetchPublicFeedbackCardsFromApi for enriched cards. */
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
    .map((row) => rowToCard(row, version))
    .filter((card): card is PublicFeedbackCard => card !== null);
}

export async function fetchPublicFeedbackCardsFromApi(
  projectId: string,
  versionKey: string | "all",
  options?: { limit?: number },
): Promise<PublicFeedbackCardsResult> {
  const params = new URLSearchParams();
  params.set("version", versionKey === "all" ? "all" : resolvePlayableVersion(versionKey));
  if (options?.limit) {
    params.set("limit", String(options.limit));
  }

  const response = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/public-feedback-cards?${params.toString()}`,
  );

  const body = (await response.json()) as
    | ({
        ok: true;
        cards: PublicFeedbackCard[];
        playableVersion: string;
        availableVersions: string[];
      })
    | { ok: false; message?: string };

  if (!response.ok || !body.ok) {
    return {
      cards: [],
      playableVersion: resolvePlayableVersion(undefined),
      availableVersions: [],
    };
  }

  return {
    cards: body.cards,
    playableVersion: body.playableVersion,
    availableVersions: body.availableVersions,
  };
}
