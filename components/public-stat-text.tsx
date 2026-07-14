"use client";

/**
 * Display a public count only after load succeeds.
 * Avoids flashing hard-coded 0 as a "real" public metric.
 */
export function PublicStatText({
  loaded,
  value,
  label,
  className = "text-xs text-zinc-500",
  compact = false,
}: {
  loaded: boolean;
  value: number | null | undefined;
  label: string;
  className?: string;
  compact?: boolean;
}) {
  if (!loaded || value == null || !Number.isFinite(value)) {
    if (compact) {
      return (
        <span className={`${className} inline-block h-3 w-10 animate-pulse rounded bg-zinc-800/80`} />
      );
    }
    return (
      <span className={`${className} inline-block h-4 w-16 animate-pulse rounded bg-zinc-800/80`} />
    );
  }

  return (
    <span className={className}>
      {label} {Number(value).toLocaleString()}
    </span>
  );
}
