"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useEntryMode } from "@/components/entry-mode-provider";
import { useRegisteredAccountPrompt } from "@/components/registered-account-prompt-provider";
import {
  buildLocationReturnPath,
  buildLoginUrlWithReturn,
  LOGIN_PATH,
} from "@/lib/login-return-url";
import type { RegisteredActionPromptVariant } from "@/lib/registered-action-prompt";

export { LOGIN_PATH } from "@/lib/login-return-url";

export type RequireAuthOptions = {
  variant?: RegisteredActionPromptVariant;
};

function readReturnPath(pathname: string): string {
  if (typeof window === "undefined") {
    return pathname;
  }
  return buildLocationReturnPath(pathname, window.location.search);
}

/**
 * Auth gate for click actions. Avoids useSearchParams so static prerender
 * of shells that mount this hook (e.g. PlatformFeedback) does not CSR-bailout.
 * Return URL still includes current query via window.location at call time.
 */
export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated, isRegisteredUser } = useAuth();
  const { isGuestEntry } = useEntryMode();
  const { promptRegisteredAccountAccess } = useRegisteredAccountPrompt();

  function requireAuth(
    action: () => void,
    returnPath?: string,
    options?: RequireAuthOptions,
  ) {
    if (!hydrated) {
      return;
    }

    if (isRegisteredUser) {
      action();
      return;
    }

    promptRegisteredAccountAccess(returnPath ?? readReturnPath(pathname), {
      variant: options?.variant ?? "default",
    });
  }

  return {
    user,
    hydrated,
    isGuestEntry,
    isRegisteredUser,
    /** Registered Supabase account only — entry-mode guest is not logged in. */
    isLoggedIn: isRegisteredUser,
    requireAuth,
    goToLogin: (returnPath?: string) =>
      router.push(buildLoginUrlWithReturn(returnPath ?? readReturnPath(pathname))),
  };
}
