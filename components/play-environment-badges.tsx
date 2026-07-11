import { getPlayEnvironmentLabels } from "@/lib/play-environment";

type PlayEnvironmentBadgesProps = {
  game: Parameters<typeof getPlayEnvironmentLabels>[0];
  compact?: boolean;
};

const labelStyles: Record<string, string> = {
  PC対応: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  スマホ対応: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  ブラウザでプレイ: "border-cyan-500/35 bg-cyan-500/10 text-cyan-300",
  公開先あり: "border-zinc-500/35 bg-zinc-500/10 text-zinc-300",
  ダウンロードあり: "border-amber-500/35 bg-amber-500/10 text-amber-300",
};

export function PlayEnvironmentBadges({
  game,
  compact = false,
}: PlayEnvironmentBadgesProps) {
  const labels = getPlayEnvironmentLabels(game);

  if (labels.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? "" : "mt-3"}`}>
      {labels.map((label) => (
        <span
          key={label}
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
            labelStyles[label] ??
            "border-zinc-600/50 bg-zinc-950/70 text-zinc-300"
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
