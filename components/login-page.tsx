"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { getAuthErrorMessage } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/login-return-url";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

export function LoginPage({
  supabaseConfigured,
}: {
  supabaseConfigured: boolean;
}) {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const returnParam = searchParams.get("return");

  const { user, hydrated, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && user) {
      window.location.href = resolvePostLoginPath(returnParam);
    }
  }, [hydrated, user, returnParam]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    if (mode === "login") {
      try {
        await signIn(email, password);
      } catch (caught) {
        const authError = caught as { message?: string };
        setError(getAuthErrorMessage(authError.message ?? "認証に失敗しました。"));
        setSubmitting(false);
        return;
      }

      window.location.href = resolvePostLoginPath(returnParam);
      return;
    }

    try {
      const hasSession = await signUp(email, password, displayName);

      if (hasSession) {
        window.location.href = resolvePostLoginPath(returnParam);
        return;
      }

      setMessage(
        "アカウントを作成しました。確認メールが有効な場合はメールを確認してください。",
      );
      setMode("login");
    } catch (caught) {
      const authError = caught as { message?: string };
      setError(getAuthErrorMessage(authError.message ?? "認証に失敗しました。"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="text-center">
          <Link href="/" className="inline-block text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              Forge
            </span>
          </Link>
          <h1 className="mt-8 text-2xl font-bold tracking-tight">
            {mode === "login" ? "ログイン" : "新規登録"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {mode === "login"
              ? "メールアドレスとパスワードでログインしてください。"
              : "メールアドレスとパスワードでアカウントを作成してください。"}
          </p>
        </div>

        {!supabaseConfigured && (
          <div className="mt-8 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            Supabaseの環境変数が設定されていません。
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-10 space-y-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="displayName" className="text-sm font-medium text-zinc-400">
                ニックネーム
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className={inputClassName}
                placeholder="ニックネーム"
              />
              <p className="mt-2 text-sm text-zinc-500">サイト内で表示される名前</p>
            </div>
          )}

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
              className={inputClassName}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-zinc-400">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
              placeholder="6文字以上"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-300">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !supabaseConfigured}
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 text-base font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "処理中..."
              : mode === "login"
                ? "ログイン"
                : "アカウントを作成"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          {mode === "login" ? (
            <>
              アカウントをお持ちでない方は{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setMessage(null);
                }}
                className="font-medium text-orange-400 transition-colors hover:text-orange-300"
              >
                新規登録
              </button>
            </>
          ) : (
            <>
              既にアカウントをお持ちの方は{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setMessage(null);
                }}
                className="font-medium text-orange-400 transition-colors hover:text-orange-300"
              >
                ログイン
              </button>
            </>
          )}
        </p>
      </main>
    </div>
  );
}
