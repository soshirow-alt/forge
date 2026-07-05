"use client";

import {
  bucketPercent,
  type VoicePromptAggregate,
} from "@/lib/voice-aggregates";

type VoiceAggregateBarsProps = {
  aggregate: VoicePromptAggregate;
  compact?: boolean;
  /** studio = 横棒 + 多かった反応。public = 積み上げ + 凡例（みんなのFB） */
  variant?: "studio" | "public";
};

const STACKED_SEGMENT_CLASS_NAMES = [
  "bg-orange-500/85",
  "bg-amber-500/80",
  "bg-violet-500/75",
  "bg-emerald-500/70",
] as const;

function PublicStackedDistribution({
  aggregate,
  compact,
}: {
  aggregate: VoicePromptAggregate;
  compact: boolean;
}) {
  const sorted = [...aggregate.buckets].sort((a, b) => b.count - a.count);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-800/80"
        role="img"
        aria-label={`${aggregate.promptText} の回答分布`}
      >
        {sorted.map((bucket, index) => {
          const pct = bucketPercent(bucket.count, aggregate.totalResponses);
          if (pct <= 0) {
            return null;
          }
          return (
            <div
              key={bucket.answerValue}
              className={`h-full ${STACKED_SEGMENT_CLASS_NAMES[index % STACKED_SEGMENT_CLASS_NAMES.length]}`}
              style={{ width: `${pct}%` }}
              title={`${bucket.answerLabel} ${bucket.count}件 (${pct}%)`}
            />
          );
        })}
      </div>
      <ul className={compact ? "space-y-1" : "space-y-1.5"}>
        {sorted.map((bucket, index) => {
          const pct = bucketPercent(bucket.count, aggregate.totalResponses);
          return (
            <li
              key={bucket.answerValue}
              className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs"
            >
              <span
                className={`size-2 shrink-0 rounded-full ${STACKED_SEGMENT_CLASS_NAMES[index % STACKED_SEGMENT_CLASS_NAMES.length]}`}
                aria-hidden="true"
              />
              <span className="font-medium text-zinc-200">{bucket.answerLabel}</span>
              <span className="tabular-nums text-zinc-500">
                {bucket.count}件 ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>
      {!compact ? (
        <p className="text-[11px] text-zinc-600">
          合計 {aggregate.totalResponses} 件の回答（選択式の集計）
        </p>
      ) : null}
    </div>
  );
}

function StudioRowDistribution({
  aggregate,
  compact,
}: {
  aggregate: VoicePromptAggregate;
  compact: boolean;
}) {
  const sorted = [...aggregate.buckets].sort((a, b) => b.count - a.count);
  const topBucket = sorted[0] ?? null;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {topBucket ? (
        <p className="text-xs text-orange-300/90">
          多かった反応: {topBucket.answerLabel}
        </p>
      ) : null}
      {sorted.map((bucket) => {
        const pct = bucketPercent(bucket.count, aggregate.totalResponses);
        return (
          <div key={bucket.answerValue}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-zinc-400">{bucket.answerLabel}</span>
              <span className="tabular-nums text-zinc-500">
                {bucket.count}件 ({pct}%)
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500/80 to-amber-500/70"
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
          </div>
        );
      })}
      {!compact ? (
        <p className="pt-1 text-[11px] text-zinc-600">
          合計 {aggregate.totalResponses} 件の回答
        </p>
      ) : null}
    </div>
  );
}

export function VoiceAggregateBars({
  aggregate,
  compact = false,
  variant = "studio",
}: VoiceAggregateBarsProps) {
  if (aggregate.totalResponses === 0) {
    return <p className="text-xs text-zinc-600">まだ回答はありません</p>;
  }

  if (variant === "public") {
    return <PublicStackedDistribution aggregate={aggregate} compact={compact} />;
  }

  return <StudioRowDistribution aggregate={aggregate} compact={compact} />;
}
