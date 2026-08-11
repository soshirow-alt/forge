import { notFound, redirect } from "next/navigation";
import { PlayerIaCategoryHomePage } from "@/components/player-ia/player-ia-category-home-page";
import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";
import { loadPlayerIaCategoryHome } from "@/lib/player-ia/load-player-ia-category-home";
import { createRequestNowMs } from "@/lib/player-ia/request-now";
import { isProjectCategoryId } from "@/lib/project-categories";

export default async function HomeCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isProjectCategoryId(category) || category === "game") {
    notFound();
  }
  if (!shouldServePlayerIaRedesign()) {
    redirect(`/search?category=${category}`);
  }

  const initialHome = await loadPlayerIaCategoryHome(category);
  const nowMs = createRequestNowMs();

  return (
    <PlayerIaCategoryHomePage
      category={category}
      initialHome={initialHome}
      nowMs={nowMs}
    />
  );
}
