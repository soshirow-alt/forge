"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { useEntryMode } from "@/components/entry-mode-provider";
import {
  ACCOUNT_REGISTRATION_REQUIRED_MESSAGE,
  ACCOUNT_REGISTRATION_REQUIRED_NOTICE,
} from "@/lib/guest-auth";
import { PageLoadingSkeleton } from "@/components/forge-loading-skeletons";
import {
  buildLoginUrlWithReturn,
  buildPathWithSearch,
  LOGIN_INTENT_REGISTERED,
} from "@/lib/login-return-url";

type RegisteredAccountGuardProps = {
  children: ReactNode;
  /** Override return path (defaults to current path + search) */
  returnPath?: string;
};

/** Blocks entry-mode guests and unauthenticated users from registered-only surfaces. */
export function RegisteredAccountGuard({
  children,
  returnPath,
}: RegisteredAccountGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authResolved, isRegisteredUser } = useAuth();
  const { isGuestEntry } = useEntryMode();

  const defaultReturnPath = useMemo(
    () => buildPathWithSearch(pathname, searchParams.toString()),
    [pathname, searchParams],
  );

  const resolvedReturnPath = returnPath ?? defaultReturnPath;

  useEffect(() => {
    if (!authResolved || isRegisteredUser) {
      return;
    }

    router.replace(
      buildLoginUrlWithReturn(resolvedReturnPath, {
        notice: isGuestEntry ? ACCOUNT_REGISTRATION_REQUIRED_NOTICE : undefined,
        intent: LOGIN_INTENT_REGISTERED,
      }),
    );
  }, [authResolved, isRegisteredUser, isGuestEntry, router, resolvedReturnPath]);

  if (!authResolved || !isRegisteredUser) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        {isGuestEntry ? (
          <p className="text-center text-sm text-zinc-500">
            {ACCOUNT_REGISTRATION_REQUIRED_MESSAGE}
          </p>
        ) : (
          <PageLoadingSkeleton lines={3} />
        )}
      </div>
    );
  }

  return <>{children}</>;
}
