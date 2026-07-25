import { redirect } from "next/navigation";
import {
  EXPLORE_PROTOTYPE_CATEGORY_SLUGS,
  buildFutureHomeHref,
  isExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";

export function generateStaticParams() {
  return EXPLORE_PROTOTYPE_CATEGORY_SLUGS.map((category) => ({ category }));
}

/** Category lists moved to `/home?category=` — keep path for compatibility. */
export default async function ExplorePrototypeCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { category } = await params;
  const sp = await searchParams;

  if (!isExplorePrototypeCategorySlug(category)) {
    redirect(buildFutureHomeHref({ q: sp.q }));
  }

  redirect(buildFutureHomeHref({ category, q: sp.q }));
}
