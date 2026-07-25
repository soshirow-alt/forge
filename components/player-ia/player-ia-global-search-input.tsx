"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  FORGE_SHELL_HEADER_SEARCH_FORM_CLASS,
  FORGE_SHELL_HEADER_SEARCH_INPUT_CLASS,
} from "@/lib/forge-shell-header";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import {
  PROJECT_CATEGORY_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import type { GlobalSearchSuggest } from "@/lib/supabase/public-catalog-db";

function suggestHref(item: GlobalSearchSuggest): string {
  if (item.kind === "project") {
    return gameDetailHref(item.id);
  }
  if (item.kind === "developer") {
    return `/creators/${encodeURIComponent(item.id)}`;
  }
  return `/search/global?q=${encodeURIComponent(item.title)}`;
}

export function PlayerIaGlobalSearchInputFallback() {
  return (
    <form
      className={FORGE_SHELL_HEADER_SEARCH_FORM_CLASS}
      onSubmit={(event) => event.preventDefault()}
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
        aria-hidden="true"
      />
      <input
        type="search"
        readOnly
        placeholder="作品・開発者・タグを検索"
        className={FORGE_SHELL_HEADER_SEARCH_INPUT_CLASS}
      />
    </form>
  );
}

export function PlayerIaGlobalSearchInput() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GlobalSearchSuggest[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 1) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `/api/search/suggest?q=${encodeURIComponent(trimmed)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        setSuggestions([]);
        return;
      }
      const payload = (await response.json()) as {
        ok?: boolean;
        suggestions?: GlobalSearchSuggest[];
      };
      setSuggestions(payload.suggestions ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSuggestions(query);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [fetchSuggestions, query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    setOpen(false);
    router.push(
      trimmed
        ? `/search/global?q=${encodeURIComponent(trimmed)}`
        : "/search/global",
    );
  }

  return (
    <div ref={containerRef} className={`${FORGE_SHELL_HEADER_SEARCH_FORM_CLASS} relative`}>
      <form onSubmit={handleSubmit}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="作品・開発者・タグを検索"
          className={FORGE_SHELL_HEADER_SEARCH_INPUT_CLASS}
          aria-expanded={open && suggestions.length > 0}
          aria-controls="player-ia-search-suggest"
          autoComplete="off"
        />
      </form>

      {open && (suggestions.length > 0 || loading) ? (
        <ul
          id="player-ia-search-suggest"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-80 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 py-1 shadow-xl"
        >
          {loading && suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-zinc-500">検索中…</li>
          ) : null}
          {suggestions.map((item) => (
            <li key={`${item.kind}-${item.id}`}>
              <Link
                href={suggestHref(item)}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-zinc-900"
              >
                <span className="shrink-0 rounded-md border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                  {item.kind === "project"
                    ? "作品"
                    : item.kind === "developer"
                      ? "開発者"
                      : "タグ"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-zinc-100">{item.title}</span>
                  {item.subtitle ? (
                    <span className="block truncate text-xs text-zinc-500">
                      {item.subtitle}
                    </span>
                  ) : null}
                </span>
                {item.category ? (
                  <span className="shrink-0 text-[10px] text-zinc-500">
                    {PROJECT_CATEGORY_LABELS[item.category as ProjectCategoryId]}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
