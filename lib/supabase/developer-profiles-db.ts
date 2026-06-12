import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createDeveloperProfile,
  type DeveloperProfile,
  type DeveloperProfileInput,
} from "@/lib/developer-profiles";
import type { DeveloperProfileRow } from "@/lib/supabase/schema";

function profileRowToDeveloperProfile(row: DeveloperProfileRow): DeveloperProfile {
  return {
    userId: row.user_id,
    creatorId: row.creator_id,
    publicName: row.public_name,
    profile: row.profile,
    xAccount: row.x_account ?? undefined,
    website: row.website ?? undefined,
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
    .upsert(
      {
        user_id: profile.userId,
        creator_id: profile.creatorId,
        public_name: profile.publicName,
        profile: profile.profile,
        x_account: profile.xAccount ?? null,
        website: profile.website ?? null,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return profileRowToDeveloperProfile(data as DeveloperProfileRow);
}
