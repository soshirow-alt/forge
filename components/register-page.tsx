"use client";

import Link from "next/link";
import { PRIVACY_PATH, TERMS_PATH } from "@/lib/legal-routes";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  AuthPageShell,
  OAuthComingSoonSection,
  PasswordInput,
  authInputClassName,
  handleAuthFormEnterKey,
} from "@/components/auth-layout";
import { useAuth } from "@/components/auth-provider";
import { markNewRegistrationPending } from "@/lib/developer-onboarding-v0-store";
import { AUTH_ALREADY_REGISTERED_MESSAGE, getAuthErrorMessage } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/login-return-url";

export function RegisterPage({
  supabaseConfigured,
}: {
  supabaseConfigured: boolean;
}) {
  const router = useRouter();
  const { user, hydrated, signUp } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && user) {
      window.location.href = resolvePostLoginPath(null);
    }
  }, [hydrated, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("パスワード（確認）が一致しません。");
      return;
    }

    if (!agreed) {
      setError("利用規約とプライバシーポリシーへの同意が必要です。");
      return;
    }

    setSubmitting(true);

    try {
      const hasSession = await signUp(email, password, username);
      markNewRegistrationPending();

      if (hasSession) {
        window.location.href = resolvePostLoginPath(null);
        return;
      }

      const params = new URLSearchParams({ email });
      router.push(`/auth/verify-email?${params.toString()}`);
    } catch (caught) {
      const authError = caught as { message?: string; code?: string };
      setError(
        getAuthErrorMessage(
          authError.message ?? "登録に失敗しました。",
          authError.code,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell active="register">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">新規登録</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Forgeに参加して、ゲームの世界を広げましょう。
        </p>

        {!supabaseConfigured && (
          <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            Supabaseの環境変数が設定されていません。
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          onKeyDown={handleAuthFormEnterKey}
          className="mt-8 space-y-4"
        >
          <div>
            <label htmlFor="username" className="text-sm font-medium text-zinc-400">
              ユーザー名
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={authInputClassName}
              placeholder="ユーザー名を入力"
            />
            <p className="mt-2 text-xs text-zinc-500">
              公開される名前です（Studioプロフィールから変更できます）
            </p>
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-zinc-400">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={authInputClassName}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-zinc-400">
              パスワード
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              placeholder="8文字以上で入力してください"
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="text-sm font-medium text-zinc-400">
              パスワード（確認）
            </label>
            <PasswordInput
              id="passwordConfirm"
              value={passwordConfirm}
              onChange={setPasswordConfirm}
              placeholder="もう一度入力してください"
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-1 size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/40"
            />
            <span>
              <Link
                href={TERMS_PATH}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300"
              >
                利用規約
              </Link>{" "}
              と{" "}
              <Link
                href={PRIVACY_PATH}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300"
              >
                プライバシーポリシー
              </Link>{" "}
              に同意します
            </span>
          </label>

          {error && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              <p>{error}</p>
              {error === AUTH_ALREADY_REGISTERED_MESSAGE ? (
                <p className="mt-2">
                  <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
                    ログイン画面へ
                  </Link>
                </p>
              ) : null}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !supabaseConfigured}
            className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "処理中..." : "アカウントを作成"}
          </button>
        </form>

        <OAuthComingSoonSection description="Google / Discord / GitHub 登録は Coming Soon です。メールアドレスで登録できます。" />

        <p className="mt-8 text-center text-sm text-zinc-500">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300">
            ログイン
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
