import { redirect } from "next/navigation";
import { buildSearchCategoryHref, isProjectCategoryId } from "@/lib/project-categories";
import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";
import {
  EXPLORE_PROTOTYPE_CATEGORY_SLUGS,
  buildFutureHomeHref,
  isExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";

export function generateStaticParams() {
  return EXPLORE_PROTOTYPE_CATEGORY_SLUGS.map((category) => ({ category }));
}

/** Category lists: IA → `/search?category=`; legacy → `/home?category=` */
export default async function ExplorePrototypeCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!isExplorePrototypeCategorySlug(category)) {
    redirect(shouldServePlayerIaRedesign() ? "/search" : buildFutureHomeHref());
  }

  if (shouldServePlayerIaRedesign()) {
    const mapped = isProjectCategoryId(category) ? category : null;
    redirect(buildSearchCategoryHref(mapped));
  }

  redirect(buildFutureHomeHref({ category }));
}
