"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

function readSearchQueryFromWindow(pathname: string): string {
  if (typeof window === "undefined") return "";
  if (pathname === "/search" || pathname.startsWith("/search/")) {
    return new URLSearchParams(window.location.search).get("q")?.trim() ?? "";
  }
  return "";
}

export function HeaderSearchFormFallback() {
  return (
    <form className="relative min-w-0 flex-1" onSubmit={(event) => event.preventDefault()}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
        aria-hidden="true"
      />
      <input
        type="search"
        readOnly
        placeholder="ゲームやジャンルを検索（例：RPG、ピクセルアート）"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500"
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
    <form onSubmit={handleSubmit} className="relative min-w-0 flex-1">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ゲームやジャンルを検索（例：RPG、ピクセルアート）"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
      />
    </form>
  );
}
