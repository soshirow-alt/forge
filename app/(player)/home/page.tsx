import { redirect } from "next/navigation";
import { DiscoveryHomePage } from "@/components/discovery-home-page";
import { PlayerIaHomePage } from "@/components/player-ia/player-ia-home-page";
import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";
import { loadPlayerIaHome } from "@/lib/player-ia/load-player-ia-home";
import { createRequestNowMs } from "@/lib/player-ia/request-now";
import {
  buildSearchCategoryHref,
  isProjectCategoryId,
} from "@/lib/project-categories";

/**
 * Preview / local: Player IA whole-home (Staging DB).
 * Production (`VERCEL_ENV=production`): formal DiscoveryHomePage (unchanged).
 */
export default async function HomeDiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const sp = await searchParams;

  if (!shouldServePlayerIaRedesign()) {
    return <DiscoveryHomePage />;
  }

  const rawCategory = sp.category?.trim() ?? "";
  if (rawCategory) {
    const category = isProjectCategoryId(rawCategory) ? rawCategory : null;
    redirect(buildSearchCategoryHref(category));
  }

  const hasQ = typeof sp.q === "string" && sp.q.length > 0;
  if (hasQ) {
    redirect("/home");
  }

  const initialHome = await loadPlayerIaHome();
  const nowMs = createRequestNowMs();
  return <PlayerIaHomePage initialHome={initialHome} nowMs={nowMs} />;
}
