import {
  getCommunityImpactItems,
  type CommunityImpactItem,
} from "@/lib/project-activity";

type GameCommunityImpactSectionProps = {
  projectId: string;
};

function ImpactList({ items }: { items: CommunityImpactItem[] }) {
  return (
    <ul className="mt-5 space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-4 py-3"
        >
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm text-emerald-400"
            aria-hidden
          >
            ✔
          </span>
          <span className="text-sm text-zinc-200">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function GameCommunityImpactSection({
  projectId,
}: GameCommunityImpactSectionProps) {
  const items = getCommunityImpactItems(projectId);

  return (
    <div className="mt-8 border-t border-zinc-800 pt-8">
      <h2 className="text-sm font-medium text-zinc-500">プレイヤーからの反映</h2>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600">
        テストプレイやフィードバックをもとに取り入れられた改善例です。
      </p>
      <ImpactList items={items} />
    </div>
  );
}
