"use client";

import { paginateSearchResults } from "@/lib/search-v0-mock-data";
import { useEffect, useMemo, useState } from "react";

export const MYPAGE_LIST_PAGE_SIZE = 5;

export function useMyPageListPagination<T>(items: T[], resetKey: string) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const pagination = useMemo(
    () => paginateSearchResults(items, page, MYPAGE_LIST_PAGE_SIZE),
    [items, page],
  );

  return { pagination, page, setPage };
}

export function MyPageListPagination({
  totalItems,
  page,
  pageSize,
  onPageChange,
}: {
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const rangeStart = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalItems);

  if (totalItems === 0) {
    return (
      <p className="mt-6 text-sm text-zinc-500">0件</p>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
      <p>
        {totalItems}件中 {rangeStart}–{rangeEnd}件
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 transition-colors hover:border-zinc-700 hover:text-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-600"
          >
            前へ
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`rounded-lg border px-3 py-1.5 ${
                pageNumber === safePage
                  ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                  : "border-zinc-800 transition-colors hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 transition-colors hover:border-zinc-700 hover:text-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-600"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
