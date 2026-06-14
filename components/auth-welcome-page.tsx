"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";

const buttonClassName =
  "inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 text-base font-semibold text-zinc-950 transition-opacity hover:opacity-90";

export function AuthWelcomePage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-950 text-zinc-500">
        読み込み中...
      </div>
    );
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
          <div className="mt-8 inline-flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-2xl">
            ✓
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">メール確認が完了しました</h1>
          <p className="mt-3 text-lg font-medium text-orange-300">Forgeへようこそ</p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            {user.name} さん、アカウントの準備が整いました。
            ゲームを発見したり、プレイしたり、作品を投稿したり — Forge の入口から始めましょう。
          </p>
        </div>

        <div className="mt-10">
          <Link href="/" className={buttonClassName}>
            ホームへ進む
          </Link>
        </div>
      </main>
    </div>
  );
}
