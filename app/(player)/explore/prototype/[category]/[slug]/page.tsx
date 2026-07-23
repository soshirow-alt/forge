import { notFound } from "next/navigation";
import { ExplorePrototypeDetailPage } from "@/components/explore-prototype/explore-prototype-detail-page";
import {
  getAllExplorePrototypeStaticParams,
  getExplorePrototypeWorkBySlug,
  isExplorePrototypeCategorySlug,
  type ExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";

export function generateStaticParams() {
  return getAllExplorePrototypeStaticParams();
}

export default async function ExplorePrototypeWorkDetailRoute({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  if (!isExplorePrototypeCategorySlug(category)) {
    notFound();
  }

  const work = getExplorePrototypeWorkBySlug(
    category as ExplorePrototypeCategorySlug,
    slug,
  );
  if (!work || work.category !== category) {
    notFound();
  }

  return <ExplorePrototypeDetailPage work={work} />;
}
