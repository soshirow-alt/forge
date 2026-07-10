"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";
import {
  buildLoginUrlWithReturn,
  LOGIN_INTENT_REGISTERED,
} from "@/lib/login-return-url";
import type { RegisteredActionPromptVariant } from "@/lib/registered-action-prompt";

type RegisteredAccountPromptOptions = {
  variant?: RegisteredActionPromptVariant;
};

type RegisteredAccountPromptContextValue = {
  promptRegisteredAccountAccess: (
    returnPath?: string,
    options?: RegisteredAccountPromptOptions,
  ) => void;
};

const RegisteredAccountPromptContext =
  createContext<RegisteredAccountPromptContextValue | null>(null);

function resolveActionReturnPath(returnPath?: string): string {
  if (returnPath?.trim()) {
    return returnPath;
  }

  if (typeof window !== "undefined") {
    return `${window.location.pathname}${window.location.search}`;
  }

  return "/home";
}

export function RegisteredAccountPromptProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const promptRegisteredAccountAccess = useCallback(
    (returnPath?: string, options?: RegisteredAccountPromptOptions) => {
      const path = resolveActionReturnPath(returnPath);
      const variant = options?.variant ?? "default";
      router.push(
        buildLoginUrlWithReturn(path, {
          intent:
            variant === "play" ? undefined : LOGIN_INTENT_REGISTERED,
        }),
      );
    },
    [router],
  );

  const value = useMemo(
    () => ({ promptRegisteredAccountAccess }),
    [promptRegisteredAccountAccess],
  );

  return (
    <RegisteredAccountPromptContext.Provider value={value}>
      {children}
    </RegisteredAccountPromptContext.Provider>
  );
}

export function useRegisteredAccountPrompt() {
  const context = useContext(RegisteredAccountPromptContext);
  if (!context) {
    throw new Error(
      "useRegisteredAccountPrompt must be used within RegisteredAccountPromptProvider",
    );
  }
  return context;
}

type RegisteredOnlyLinkProps = ComponentProps<typeof Link>;

/** Registered users navigate normally; guests go to /login?return=... */
export function RegisteredOnlyLink({
  href,
  onClick,
  ...props
}: RegisteredOnlyLinkProps) {
  const { isRegisteredUser, authResolved } = useAuth();
  const { promptRegisteredAccountAccess } = useRegisteredAccountPrompt();
  const returnPath = typeof href === "string" ? href : href.pathname ?? undefined;

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }
    if (!authResolved) {
      event.preventDefault();
      return;
    }
    if (isRegisteredUser) {
      return;
    }

    event.preventDefault();
    promptRegisteredAccountAccess(returnPath, { variant: "default" });
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
