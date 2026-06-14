"use client";

import { bucketPercent, type VoicePromptAggregate } from "@/lib/voice-aggregates";

type VoiceAggregateBarsProps = {
  aggregate: VoicePromptAggregate;
  compact?: boolean;
};

export function VoiceAggregateBars({
  aggregate,
  compact = false,
}: VoiceAggregateBarsProps) {
  if (aggregate.totalResponses === 0) {
    return (
      <p className="text-xs text-zinc-600">まだ返事はありません</p>
    );
  }

  const sorted = [...aggregate.buckets].sort((a, b) => b.count - a.count);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
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
      {!compact && (
        <p className="pt-1 text-[11px] text-zinc-600">
          合計 {aggregate.totalResponses} 件の返事（個別の内容は非公開）
        </p>
      )}
    </div>
  );
}
