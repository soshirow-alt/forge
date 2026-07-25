"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  EXPLORE_PROTOTYPE_CATEGORIES,
  buildFutureHomeHref,
  getExplorePrototypeSearchPlaceholder,
  isExplorePrototypeCategorySlug,
  type ExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";
import {
  FORGE_SHELL_HEADER_SEARCH_FORM_CLASS,
  FORGE_SHELL_HEADER_SEARCH_INPUT_CLASS,
} from "@/lib/forge-shell-header";

const SELECT_CLASS =
  "h-10 w-full min-w-0 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30 focus-visible:ring-2 focus-visible:ring-violet-400 sm:w-auto sm:max-w-[16.5rem]";

function parseFutureHomeChromeLocation(
  pathname: string,
  searchParams: URLSearchParams,
): {
  category: ExplorePrototypeCategorySlug | null;
} {
  if (pathname === "/home") {
    const raw = searchParams.get("category")?.trim() ?? "";
    return {
      category: isExplorePrototypeCategorySlug(raw) ? raw : null,
    };
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "explore" && parts[1] === "prototype") {
    const maybeCategory = parts[2];
    if (maybeCategory && isExplorePrototypeCategorySlug(maybeCategory)) {
      return { category: maybeCategory };
    }
  }

  return { category: null };
}

function ExplorePrototypeHeaderControlsInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { category } = parseFutureHomeChromeLocation(pathname, searchParams);
  const urlQuery = searchParams.get("q")?.trim() ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);

  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  function navigate(nextCategory: ExplorePrototypeCategorySlug | null, nextQuery: string) {
    router.push(
      buildFutureHomeHref({
        category: nextCategory,
        q: nextQuery,
      }),
    );
  }

  function handleCategoryChange(value: string) {
    const nextCategory = isExplorePrototypeCategorySlug(value) ? value : null;
    navigate(nextCategory, query);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    navigate(category, query);
  }

  const placeholder = getExplorePrototypeSearchPlaceholder(category);
  const selectValue = category ?? "";

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
      <label className="sr-only" htmlFor="explore-prototype-category">
        カテゴリ
      </label>
      <select
        id="explore-prototype-category"
        value={selectValue}
        onChange={(event) => handleCategoryChange(event.target.value)}
        className={SELECT_CLASS}
        aria-label="Exploreカテゴリ"
      >
        <option value="">すべて</option>
        {EXPLORE_PROTOTYPE_CATEGORIES.map((item) => (
          <option key={item.slug} value={item.slug}>
            {item.label}
          </option>
        ))}
      </select>

      <form onSubmit={handleSubmit} className={FORGE_SHELL_HEADER_SEARCH_FORM_CLASS}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className={FORGE_SHELL_HEADER_SEARCH_INPUT_CLASS}
        />
      </form>
    </div>
  );
}

/**
 * Future discovery chrome: category select + fixture search (?q=).
 * Mounted from PlayerShell on Preview `/home` and `/explore/prototype/**` (details).
 */
export function ExplorePrototypeHeaderControls() {
  return <ExplorePrototypeHeaderControlsInner />;
}
