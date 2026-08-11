"use client";

import Link from "next/link";
import { ChevronRight, Gamepad2, Search } from "lucide-react";
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
import type { PlayerIaGameHomePayload } from "@/lib/supabase/player-ia-home-db";

const GAME_SEARCH_HREF = "/search?category=game";
const GAME_HERO_CTA = "詳細を見る";

function createClientFallbackNowMs(): number {
  return createRequestNowMs();
}

export function PlayerIaGameHomePage({
  initialHome = null,
  nowMs,
}: {
  initialHome?: PlayerIaGameHomePayload | null;
  nowMs?: number;
}) {
  const [fallbackNowMs] = useState(createClientFallbackNowMs);
  const displayNowMs = nowMs ?? fallbackNowMs;
  const [clientHome, setClientHome] = useState<PlayerIaGameHomePayload | null>(
    null,
  );
  const [clientLoading, setClientLoading] = useState(initialHome == null);
  const [clientError, setClientError] = useState(false);

  useEffect(() => {
    if (initialHome) return;
    let cancelled = false;
    void fetch("/api/discovery/player-ia-game-home", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("game home fetch failed");
        const payload = (await response.json()) as {
          ok?: boolean;
          home?: PlayerIaGameHomePayload;
        };
        if (!payload.ok || !payload.home) throw new Error("invalid payload");
        if (!cancelled) {
          setClientHome(payload.home);
          setClientError(false);
        }
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
  }, [initialHome]);

  const home = initialHome ?? clientHome;
  const loading = initialHome ? false : clientLoading;
  const error = initialHome ? false : clientError;

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
          ゲームホームを読み込めませんでした。
        </p>
        <Link
          href={GAME_SEARCH_HREF}
          className="mt-4 inline-flex text-sm font-medium text-violet-300 hover:text-violet-200"
        >
          条件で探す
        </Link>
      </div>
    );
  }

  const empty =
    home.heroWorks.length === 0 &&
    home.meaningfulUpdates.length === 0 &&
    home.newestProjects.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
      {empty ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
          <p className="text-sm text-zinc-400">ゲーム</p>
          <p className="mt-2 text-lg font-semibold text-white">Coming Soon</p>
          <Link
            href={GAME_SEARCH_HREF}
            className="mt-4 inline-flex text-sm font-medium text-violet-300 hover:text-violet-200"
          >
            条件で探す
          </Link>
        </div>
      ) : null}

      {home.heroWorks.length > 0 ? (
        <CategoryHomeHero
          items={home.heroWorks}
          headingId="game-home-hero"
          title={
            <h2
              id="game-home-hero"
              className="text-lg font-bold tracking-tight text-white text-balance"
            >
              注目のゲーム
            </h2>
          }
          seeAll={
            <Link
              href={GAME_SEARCH_HREF}
              className="group inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
            >
              すべて見る
              <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          }
          placeholder={
            <CategoryHomePlaceholder
              icon={Gamepad2}
              copy={CATEGORY_HOME_HERO_PLACEHOLDER_COPY}
            />
          }
          renderHero={(item) => (
            <CategoryHomeHeroWorkCard
              item={item}
              nowMs={displayNowMs}
              ctaLabel={GAME_HERO_CTA}
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
        title="最近アップデートされたゲーム"
        headingId="game-home-updates"
        seeAllHref="/search?category=game&sort=updated"
        nowMs={displayNowMs}
      />
      <CategoryHomeNewestShelf
        items={home.newestProjects}
        title="新着ゲーム"
        headingId="game-home-newest"
        seeAllHref="/search?category=game&sort=newest"
        nowMs={displayNowMs}
      />
    </div>
  );
}
