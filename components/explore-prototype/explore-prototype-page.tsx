import { ExplorePrototypeCard } from "@/components/explore-prototype/explore-prototype-card";
import { ExplorePrototypeNav } from "@/components/explore-prototype/explore-prototype-nav";
import {
  getExplorePrototypeCategory,
  getExplorePrototypeShelves,
  type ExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";

export function ExplorePrototypePage({
  category,
}: {
  category: ExplorePrototypeCategorySlug;
}) {
  const meta = getExplorePrototypeCategory(category);
  const shelves = getExplorePrototypeShelves(category);

  if (!meta) {
    return null;
  }

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
        </div>

        <ExplorePrototypeNav active={category} />

        <div className="space-y-1 border-t border-zinc-800/80 pt-3">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            {meta.label}
          </h2>
          <p className="text-sm text-zinc-400">{meta.description}</p>
        </div>
      </header>

      {shelves.map((shelf) => (
        <section key={shelf.id} aria-labelledby={`shelf-${shelf.id}`}>
          <h2
            id={`shelf-${shelf.id}`}
            className="text-lg font-semibold text-white sm:text-xl"
          >
            {shelf.title}
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shelf.works.map((work) => (
              <li key={`${shelf.id}-${work.id}`} className="min-w-0 h-full">
                <ExplorePrototypeCard work={work} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
