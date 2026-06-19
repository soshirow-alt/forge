"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";
import { PlayerShell, SortDropdown } from "@/components/player-shell";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  DEVELOPER_SEARCH_TOTAL,
  developerProfileHref,
  developerSearchResults,
  filterDevelopers,
} from "@/lib/developer-search-v0-mock-data";
import { BadgeCheck, ChevronDown, Sprout, UserPlus } from "lucide-react";

function DeveloperSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { requireAuth } = useRequireAuth();
  const queryFromUrl = searchParams.get("q")?.trim() ?? "";
  const [query, setQuery] = useState(queryFromUrl);
  const [newOnly, setNewOnly] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const dev of developerSearchResults) {
      if (dev.following) {
        initial.add(dev.id);
      }
    }
    return initial;
  });

  const handleFollow = useCallback(
    (devId: string) => {
      requireAuth(() => {
        setFollowingIds((prev) => {
          const next = new Set(prev);
          if (next.has(devId)) {
            next.delete(devId);
          } else {
            next.add(devId);
          }
          return next;
        });
      }, `/search/creators${queryFromUrl ? `?q=${encodeURIComponent(queryFromUrl)}` : ""}`);
    },
    [queryFromUrl, requireAuth],
  );

  const results = useMemo(() => {
    const filtered = filterDevelopers(queryFromUrl);
    return newOnly ? filtered.filter((dev) => dev.isNew) : filtered;
  }, [queryFromUrl, newOnly]);

  const applySearch = () => {
    const trimmed = query.trim();
    router.push(trimmed ? `/search/creators?q=${encodeURIComponent(trimmed)}` : "/search/creators");
  };

  return (
    <PlayerShell activeNav="creator-search" headerSearchDefault={queryFromUrl}>
      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="min-w-0 flex-1">
          <header>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">開発者を探す</h1>
            <p className="mt-2 text-sm text-zinc-400">開発者名で検索できます</p>
          </header>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="開発者名を入力して検索"
              className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={applySearch}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
            >
              検索
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">
              検索結果: {DEVELOPER_SEARCH_TOTAL}人（表示 {results.length}人）
            </p>
            <SortDropdown label="おすすめ順" />
          </div>

          <ul className="mt-6 space-y-4">
            {results.map((dev) => (
              <li key={dev.id}>
                <Link
                  href={developerProfileHref(dev.id)}
                  className="block rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-700"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <span className="relative mx-auto size-16 shrink-0 overflow-hidden rounded-full bg-zinc-800 sm:mx-0">
                      <Image src={dev.avatar} alt="" fill className="object-cover" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-white">{dev.name}</h2>
                        {dev.verified && (
                          <BadgeCheck className="size-4 text-violet-400" aria-label="認証済み" />
                        )}
                        {dev.isNew && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                            <Sprout className="size-3" aria-hidden="true" />
                            新規開発者
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">{dev.bio}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        開発中 {dev.inDevelopment} / 完成品 {dev.completed} / フォロワー{" "}
                        {dev.followers.toLocaleString()}
                      </p>
                      <div className="mt-3 flex gap-2">
                        {dev.gameThumbs.map((thumb) => (
                          <span
                            key={thumb}
                            className="relative size-12 overflow-hidden rounded-lg bg-zinc-800"
                          >
                            <Image src={thumb} alt="" fill className="object-cover" />
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        handleFollow(dev.id);
                      }}
                      className={`inline-flex shrink-0 items-center gap-1.5 self-center rounded-xl border px-4 py-2 text-sm ${
                        followingIds.has(dev.id)
                          ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                          : "border-zinc-700 text-zinc-300 hover:border-zinc-600"
                      }`}
                    >
                      <UserPlus className="size-4" aria-hidden="true" />
                      {followingIds.has(dev.id) ? "フォロー中" : "フォロー"}
                    </button>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <aside className="w-full shrink-0 xl:w-72">
          <section className="sticky top-24 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-white">絞り込み</h2>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={newOnly}
                onChange={(e) => setNewOnly(e.target.checked)}
                className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500"
              />
              🌱 新規開発者のみ
            </label>
            <p className="mt-4 text-xs leading-relaxed text-zinc-600">
              開発者名のみ検索対象です。作品名・ジャンル・自己紹介文は検索しません。
            </p>
          </section>
        </aside>
      </div>
    </PlayerShell>
  );
}

export function DeveloperSearchV0Page() {
  return (
    <Suspense fallback={<div className="flex min-h-full items-center justify-center bg-[#0a0a0a] text-zinc-500">読み込み中...</div>}>
      <DeveloperSearchContent />
    </Suspense>
  );
}
