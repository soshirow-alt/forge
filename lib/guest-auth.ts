import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

/** Default landing after guest entry-mode selection when return URL is absent or not allowed. */
export const DEFAULT_POST_GUEST_LOGIN_PATH = "/home";

export const ACCOUNT_REGISTRATION_REQUIRED_NOTICE = "account-required";

export const ACCOUNT_REGISTRATION_REQUIRED_MESSAGE =
  "この機能を使うにはアカウント登録が必要です。";

/** Routes that require a registered Supabase account in all deployment modes. */
export const REGISTERED_ACCOUNT_REQUIRED_PREFIXES = [
  "/studio",
  "/mypage",
  "/notifications",
  "/settings",
  "/submit",
  "/my-projects",
  "/bookmarks",
  "/projects/",
] as const;

const PROJECT_STUDIO_PATH = /^\/projects\/[^/]+\/studio(?:\/|$)/;

/** Legacy: detect leftover Supabase anonymous sessions (auto sign-out on bootstrap). */
export function isAnonymousSupabaseUser(
  user: SupabaseAuthUser | null | undefined,
): boolean {
  if (!user) {
    return false;
  }

  if ("is_anonymous" in user && user.is_anonymous === true) {
    return true;
  }

  return user.app_metadata?.provider === "anonymous";
}

export function requiresRegisteredAccount(pathname: string): boolean {
  if (PROJECT_STUDIO_PATH.test(pathname)) {
    return true;
  }

  return REGISTERED_ACCOUNT_REQUIRED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}

export function isGuestReturnPathAllowed(returnPath: string): boolean {
  const queryIndex = returnPath.indexOf("?");
  const pathname =
    queryIndex >= 0 ? returnPath.slice(0, queryIndex) : returnPath;

  return !requiresRegisteredAccount(pathname);
}
