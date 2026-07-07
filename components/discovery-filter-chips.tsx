"use client";

import {
  GENRE_FILTER_OPTIONS,
  PHASE_FILTER_OPTIONS,
  PLATFORM_FILTER_OPTIONS,
  PLAY_TIME_FILTER_OPTIONS,
  type DiscoveryChipFilters,
  type GenreFilter,
  type PhaseFilter,
  type PlatformFilter,
  type PlayTimeFilter,
  hasActiveChipFilters,
} from "@/lib/discovery-filters";
import { displayPhase } from "@/lib/development-phases";

type DiscoveryFilterChipsProps = {
  filters: DiscoveryChipFilters;
  onChange: (filters: DiscoveryChipFilters) => void;
};

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
        active
          ? "border-orange-500/60 bg-orange-500/15 text-orange-200"
          : "border-zinc-700/80 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}

function FilterGroup<T extends string>({
  title,
  options,
  selected,
  onToggle,
  labelForOption,
}: {
  title: string;
  options: readonly T[];
  selected: T[];
  onToggle: (value: T) => void;
  labelForOption?: (value: T) => string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-zinc-500">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip
            key={option}
            label={labelForOption ? labelForOption(option) : option}
            active={selected.includes(option)}
            onClick={() => onToggle(option)}
          />
        ))}
      </div>
    </div>
  );
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function DiscoveryFilterChips({
  filters,
  onChange,
}: DiscoveryFilterChipsProps) {
  function toggleGenre(genre: GenreFilter) {
    onChange({ ...filters, genres: toggleValue(filters.genres, genre) });
  }

  function togglePlatform(platform: PlatformFilter) {
    onChange({ ...filters, platforms: toggleValue(filters.platforms, platform) });
  }

  function togglePhase(phase: PhaseFilter) {
    onChange({ ...filters, phases: toggleValue(filters.phases, phase) });
  }

  function togglePlayTime(playTime: PlayTimeFilter) {
    onChange({ ...filters, playTimes: toggleValue(filters.playTimes, playTime) });
  }

  function clearAll() {
    onChange({
      genres: [],
      platforms: [],
      phases: [],
      playTimes: [],
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 backdrop-blur-sm sm:p-6">
      <div className="flex flex-col gap-5">
        <FilterGroup
          title="ジャンル"
          options={GENRE_FILTER_OPTIONS}
          selected={filters.genres}
          onToggle={toggleGenre}
        />
        <FilterGroup
          title="開発フェーズ"
          options={PHASE_FILTER_OPTIONS}
          selected={filters.phases}
          onToggle={togglePhase}
          labelForOption={displayPhase}
        />
        <FilterGroup
          title="想定プレイ時間"
          options={PLAY_TIME_FILTER_OPTIONS}
          selected={filters.playTimes}
          onToggle={togglePlayTime}
        />
        <FilterGroup
          title="プレイ環境"
          options={PLATFORM_FILTER_OPTIONS}
          selected={filters.platforms}
          onToggle={togglePlatform}
        />
      </div>
      {hasActiveChipFilters(filters) && (
        <button
          type="button"
          onClick={clearAll}
          className="mt-4 text-xs font-medium text-zinc-500 transition-colors hover:text-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          フィルターをクリア
        </button>
      )}
    </div>
  );
}
