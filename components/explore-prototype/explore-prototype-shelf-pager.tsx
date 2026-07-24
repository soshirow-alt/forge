"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

function useResponsivePageSize(desktopSize: number) {
  const [pageSize, setPageSize] = useState(desktopSize);

  useEffect(() => {
    function update() {
      if (window.innerWidth < 640) {
        setPageSize(1);
      } else if (window.innerWidth < 1024) {
        setPageSize(Math.min(2, desktopSize));
      } else {
        setPageSize(desktopSize);
      }
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [desktopSize]);

  return pageSize;
}

/**
 * Explore Prototype shelf pager — Production HorizontalCardPager behavior.
 */
export function ExplorePrototypeShelfPager<T>({
  items,
  renderItem,
  getKey,
  pageSize = 4,
  className = "",
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
  pageSize?: number;
  className?: string;
}) {
  const responsivePageSize = useResponsivePageSize(pageSize);
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(items.length / responsivePageSize));
  const safePage = Math.min(page, totalPages - 1);
  if (safePage !== page) {
    setPage(safePage);
  }

  const pageItems = useMemo(
    () =>
      items.slice(
        safePage * responsivePageSize,
        safePage * responsivePageSize + responsivePageSize,
      ),
    [items, responsivePageSize, safePage],
  );

  function goPrev() {
    setPage((current) => Math.max(0, current - 1));
  }

  function goNext() {
    setPage((current) => Math.min(totalPages - 1, current + 1));
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${responsivePageSize}, minmax(0, 1fr))`,
        }}
      >
        {pageItems.map((item) => (
          <div key={getKey(item)} className="min-w-0">
            {renderItem(item)}
          </div>
        ))}
      </div>

      {totalPages > 1 ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            disabled={safePage <= 0}
            className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-700/80 bg-zinc-950/90 p-2 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none disabled:opacity-30 sm:-left-4"
            aria-label="前の作品"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={safePage >= totalPages - 1}
            className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-700/80 bg-zinc-950/90 p-2 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none disabled:opacity-30 sm:-right-4"
            aria-label="次の作品"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPage(index)}
                className={`size-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                  index === safePage
                    ? "bg-violet-500"
                    : "bg-zinc-700 hover:bg-zinc-500"
                }`}
                aria-label={`ページ ${index + 1}`}
                aria-current={index === safePage ? "true" : undefined}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function ExplorePrototypeSectionHeader({
  title,
  headingId,
  seeAllHref,
  seeAllLabel,
}: {
  title: string;
  headingId?: string;
  seeAllHref?: string;
  seeAllLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2
        id={headingId}
        className="text-lg font-semibold text-white sm:text-xl"
      >
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
