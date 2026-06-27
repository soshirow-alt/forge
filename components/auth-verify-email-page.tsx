"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AuthPageShell,
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
} from "@/components/auth-layout";
import { getEmailConfirmRedirectUrl } from "@/lib/auth-redirect";
import { getAuthErrorMessage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Mail } from "lucide-react";

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
    <AuthPageShell active="register">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 sm:p-8">
        <div className="flex size-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
          <Mail className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
          メールを確認してください
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          登録ありがとうございます。確認メールを送信しました。
          メール内のリンクをクリックすると、Forge の利用を開始できます。
        </p>

        {email && (
          <p className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300">
            送信先: <span className="font-medium text-zinc-100">{email}</span>
          </p>
        )}

        {!supabaseConfigured && (
          <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            Supabaseの環境変数が設定されていません。
          </div>
        )}

        <div className="mt-8 space-y-3">
          {message && (
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {email && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !supabaseConfigured}
              className={authPrimaryButtonClassName}
            >
              {resending ? "送信中..." : "確認メールを再送する"}
            </button>
          )}

          <Link href="/login" className={authSecondaryButtonClassName}>
            ログイン画面へ
          </Link>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-zinc-500">
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
          Yahoo 等のメールは届くまで数分かかることがあります。
        </p>
      </div>
    </AuthPageShell>
  );
}
