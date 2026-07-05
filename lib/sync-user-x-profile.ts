import type { SupabaseClient } from "@supabase/supabase-js";
import { extractXProfileFromAuthUser } from "@/lib/x-auth";

export type SyncUserXProfileResult =
  | { ok: true; synced: boolean }
  | { ok: false; code: "no_user" | "x_account_already_linked" | "sync_failed" };

export async function syncUserXProfileAfterAuth(
  supabase: SupabaseClient,
): Promise<SyncUserXProfileResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, code: "no_user" };
  }

  const payload = extractXProfileFromAuthUser(user);
  if (!payload) {
    return { ok: true, synced: false };
  }

  const { error: rpcError } = await supabase.rpc("upsert_own_x_profile", {
    p_x_user_id: payload.xUserId,
    p_x_username: payload.xUsername,
    p_x_display_name: payload.xDisplayName,
    p_x_avatar_url: payload.xAvatarUrl,
  });

  if (rpcError) {
    const message = rpcError.message.toLowerCase();
    if (message.includes("x_account_already_linked")) {
      return { ok: false, code: "x_account_already_linked" };
    }
    return { ok: false, code: "sync_failed" };
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const updates: Record<string, string> = {};

  if (!String(meta.display_name ?? "").trim() && payload.xDisplayName) {
    updates.display_name = payload.xDisplayName;
  }

  const existingAvatar = String(meta.avatar_url ?? meta.picture ?? "").trim();
  if (!existingAvatar && payload.xAvatarUrl) {
    updates.avatar_url = payload.xAvatarUrl;
  }

  if (Object.keys(updates).length > 0) {
    await supabase.auth.updateUser({ data: updates });
  }

  return { ok: true, synced: true };
}
