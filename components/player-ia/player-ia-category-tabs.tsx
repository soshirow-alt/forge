"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  PROJECT_CATEGORY_NAV,
  type ProjectCategoryNavId,
} from "@/lib/project-categories";
import { buildSearchHrefForCategory } from "@/lib/player-ia/search-href";

const TAB_BASE =
  "inline-flex h-9 cursor-pointer items-center rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:px-3 sm:text-sm";

const TAB_ACTIVE =
  "bg-violet-600/30 text-white ring-1 ring-violet-500/55 hover:bg-violet-600/40 active:bg-violet-600/45";

const TAB_INACTIVE =
  "border border-zinc-700/80 bg-zinc-900/70 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-800/90";

function parseActiveCategory(searchParams: URLSearchParams): ProjectCategoryNavId {
  const raw = searchParams.get("category")?.trim() ?? "";
  if (!raw || raw === "all") {
    return "all";
  }
  const match = PROJECT_CATEGORY_NAV.find((item) => item.id === raw);
  return match?.id ?? "all";
}

export function PlayerIaCategoryTabsFallback() {
  return (
    <div
      className="min-w-0 flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80 p-1"
      aria-hidden="true"
    >
      <div className="flex w-max items-center gap-1">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-9 w-[4.5rem] shrink-0 animate-pulse rounded-md bg-zinc-800/80 sm:w-24"
          />
        ))}
      </div>
    </div>
  );
}

export function PlayerIaCategoryTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = parseActiveCategory(searchParams);

  if (pathname !== "/search") {
    return null;
  }

  return (
    <nav
      aria-label="作品カテゴリ"
      className="mb-5 flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2.5"
    >
      <span className="hidden shrink-0 text-[11px] font-medium tracking-wide text-zinc-500 sm:inline">
        カテゴリ
      </span>
      <div className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max items-center gap-1">
          {PROJECT_CATEGORY_NAV.map((item) => {
            const selected = item.id === activeCategory;
            const href = buildSearchHrefForCategory(item.id, searchParams);
            return (
              <li key={item.id} className="shrink-0">
                <Link
                  href={href}
                  aria-current={selected ? "page" : undefined}
                  className={`${TAB_BASE} ${selected ? TAB_ACTIVE : TAB_INACTIVE}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
