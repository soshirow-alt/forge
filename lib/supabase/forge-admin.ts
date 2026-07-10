import type { SupabaseClient } from "@supabase/supabase-js";

export async function isForgeAdmin(
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_forge_admin");
  if (error) {
    console.error("is_forge_admin rpc failed", error);
    return false;
  }
  return data === true;
}
