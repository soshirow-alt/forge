"use client";

import { DiscoveryGameThumbnail } from "@/components/discovery-game-thumbnail";
import { PlayerShell } from "@/components/player-shell";
import {
  screenshotHeroSlides,
  screenshotNewGames,
  screenshotPopular,
  screenshotRecentlyUpdated,
} from "@/lib/demo/screenshot-catalog";
import { screenshotGameHref } from "@/lib/demo/screenshot-routes";
import type { HomeGameCard } from "@/lib/home-v0-mock-data";
import { DiscoveryCardStatPills } from "@/components/discovery-card-stat-pills";
import Image from "next/image";
import Link from "next/link";

function ScreenshotGameCard({
  game,
  rank,
}: {
  game: HomeGameCard;
  rank?: number;
}) {
  const href = screenshotGameHref(game.id);

  return (
    <Link href={href} className="block w-full min-w-0">
      <article>
        <div className="relative">
          {rank !== undefined && (
            <span className="absolute left-2 top-2 z-10 flex size-7 items-center justify-center rounded-md bg-violet-600 text-sm font-bold text-white shadow-lg">
              {rank}
            </span>
          )}
          <DiscoveryGameThumbnail
            id={game.id}
            title={game.title}
            genre={game.genre}
            version={game.version}
            image={game.image}
            className="w-full aspect-[4/3]"
            sizes="(max-width: 1280px) 25vw, 360px"
          />
        </div>
        <h3 className="mt-2 truncate text-sm font-semibold text-white">{game.title}</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          {game.version} · {game.updatedLabel}
        </p>
        <div className="mt-1.5">
          <DiscoveryCardStatPills
            feedbackCount={game.feedbackCount}
            watchCount={game.watchCount}
            compact
          />
        </div>
      </article>
    </Link>
  );
}

function FourCardGrid({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 grid grid-cols-4 gap-3">{children}</div>;
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>;
}

function HeroCarousel({ slides }: { slides: HomeGameCard[] }) {
  const slide = slides[0];

  if (!slide) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
      <div className="relative min-h-[280px] sm:min-h-[320px]">
        {slide.image ? (
          <Image
            src={slide.image}
            alt=""
            fill
            className="object-cover opacity-50"
            priority
          />
        ) : null}
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
            <DiscoveryCardStatPills
              feedbackCount={slide.feedbackCount}
              watchCount={slide.watchCount}
            />
          </div>
          <Link
            href={screenshotGameHref(slide.id)}
            className="mt-6 inline-flex w-fit rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
          >
            詳しく見る →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ScreenshotDiscoveryHomePage() {
  const popular = screenshotPopular.slice(0, 4);
  const updated = screenshotRecentlyUpdated.slice(0, 4);
  const newest = screenshotNewGames.slice(0, 4);

  return (
    <PlayerShell activeNav="home">
      <div className="space-y-10">
        <HeroCarousel slides={screenshotHeroSlides} />

        <section>
          <SectionHeader title="最近更新された作品" />
          <FourCardGrid>
            {updated.map((game) => (
              <ScreenshotGameCard key={game.id} game={game} />
            ))}
          </FourCardGrid>
        </section>

        <section>
          <SectionHeader title="今週人気の作品" />
          <FourCardGrid>
            {popular.map((game, index) => (
              <ScreenshotGameCard key={game.id} game={game} rank={index + 1} />
            ))}
          </FourCardGrid>
        </section>

        <section>
          <SectionHeader title="新着作品" />
          <FourCardGrid>
            {newest.map((game) => (
              <ScreenshotGameCard key={game.id} game={game} />
            ))}
          </FourCardGrid>
        </section>
      </div>
    </PlayerShell>
  );
}
