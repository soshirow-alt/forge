"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  buildLoginUrlWithReturn,
  buildPathWithSearch,
} from "@/lib/login-return-url";

/**
 * authResolved 後に未ログインなら /login?return=現在URL へ replace。
 * fixedReturnPath を渡すと pathname の代わりにそれを return に使う。
 */
export function useRedirectToLoginWhenLoggedOut(fixedReturnPath?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, hydrated } = useAuth();

  const returnPath = useMemo(() => {
    if (fixedReturnPath) {
      return fixedReturnPath;
    }
    return buildPathWithSearch(pathname, searchParams.toString());
  }, [fixedReturnPath, pathname, searchParams]);

  useEffect(() => {
    if (!hydrated || user) {
      return;
    }

    router.replace(buildLoginUrlWithReturn(returnPath));
  }, [hydrated, user, router, returnPath]);
}
