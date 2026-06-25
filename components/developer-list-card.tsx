"use client";

import Image from "next/image";
import Link from "next/link";
import type { DeveloperSearchResult } from "@/lib/developer-search-v0-mock-data";
import { developerProfileHref } from "@/lib/developer-search-v0-mock-data";
import { BadgeCheck, Sprout, UserPlus } from "lucide-react";

export function DeveloperListCard({
  dev,
  following = false,
  showFollowButton = true,
  onFollow,
  href,
}: {
  dev: DeveloperSearchResult;
  following?: boolean;
  showFollowButton?: boolean;
  onFollow?: (devId: string) => void;
  href?: string;
}) {
  const profileHref = href ?? developerProfileHref(dev.id);

  return (
    <Link
      href={profileHref}
      className="block rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-700"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="relative mx-auto size-16 shrink-0 overflow-hidden rounded-full bg-zinc-800 sm:mx-0">
          <Image src={dev.avatar} alt="" fill className="object-cover" sizes="64px" />
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
          <p className="mt-1 text-xs text-zinc-600">@{dev.handle}</p>
          <p className="mt-2 text-sm text-zinc-400">{dev.bio}</p>
          {dev.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {dev.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-zinc-700/80 bg-zinc-950/50 px-2 py-0.5 text-[10px] text-zinc-500"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-zinc-500">
            開発中 {dev.inDevelopment} / 完成品 {dev.completed} / フォロワー{" "}
            {dev.followers.toLocaleString()}
          </p>
          <div className="mt-3 flex gap-2">
            {dev.gameThumbs.map((thumb) => (
              <span key={thumb} className="relative size-12 overflow-hidden rounded-lg bg-zinc-800">
                <Image src={thumb} alt="" fill className="object-cover" sizes="48px" />
              </span>
            ))}
          </div>
        </div>
        {showFollowButton && onFollow && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onFollow(dev.id);
            }}
            className={`inline-flex shrink-0 items-center gap-1.5 self-center rounded-xl border px-4 py-2 text-sm ${
              following
                ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                : "border-zinc-700 text-zinc-300 hover:border-zinc-600"
            }`}
          >
            <UserPlus className="size-4" aria-hidden="true" />
            {following ? "フォロー中" : "フォロー"}
          </button>
        )}
      </div>
    </Link>
  );
}
