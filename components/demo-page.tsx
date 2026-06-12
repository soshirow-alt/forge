"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ForgeHeader } from "@/components/forge-header";
import { useGames } from "@/components/games-provider";
import { setupDemoEnvironment } from "@/lib/demo-setup";

export function DemoPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { reloadFromStorage, saveDeveloperProfile } = useGames();

  function handleSetup() {
    if (!user) {
      router.push("/login?redirect=/demo");
      return;
    }

    const profile = saveDeveloperProfile(user.id, {
      publicName: "デモ開発スタジオ",
      profile:
        "Forgeデモ環境用の開発者プロフィールです。試作品の公開とテスター募集のデモを行います。",
      xAccount: "@forge_demo",
      website: "https://example.com",
    });

    setupDemoEnvironment(user.id, profile.publicName);
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
            ログイン中のアカウントにデモ作品3件、応援数、フィードバック、開発日誌をセットアップします。
          </p>
        </div>

        {hydrated && !user ? (
          <div className="mt-12 space-y-4 text-center">
            <p className="text-zinc-400">デモ環境を作成するにはログインが必要です。</p>
            <Link
              href="/login?redirect=/demo"
              className="inline-block rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
            >
              ログイン
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSetup}
            className="mt-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-xl font-semibold text-zinc-950 transition-opacity hover:opacity-90"
          >
            デモ環境を作成する
          </button>
        )}
      </main>
    </div>
  );
}
