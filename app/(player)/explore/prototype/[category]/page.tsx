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
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isExplorePrototypeCategorySlug(category)) {
    notFound();
  }

  return (
    <ExplorePrototypePage category={category as ExplorePrototypeCategorySlug} />
  );
}
