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

  if (shouldServePlayerIaRedesign()) {
    // Formal IA categories (incl. `asset`) may be absent from legacy explore slugs.
    if (isProjectCategoryId(category)) {
      redirect(buildSearchCategoryHref(category));
    }
    redirect("/search");
  }

  if (!isExplorePrototypeCategorySlug(category)) {
    redirect(buildFutureHomeHref());
  }

  redirect(buildFutureHomeHref({ category }));
}
