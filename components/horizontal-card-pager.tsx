"use client";

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

export function HorizontalCardPager<T>({
  items,
  renderItem,
  getKey,
  pageSize = 3,
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

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

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

      {totalPages > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            disabled={safePage <= 0}
            className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-700/80 bg-zinc-950/90 p-2 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:pointer-events-none disabled:opacity-30 sm:-left-4"
            aria-label="前の作品"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={safePage >= totalPages - 1}
            className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-700/80 bg-zinc-950/90 p-2 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:pointer-events-none disabled:opacity-30 sm:-right-4"
            aria-label="次の作品"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPage(index)}
                className={`size-2 rounded-full transition-colors ${
                  index === safePage ? "bg-violet-500" : "bg-zinc-700 hover:bg-zinc-500"
                }`}
                aria-label={`ページ ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
