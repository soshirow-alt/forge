import { redirect } from "next/navigation";
import { DiscoveryHomePage } from "@/components/discovery-home-page";
import { PlayerIaHomePage } from "@/components/player-ia/player-ia-home-page";
import { ExplorePrototypeHomePage } from "@/components/explore-prototype/explore-prototype-home-page";
import { ExplorePrototypePage } from "@/components/explore-prototype/explore-prototype-page";
import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";
import { shouldServeFutureDiscoveryHome } from "@/lib/production-mode";
import { buildSearchCategoryHref, isProjectCategoryId } from "@/lib/project-categories";
import {
  buildFutureHomeHref,
  isExplorePrototypeCategorySlug,
  type ExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";

/**
 * Preview / local: Player IA home (DB-backed) or legacy Explore Prototype fixtures.
 * Production release mode: formal DiscoveryHomePage (unchanged).
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

  if (shouldServePlayerIaRedesign()) {
    const rawCategory = sp.category?.trim() ?? "";
    if (rawCategory) {
      const category = isProjectCategoryId(rawCategory) ? rawCategory : null;
      redirect(buildSearchCategoryHref(category));
    }

    const hasQ = typeof sp.q === "string" && sp.q.length > 0;
    if (hasQ) {
      redirect("/home");
    }

    return <PlayerIaHomePage />;
  }

  const rawCategory = sp.category?.trim() ?? "";
  const category =
    rawCategory && isExplorePrototypeCategorySlug(rawCategory)
      ? (rawCategory as ExplorePrototypeCategorySlug)
      : null;

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
