import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicXProfile } from "@/lib/x-auth";

type PublicXProfileRow = {
  x_username: string | null;
  x_display_name: string | null;
  x_avatar_url: string | null;
};

export type OwnXProfileRow = PublicXProfileRow & {
  x_user_id: string;
  x_connected_at: string;
  x_last_synced_at: string;
};

function mapPublicRow(row: PublicXProfileRow | null | undefined): PublicXProfile | null {
  const username = row?.x_username?.trim();
  if (!username) {
    return null;
  }

  return {
    xUsername: username.replace(/^@/, ""),
    xDisplayName: row?.x_display_name?.trim() || null,
    xAvatarUrl: row?.x_avatar_url?.trim() || null,
  };
}

export async function fetchOwnXProfile(
  supabase: SupabaseClient,
): Promise<OwnXProfileRow | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_x_profiles")
    .select("x_user_id,x_username,x_display_name,x_avatar_url,x_connected_at,x_last_synced_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as OwnXProfileRow;
}

export async function fetchPublicXProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<PublicXProfile | null> {
  const { data, error } = await supabase.rpc("get_public_x_profile", {
    p_user_id: userId,
  });

  if (error) {
    return null;
  }

  const row = Array.isArray(data) ? (data[0] as PublicXProfileRow | undefined) : null;
  return mapPublicRow(row);
}

export async function fetchPublicXProfiles(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Map<string, PublicXProfile>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase.rpc("get_public_x_profiles", {
    p_user_ids: uniqueIds,
  });

  if (error || !data) {
    return new Map();
  }

  const profiles = new Map<string, PublicXProfile>();
  for (const row of data as Array<PublicXProfileRow & { user_id: string }>) {
    const mapped = mapPublicRow(row);
    if (mapped) {
      profiles.set(row.user_id, mapped);
    }
  }

  return profiles;
}
