"use client";

import Link from "next/link";
import type { DeveloperSearchResult } from "@/lib/developer-search-v0-mock-data";
import { developerProfileHref } from "@/lib/developer-search-v0-mock-data";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { PublicXLink } from "@/components/public-x-link";
import { Sprout, UserPlus } from "lucide-react";

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
  const featured = (
    dev.featuredWorks ??
    (dev.gameThumbs ?? []).map((image, index) => ({
      id: `${dev.id}-thumb-${index}`,
      title: "",
      image,
    }))
  )
    .filter((work) => Boolean(work.title?.trim()) && Boolean(work.id?.trim()))
    .slice(0, 3);
  const publicGameCount =
    typeof dev.publicGameCount === "number" ? dev.publicGameCount : null;

  return (
    <Link
      href={profileHref}
      className="block rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700 sm:p-5"
    >
      <div className="flex gap-3 sm:gap-4">
        <ProfileAvatar
          src={dev.avatar}
          userId={dev.userId}
          className="size-12 shrink-0 sm:size-14"
          size={56}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-semibold text-white">
                  {dev.name}
                </h2>
                {dev.isNew ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                    <Sprout className="size-3" aria-hidden="true" />
                    新規
                  </span>
                ) : null}
                {dev.xAccount ? (
                  <PublicXLink accountOrUrl={dev.xAccount} />
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                @{dev.handle}
              </p>
            </div>
            {showFollowButton && onFollow ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onFollow(dev.id);
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm ${
                  following
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <UserPlus className="size-4" aria-hidden="true" />
                {following ? "フォロー中" : "フォロー"}
              </button>
            ) : null}
          </div>

          {dev.bio ? (
            <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{dev.bio}</p>
          ) : null}

          {dev.genres.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {dev.genres.slice(0, 4).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-zinc-700/80 bg-zinc-950/50 px-2 py-0.5 text-[10px] text-zinc-500"
                >
                  {genre}
                </span>
              ))}
            </div>
          ) : null}

          <p className="mt-2 text-xs text-zinc-500">
            {publicGameCount == null ? (
              <span className="inline-block h-3 w-20 animate-pulse rounded bg-zinc-800/80 align-middle" />
            ) : (
              <>公開作品 {publicGameCount.toLocaleString()}</>
            )}
            {dev.followers == null ? (
              <span className="ml-2 inline-block h-3 w-16 animate-pulse rounded bg-zinc-800/80 align-middle" />
            ) : (
              <> · フォロワー {dev.followers.toLocaleString()}</>
            )}
          </p>

          {featured.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2.5">
              {featured.map((work) => (
                <li key={work.id} className="min-w-0">
                  <ProjectThumbnail
                    projectId={work.id}
                    title={work.title || "作品"}
                    variant="mini"
                  />
                  {work.title ? (
                    <p className="mt-1 max-w-[140px] truncate text-[10px] leading-tight text-zinc-500">
                      {work.title}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
