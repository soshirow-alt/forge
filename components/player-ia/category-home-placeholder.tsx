import type { LucideIcon } from "lucide-react";
import { CATEGORY_HOME_HERO_PLACEHOLDER_COPY } from "@/lib/player-ia/category-home-hero";
import {
  HOME_HERO_PLACEHOLDER_CHROME_CLASS,
  HOME_HERO_PLACEHOLDER_THUMB_BOX_CLASS,
} from "@/lib/player-ia/home-hero-geometry";

export function CategoryHomePlaceholder({
  icon: Icon,
  copy = CATEGORY_HOME_HERO_PLACEHOLDER_COPY,
}: {
  icon?: LucideIcon;
  copy?: string;
}) {
  return (
    <div role="presentation" className={HOME_HERO_PLACEHOLDER_CHROME_CLASS}>
      <span className={HOME_HERO_PLACEHOLDER_THUMB_BOX_CLASS} aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        {Icon ? (
          <Icon className="mb-1 size-4 shrink-0 opacity-40 text-zinc-600" aria-hidden="true" />
        ) : null}
        <p className="line-clamp-2 text-xs leading-relaxed text-zinc-600">{copy}</p>
      </span>
    </div>
  );
}
