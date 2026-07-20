"use client";

import Link from "next/link";
import {
  EXPLORE_SUB_NAV,
  type ExploreSubNavId,
} from "@/lib/prototype/domain-expansion";

/**
 * Explore second-level nav — horizontal, always visible (incl. mobile scroll).
 * Not placed in the Forge global sidebar.
 */
export function ExploreSubNav({ active }: { active: ExploreSubNavId }) {
  return (
    <nav
      aria-label="Explore内カテゴリ"
      className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
    >
      <ul className="flex w-max min-w-full gap-1.5 sm:gap-2">
        {EXPLORE_SUB_NAV.map((item) => {
          const selected = item.id === active;
          return (
            <li key={item.id} className="shrink-0">
              <Link
                href={item.href}
                aria-current={selected ? "page" : undefined}
                className={`inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors sm:px-3.5 ${
                  selected
                    ? "bg-violet-600/25 text-violet-100 ring-1 ring-violet-500/45"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
