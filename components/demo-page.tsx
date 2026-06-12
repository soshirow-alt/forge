"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ForgeHeader } from "@/components/forge-header";
import { useGames } from "@/components/games-provider";
import { setupDemoEnvironment } from "@/lib/demo-setup";

export function DemoPage() {
  const router = useRouter();
  const { loginDemoUser } = useAuth();
  const { reloadFromStorage } = useGames();

  function handleSetup() {
    setupDemoEnvironment();
    loginDemoUser();
    reloadFromStorage();
    router.push("/my-projects");
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <ForgeHeader />

      <main className="mx-auto flex max-w-2xl flex-col px-6 py-16">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
        >
          ← 作品一覧に戻る
        </Link>

        <div className="mt-12 text-center">
          <p className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              Forge
            </span>
          </p>
          <h1 className="mt-8 text-2xl font-bold tracking-tight">デモ環境</h1>
          <p className="mt-3 text-zinc-500">
            開発者向けのデモデータを作成します。ログイン状態、作品3件、応援数、フィードバック、開発日誌がセットアップされます。
          </p>
        </div>

        <button
          type="button"
          onClick={handleSetup}
          className="mt-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-xl font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          デモ環境を作成する
        </button>
      </main>
    </div>
  );
}
