"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  AuthPageShell,
  OAuthComingSoonSection,
  PasswordInput,
  authInputClassName,
  handleAuthFormEnterKey,
} from "@/components/auth-layout";
import { useAuth } from "@/components/auth-provider";
import { getAuthErrorMessage } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/login-return-url";

export function LoginPage({
  supabaseConfigured,
}: {
  supabaseConfigured: boolean;
}) {
  const searchParams = useSearchParams();
  const returnParam = searchParams.get("return");
  const callbackError = searchParams.get("error");
  const notice = searchParams.get("notice");

  const { user, hydrated, signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (callbackError === "auth_callback") {
      setError(
        "メール確認リンクが無効または期限切れです。確認メールを再送するか、ログインをお試しください。",
      );
    }
  }, [callbackError]);

  useEffect(() => {
    if (hydrated && user) {
      window.location.href = resolvePostLoginPath(returnParam);
    }
  }, [hydrated, user, returnParam]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      await signIn(email, password);
      window.location.href = resolvePostLoginPath(returnParam);
    } catch (caught) {
      const authError = caught as { message?: string };
      setError(getAuthErrorMessage(authError.message ?? "認証に失敗しました。"));
      setSubmitting(false);
    }
  }

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

        <form
          onSubmit={handleSubmit}
          onKeyDown={handleAuthFormEnterKey}
          method="post"
          autoComplete="on"
          className="mt-8 space-y-4"
        >
          <div>
            <label htmlFor="email" className="text-sm font-medium text-zinc-400">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className={authInputClassName}
              placeholder="メールアドレス"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-zinc-400">
              パスワード
            </label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="パスワード"
              autoComplete="current-password"
              minLength={6}
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
            disabled={submitting || !supabaseConfigured}
            className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "処理中..." : "ログイン"}
          </button>
        </form>

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
