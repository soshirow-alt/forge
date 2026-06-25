"use client";

import { HorizontalCardPager } from "@/components/horizontal-card-pager";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { GameThumbnail, PlayerShell } from "@/components/player-shell";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import {
  heroSlides,
  newGames,
  popularGames,
  recentlyUpdatedGames,
  type HomeGameCard,
} from "@/lib/home-v0-mock-data";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Users,
} from "lucide-react";

function StatPills({ voiceCount, witnessCount }: { voiceCount: number; witnessCount: number }) {
  return (
    <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
      <span className="inline-flex items-center gap-1.5">
        <MessageSquare className="size-4 text-violet-400" aria-hidden="true" />
        フィードバック {voiceCount}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users className="size-4 text-violet-400" aria-hidden="true" />
        見届け人 {witnessCount}
      </span>
    </div>
  );
}

function HorizontalGameCard({
  game,
  rank,
}: {
  game: HomeGameCard;
  rank?: number;
}) {
  return (
    <Link href={gameDetailHref(game.id)} className="block w-full">
      <article>
      <div className="relative">
        {rank !== undefined && (
          <span className="absolute left-2 top-2 z-10 flex size-7 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white shadow-lg">
            {rank}
          </span>
        )}
        <GameThumbnail
          src={game.image}
          alt={game.title}
          className="w-full aspect-[4/3]"
        />
      </div>
      <h3 className="mt-3 truncate font-semibold text-white">{game.title}</h3>
      <p className="mt-1 text-xs text-zinc-500">
        {game.version} · {game.updatedLabel}
      </p>
      <div className="mt-2">
        <StatPills voiceCount={game.voiceCount} witnessCount={game.witnessCount} />
      </div>
      </article>
    </Link>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
      {href && (
        <Link href={href} className="text-sm text-violet-400 transition-colors hover:text-violet-300">
          すべて見る →
        </Link>
      )}
    </div>
  );
}

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const slide = heroSlides[index];

  function goPrev() {
    setIndex((current) => (current === 0 ? heroSlides.length - 1 : current - 1));
  }

  function goNext() {
    setIndex((current) => (current === heroSlides.length - 1 ? 0 : current + 1));
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
      <div className="relative min-h-[280px] sm:min-h-[320px]">
        <Image
          src={slide.image}
          alt=""
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-transparent to-transparent" />

        <div className="relative flex h-full flex-col justify-end p-6 sm:p-8 lg:max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
            注目の開発中ゲーム
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
            {slide.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {slide.version} · {slide.updatedLabel}
          </p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-300">
            {slide.description}
          </p>
          <div className="mt-4">
            <StatPills voiceCount={slide.voiceCount} witnessCount={slide.witnessCount} />
          </div>
          <Link
            href={gameDetailHref(slide.id)}
            className="mt-6 inline-flex w-fit rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
          >
            詳しく見る →
          </Link>
        </div>

        <button
          type="button"
          onClick={goPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-zinc-700/80 bg-zinc-950/80 p-2 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
          aria-label="前のスライド"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-zinc-700/80 bg-zinc-950/80 p-2 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
          aria-label="次のスライド"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="flex justify-center gap-2 border-t border-zinc-800/80 py-3">
        {heroSlides.map((item, dotIndex) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(dotIndex)}
            className={`size-2 rounded-full transition-colors ${
              dotIndex === index ? "bg-violet-500" : "bg-zinc-700 hover:bg-zinc-500"
            }`}
            aria-label={`スライド ${dotIndex + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

export function DiscoveryHomePage() {
  return (
    <PlayerShell activeNav="home">
      <div className="space-y-10">
        <HeroCarousel />

        <section>
          <SectionHeader title="最近更新された作品" href="/search" />
          <div className="mt-4 px-2">
            <HorizontalCardPager
              items={[...recentlyUpdatedGames]}
              getKey={(game) => game.id}
              pageSize={3}
              renderItem={(game) => <HorizontalGameCard game={game} />}
            />
          </div>
        </section>

        <section>
          <SectionHeader title="今週人気の作品" href="/search" />
          <div className="mt-4 px-2">
            <HorizontalCardPager
              items={popularGames.map((game, index) => ({ game, rank: index + 1 }))}
              getKey={({ game }) => game.id}
              pageSize={3}
              renderItem={({ game, rank }) => (
                <HorizontalGameCard game={game} rank={rank} />
              )}
            />
          </div>
        </section>

        <section>
          <SectionHeader title="新着作品" href="/search" />
          <div className="mt-4 px-2">
            <HorizontalCardPager
              items={[...newGames]}
              getKey={(game) => game.id}
              pageSize={3}
              renderItem={(game) => <HorizontalGameCard game={game} />}
            />
          </div>
        </section>
      </div>
    </PlayerShell>
  );
}
