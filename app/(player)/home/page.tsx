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
 * - Invalid `category` → 「すべて」(`/home`)
 * - `q` is ignored (stripped via redirect) — future home has no search UI
 */
export default async function HomeDiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const sp = await searchParams;

  if (!shouldServeFutureDiscoveryHome()) {
    return <DiscoveryHomePage />;
  }

  const rawCategory = sp.category?.trim() ?? "";
  const category =
    rawCategory && isExplorePrototypeCategorySlug(rawCategory)
      ? (rawCategory as ExplorePrototypeCategorySlug)
      : null;

  // Drop obsolete search query and invalid category from the URL.
  const hasQ = typeof sp.q === "string" && sp.q.length > 0;
  const hasInvalidCategory = Boolean(rawCategory) && !category;
  if (hasQ || hasInvalidCategory) {
    redirect(buildFutureHomeHref({ category }));
  }

  if (category) {
    return <ExplorePrototypePage category={category} />;
  }

  return <ExplorePrototypeHomePage />;
}
