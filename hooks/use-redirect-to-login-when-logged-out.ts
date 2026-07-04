"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { ACCOUNT_REGISTRATION_REQUIRED_NOTICE } from "@/lib/guest-auth";
import {
  buildLoginUrlWithReturn,
  buildPathWithSearch,
} from "@/lib/login-return-url";

/**
 * authResolved 後に未ログイン、またはゲストなら /login?return=現在URL へ replace。
 * fixedReturnPath を渡すと pathname の代わりにそれを return に使う。
 */
export function useRedirectToLoginWhenLoggedOut(fixedReturnPath?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, hydrated, isGuest, isRegisteredUser } = useAuth();

  const returnPath = useMemo(() => {
    if (fixedReturnPath) {
      return fixedReturnPath;
    }
    return buildPathWithSearch(pathname, searchParams.toString());
  }, [fixedReturnPath, pathname, searchParams]);

  useEffect(() => {
    if (!hydrated || isRegisteredUser) {
      return;
    }

    router.replace(
      buildLoginUrlWithReturn(returnPath, {
        notice: isGuest ? ACCOUNT_REGISTRATION_REQUIRED_NOTICE : undefined,
      }),
    );
  }, [hydrated, user, isGuest, isRegisteredUser, router, returnPath]);
}
