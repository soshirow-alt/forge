import { getDevelopmentActivityMetrics } from "@/lib/demo-community";

type DevelopmentActivityPanelProps = {
  gameId: string;
};

export function DevelopmentActivityPanel({
  gameId,
}: DevelopmentActivityPanelProps) {
  const metrics = getDevelopmentActivityMetrics(gameId);

  if (!metrics) {
    return null;
  }

  return (
    <dl className="grid gap-2 border-t border-zinc-800 pt-3 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-xs text-zinc-500">更新頻度</dt>
        <dd className="text-sm text-zinc-300">{metrics.updateFrequency}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-xs text-zinc-500">最近の改善</dt>
        <dd className="max-w-[58%] truncate text-right text-sm text-zinc-400">
          {metrics.recentImprovement}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-xs text-zinc-500">開発活動</dt>
        <dd className="text-sm font-medium tabular-nums text-zinc-200">
          {metrics.devActivityCount}件
        </dd>
      </div>
      {metrics.adoptedSuggestionsCount > 0 && (
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-zinc-500">プレイヤー提案採用実績</dt>
          <dd className="text-sm tabular-nums text-zinc-400">
            {metrics.adoptedSuggestionsCount}件
          </dd>
        </div>
      )}
    </dl>
  );
}
