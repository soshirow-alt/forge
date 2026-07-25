import { ExplorePrototypeFeaturedCarousel } from "@/components/explore-prototype/explore-prototype-featured-carousel";
import { ExplorePrototypeShelfSection } from "@/components/explore-prototype/explore-prototype-shelf-section";
import {
  getExplorePrototypeCategory,
  getExplorePrototypeCategoryBrowse,
  type ExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";

export function ExplorePrototypePage({
  category,
}: {
  category: ExplorePrototypeCategorySlug;
}) {
  const meta = getExplorePrototypeCategory(category);
  const browse = getExplorePrototypeCategoryBrowse(category);

  if (!meta) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ExplorePrototypeFeaturedCarousel
        slides={browse.featured}
        heading="注目の作品"
        headingLevel="h2"
      />

      {browse.shelves.map((shelf) => (
        <ExplorePrototypeShelfSection
          key={shelf.id}
          title={shelf.title}
          headingId={`shelf-${shelf.id}`}
          works={shelf.works}
          keyPrefix={`${category}-${shelf.id}`}
        />
      ))}
    </div>
  );
}
