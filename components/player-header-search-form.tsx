"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useState } from "react";
import {
  FORGE_SHELL_HEADER_SEARCH_FORM_CLASS,
  FORGE_SHELL_HEADER_SEARCH_INPUT_CLASS,
} from "@/lib/forge-shell-header";

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

/** Header search — remounts on /search?q= so query-only nav stays in sync. */
export function HeaderSearchForm({ legacyDefault }: { legacyDefault?: string }) {
  return (
    <Suspense fallback={<HeaderSearchFormFallback />}>
      <HeaderSearchFormFromUrl legacyDefault={legacyDefault} />
    </Suspense>
  );
}

function HeaderSearchFormFromUrl({ legacyDefault }: { legacyDefault?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery =
    pathname === "/search" || pathname.startsWith("/search/")
      ? (searchParams.get("q")?.trim() ?? "")
      : "";
  const initialQuery = legacyDefault ?? urlQuery;
  return (
    <HeaderSearchFormInner
      key={`player-search-q:${pathname}:${urlQuery}:${legacyDefault ?? ""}`}
      initialQuery={initialQuery}
    />
  );
}

function HeaderSearchFormInner({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

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
