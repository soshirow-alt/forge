import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createDeveloperProfile,
  type DeveloperProfile,
  type DeveloperProfileInput,
} from "@/lib/developer-profiles";
import { mapProjectSubmitErrorMessage } from "@/lib/error-message";
import { normalizeExternalUrlForDb } from "@/lib/game-links";
import type { DeveloperProfileRow } from "@/lib/supabase/schema";

function profileRowToDeveloperProfile(row: DeveloperProfileRow): DeveloperProfile {
  return {
    userId: row.user_id,
    creatorId: row.creator_id,
    publicName: row.public_name,
    profile: row.profile,
    xAccount: row.x_account ?? undefined,
    website: row.website ?? undefined,
    discordUrl: row.discord_url ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
  };
}

function profileToRow(profile: DeveloperProfile) {
  return {
    user_id: profile.userId,
    creator_id: profile.creatorId,
    public_name: profile.publicName,
    profile: profile.profile,
    x_account: profile.xAccount ?? null,
    website: profile.website ?? null,
    discord_url: profile.discordUrl ?? null,
    youtube_url: profile.youtubeUrl ?? null,
  };
}

export async function fetchDeveloperProfiles(
  supabase: SupabaseClient,
): Promise<DeveloperProfile[]> {
  const { data, error } = await supabase
    .from("developer_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as DeveloperProfileRow[]).map(profileRowToDeveloperProfile);
}

export async function upsertDeveloperProfile(
  supabase: SupabaseClient,
  userId: string,
  input: DeveloperProfileInput,
): Promise<DeveloperProfile> {
  const profile = createDeveloperProfile(userId, input);

  const { data, error } = await supabase
    .from("developer_profiles")
    .upsert(profileToRow(profile), { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(mapProjectSubmitErrorMessage(error));
  }

  return profileRowToDeveloperProfile(data as DeveloperProfileRow);
}

export type DeveloperProfileSocialPatch = {
  discordUrl?: string;
  youtubeUrl?: string;
  xUrl?: string;
  officialUrl?: string;
};

/** Copy non-empty project social URLs onto developer_profiles (developer-wide defaults). */
export async function mergeDeveloperProfileSocialLinks(
  supabase: SupabaseClient,
  userId: string,
  patch: DeveloperProfileSocialPatch,
): Promise<void> {
  const discord = normalizeExternalUrlForDb(patch.discordUrl);
  const youtube = normalizeExternalUrlForDb(patch.youtubeUrl);
  const xRaw = patch.xUrl?.trim();
  const website = normalizeExternalUrlForDb(patch.officialUrl);

  if (!discord && !youtube && !xRaw && !website) {
    return;
  }

  const { data: existing, error: fetchError } = await supabase
    .from("developer_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!existing) {
    return;
  }

  const row = existing as DeveloperProfileRow;
  const updates: Partial<DeveloperProfileRow> = {};

  if (discord) {
    updates.discord_url = discord;
  }
  if (youtube) {
    updates.youtube_url = youtube;
  }
  if (xRaw) {
    updates.x_account = xRaw.startsWith("http") ? xRaw : xRaw.replace(/^@/, "");
  }
  if (website) {
    updates.website = website;
  }

  const { error: updateError } = await supabase
    .from("developer_profiles")
    .update(updates)
    .eq("user_id", userId);

  if (updateError) {
    throw updateError;
  }
}
