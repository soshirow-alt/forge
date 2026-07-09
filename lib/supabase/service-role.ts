import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseWriteAllowed } from "./write-guard";

export function createServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  assertSupabaseWriteAllowed("createServiceRoleClient");

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
