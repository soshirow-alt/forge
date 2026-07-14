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
}

export function FeaturedGameCard({
  game,
  mainSrc,
  extraSlots,
  selectedScreenshot,
  onSelectScreenshot,
  statsLoaded = true,
}: FeaturedGameCardProps) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 shadow-xl md:h-[350px] md:flex-row">
      {/* Left media area (~620px on desktop) */}
      <div className="aspect-video w-full shrink-0 md:aspect-auto md:h-full md:w-[620px]">
        <FeaturedGameMedia
          src={mainSrc}
          alt={`${game.title} のスクリーンショット`}
          projectId={game.id}
          title={game.title}
          genre={game.genre}
          version={game.version}
        />
      </div>

      {/* Right info panel (~380px on desktop) */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Additional images: always reserve 2 slots */}
        <div className="flex gap-3">
          {[0, 1].map((slot) => {
            const shot = extraSlots[slot];
            if (shot === "loading") {
              return <LoadingScreenshotSlot key={slot} />;
            }
            if (!shot) {
              return <MissingScreenshot key={slot} />;
            }
            return (
              <GameScreenshotThumbnail
                key={slot}
                src={shot}
                alt={`${game.title} の追加画像 ${slot + 1}`}
                active={selectedScreenshot === slot}
                onSelect={() => onSelectScreenshot(slot)}
              />
            );
          })}
        </div>

        {/* Work info */}
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">
            {"featuredLabel" in game && typeof game.featuredLabel === "string"
              ? game.featuredLabel
              : "注目の作品"}
          </p>
          {"featuredReason" in game &&
          typeof game.featuredReason === "string" &&
          game.featuredReason ? (
            <p className="text-xs font-medium text-zinc-300">{game.featuredReason}</p>
          ) : null}
          <h2 className="text-pretty text-lg font-bold leading-tight text-white">
            {game.title}
          </h2>
          <p className="text-xs text-zinc-500">
            {game.version} · {game.updatedLabel}
          </p>
          <p className="line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {game.description}
          </p>

          <div className="mt-auto pt-1">
            <DiscoveryCardStatPills
              feedbackCount={statsLoaded ? game.feedbackCount : null}
              watchCount={statsLoaded ? game.watchCount : null}
              loaded={statsLoaded}
              compact
            />
          </div>
        </div>

        <Link
          href={gameDetailHref(game.id)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-950 transition-opacity hover:opacity-90"
        >
          詳しく見る
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
