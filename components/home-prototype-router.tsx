"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DiscoveryHomePage } from "@/components/discovery-home-page";
import { ExploreHomePage } from "@/components/explore-home-page";

function GameCategoryChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2">
        <div>
          <p className="text-xs font-medium text-violet-300">ゲームカテゴリ面（プロトタイプ）</p>
          <p className="text-xs text-zinc-500">
            現行の発見フィードをゲーム面として表示しています
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/home" className="text-violet-300 hover:underline">
            ← Exploreホーム
          </Link>
          <Link href="/prototype" className="text-zinc-400 hover:underline">
            詳細比較
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

function HomePrototypeSwitch() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  if (category === "game") {
    return (
      <GameCategoryChrome>
        <DiscoveryHomePage />
      </GameCategoryChrome>
    );
  }

  return <ExploreHomePage />;
}

export function HomePrototypeRouter() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-zinc-800/60" />}>
      <HomePrototypeSwitch />
    </Suspense>
  );
}
