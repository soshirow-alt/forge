import { ExplorePrototypeDiscoveryCard } from "@/components/explore-prototype/explore-prototype-discovery-card";
import { ExplorePrototypeFeaturedCarousel } from "@/components/explore-prototype/explore-prototype-featured-carousel";
import { ExplorePrototypeNav } from "@/components/explore-prototype/explore-prototype-nav";
import {
  ExplorePrototypeSectionHeader,
  ExplorePrototypeShelfPager,
} from "@/components/explore-prototype/explore-prototype-shelf-pager";
import {
  getExplorePrototypeHomeCategoryShelves,
  getExplorePrototypeHomeFeatured,
} from "@/lib/prototype/explore-prototype";

/**
 * Explore Prototype hub — mixed-category featured carousel + lightweight category shelves.
 */
export function ExplorePrototypeHomePage() {
  const featured = getExplorePrototypeHomeFeatured();
  const shelves = getExplorePrototypeHomeCategoryShelves();

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
          <p className="text-sm text-zinc-400">
            カテゴリを横断して、注目作品と最近の更新を眺める
          </p>
        </div>

        <ExplorePrototypeNav active={null} />
      </header>

      <ExplorePrototypeFeaturedCarousel
        slides={featured}
        heading="注目の作品"
        headingLevel="h2"
      />

      {shelves.map((shelf) => {
        const headingId = `hub-shelf-${shelf.seeAllHref?.replace(/\//g, "-") ?? shelf.title}`;
        return (
          <section
            key={shelf.seeAllHref ?? shelf.title}
            aria-labelledby={headingId}
            className="space-y-3"
          >
            <ExplorePrototypeSectionHeader
              title={shelf.title}
              headingId={headingId}
              seeAllHref={shelf.seeAllHref}
              seeAllLabel={shelf.seeAllLabel}
            />
            <div className="px-2">
              <ExplorePrototypeShelfPager
                items={shelf.works}
                getKey={(work) => `hub-${work.id}`}
                pageSize={4}
                renderItem={(work) => (
                  <ExplorePrototypeDiscoveryCard work={work} />
                )}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
