"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ForgeHeader } from "@/components/forge-header";
import { useGames } from "@/components/games-provider";
import { setupDemoEnvironment } from "@/lib/demo-setup";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";

export function DemoPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { reloadFromStorage, saveDeveloperProfile } = useGames();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSetup() {
    if (!user) {
      router.push("/login?redirect=/demo");
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setError("Supabaseの環境変数が設定されていません。");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const profile = await saveDeveloperProfile(user.id, {
        publicName: "デモ開発スタジオ",
        profile:
          "Forgeデモ環境用の開発者プロフィールです。試作品の公開とテスター募集のデモを行います。",
        xAccount: "@forge_demo",
        website: "https://example.com",
      });

      await setupDemoEnvironment(supabase, user.id, profile.publicName);
      await reloadFromStorage();
      router.push("/studio/mypage");
    } catch {
      setError("デモ環境の作成に失敗しました。");
    } finally {
      setSubmitting(false);
    }
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
            ログイン中のアカウントにデモ作品3件、応援数、回答、開発日誌をセットアップします。
          </p>
        </div>

        {error && (
          <div className="mt-8 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

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
            onClick={() => void handleSetup()}
            disabled={submitting}
            className="mt-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-xl font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "作成中..." : "デモ環境を作成する"}
          </button>
        )}
      </main>
    </div>
  );
}
