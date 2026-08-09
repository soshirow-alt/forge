"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DiscoveryCardStatPills } from "@/components/discovery-card-stat-pills";
import { FeaturedGameMedia } from "@/components/featured/featured-game-media";
import { GameScreenshotThumbnail } from "@/components/featured/game-screenshot-thumbnail";
import {
  LoadingScreenshotSlot,
  MissingScreenshot,
} from "@/components/featured/missing-screenshot";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import type { HomeDiscoveryCard } from "@/lib/supabase/home-discovery-db";

export type FeaturedExtraSlot = string | null | "loading";

interface FeaturedGameCardProps {
  game: HomeDiscoveryCard;
  mainSrc: string;
  /** Extra slots: urls for screenshots[0]/[1], or loading / missing */
  extraSlots: FeaturedExtraSlot[];
  /** index into extras currently shown as main, or null = cover (thumbnail_urls[0]) */
  selectedScreenshot: number | null;
  onSelectScreenshot: (index: number) => void;
  /** When false, stats show skeleton instead of confirmed 0. */
  statsLoaded?: boolean;
  /** Player IA density — shorter card / narrower media; Production leaves false. */
  compact?: boolean;
}

export function FeaturedGameCard({
  game,
  mainSrc,
  extraSlots,
  selectedScreenshot,
  onSelectScreenshot,
  statsLoaded = true,
  compact = false,
}: FeaturedGameCardProps) {
  const featuredLabel =
    "featuredLabel" in game && typeof game.featuredLabel === "string"
      ? game.featuredLabel
      : "注目の作品";
  const featuredReason =
    "featuredReason" in game && typeof game.featuredReason === "string"
      ? game.featuredReason
      : "";

  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 shadow-xl md:flex-row ${
        compact ? "md:h-[300px]" : "md:h-[350px]"
      }`}
    >
      <div
        className={`aspect-video w-full shrink-0 md:aspect-auto md:h-full ${
          compact ? "md:w-[440px]" : "md:w-[620px]"
        }`}
      >
        <FeaturedGameMedia
          src={mainSrc}
          alt={`${game.title} のスクリーンショット`}
          projectId={game.id}
          title={game.title}
          genre={game.genre}
          version={game.version}
        />
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col ${
          compact ? "gap-2 p-3.5" : "gap-4 p-5"
        }`}
      >
        <div
          className={`shrink-0 ${
            compact
              ? "grid grid-cols-2 gap-2 [&>*]:min-w-0"
              : "flex gap-3"
          }`}
        >
          {[0, 1].map((slot) => {
            const shot = extraSlots[slot];
            if (shot === "loading") {
              return <LoadingScreenshotSlot key={slot} compact={compact} />;
            }
            if (!shot) {
              return <MissingScreenshot key={slot} compact={compact} />;
            }
            return (
              <GameScreenshotThumbnail
                key={slot}
                src={shot}
                alt={`${game.title} の追加画像 ${slot + 1}`}
                active={selectedScreenshot === slot}
                onSelect={() => onSelectScreenshot(slot)}
                compact={compact}
              />
            );
          })}
        </div>

        <div
          className={`flex min-h-0 flex-1 flex-col ${
            compact ? "gap-1" : "gap-2"
          }`}
        >
          <div
            className={`flex min-h-0 flex-1 flex-col ${
              compact ? "gap-1 overflow-hidden" : "gap-2"
            }`}
          >
            <p className="shrink-0 text-xs font-semibold uppercase tracking-wide text-violet-400">
              {featuredLabel}
            </p>
            {featuredReason ? (
              <p
                className={`shrink-0 text-xs font-medium text-zinc-300 ${
                  compact ? "line-clamp-1" : ""
                }`}
              >
                {featuredReason}
              </p>
            ) : null}
            <h2
              className={`text-pretty font-bold leading-tight text-white ${
                compact ? "line-clamp-2 text-base" : "text-lg"
              }`}
            >
              {game.title}
            </h2>
            <p className="shrink-0 text-xs text-zinc-500">
              {game.version} · {game.updatedLabel}
            </p>
            <p
              className={`leading-relaxed text-zinc-400 ${
                compact ? "line-clamp-2 text-xs" : "line-clamp-2 text-sm"
              }`}
            >
              {game.description}
            </p>
          </div>

          <div className="shrink-0 pt-1">
            <DiscoveryCardStatPills
              playCount={statsLoaded ? (game.playPlayerCount ?? null) : null}
              feedbackCount={statsLoaded ? game.feedbackCount : null}
              watchCount={statsLoaded ? game.watchCount : null}
              loaded={statsLoaded}
              compact={compact}
            />
          </div>
        </div>

        <Link
          href={gameDetailHref(game.id)}
          className={`inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white font-medium text-zinc-950 transition-opacity hover:opacity-90 ${
            compact ? "px-3 py-1.5 text-xs" : "px-3 py-2 text-sm"
          }`}
        >
          詳しく見る
          <ArrowRight className={compact ? "size-3.5" : "size-4"} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
