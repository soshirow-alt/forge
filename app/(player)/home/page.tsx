import { redirect } from "next/navigation";
import { DiscoveryHomePage } from "@/components/discovery-home-page";
import { ExplorePrototypeHomePage } from "@/components/explore-prototype/explore-prototype-home-page";
import { ExplorePrototypePage } from "@/components/explore-prototype/explore-prototype-page";
import { shouldServeFutureDiscoveryHome } from "@/lib/production-mode";
import {
  buildFutureHomeHref,
  isExplorePrototypeCategorySlug,
  type ExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";

/**
 * Preview / local: category-expanded future discovery (Explore Prototype fixtures).
 * Production release mode: formal DiscoveryHomePage (unchanged).
 *
 * Invalid `category` query → fallback to 「すべて」(`/home`, q preserved).
 */
export default async function HomeDiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const query = sp.q ?? "";

  if (!shouldServeFutureDiscoveryHome()) {
    return <DiscoveryHomePage />;
  }

  const rawCategory = sp.category?.trim() ?? "";
  if (rawCategory && !isExplorePrototypeCategorySlug(rawCategory)) {
    redirect(buildFutureHomeHref({ q: query }));
  }

  if (rawCategory && isExplorePrototypeCategorySlug(rawCategory)) {
    return (
      <ExplorePrototypePage
        category={rawCategory as ExplorePrototypeCategorySlug}
        query={query}
      />
    );
  }

  return <ExplorePrototypeHomePage query={query} />;
}
