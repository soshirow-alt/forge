"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { FORGE_FEATURE_TAG_OPTIONS } from "@/lib/forge-feature-tag-options";
import { FORGE_GENRE_OPTIONS } from "@/lib/forge-genre-options";
import {
  buildSearchHrefFromFilters,
  categorySupportsGameFilters,
  emptySearchFilterDraft,
  getSearchAttrFilterSpecs,
  readSearchFilterDraftFromParams,
  type PlayerIaSearchFilterDraft,
} from "@/lib/player-ia/search-filter-state";
import type { ProjectCategoryId } from "@/lib/project-categories";

type PlayerIaSearchFilterPanelProps = {
  category: ProjectCategoryId | null;
  sort: string;
  searchParams: URLSearchParams;
  onNavigate: (href: string) => void;
  /** When true, omit sticky aside chrome (used inside mobile sheet). */
  embedded?: boolean;
  className?: string;
};

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function FilterPanelBody({
  category,
  sort,
  searchParams,
  onNavigate,
  draft,
  setDraft,
  keywordId,
}: {
  category: ProjectCategoryId | null;
  sort: string;
  searchParams: URLSearchParams;
  onNavigate: (href: string) => void;
  draft: PlayerIaSearchFilterDraft;
  setDraft: (next: PlayerIaSearchFilterDraft) => void;
  keywordId: string;
}) {
  const showGameFilters = categorySupportsGameFilters(category);
  const categoryKey = category ?? "all";

  const apply = () => {
    onNavigate(
      buildSearchHrefFromFilters({
        category: categoryKey,
        sort,
        draft,
        current: searchParams,
      }),
    );
  };

  const clear = () => {
    const cleared = emptySearchFilterDraft();
    setDraft(cleared);
    onNavigate(
      buildSearchHrefFromFilters({
        category: categoryKey,
        sort,
        draft: cleared,
        current: searchParams,
      }),
    );
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">絞り込み</h2>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-violet-400 transition-colors hover:text-violet-300"
        >
          すべてクリア
        </button>
      </div>

      <div className="mt-4">
        <label htmlFor={keywordId} className="text-xs font-medium text-zinc-500">
          キーワード
        </label>
        <input
          id={keywordId}
          type="search"
          value={draft.q}
          maxLength={80}
          onChange={(event) =>
            setDraft({ ...draft, q: event.target.value })
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply();
            }
          }}
          className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
          placeholder="タイトル・説明・作者など"
          autoComplete="off"
        />
      </div>

      {showGameFilters ? (
        <>
          <fieldset className="mt-5">
            <legend className="text-xs font-medium text-zinc-500">ジャンル</legend>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
              {FORGE_GENRE_OPTIONS.map((genre) => {
                const checked = draft.genres.includes(genre);
                return (
                  <label
                    key={genre}
                    className={`flex cursor-pointer items-center gap-2 text-sm ${
                      checked ? "text-zinc-100" : "text-zinc-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setDraft({
                          ...draft,
                          genres: toggleValue(draft.genres, genre),
                        })
                      }
                      className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/40"
                    />
                    {genre}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-xs font-medium text-zinc-500">特徴タグ</legend>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
              {FORGE_FEATURE_TAG_OPTIONS.map((tag) => {
                const checked = draft.tags.includes(tag);
                return (
                  <label
                    key={tag}
                    className={`flex cursor-pointer items-center gap-2 text-sm ${
                      checked ? "text-zinc-100" : "text-zinc-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setDraft({
                          ...draft,
                          tags: toggleValue(draft.tags, tag),
                        })
                      }
                      className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/40"
                    />
                    {tag}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </>
      ) : null}

      {getSearchAttrFilterSpecs(category).map((spec) => {
        const selected = draft.attrFilters[spec.fieldId] ?? [];
        return (
          <fieldset key={spec.fieldId} className="mt-5">
            <legend className="text-xs font-medium text-zinc-500">
              {spec.label}
            </legend>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
              {spec.options.map((option) => {
                const checked = selected.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-2 text-sm ${
                      checked ? "text-zinc-100" : "text-zinc-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const nextValues =
                          spec.cardinality === "single"
                            ? checked
                              ? []
                              : [option.value]
                            : toggleValue(selected, option.value).slice(
                                0,
                                spec.maxSelection,
                              );
                        setDraft({
                          ...draft,
                          attrFilters: {
                            ...draft.attrFilters,
                            [spec.fieldId]: nextValues,
                          },
                        });
                      }}
                      className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/40"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <button
        type="button"
        onClick={apply}
        className="mt-6 flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90"
      >
        この条件で検索
        <ChevronDown className="size-4 rotate-[-90deg]" aria-hidden="true" />
      </button>
    </>
  );
}

export function PlayerIaSearchFilterPanel({
  category,
  sort,
  searchParams,
  onNavigate,
  embedded = false,
  className = "",
}: PlayerIaSearchFilterPanelProps) {
  const keywordId = useId();
  const urlKey = `${category ?? "all"}::${searchParams.toString()}`;
  const urlDraft = readSearchFilterDraftFromParams(
    new URLSearchParams(searchParams.toString()),
    category,
  );
  const [draft, setDraft] = useState(urlDraft);
  const [syncedUrlKey, setSyncedUrlKey] = useState(urlKey);
  if (urlKey !== syncedUrlKey) {
    setSyncedUrlKey(urlKey);
    setDraft(urlDraft);
  }

  const body = (
    <FilterPanelBody
      category={category}
      sort={sort}
      searchParams={searchParams}
      onNavigate={onNavigate}
      draft={draft}
      setDraft={setDraft}
      keywordId={keywordId}
    />
  );

  if (embedded) {
    return <div className={className}>{body}</div>;
  }

  return (
    <aside className={`w-full shrink-0 xl:w-72 ${className}`}>
      <section className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
        {body}
      </section>
    </aside>
  );
}

export function PlayerIaSearchFilterMobileTrigger({
  category,
  sort,
  searchParams,
  onNavigate,
}: Omit<PlayerIaSearchFilterPanelProps, "embedded" | "className">) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const navigateAndClose = (href: string) => {
    onNavigate(href);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 text-sm text-zinc-200 xl:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        絞り込み
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 xl:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="絞り込みを閉じる"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <span id={titleId} className="sr-only">
                絞り込み
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                aria-label="閉じる"
              >
                <X className="size-4" />
              </button>
            </div>
            <PlayerIaSearchFilterPanel
              category={category}
              sort={sort}
              searchParams={searchParams}
              onNavigate={navigateAndClose}
              embedded
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
