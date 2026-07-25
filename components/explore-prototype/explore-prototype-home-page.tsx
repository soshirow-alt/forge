import { ExplorePrototypeEmptyState } from "@/components/explore-prototype/explore-prototype-empty-state";
import { ExplorePrototypeFeaturedCarousel } from "@/components/explore-prototype/explore-prototype-featured-carousel";
import { ExplorePrototypeShelfSection } from "@/components/explore-prototype/explore-prototype-shelf-section";
import { getExplorePrototypeHubBrowse } from "@/lib/prototype/explore-prototype";

/**
 * Explore Prototype hub — mixed-category featured carousel + lightweight category shelves.
 * Page chrome (eyebrow / title / category tabs) lives in the header controls.
 */
export function ExplorePrototypeHomePage({ query = "" }: { query?: string }) {
  const browse = getExplorePrototypeHubBrowse(query);

  if (browse.matchCount === 0) {
    return (
      <div className="space-y-6">
        <ExplorePrototypeEmptyState query={browse.query} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ExplorePrototypeFeaturedCarousel
        slides={browse.featured}
        heading="注目の作品"
        headingLevel="h2"
      />

      {browse.shelves.map((shelf) => {
        const headingId = `hub-shelf-${shelf.seeAllHref?.replace(/\//g, "-") ?? shelf.title}`;
        return (
          <ExplorePrototypeShelfSection
            key={shelf.seeAllHref ?? shelf.title}
            title={shelf.title}
            headingId={headingId}
            works={shelf.works}
            seeAllHref={shelf.seeAllHref}
            seeAllLabel={shelf.seeAllLabel}
            keyPrefix={`hub-${shelf.seeAllHref ?? shelf.title}`}
          />
        );
      })}
    </div>
  );
}
