"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { StatusFilterPills } from "@/components/mypage-filters";
import { MypageWatchCard } from "@/components/mypage-watch-card";
import { useGames } from "@/components/games-provider";
import { useMypageWatchCards } from "@/hooks/use-mypage-watch-cards";
import {
  countMypageWatchFilters,
  filterMypageWatchCards,
  type MypageWatchFilterId,
} from "@/lib/mypage-watch-cards";
import { WATCH_BUTTON_OFF, WATCH_TAB_LABEL } from "@/lib/watch-ui-labels";

export function MyPageLoopPanel() {
  const searchParams = useSearchParams();
  const highlightProjectId = searchParams.get("project");
  const { user } = useAuth();
  const { unwatchGame } = useGames();
  const { cards, loading, includeFbFilter } = useMypageWatchCards();
  const [filter, setFilter] = useState<MypageWatchFilterId>("all");
  const activeFilter: MypageWatchFilterId =
    filter === "fb_reflected" && !includeFbFilter ? "all" : filter;

  const filterOptions = useMemo(
    () => countMypageWatchFilters(cards, includeFbFilter),
    [cards, includeFbFilter],
  );

  const visibleCards = useMemo(
    () => filterMypageWatchCards(cards, activeFilter),
    [cards, activeFilter],
  );

  useEffect(() => {
    if (!highlightProjectId || loading) {
      return;
    }
    const el = document.getElementById(`watch-project-${highlightProjectId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightProjectId, loading, visibleCards]);

  if (!user) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-zinc-200">
          {WATCH_TAB_LABEL}を見るにはログインが必要です
        </h2>
        <Link
          href="/login?return=/mypage"
          className="mt-6 inline-block rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          ログイン
        </Link>
      </div>
    );
  }

  if (loading && cards.length === 0) {
    return <p className="text-sm text-zinc-600">読み込み中...</p>;
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-zinc-200">
          {WATCH_TAB_LABEL}の作品はまだありません
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
          作品詳細で「{WATCH_BUTTON_OFF}」をオンにすると、ここに1作品1カードで表示されます。
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/home"
            className="inline-block rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            作品を探す
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatusFilterPills
        options={filterOptions}
        activeId={activeFilter}
        onChange={setFilter}
      />

      {visibleCards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-5 py-10 text-center">
          <p className="text-sm text-zinc-500">この条件に合う作品はありません。</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visibleCards.map((card) => (
            <li key={card.projectId}>
              <MypageWatchCard
                card={card}
                highlighted={highlightProjectId === card.projectId}
              />
              <div className="mt-1 flex justify-end px-1">
                <button
                  type="button"
                  onClick={() => void unwatchGame(card.projectId)}
                  className="text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
                >
                  更新追跡を解除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
