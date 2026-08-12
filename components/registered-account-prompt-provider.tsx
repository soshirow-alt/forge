"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";
import { FORGE_NAV_PENDING_CLASS } from "@/lib/forge-nav-pending";
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
  className = "",
  ...props
}: RegisteredOnlyLinkProps) {
  const pathname = usePathname();
  const { isRegisteredUser, authResolved } = useAuth();
  const { promptRegisteredAccountAccess } = useRegisteredAccountPrompt();
  const returnPath = typeof href === "string" ? href : href.pathname ?? undefined;
  const [pending, setPending] = useState(false);
  const targetPath =
    typeof href === "string"
      ? href.split("?")[0]?.split("#")[0] ?? href
      : href.pathname ?? null;
  const sameDestination = Boolean(targetPath) && pathname === targetPath;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }
    if (pending) {
      event.preventDefault();
      return;
    }
    if (!authResolved) {
      event.preventDefault();
      return;
    }
    if (isRegisteredUser) {
      if (sameDestination) {
        return;
      }
      if (
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        event.button === 0
      ) {
        setPending(true);
      }
      return;
    }

    event.preventDefault();
    promptRegisteredAccountAccess(returnPath, { variant: "default" });
  }

  return (
    <Link
      href={href}
      {...props}
      onClick={handleClick}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      className={`${className}${pending ? FORGE_NAV_PENDING_CLASS : ""}`}
      tabIndex={pending ? -1 : props.tabIndex}
    />
  );
}
