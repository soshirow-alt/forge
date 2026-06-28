"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  AuthPageShell,
  PasswordInput,
  authPrimaryButtonClassName,
  handleAuthFormEnterKey,
} from "@/components/auth-layout";
import { getAuthErrorMessage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordPage({
  supabaseConfigured,
}: {
  supabaseConfigured: boolean;
}) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      return;
    }

    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(Boolean(session));
      if (!session) {
        setError(
          "リンクが無効または期限切れです。パスワード再設定をもう一度お試しください。",
        );
      }
    });
  }, [supabaseConfigured]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("パスワード（確認）が一致しません。");
      return;
    }

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        throw updateError;
      }

      await supabase.auth.signOut();
      setDone(true);
    } catch (caught) {
      const authError = caught as { message?: string; code?: string };
      setError(
        getAuthErrorMessage(
          authError.message ?? "更新に失敗しました。",
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
        <h1 className="text-3xl font-bold tracking-tight text-white">新しいパスワード</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          新しいパスワードを入力してください。
        </p>

        {!supabaseConfigured && (
          <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            Supabaseの環境変数が設定されていません。
          </div>
        )}

        {done ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              パスワードを更新しました。新しいパスワードでログインしてください。
            </div>
            <Link href="/login" className={authPrimaryButtonClassName}>
              ログイン画面へ
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            onKeyDown={handleAuthFormEnterKey}
            className="mt-8 space-y-4"
          >
            <div>
              <label htmlFor="password" className="text-sm font-medium text-zinc-400">
                新しいパスワード
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                placeholder="8文字以上"
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            <div>
              <label
                htmlFor="passwordConfirm"
                className="text-sm font-medium text-zinc-400"
              >
                新しいパスワード（確認）
              </label>
              <PasswordInput
                id="passwordConfirm"
                value={passwordConfirm}
                onChange={setPasswordConfirm}
                placeholder="もう一度入力"
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {error}
                {!ready && (
                  <p className="mt-2">
                    <Link
                      href="/login/forgot-password"
                      className="font-medium text-violet-300 hover:text-violet-200"
                    >
                      再設定メールを再送する
                    </Link>
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !supabaseConfigured || !ready}
              className={authPrimaryButtonClassName}
            >
              {submitting ? "更新中..." : "パスワードを更新"}
            </button>
          </form>
        )}
      </div>
    </AuthPageShell>
  );
}
