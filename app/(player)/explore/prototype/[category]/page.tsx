import { notFound } from "next/navigation";
import { ExplorePrototypePage } from "@/components/explore-prototype/explore-prototype-page";
import {
  EXPLORE_PROTOTYPE_CATEGORY_SLUGS,
  isExplorePrototypeCategorySlug,
  type ExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";

export function generateStaticParams() {
  return EXPLORE_PROTOTYPE_CATEGORY_SLUGS.map((category) => ({ category }));
}

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
    notFound();
  }

  return (
    <ExplorePrototypePage
      category={category as ExplorePrototypeCategorySlug}
      query={sp.q ?? ""}
    />
  );
}
