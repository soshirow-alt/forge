"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DiscoveryHomePage } from "@/components/discovery-home-page";
import { ExploreCategorySurface } from "@/components/explore-category-surface";
import { ExploreHomePage } from "@/components/explore-home-page";
import { ExploreSubNav } from "@/components/explore-sub-nav";
import {
  parseExploreCategoryQuery,
  type ExploreSubNavId,
  type WorkCategoryId,
} from "@/lib/prototype/domain-expansion";

function activeSubNavId(category: WorkCategoryId | null): ExploreSubNavId {
  return category ?? "home";
}

function HomePrototypeSwitch() {
  const searchParams = useSearchParams();
  const category = parseExploreCategoryQuery(searchParams.get("category"));
  const active = activeSubNavId(category);

  let body: React.ReactNode;
  if (category === "game") {
    body = (
      <div className="space-y-3">
        <p className="text-xs text-zinc-500">
          ゲームカテゴリ面 — 現行の発見フィード（注目・反応・プレイ増加・新着・最近更新）
        </p>
        <DiscoveryHomePage />
      </div>
    );
  } else if (
    category === "music" ||
    category === "dev_tool" ||
    category === "web_service"
  ) {
    body = <ExploreCategorySurface categoryId={category} />;
  } else {
    body = <ExploreHomePage />;
  }

  return (
    <div className="space-y-5">
      <ExploreSubNav active={active} />
      {body}
    </div>
  );
}

export function HomePrototypeRouter() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-zinc-800/60" />}>
      <HomePrototypeSwitch />
    </Suspense>
  );
}
