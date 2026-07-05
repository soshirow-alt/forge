import type { User as SupabaseUser } from "@supabase/supabase-js";
import { isProductionReleaseMode } from "@/lib/production-mode";

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

/** preview-landing-01 ホスト/ブランチ — FORGE_PRODUCTION_MODE 強制時も Preview E2E 用に X を出す */
function isPreviewLanding01Surface(host?: string): boolean {
  const resolved =
    host ??
    (typeof window !== "undefined" ? window.location.hostname : undefined);
  if (resolved?.includes("preview-landing-01")) {
    return true;
  }

  const vercelUrl =
    process.env.VERCEL_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl?.includes("preview-landing-01")) {
    return true;
  }

  const refs = [
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF,
    process.env.VERCEL_GIT_COMMIT_REF,
  ];
  return refs.some((ref) => ref === "preview/landing-01");
}

/** Preview branch は E2E 用に常に表示。local 未設定は ON。本番 release は true 明示まで OFF。 */
export function isXAuthEnabled(): boolean {
  if (isPreviewLanding01Surface()) {
    return true;
  }

  const flag = process.env.NEXT_PUBLIC_X_AUTH_ENABLED;
  if (flag === "true") {
    return true;
  }
  if (flag === "false") {
    return false;
  }
  return !isProductionReleaseMode();
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
