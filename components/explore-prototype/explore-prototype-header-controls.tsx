"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  EXPLORE_PROTOTYPE_CATEGORIES,
  buildFutureHomeHref,
  isExplorePrototypeCategorySlug,
  type ExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";

const TAB_ITEMS: Array<{
  category: ExplorePrototypeCategorySlug | null;
  label: string;
}> = [
  { category: null, label: "すべて" },
  ...EXPLORE_PROTOTYPE_CATEGORIES.map((item) => ({
    category: item.slug,
    label: item.label,
  })),
];

function parseActiveCategory(
  pathname: string,
  searchParams: URLSearchParams,
): ExplorePrototypeCategorySlug | null {
  if (pathname === "/home") {
    const raw = searchParams.get("category")?.trim() ?? "";
    return isExplorePrototypeCategorySlug(raw) ? raw : null;
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "explore" && parts[1] === "prototype") {
    const maybeCategory = parts[2];
    if (maybeCategory && isExplorePrototypeCategorySlug(maybeCategory)) {
      return maybeCategory;
    }
  }

  return null;
}

function ExplorePrototypeHeaderControlsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = parseActiveCategory(pathname, searchParams);

  return (
    <nav
      aria-label="作品カテゴリ"
      className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max items-center gap-1 sm:gap-1.5">
        {TAB_ITEMS.map((item) => {
          const selected = item.category === activeCategory;
          return (
            <li key={item.category ?? "all"} className="shrink-0">
              <Link
                href={buildFutureHomeHref({ category: item.category })}
                aria-current={selected ? "page" : undefined}
                className={`inline-flex h-9 items-center rounded-lg px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] sm:px-3 sm:text-sm ${
                  selected
                    ? "bg-violet-600/25 text-white ring-1 ring-violet-500/45"
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

/** Suspense fallback while useSearchParams hydrates — never show formal search UI. */
export function ExplorePrototypeCategoryTabsFallback() {
  return (
    <div className="min-w-0 flex-1" aria-hidden="true">
      <div className="flex w-max items-center gap-1 sm:gap-1.5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-9 w-[4.5rem] shrink-0 animate-pulse rounded-lg bg-zinc-800/70 sm:w-24"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Future discovery chrome: always-visible category tabs (no search).
 * Mounted from PlayerShell on Preview `/home` and `/explore/prototype/**`.
 */
export function ExplorePrototypeHeaderControls() {
  return <ExplorePrototypeHeaderControlsInner />;
}
