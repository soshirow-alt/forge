"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { ForgeHeader } from "@/components/forge-header";
import { MyPageDeveloperTab } from "@/components/mypage-developer-tab";
import { MyPagePlayerTab } from "@/components/mypage-player-tab";
import { useGames } from "@/components/games-provider";
import { LOGIN_PATH } from "@/hooks/use-require-auth";

type MyPageTab = "player" | "developer";

function tabHref(tab: MyPageTab): string {
  return tab === "developer" ? "/mypage?tab=developer" : "/mypage";
}

function MyPagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hydrated } = useAuth();
  const { dataReady, getOwnedProjects } = useGames();

  const activeTab: MyPageTab =
    searchParams.get("tab") === "developer" ? "developer" : "player";

  const ownedCount = getOwnedProjects(user?.id).length;

  const setTab = useCallback(
    (tab: MyPageTab) => {
      router.replace(tabHref(tab));
    },
    [router],
  );

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(LOGIN_PATH);
    }
  }, [hydrated, user, router]);

  if (!hydrated || !dataReady) {
    return (
      <div className="min-h-full bg-zinc-950 text-zinc-100">
        <ForgeHeader />
        <main className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-zinc-500">読み込み中...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <ForgeHeader />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
        >
          ← 作品一覧に戻る
        </Link>

        <header className="mt-8">
          <h1 className="text-3xl font-bold tracking-tight">マイページ</h1>
          <p className="mt-3 max-w-3xl text-zinc-400 leading-relaxed">
            遊んだゲームと、作ったゲームを切り替えて確認できます。
          </p>
        </header>

        <div
          role="tablist"
          aria-label="マイページの表示切替"
          className="mt-8 flex flex-wrap gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "player"}
            onClick={() => setTab("player")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "player"
                ? "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/40"
                : "border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            遊んだゲーム
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "developer"}
            onClick={() => setTab("developer")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "developer"
                ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40"
                : "border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            作ったゲーム
            {ownedCount > 0 && (
              <span className="ml-1.5 text-xs text-zinc-500">({ownedCount})</span>
            )}
          </button>
        </div>

        <div role="tabpanel" className="mt-10">
          {activeTab === "developer" ? (
            <MyPageDeveloperTab />
          ) : (
            <MyPagePlayerTab />
          )}
        </div>
      </main>
    </div>
  );
}

export function MyPagePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-zinc-950 text-zinc-100">
          <ForgeHeader />
          <main className="mx-auto max-w-7xl px-6 py-12">
            <p className="text-zinc-500">読み込み中...</p>
          </main>
        </div>
      }
    >
      <MyPagePageContent />
    </Suspense>
  );
}
