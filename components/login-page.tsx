"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import type { AuthProvider } from "@/lib/auth";

const buttonClassName =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-4 text-base font-medium text-zinc-100 transition-colors hover:border-orange-500/50 hover:bg-zinc-800";

export function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  function handleLogin(provider: AuthProvider) {
    login(provider);
    router.push("/");
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
          <h1 className="mt-8 text-2xl font-bold tracking-tight">ログイン</h1>
          <p className="mt-2 text-sm text-zinc-500">
            アカウントでログインするか、ゲストとして続けられます。
          </p>
        </div>

        <div className="mt-10 space-y-3">
          <button
            type="button"
            onClick={() => handleLogin("google")}
            className={buttonClassName}
          >
            Googleでログイン
          </button>
          <button
            type="button"
            onClick={() => handleLogin("discord")}
            className={buttonClassName}
          >
            Discordでログイン
          </button>
          <button
            type="button"
            onClick={() => handleLogin("guest")}
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 text-base font-semibold text-zinc-950 transition-opacity hover:opacity-90"
          >
            ゲストとして続ける
          </button>
        </div>
      </main>
    </div>
  );
}
