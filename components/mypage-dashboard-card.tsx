"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type MyPageDashboardCardProps = {
  id: string;
  title: string;
  description: string;
  count: number;
  emptyMessage: string;
  accentClassName: string;
  preview: ReactNode;
  expanded?: ReactNode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  showExpand: boolean;
};

export function MyPageDashboardCard({
  id,
  title,
  description,
  count,
  emptyMessage,
  accentClassName,
  preview,
  expanded,
  isExpanded,
  onToggleExpand,
  showExpand,
}: MyPageDashboardCardProps) {
  return (
    <section
      id={id}
      className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 scroll-mt-24"
    >
      <div className={`border-l-2 pl-3 ${accentClassName}`}>
        <h2 className="text-base font-semibold tracking-tight text-zinc-100">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          {description}
        </p>
      </div>

      <div className="mt-4 flex-1">
        {count === 0 ? (
          <p className="text-sm text-zinc-600">{emptyMessage}</p>
        ) : (
          preview
        )}
      </div>

      {showExpand && count > 0 && (
        <button
          type="button"
          onClick={onToggleExpand}
          className="mt-4 self-start text-xs font-medium text-orange-400 transition-colors hover:text-orange-300"
        >
          {isExpanded ? "閉じる" : `さらに表示（${count}件）`}
        </button>
      )}

      {isExpanded && expanded && (
        <div className="mt-4 border-t border-zinc-800/80 pt-4">{expanded}</div>
      )}
    </section>
  );
}

export function MyPageCompactGameList({
  games,
  limit,
}: {
  games: { id: string; title: string; href: string; meta?: string }[];
  limit: number;
}) {
  return (
    <ul className="space-y-2">
      {games.slice(0, limit).map((game) => (
        <li key={game.id}>
          <Link
            href={game.href}
            className="group block rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2 transition-colors hover:border-zinc-700"
          >
            <p className="truncate text-sm font-medium text-zinc-200 group-hover:text-orange-400">
              {game.title}
            </p>
            {game.meta && (
              <p className="mt-0.5 truncate text-xs text-zinc-600">{game.meta}</p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
