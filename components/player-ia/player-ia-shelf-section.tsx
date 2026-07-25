"use client";

import Link from "next/link";
import { ExplorePrototypeShelfPager } from "@/components/explore-prototype/explore-prototype-shelf-pager";
import type { ReactNode } from "react";

export function PlayerIaSectionHeader({
  title,
  headingId,
  seeAllHref,
  seeAllLabel,
}: {
  title: string;
  headingId: string;
  seeAllHref?: string;
  seeAllLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={headingId} className="text-lg font-semibold text-white sm:text-xl">
        {title}
      </h2>
      {seeAllHref && seeAllLabel ? (
        <Link
          href={seeAllHref}
          className="shrink-0 text-sm text-violet-400 transition-colors hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          {seeAllLabel} →
        </Link>
      ) : null}
    </div>
  );
}

export function PlayerIaShelfSection<T>({
  title,
  headingId,
  items,
  getKey,
  renderItem,
  seeAllHref,
  seeAllLabel,
  pageSize = 4,
}: {
  title: string;
  headingId: string;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  seeAllHref?: string;
  seeAllLabel?: string;
  pageSize?: number;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <PlayerIaSectionHeader
        title={title}
        headingId={headingId}
        seeAllHref={seeAllHref}
        seeAllLabel={seeAllLabel}
      />
      <div className="px-2">
        <ExplorePrototypeShelfPager
          items={items}
          getKey={getKey}
          renderItem={renderItem}
          pageSize={pageSize}
        />
      </div>
    </section>
  );
}
