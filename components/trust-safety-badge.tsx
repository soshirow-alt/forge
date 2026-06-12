import { getTrustBadgeStatus } from "@/lib/play-environment";

type TrustSafetyBadgeProps = {
  game: Parameters<typeof getTrustBadgeStatus>[0];
};

export function TrustSafetyBadge({ game }: TrustSafetyBadgeProps) {
  const status = getTrustBadgeStatus(game);

  if (!status) {
    return null;
  }

  if (status === "verified") {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
        安全確認
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-zinc-600/60 bg-zinc-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-400">
      未確認
    </span>
  );
}
