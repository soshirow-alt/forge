"use client";

import Link from "next/link";
import {
  AuthPageShell,
  authPrimaryButtonClassName,
} from "@/components/auth-layout";
import { useAuth } from "@/components/auth-provider";
import { useRedirectToLoginWhenLoggedOut } from "@/hooks/use-redirect-to-login-when-logged-out";
import {
  DEFAULT_POST_PLAYER_HOME_PATH,
  resolvePostLoginPath,
  sanitizeLoginReturnUrl,
} from "@/lib/login-return-url";
import { CheckCircle2 } from "lucide-react";

export function AuthWelcomePage({ returnParam }: { returnParam: string | null }) {
  const { user, hydrated } = useAuth();

  useRedirectToLoginWhenLoggedOut();

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-950 text-zinc-500">
        読み込み中...
      </div>
    );
  }

  const hasReturn = Boolean(sanitizeLoginReturnUrl(returnParam));
  const continueHref = hasReturn
    ? resolvePostLoginPath(returnParam)
    : DEFAULT_POST_PLAYER_HOME_PATH;
  const continueLabel = hasReturn ? "続ける" : "ホームへ進む";

  return (
    <AuthPageShell active="register">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 sm:p-8">
        <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
          メール確認が完了しました
        </h1>
        <p className="mt-2 text-lg font-medium text-violet-300">Forgeへようこそ</p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          {user.name} さん、アカウントの準備が整いました。
          ゲームを発見したり、プレイしたり、作品を投稿したり — Forge の入口から始めましょう。
        </p>

        <div className="mt-8">
          <Link href={continueHref} className={authPrimaryButtonClassName}>
            {continueLabel}
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
}
