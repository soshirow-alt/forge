"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  ACCOUNT_REGISTRATION_REQUIRED_MESSAGE,
  ACCOUNT_REGISTRATION_REQUIRED_NOTICE,
} from "@/lib/guest-auth";
import {
  buildLoginUrlWithReturn,
  buildPathWithSearch,
} from "@/lib/login-return-url";

type RegisteredAccountGuardProps = {
  children: ReactNode;
  /** Override return path (defaults to current path + search) */
  returnPath?: string;
};

/**
 * Blocks guest (anonymous) sessions from registered-account-only surfaces.
 */
export function RegisteredAccountGuard({
  children,
  returnPath,
}: RegisteredAccountGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, authResolved, isGuest } = useAuth();

  const defaultReturnPath = useMemo(
    () => buildPathWithSearch(pathname, searchParams.toString()),
    [pathname, searchParams],
  );

  const resolvedReturnPath = returnPath ?? defaultReturnPath;

  useEffect(() => {
    if (!authResolved) {
      return;
    }

    if (!user) {
      router.replace(buildLoginUrlWithReturn(resolvedReturnPath));
      return;
    }

    if (isGuest) {
      router.replace(
        buildLoginUrlWithReturn(resolvedReturnPath, {
          notice: ACCOUNT_REGISTRATION_REQUIRED_NOTICE,
        }),
      );
    }
  }, [authResolved, user, isGuest, router, resolvedReturnPath]);

  if (!authResolved || !user || isGuest) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
        {isGuest ? ACCOUNT_REGISTRATION_REQUIRED_MESSAGE : "読み込み中..."}
      </div>
    );
  }

  return <>{children}</>;
}
