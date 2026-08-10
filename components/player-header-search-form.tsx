"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import {
  FORGE_SHELL_HEADER_SEARCH_FORM_CLASS,
  FORGE_SHELL_HEADER_SEARCH_INPUT_CLASS,
} from "@/lib/forge-shell-header";

function readSearchQueryFromWindow(pathname: string): string {
  if (typeof window === "undefined") return "";
  if (pathname === "/search" || pathname.startsWith("/search/")) {
    return new URLSearchParams(window.location.search).get("q")?.trim() ?? "";
  }
  return "";
}

export function HeaderSearchFormFallback() {
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
        placeholder="作品・クリエイター・タグを検索"
        className={FORGE_SHELL_HEADER_SEARCH_INPUT_CLASS}
      />
    </form>
  );
}

/** Header search — syncs from window query on /search; no useSearchParams. */
export function HeaderSearchForm({ legacyDefault }: { legacyDefault?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(legacyDefault ?? "");

  useEffect(() => {
    if (legacyDefault !== undefined) {
      setQuery(legacyDefault);
      return;
    }
    setQuery(readSearchQueryFromWindow(pathname));
  }, [pathname, legacyDefault]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  return (
    <form onSubmit={handleSubmit} className={FORGE_SHELL_HEADER_SEARCH_FORM_CLASS}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="作品・クリエイター・タグを検索"
        className={FORGE_SHELL_HEADER_SEARCH_INPUT_CLASS}
      />
    </form>
  );
}
