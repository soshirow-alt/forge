import type { User as SupabaseUser } from "@supabase/supabase-js";

export type XProfilePayload = {
  xUserId: string;
  xUsername: string;
  xDisplayName: string | null;
  xAvatarUrl: string | null;
};

export type PublicXProfile = {
  xUsername: string;
  xDisplayName: string | null;
  xAvatarUrl: string | null;
};

const X_PROVIDER_IDS = new Set(["x", "twitter"]);

/** Preview/本番で Supabase X Provider 有効化後にのみ true。未設定時は X 導線を出さない。 */
export function isXAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_X_AUTH_ENABLED === "true";
}

export function isXProviderId(provider: string | undefined | null): boolean {
  return Boolean(provider && X_PROVIDER_IDS.has(provider));
}

export function findXIdentity(user: SupabaseUser) {
  return user.identities?.find((identity) => isXProviderId(identity.provider)) ?? null;
}

export function hasLinkedXIdentity(user: SupabaseUser): boolean {
  return Boolean(findXIdentity(user));
}

export function formatXUsername(username: string | null | undefined): string | null {
  const trimmed = username?.trim().replace(/^@/, "") ?? "";
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, 50);
}

export function formatXHandleLabel(username: string | null | undefined): string | null {
  const normalized = formatXUsername(username);
  return normalized ? `@${normalized}` : null;
}

function readString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

export function extractXProfileFromAuthUser(user: SupabaseUser): XProfilePayload | null {
  const identity = findXIdentity(user);
  const identityData = (identity?.identity_data ?? {}) as Record<string, unknown>;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  const xUserId = readString(identityData, ["sub", "provider_id", "id"]) ||
    readString(meta, ["sub", "provider_id"]);

  const xUsername = formatXUsername(
    readString(identityData, ["preferred_username", "user_name"]) ||
      readString(meta, ["preferred_username", "user_name"]),
  );

  if (!xUserId || !xUsername) {
    return null;
  }

  const xDisplayName =
    readString(identityData, ["name", "full_name"]) || readString(meta, ["name", "full_name"]) ||
    null;
  const xAvatarUrl =
    readString(identityData, ["picture", "avatar_url"]) ||
    readString(meta, ["picture", "avatar_url"]) ||
    null;

  return {
    xUserId,
    xUsername,
    xDisplayName: xDisplayName || null,
    xAvatarUrl: xAvatarUrl || null,
  };
}
