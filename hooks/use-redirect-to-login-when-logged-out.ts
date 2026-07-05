"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useEntryMode } from "@/components/entry-mode-provider";
import { ACCOUNT_REGISTRATION_REQUIRED_NOTICE } from "@/lib/guest-auth";
import { buildLoginUrlWithReturn } from "@/lib/login-return-url";

/**
 * authResolved 後に未ログイン（登録アカウントなし）なら /login?return=現在URL へ replace。
 * entry-mode ゲストも登録導線へ誘導する。
 */
export function useRedirectToLoginWhenLoggedOut(returnPath?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, isRegisteredUser } = useAuth();
  const { isGuestEntry } = useEntryMode();
  const resolvedReturnPath =
    returnPath ?? `${pathname}${typeof window !== "undefined" ? window.location.search : ""}`;

  useEffect(() => {
    if (!hydrated || isRegisteredUser) {
      return;
    }

    router.replace(
      buildLoginUrlWithReturn(resolvedReturnPath, {
        notice: isGuestEntry ? ACCOUNT_REGISTRATION_REQUIRED_NOTICE : undefined,
      }),
    );
  }, [hydrated, isRegisteredUser, isGuestEntry, router, resolvedReturnPath]);
}
