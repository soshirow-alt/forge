"use client";

import { genreFilters } from "@/lib/mypage-v0-mock-data";
import type { ReactNode } from "react";

export type GenreFilter = (typeof genreFilters)[number];

export function matchesGenre(
  selected: GenreFilter,
  primaryGenre: string,
  extraTags: readonly string[] = [],
) {
  if (selected === "すべて") {
    return true;
  }
  return primaryGenre === selected || extraTags.includes(selected);
}

export function StatusFilterPills<T extends string>({
  options,
  activeId,
  onChange,
}: {
  options: readonly { id: T; label: string; count: number }[];
  activeId: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {options.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onChange(filter.id)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
            activeId === filter.id
              ? "bg-violet-600 text-white"
              : "border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          }`}
        >
          {filter.label}
          <span className="ml-1 opacity-70">{filter.count}</span>
        </button>
      ))}
    </div>
  );
}

function GenreChips({
  selected,
  onChange,
}: {
  selected: GenreFilter;
  onChange: (genre: GenreFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {genreFilters.map((genre) => (
        <button
          key={genre}
          type="button"
          onClick={() => onChange(genre)}
          className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
            selected === genre
              ? "bg-white text-zinc-950"
              : "border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}

export function MyPageFilterPanel({
  selectedGenre,
  onGenreChange,
  onReset,
  children,
  showGenre = true,
}: {
  selectedGenre: GenreFilter;
  onGenreChange: (genre: GenreFilter) => void;
  onReset: () => void;
  children?: ReactNode;
  showGenre?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
      <h2 className="text-sm font-semibold text-white">フィルター</h2>
      {children && <div className="mt-4 space-y-4">{children}</div>}
      {showGenre && (
        <div className={children ? "mt-4 border-t border-zinc-800/80 pt-4" : "mt-4"}>
          <p className="text-xs font-medium text-zinc-500">ジャンル</p>
          <div className="mt-3">
            <GenreChips selected={selectedGenre} onChange={onGenreChange} />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onReset}
        className="mt-4 text-xs text-violet-400 transition-colors hover:text-violet-300"
      >
        フィルターをリセット
      </button>
    </section>
  );
}

export function MyPageFilterSidebar(props: {
  selectedGenre: GenreFilter;
  onGenreChange: (genre: GenreFilter) => void;
  onReset: () => void;
  children?: ReactNode;
  showGenre?: boolean;
}) {
  return (
    <aside className="w-full shrink-0 space-y-6 xl:w-72">
      <MyPageFilterPanel {...props} />
    </aside>
  );
}

export function FilterRadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <ul className="mt-2 space-y-1">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => onChange(option.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                value === option.id
                  ? "bg-violet-600/15 text-violet-200"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              }`}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MyPageEmptyAside() {
  return <aside className="hidden w-72 shrink-0 xl:block" aria-hidden="true" />;
}
