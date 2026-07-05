"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useEntryMode } from "@/components/entry-mode-provider";
import { isRegisteredAppUser } from "@/lib/auth";
import { ACCOUNT_REGISTRATION_REQUIRED_NOTICE } from "@/lib/guest-auth";
import { buildLoginUrlWithReturn, LOGIN_PATH } from "@/lib/login-return-url";

export { LOGIN_PATH } from "@/lib/login-return-url";

export function useRequireAuth() {
  const router = useRouter();
  const { user, hydrated, isRegisteredUser } = useAuth();
  const { isGuestEntry } = useEntryMode();
  const registered = isRegisteredAppUser(user);

  function requireAuth(action: () => void, returnPath?: string) {
    if (!hydrated) {
      return;
    }

    if (!registered) {
      router.push(
        returnPath
          ? buildLoginUrlWithReturn(returnPath, {
              notice: isGuestEntry
                ? ACCOUNT_REGISTRATION_REQUIRED_NOTICE
                : undefined,
            })
          : LOGIN_PATH,
      );
      return;
    }

    action();
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
      router.push(
        returnPath ? buildLoginUrlWithReturn(returnPath) : LOGIN_PATH,
      ),
  };
}
