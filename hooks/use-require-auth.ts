"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { useEntryMode } from "@/components/entry-mode-provider";
import { useRegisteredAccountPrompt } from "@/components/registered-account-prompt-provider";
import {
  buildLocationReturnPath,
  buildLoginUrlWithReturn,
  LOGIN_PATH,
} from "@/lib/login-return-url";

export { LOGIN_PATH } from "@/lib/login-return-url";

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, hydrated, isRegisteredUser } = useAuth();
  const { isGuestEntry } = useEntryMode();
  const { promptRegisteredAccountAccess } = useRegisteredAccountPrompt();

  const currentReturnPath = useMemo(
    () => buildLocationReturnPath(pathname, searchParams.toString()),
    [pathname, searchParams],
  );

  function requireAuth(action: () => void, returnPath?: string) {
    if (!hydrated) {
      return;
    }

    if (isRegisteredUser) {
      action();
      return;
    }

    promptRegisteredAccountAccess(returnPath ?? currentReturnPath);
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
        buildLoginUrlWithReturn(returnPath ?? currentReturnPath),
      ),
  };
}
