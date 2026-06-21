"use client";

import { ViewModeToggle, type ViewMode } from "@/components/view-mode-toggle";

export function ListControlsBar<T extends string>({
  sortId,
  sortOptions,
  onSortChange,
  viewMode,
  onViewModeChange,
  showViewToggle = true,
}: {
  sortId: T;
  sortOptions: readonly { id: T; label: string }[];
  onSortChange: (id: T) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showViewToggle?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="inline-flex items-center gap-2 text-sm text-zinc-400">
        <span className="shrink-0">並び替え:</span>
        <select
          value={sortId}
          onChange={(event) => onSortChange(event.target.value as T)}
          className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
        >
          {sortOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {showViewToggle && (
        <ViewModeToggle value={viewMode} onChange={onViewModeChange} size="sm" />
      )}
    </div>
  );
}
