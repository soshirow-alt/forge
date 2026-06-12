import { getDeveloperResponsivenessMetrics } from "@/lib/demo-community";

type DeveloperResponsivenessPanelProps = {
  gameId: string;
};

export function DeveloperResponsivenessPanel({
  gameId,
}: DeveloperResponsivenessPanelProps) {
  const metrics = getDeveloperResponsivenessMetrics(gameId);

  if (!metrics) {
    return null;
  }

  return (
    <dl className="grid gap-2.5 border-t border-zinc-800 pt-4 text-sm">
      {metrics.responseRate !== null && (
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-zinc-500">開発者応答率</dt>
          <dd className="text-sm font-medium tabular-nums text-emerald-400/90">
            {metrics.responseRate}%
          </dd>
        </div>
      )}
      {metrics.feedbackAppliedCount !== null && (
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-zinc-500">プレイヤー反映実績</dt>
          <dd className="text-sm font-medium tabular-nums text-zinc-200">
            {metrics.feedbackAppliedCount}件
          </dd>
        </div>
      )}
      {metrics.recentUpdateLabel && (
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-zinc-500">最近の更新</dt>
          <dd className="text-sm text-zinc-400">{metrics.recentUpdateLabel}</dd>
        </div>
      )}
    </dl>
  );
}
