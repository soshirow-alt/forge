"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  AuthPageShell,
  OAuthComingSoonSection,
  authInputClassName,
  handleAuthFormEnterKey,
  useAuthAutofillUnlock,
} from "@/components/auth-layout";
import { useAuth } from "@/components/auth-provider";
import { loginAction, type LoginActionState } from "@/lib/auth-login-action";
import { getAuthErrorMessage } from "@/lib/auth";
import {
  ACCOUNT_REGISTRATION_REQUIRED_MESSAGE,
  ACCOUNT_REGISTRATION_REQUIRED_NOTICE,
} from "@/lib/guest-auth";
import {
  LOGIN_PATH,
  resolvePostGuestLoginPath,
  resolvePostLoginPath,
} from "@/lib/login-return-url";

const initialLoginState: LoginActionState = { error: null, redirectTo: null };

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
  const { user, authResolved, isGuest, signInAnonymously } = useAuth();
  const [state, formAction, pending] = useActionState(loginAction, initialLoginState);
  const [guestPending, setGuestPending] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const error = state.error ?? callbackError ?? guestError;
  const autofill = useAuthAutofillUnlock();
  const postSubmitRedirectStartedRef = useRef(false);
  const alreadySignedInRedirectStartedRef = useRef(false);

  useEffect(() => {
    if (!authResolved || !user || alreadySignedInRedirectStartedRef.current) {
      return;
    }

    const target = isGuest
      ? resolvePostGuestLoginPath(returnParam)
      : resolvePostLoginPath(returnParam);

    if (target === LOGIN_PATH || target.startsWith(`${LOGIN_PATH}?`)) {
      return;
    }

    alreadySignedInRedirectStartedRef.current = true;
    window.location.replace(target);
  }, [authResolved, user, isGuest, returnParam]);

  async function handleGuestContinue() {
    setGuestError(null);
    setGuestPending(true);
    try {
      await signInAnonymously();
      const target = resolvePostGuestLoginPath(returnParam);
      window.location.assign(target);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? getAuthErrorMessage(caught.message)
          : "ゲストログインに失敗しました。";
      if (
        caught instanceof Error &&
        (caught.message.toLowerCase().includes("anonymous") ||
          caught.message.toLowerCase().includes("disabled"))
      ) {
        setGuestError(
          "ゲストログインは現在利用できません。Supabase で Anonymous Sign-ins を有効にしてください。",
        );
      } else {
        setGuestError(message);
      }
    } finally {
      setGuestPending(false);
    }
  }

  useEffect(() => {
    if (!state.redirectTo || postSubmitRedirectStartedRef.current) {
      return;
    }

    postSubmitRedirectStartedRef.current = true;
    window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  return (
    <AuthPageShell active="login">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-white">ログイン</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          あなたのアカウントにログインして、
          <br />
          ゲームの世界を広げましょう。
        </p>

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

          {error && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending || guestPending || !supabaseConfigured}
            className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "処理中..." : "ログイン"}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled={pending || guestPending || !supabaseConfigured}
            onClick={() => {
              void handleGuestContinue();
            }}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 px-6 py-3.5 text-base font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guestPending ? "処理中..." : "ゲストで続ける"}
          </button>
          <p className="text-center text-xs leading-relaxed text-zinc-500">
            ログインせずに試せます。あとでアカウント登録できます。
          </p>
          <p className="text-center text-xs leading-relaxed text-zinc-600">
            ゲストの記録はこのブラウザに紐づきます。別の端末でも使う場合はアカウント登録してください。
          </p>
        </div>

        <OAuthComingSoonSection />

        <p className="mt-8 text-center text-sm text-zinc-500">
          アカウントをお持ちでない方は{" "}
          <Link href="/register" className="font-medium text-violet-400 hover:text-violet-300">
            新規登録
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
