"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  AuthPageShell,
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth-layout";
import { getPasswordResetRedirectUrl } from "@/lib/auth-redirect";
import { getAuthErrorMessage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { KeyRound } from "lucide-react";

export function ForgotPasswordPage({
  supabaseConfigured,
}: {
  supabaseConfigured: boolean;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectUrl(),
      });

      if (resetError) {
        throw resetError;
      }

      setSent(true);
    } catch (caught) {
      const authError = caught as { message?: string; code?: string };
      setError(
        getAuthErrorMessage(
          authError.message ?? "送信に失敗しました。",
          authError.code,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell active="login">
      <div className="mx-auto w-full max-w-md">
        <div className="flex size-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
          <KeyRound className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
          パスワードを再設定
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          登録済みのメールアドレスを入力してください。再設定用のリンクをお送りします。
        </p>

        {!supabaseConfigured && (
          <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            Supabaseの環境変数が設定されていません。
          </div>
        )}

        {sent ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              再設定用のメールを送信しました。受信トレイ（迷惑メールフォルダも）をご確認ください。
            </div>
            <Link href="/login" className={authPrimaryButtonClassName}>
              ログイン画面へ
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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

            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !supabaseConfigured}
              className={authPrimaryButtonClassName}
            >
              {submitting ? "送信中..." : "再設定メールを送信"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300">
            ログインに戻る
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
