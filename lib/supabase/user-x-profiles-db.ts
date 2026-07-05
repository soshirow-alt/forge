import type { SupabaseClient } from "@supabase/supabase-js";

type OwnXProfileRow = {
  x_user_id: string;
  x_username: string | null;
  x_display_name: string | null;
  x_avatar_url: string | null;
  x_connected_at: string;
  x_last_synced_at: string;
};

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

