"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CreatorLink } from "@/components/creator-link";
import { GameThumbnail } from "@/components/game-thumbnail";
import type { Game } from "@/lib/mock-games";

export type ForgeGameCardBadge = {
  id: string;
  emoji?: string;
  label: string;
};

type ForgeGameCardVariant = "compact" | "row" | "grid";

type ForgeGameCardProps = {
  game: Game;
  variant: ForgeGameCardVariant;
  badges?: ForgeGameCardBadge[];
  meta?: string;
  primaryAction?: { label: string; href: string };
  detailHref?: string;
  detailLabel?: string;
  showCreator?: boolean;
  linkTitle?: boolean;
  showActions?: boolean;
  className?: string;
  trailing?: ReactNode;
};

const variantStyles: Record<
  ForgeGameCardVariant,
  { shell: string; thumb: string; aspect: string; title: string }
> = {
  compact: {
    shell: "gap-3 px-3 py-2",
    thumb: "w-[4.5rem]",
    aspect: "aspect-[4/3]",
    title: "text-sm",
  },
  row: {
    shell: "gap-3 px-3 py-2.5",
    thumb: "w-20",
    aspect: "aspect-[4/3]",
    title: "text-sm",
  },
  grid: {
    shell: "flex-col gap-2 p-3",
    thumb: "w-full",
    aspect: "aspect-[4/3]",
    title: "text-sm",
  },
};

function BadgeList({ badges }: { badges: ForgeGameCardBadge[] }) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <ul className="mt-1.5 flex flex-wrap gap-1">
      {badges.map((badge) => (
        <li
          key={badge.id}
          className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[10px] text-zinc-400"
        >
          {badge.emoji ? <span aria-hidden="true">{badge.emoji}</span> : null}
          <span>{badge.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function ForgeGameCard({
  game,
  variant,
  badges = [],
  meta,
  primaryAction,
  detailHref,
  detailLabel = "作品を見る →",
  showCreator = false,
  linkTitle = true,
  showActions = true,
  className = "",
  trailing,
}: ForgeGameCardProps) {
  const styles = variantStyles[variant];
  const resolvedDetailHref = detailHref ?? `/games/${game.id}`;
  const isGrid = variant === "grid";

  return (
    <div
      className={`rounded-lg border border-zinc-800/80 bg-zinc-950/40 ${isGrid ? "" : "flex items-start"} ${styles.shell} ${className}`}
    >
      <div className={`${styles.thumb} shrink-0 overflow-hidden rounded-md`}>
        <GameThumbnail
          thumbnailUrl={game.thumbnailUrl}
          status={game.status}
          projectId={game.id}
          title={game.title}
          genre={game.genre}
          phase={game.phase}
          aspectClassName={styles.aspect}
          showStatus={false}
          overlayClassName={
            isGrid
              ? "pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent opacity-80"
              : "pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent opacity-50"
          }
        />
      </div>

      <div className="min-w-0 flex-1">
        {linkTitle ? (
          <Link
            href={resolvedDetailHref}
            className={`block truncate font-medium text-zinc-100 transition-colors hover:text-orange-400 ${styles.title}`}
          >
            {game.title}
          </Link>
        ) : (
          <p className={`truncate font-medium text-zinc-100 ${styles.title}`}>{game.title}</p>
        )}
        <p className="mt-0.5 truncate text-xs text-zinc-500">{game.genre}</p>
        {meta ? <p className="mt-1 text-xs text-zinc-600">{meta}</p> : null}
        {showCreator ? (
          <div className="mt-1">
            <CreatorLink name={game.creator} />
          </div>
        ) : null}
        <BadgeList badges={badges} />
        {showActions ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {primaryAction ? (
              <Link
                href={primaryAction.href}
                className="inline-flex rounded-md bg-gradient-to-r from-orange-500 to-amber-500 px-2.5 py-1 text-[11px] font-semibold text-zinc-950 transition-opacity hover:opacity-90"
              >
                {primaryAction.label}
              </Link>
            ) : null}
            <Link
              href={resolvedDetailHref}
              className="text-[11px] font-medium text-orange-400/90 transition-colors hover:text-orange-300"
            >
              {detailLabel}
            </Link>
          </div>
        ) : null}
      </div>

      {trailing ? <div className="shrink-0 self-start">{trailing}</div> : null}
    </div>
  );
}

export function ForgeGameCardList({
  games,
  variant,
  limit,
  badgesForGame,
  metaForGame,
  primaryActionForGame,
  showCreator = false,
  detailLabel,
}: {
  games: Game[];
  variant: ForgeGameCardVariant;
  limit?: number;
  badgesForGame?: (game: Game) => ForgeGameCardBadge[];
  metaForGame?: (game: Game) => string | undefined;
  primaryActionForGame?: (game: Game) => { label: string; href: string } | undefined;
  showCreator?: boolean;
  detailLabel?: string;
}) {
  const visibleGames = limit ? games.slice(0, limit) : games;

  return (
    <ul className={variant === "grid" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
      {visibleGames.map((game) => (
        <li key={game.id} className={variant === "grid" ? "min-w-0" : undefined}>
          <ForgeGameCard
            game={game}
            variant={variant}
            badges={badgesForGame?.(game)}
            meta={metaForGame?.(game)}
            primaryAction={primaryActionForGame?.(game)}
            showCreator={showCreator}
            detailLabel={detailLabel}
          />
        </li>
      ))}
    </ul>
  );
}
