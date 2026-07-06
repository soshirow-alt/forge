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
import { V0SimpleModal } from "@/components/v0-simple-modal";
import { useAuth } from "@/components/auth-provider";
import {
  REGISTERED_FEATURE_REQUIRES_LOGIN_BODY,
  REGISTERED_FEATURE_REQUIRES_LOGIN_TITLE,
} from "@/lib/guest-auth";
import { buildLoginUrlWithReturn, buildRegisterUrlWithReturn, LOGIN_PATH } from "@/lib/login-return-url";

type PromptState = {
  returnPath?: string;
} | null;

type RegisteredAccountPromptContextValue = {
  promptRegisteredAccountAccess: (returnPath?: string) => void;
  closePrompt: () => void;
};

const RegisteredAccountPromptContext =
  createContext<RegisteredAccountPromptContextValue | null>(null);

export function RegisteredAccountPromptProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [prompt, setPrompt] = useState<PromptState>(null);

  const promptRegisteredAccountAccess = useCallback((returnPath?: string) => {
    setPrompt({ returnPath });
  }, []);

  const closePrompt = useCallback(() => {
    setPrompt(null);
  }, []);

  const loginHref = prompt?.returnPath
    ? buildLoginUrlWithReturn(prompt.returnPath)
    : LOGIN_PATH;
  const registerHref = prompt?.returnPath
    ? buildRegisterUrlWithReturn(prompt.returnPath)
    : "/register";

  const value = useMemo(
    () => ({ promptRegisteredAccountAccess, closePrompt }),
    [promptRegisteredAccountAccess, closePrompt],
  );

  return (
    <RegisteredAccountPromptContext.Provider value={value}>
      {children}
      {prompt ? (
        <V0SimpleModal
          title={REGISTERED_FEATURE_REQUIRES_LOGIN_TITLE}
          subtitle={REGISTERED_FEATURE_REQUIRES_LOGIN_BODY}
          onClose={closePrompt}
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={loginHref}
              onClick={closePrompt}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90"
            >
              ログインする
            </Link>
            <button
              type="button"
              onClick={closePrompt}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
            >
              閉じる
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-zinc-500">
            アカウントをお持ちでない方は{" "}
            <Link
              href={registerHref}
              onClick={closePrompt}
              className="font-medium text-violet-400 hover:text-violet-300"
            >
              新規登録
            </Link>
          </p>
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

/** Registered users navigate normally; guests see an in-place login prompt. */
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
