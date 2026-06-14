"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { getEmailConfirmRedirectUrl } from "@/lib/auth-redirect";
import { getAuthErrorMessage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

const buttonClassName =
  "w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 text-base font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export function AuthVerifyEmailPage({
  supabaseConfigured,
}: {
  supabaseConfigured: boolean;
}) {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    if (!email || !supabaseConfigured) {
      return;
    }

    setResending(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: getEmailConfirmRedirectUrl(),
        },
      });

      if (resendError) {
        throw resendError;
      }

      setMessage("確認メールを再送しました。受信トレイをご確認ください。");
    } catch (caught) {
      const authError = caught as { message?: string };
      setError(getAuthErrorMessage(authError.message ?? "再送に失敗しました。"));
    } finally {
      setResending(false);
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
          <h1 className="mt-8 text-2xl font-bold tracking-tight">メールを確認してください</h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            登録ありがとうございます。確認メールを送信しました。
            メール内のリンクをクリックすると、Forge の利用を開始できます。
          </p>
          {email && (
            <p className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300">
              送信先: <span className="font-medium text-zinc-100">{email}</span>
            </p>
          )}
        </div>

        {!supabaseConfigured && (
          <div className="mt-8 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            Supabaseの環境変数が設定されていません。
          </div>
        )}

        <div className="mt-10 space-y-4">
          {message && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-300">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {email && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !supabaseConfigured}
              className={buttonClassName}
            >
              {resending ? "送信中..." : "確認メールを再送する"}
            </button>
          )}

          <Link
            href="/login"
            className="block w-full rounded-lg border border-zinc-700 px-6 py-4 text-center text-base font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
          >
            ログイン画面へ
          </Link>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-zinc-600">
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </p>
      </main>
    </div>
  );
}
