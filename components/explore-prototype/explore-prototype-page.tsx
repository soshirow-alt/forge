import { ExplorePrototypeDiscoveryCard } from "@/components/explore-prototype/explore-prototype-discovery-card";
import { ExplorePrototypeFeaturedCarousel } from "@/components/explore-prototype/explore-prototype-featured-carousel";
import { ExplorePrototypeNav } from "@/components/explore-prototype/explore-prototype-nav";
import {
  ExplorePrototypeSectionHeader,
  ExplorePrototypeShelfPager,
} from "@/components/explore-prototype/explore-prototype-shelf-pager";
import {
  getExplorePrototypeCategory,
  getExplorePrototypeFeaturedWorks,
  getExplorePrototypeShelves,
  type ExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";

export function ExplorePrototypePage({
  category,
}: {
  category: ExplorePrototypeCategorySlug;
}) {
  const meta = getExplorePrototypeCategory(category);
  const featured = getExplorePrototypeFeaturedWorks(category);
  const shelves = getExplorePrototypeShelves(category);

  if (!meta) {
    return null;
  }

  return (
    <div className="space-y-8">
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

      <ExplorePrototypeFeaturedCarousel
        slides={featured}
        heading="注目の作品"
        headingLevel="h2"
      />

      {shelves.map((shelf) => (
        <section
          key={shelf.id}
          aria-labelledby={`shelf-${shelf.id}`}
          className="space-y-3"
        >
          <ExplorePrototypeSectionHeader
            title={shelf.title}
            headingId={`shelf-${shelf.id}`}
          />
          <div className="px-2">
            <ExplorePrototypeShelfPager
              items={shelf.works}
              getKey={(work) => `${shelf.id}-${work.id}`}
              pageSize={4}
              renderItem={(work) => (
                <ExplorePrototypeDiscoveryCard work={work} />
              )}
            />
          </div>
        </section>
      ))}
    </div>
  );
}
