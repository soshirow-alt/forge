import Link from "next/link";
import { ExplorePrototypeCard } from "@/components/explore-prototype/explore-prototype-card";
import { ExplorePrototypeNav } from "@/components/explore-prototype/explore-prototype-nav";
import {
  EXPLORE_PROTOTYPE_CATEGORIES,
  getExplorePrototypeHomeFeatured,
} from "@/lib/prototype/explore-prototype";

/**
 * Explore Prototype hub — cross-category featured works + category entry.
 */
export function ExplorePrototypeHomePage() {
  const featured = getExplorePrototypeHomeFeatured();

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
            Explore
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            作品を探す
          </h1>
          <p className="text-sm text-zinc-400">
            カテゴリを選んで、プロトタイプ作品を横断して眺める
          </p>
        </div>

        <ExplorePrototypeNav active={null} />
      </header>

      <section aria-labelledby="home-featured">
        <h2
          id="home-featured"
          className="text-lg font-semibold text-white sm:text-xl"
        >
          注目の作品
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featured.map((work) => (
            <li key={work.id} className="min-w-0">
              <ExplorePrototypeCard work={work} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="home-categories" className="space-y-3">
        <h2
          id="home-categories"
          className="text-lg font-semibold text-white sm:text-xl"
        >
          カテゴリから探す
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {EXPLORE_PROTOTYPE_CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link
                href={category.href}
                className="flex min-w-0 flex-col gap-1 rounded-xl border border-zinc-800/90 bg-zinc-900/40 px-4 py-3 transition-colors hover:border-violet-500/40 hover:bg-violet-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                <span className="text-sm font-semibold text-zinc-50">
                  {category.label}
                </span>
                <span className="text-xs text-zinc-400">{category.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
