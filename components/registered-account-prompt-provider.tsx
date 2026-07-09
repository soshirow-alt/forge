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
import { buildLoginUrlWithReturn } from "@/lib/login-return-url";

type RegisteredAccountPromptContextValue = {
  promptRegisteredAccountAccess: (returnPath?: string) => void;
  closePrompt: () => void;
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
    (returnPath?: string) => {
      router.push(buildLoginUrlWithReturn(resolveActionReturnPath(returnPath)));
    },
    [router],
  );

  const closePrompt = useCallback(() => {
    // No-op — kept for API compatibility after modal removal.
  }, []);

  const value = useMemo(
    () => ({ promptRegisteredAccountAccess, closePrompt }),
    [promptRegisteredAccountAccess, closePrompt],
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

/** Registered users navigate normally; guests redirect to /login with return. */
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
    promptRegisteredAccountAccess(returnPath);
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
