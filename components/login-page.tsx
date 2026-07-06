"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  AuthPageShell,
  authInputClassName,
  handleAuthFormEnterKey,
  useAuthAutofillUnlock,
} from "@/components/auth-layout";
import { XOAuthLoginSection } from "@/components/x-oauth-login-section";
import { useAuth } from "@/components/auth-provider";
import { useEntryMode } from "@/components/entry-mode-provider";
import { loginAction, type LoginActionState } from "@/lib/auth-login-action";
import {
  forgePerfLog,
  forgePerfMark,
  forgePerfMeasure,
} from "@/lib/forge-perf-log";
import {
  ACCOUNT_REGISTRATION_REQUIRED_MESSAGE,
  ACCOUNT_REGISTRATION_REQUIRED_NOTICE,
} from "@/lib/guest-auth";
import {
  DEFAULT_POST_PLAYER_HOME_PATH,
  LOGIN_PATH,
  buildRegisterUrlWithReturn,
  isGuestEligibleReturnParam,
  resolvePostGuestLoginPath,
  resolvePostLoginPath,
} from "@/lib/login-return-url";

const initialLoginState: LoginActionState = { error: null, redirectTo: null };

function GuestParticipationConfirmDialog({
  open,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-login-confirm-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
        <h2 id="guest-login-confirm-title" className="text-lg font-semibold text-white">
          ゲストで参加
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          ゲスト参加の記録は、ログイン後に引き継がれません。
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-base font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ゲストで参加
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="w-full rounded-xl px-6 py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

export function LoginPage({
  supabaseConfigured,
  returnParam,
  callbackError,
  notice,
}: {
  supabaseConfigured: boolean;
  returnParam: string | null;
  callbackError: string | null;
  notice: string | null;
}) {
  const { user, authResolved, isRegisteredUser } = useAuth();
  const { setGuestEntryMode } = useEntryMode();
  const [state, formAction, pending] = useActionState(loginAction, initialLoginState);
  const autofill = useAuthAutofillUnlock();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const postSubmitRedirectStartedRef = useRef(false);
  const alreadySignedInRedirectStartedRef = useRef(false);
  const [guestConfirmOpen, setGuestConfirmOpen] = useState(false);
  const loginSubmitMarkRef = useRef<string | null>(null);
  const showGuestEntry = isGuestEligibleReturnParam(returnParam);

  useEffect(() => {
    if (pending && !loginSubmitMarkRef.current) {
      const mark = `login.submit:${Date.now()}`;
      loginSubmitMarkRef.current = mark;
      forgePerfMark(mark);
      forgePerfLog("login.submit.start");
    }
    if (!pending) {
      loginSubmitMarkRef.current = null;
    }
  }, [pending]);

  useEffect(() => {
    if (state.error && loginSubmitMarkRef.current) {
      forgePerfMeasure("login.submit.error", loginSubmitMarkRef.current, {
        error: state.error,
      });
      loginSubmitMarkRef.current = null;
    }
  }, [state.error]);

  useEffect(() => {
    if (!authResolved || alreadySignedInRedirectStartedRef.current) {
      return;
    }

    if (isRegisteredUser && user) {
      const target = resolvePostLoginPath(returnParam);
      if (target === LOGIN_PATH || target.startsWith(`${LOGIN_PATH}?`)) {
        return;
      }
      alreadySignedInRedirectStartedRef.current = true;
      window.location.replace(target);
    }
  }, [authResolved, user, isRegisteredUser, returnParam]);

  function handleGuestContinue() {
    setGuestEntryMode();
    const target = resolvePostGuestLoginPath(returnParam);
    window.location.assign(target);
  }

  useEffect(() => {
    if (!state.redirectTo || postSubmitRedirectStartedRef.current) {
      return;
    }

    postSubmitRedirectStartedRef.current = true;
    if (loginSubmitMarkRef.current) {
      forgePerfMeasure("login.submit.success", loginSubmitMarkRef.current);
      forgePerfMark("login.redirect");
    }
    window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  return (
    <AuthPageShell active="login">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-white">ログイン</h1>

        {!supabaseConfigured && (
          <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            Supabaseの環境変数が設定されていません。
          </div>
        )}

        {notice === "password-changed" && (
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            パスワードを変更しました。新しいパスワードでログインしてください。
          </div>
        )}

        {notice === ACCOUNT_REGISTRATION_REQUIRED_NOTICE && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {ACCOUNT_REGISTRATION_REQUIRED_MESSAGE}
          </div>
        )}

        {callbackError ? (
          <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {callbackError}
          </div>
        ) : null}

        <form
          id="login-form"
          action={formAction}
          method="post"
          autoComplete="on"
          onKeyDown={handleAuthFormEnterKey}
          className="mt-8 space-y-4"
        >
          <input type="hidden" name="return" value={returnParam ?? ""} />

          <div>
            <label htmlFor="email" className="text-sm font-medium text-zinc-400">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username email"
              inputMode="email"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              readOnly={autofill.readOnly}
              onFocus={autofill.onFocus}
              className={authInputClassName}
              placeholder="メールアドレス"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-zinc-400">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              readOnly={autofill.readOnly}
              onFocus={autofill.onFocus}
              className={authInputClassName}
              placeholder="パスワード"
            />
          </div>

          <div className="text-right">
            <Link
              href="/login/forgot-password"
              className="text-sm text-violet-400 transition-colors hover:text-violet-300"
            >
              パスワードをお忘れの方
            </Link>
          </div>

          {state.error && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending || !supabaseConfigured}
            className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "ログイン中…" : "メールでログイン"}
          </button>
        </form>

        <div className="mt-3">
          <XOAuthLoginSection
            nextPath={
              returnParam
                ? resolvePostLoginPath(returnParam)
                : DEFAULT_POST_PLAYER_HOME_PATH
            }
            disabled={pending || !supabaseConfigured}
          />
        </div>

        {showGuestEntry ? (
          <>
            <div className="my-8 border-t border-zinc-800" aria-hidden="true" />
            <button
              type="button"
              disabled={pending}
              onClick={() => setGuestConfirmOpen(true)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 px-6 py-3.5 text-base font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ゲストで参加
            </button>
          </>
        ) : null}

        <p className="mt-8 text-center text-sm text-zinc-500">
          アカウントをお持ちでない方は{" "}
          <Link
            href={buildRegisterUrlWithReturn(returnParam ?? "")}
            className="font-medium text-violet-400 hover:text-violet-300"
          >
            新規登録
          </Link>
        </p>
      </div>

      <GuestParticipationConfirmDialog
        open={guestConfirmOpen}
        pending={pending}
        onCancel={() => setGuestConfirmOpen(false)}
        onConfirm={() => {
          setGuestConfirmOpen(false);
          handleGuestContinue();
        }}
      />
    </AuthPageShell>
  );
}
