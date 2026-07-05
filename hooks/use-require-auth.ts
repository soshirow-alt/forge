"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useEntryMode } from "@/components/entry-mode-provider";
import { useRegisteredAccountPrompt } from "@/components/registered-account-prompt-provider";
import { buildLoginUrlWithReturn, LOGIN_PATH } from "@/lib/login-return-url";

export { LOGIN_PATH } from "@/lib/login-return-url";

export function useRequireAuth() {
  const router = useRouter();
  const { user, hydrated, isRegisteredUser } = useAuth();
  const { isGuestEntry } = useEntryMode();
  const { promptRegisteredAccountAccess } = useRegisteredAccountPrompt();

  function requireAuth(action: () => void, returnPath?: string) {
    if (!hydrated) {
      return;
    }

    if (isRegisteredUser) {
      action();
      return;
    }

    promptRegisteredAccountAccess(returnPath);
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
