"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";
import { V0SimpleModal } from "@/components/v0-simple-modal";
import { buildLoginUrlWithReturn } from "@/lib/login-return-url";
import {
  getRegisteredActionPromptBody,
  REGISTERED_ACTION_PROMPT_TITLE,
  type RegisteredActionPromptVariant,
} from "@/lib/registered-action-prompt";

type PromptState = {
  returnPath: string;
  variant: RegisteredActionPromptVariant;
} | null;

type RegisteredAccountPromptOptions = {
  variant?: RegisteredActionPromptVariant;
};

type RegisteredAccountPromptContextValue = {
  promptRegisteredAccountAccess: (
    returnPath?: string,
    options?: RegisteredAccountPromptOptions,
  ) => void;
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
  const [prompt, setPrompt] = useState<PromptState>(null);

  const promptRegisteredAccountAccess = useCallback(
    (returnPath?: string, options?: RegisteredAccountPromptOptions) => {
      setPrompt({
        returnPath: resolveActionReturnPath(returnPath),
        variant: options?.variant ?? "default",
      });
    },
    [],
  );

  const closePrompt = useCallback(() => {
    setPrompt(null);
  }, []);

  const loginHref = prompt
    ? buildLoginUrlWithReturn(prompt.returnPath)
    : "/login";

  const value = useMemo(
    () => ({ promptRegisteredAccountAccess, closePrompt }),
    [promptRegisteredAccountAccess, closePrompt],
  );

  return (
    <RegisteredAccountPromptContext.Provider value={value}>
      {children}
      {prompt ? (
        <V0SimpleModal
          title={REGISTERED_ACTION_PROMPT_TITLE}
          subtitle={getRegisteredActionPromptBody(prompt.variant)}
          onClose={closePrompt}
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={loginHref}
              onClick={closePrompt}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90"
            >
              ログインして続ける
            </Link>
            <button
              type="button"
              onClick={closePrompt}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
            >
              今はやめる
            </button>
          </div>
        </V0SimpleModal>
      ) : null}
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

/** Registered users navigate normally; guests see login confirmation modal. */
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
