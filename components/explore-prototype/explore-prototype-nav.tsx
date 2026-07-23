import Link from "next/link";
import {
  EXPLORE_PROTOTYPE_CATEGORIES,
  type ExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";

/**
 * Category navigation for Explore Prototype — Link-based page transitions only.
 */
export function ExplorePrototypeNav({
  active,
}: {
  /** null = hub `/explore/prototype` (no category selected) */
  active: ExplorePrototypeCategorySlug | null;
}) {
  return (
    <nav
      aria-label="Exploreカテゴリ"
      className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
    >
      <ul className="flex w-max min-w-full gap-1.5 sm:gap-2">
        {EXPLORE_PROTOTYPE_CATEGORIES.map((item) => {
          const selected = item.slug === active;
          return (
            <li key={item.slug} className="shrink-0">
              <Link
                href={item.href}
                aria-current={selected ? "page" : undefined}
                className={`inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:px-3.5 ${
                  selected
                    ? "bg-violet-600/25 text-violet-100 ring-1 ring-violet-500/45"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
