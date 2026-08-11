import type { LucideIcon } from "lucide-react";
import { CATEGORY_HOME_HERO_PLACEHOLDER_COPY } from "@/lib/player-ia/category-home-hero";

export function CategoryHomePlaceholder({
  icon: Icon,
  copy = CATEGORY_HOME_HERO_PLACEHOLDER_COPY,
}: {
  icon?: LucideIcon;
  copy?: string;
}) {
  return (
    <div
      role="presentation"
      className="flex h-full min-h-[148px] w-full items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/50 px-4 py-3 text-zinc-600"
    >
      {Icon ? (
        <Icon className="size-5 shrink-0 opacity-40" aria-hidden="true" />
      ) : null}
      <p className="text-xs leading-relaxed">{copy}</p>
    </div>
  );
}
