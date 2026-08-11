"use client";

import Link from "next/link";
import {
  AppWindow,
  Box,
  ChevronRight,
  Gamepad2,
  Headphones,
  Search,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CategoryHomeHero } from "@/components/player-ia/category-home-hero";
import { CategoryHomePlaceholder } from "@/components/player-ia/category-home-placeholder";
import {
  CategoryHomeNewestShelf,
  CategoryHomeUpdateShelf,
} from "@/components/player-ia/category-home-shelves";
import {
  CategoryHomeHeroWorkCard,
  CategoryHomeRailWorkCard,
} from "@/components/player-ia/category-home-work-cards";
import { CATEGORY_HOME_HERO_PLACEHOLDER_COPY } from "@/lib/player-ia/category-home-hero";
import { createRequestNowMs } from "@/lib/player-ia/request-now";
import {
  PROJECT_CATEGORY_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import type { PlayerIaCategoryHomePayload } from "@/lib/supabase/player-ia-home-db";

const CATEGORY_HOME_ICONS: Record<ProjectCategoryId, LucideIcon> = {
  game: Gamepad2,
  audio: Headphones,
  asset: Box,
  "dev-tool": Wrench,
  "service-app": AppWindow,
};

function createClientFallbackNowMs(): number {
  return createRequestNowMs();
}

export function PlayerIaCategoryHomePage({
  category,
  initialHome,
  nowMs,
}: {
  category: ProjectCategoryId;
  initialHome?: PlayerIaCategoryHomePayload | null;
  nowMs?: number;
}) {
  const label = PROJECT_CATEGORY_LABELS[category];
  const searchHref = `/search?category=${category}`;
  const [clientHome, setClientHome] = useState<PlayerIaCategoryHomePayload | null>(
    null,
  );
  const [clientLoading, setClientLoading] = useState(!initialHome);
  const [clientError, setClientError] = useState(false);
  const [displayNowMs] = useState(() => nowMs ?? createClientFallbackNowMs());

  useEffect(() => {
    if (initialHome) return;
    let cancelled = false;
    void fetch(
      `/api/discovery/player-ia-category-home?category=${encodeURIComponent(category)}`,
      { cache: "no-store" },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("category home failed");
        const payload = (await response.json()) as {
          home?: PlayerIaCategoryHomePayload;
        };
        if (!cancelled) setClientHome(payload.home ?? null);
      })
      .catch(() => {
        if (!cancelled) setClientError(true);
      })
      .finally(() => {
        if (!cancelled) setClientLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, initialHome]);

  const home = initialHome ?? clientHome;
  const loading = initialHome ? false : clientLoading;
  const error = initialHome ? false : clientError;
  const Icon = CATEGORY_HOME_ICONS[category];

  if (loading) {
    return (
      <div className="flex flex-col gap-10">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40"
          />
        ))}
      </div>
    );
  }

  if (error || !home) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
        <Search className="mx-auto size-10 text-zinc-600" aria-hidden="true" />
        <p className="mt-4 text-sm text-zinc-400">
          {label}ホームを読み込めませんでした。
        </p>
        <Link
          href={searchHref}
          className="mt-4 inline-flex text-sm font-medium text-violet-300 hover:text-violet-200"
        >
          条件で探す
        </Link>
      </div>
    );
  }

  if (!home.hasPublicWork) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="mt-2 text-lg font-semibold text-white">Coming Soon</p>
        <Link
          href={searchHref}
          className="mt-4 inline-flex text-sm font-medium text-violet-300 hover:text-violet-200"
        >
          条件で探す
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
      {home.heroWorks.length > 0 ? (
        <CategoryHomeHero
          items={home.heroWorks}
          headingId="category-home-spotlight"
          title={
            <h2
              id="category-home-spotlight"
              className="text-lg font-bold tracking-tight text-white text-balance"
            >
              注目の{label}
            </h2>
          }
          seeAll={
            <Link
              href={searchHref}
              className="group inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
            >
              すべて見る
              <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          }
          placeholder={
            <CategoryHomePlaceholder
              icon={Icon}
              copy={CATEGORY_HOME_HERO_PLACEHOLDER_COPY}
            />
          }
          renderHero={(item) => (
            <CategoryHomeHeroWorkCard
              item={item}
              nowMs={displayNowMs}
              ctaLabel="詳細を見る"
            />
          )}
          renderRail={(item, onPromote) => (
            <CategoryHomeRailWorkCard
              item={item}
              nowMs={displayNowMs}
              onPromote={onPromote}
            />
          )}
        />
      ) : null}

      <CategoryHomeUpdateShelf
        items={home.meaningfulUpdates}
        title="最近アップデート"
        headingId="category-home-updates"
        seeAllHref={`/search?category=${category}&sort=updated`}
        nowMs={displayNowMs}
      />
      <CategoryHomeNewestShelf
        items={home.newestProjects}
        title="新着"
        headingId="category-home-newest"
        seeAllHref={`/search?category=${category}&sort=newest`}
        nowMs={displayNowMs}
      />
    </div>
  );
}
