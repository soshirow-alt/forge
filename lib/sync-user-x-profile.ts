import type { SupabaseClient } from "@supabase/supabase-js";
import { mapRpcErrorMessage, type OAuthCallbackFailReason } from "@/lib/oauth-callback-errors";
import { extractXProfileFromAuthUser } from "@/lib/x-auth";

export type SyncUserXProfileResult =
  | { ok: true; synced: boolean }
  | { ok: false; code: OAuthCallbackFailReason; detail?: string };

export async function syncUserXProfileAfterAuth(
  supabase: SupabaseClient,
  options?: { requireXIdentity?: boolean },
): Promise<SyncUserXProfileResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      ok: false,
      code: "missing_user",
      detail: userError.message,
    };
  }

  if (!user) {
    return { ok: false, code: "missing_user" };
  }

  const payload = extractXProfileFromAuthUser(user);
  if (!payload) {
    if (options?.requireXIdentity) {
      const identity = user.identities?.find((item) =>
        item.provider === "x" || item.provider === "twitter",
      );
      if (!identity) {
        return { ok: false, code: "missing_x_identity" };
      }

      const data = (identity.identity_data ?? {}) as Record<string, unknown>;
      const hasUserId = Boolean(
        identity.id ||
          data.sub ||
          data.provider_id ||
          data.id,
      );
      const hasUsername = Boolean(
        data.preferred_username ||
          data.user_name ||
          data.screen_name ||
          data.nickname,
      );

      if (!hasUserId) {
        return { ok: false, code: "missing_x_user_id" };
      }
      if (!hasUsername) {
        return { ok: false, code: "missing_x_username" };
      }

      return { ok: false, code: "missing_x_identity" };
    }

    return { ok: true, synced: false };
  }

  const { error: rpcError } = await supabase.rpc("upsert_own_x_profile", {
    p_x_user_id: payload.xUserId,
    p_x_username: payload.xUsername,
    p_x_display_name: payload.xDisplayName,
    p_x_avatar_url: payload.xAvatarUrl,
  });

  if (rpcError) {
    return {
      ok: false,
      code: mapRpcErrorMessage(rpcError.message),
      detail: rpcError.message,
    };
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
