import { PlayerIaSearchPage } from "@/components/player-ia/player-ia-search-page";
import { WorksSearchPage } from "@/components/works-search-page";
import {
  buildCatalogQueryString,
  PLAYER_IA_SEARCH_CATALOG_LIMIT,
} from "@/lib/player-ia/catalog-search-params";
import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";
import { loadPublicCatalog } from "@/lib/player-ia/load-public-catalog";
import { createRequestNowMs } from "@/lib/player-ia/request-now";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!shouldServePlayerIaRedesign()) {
    return <WorksSearchPage />;
  }

  const sp = await searchParams;
  const initialCatalogQuery = buildCatalogQueryString(sp, {
    limit: PLAYER_IA_SEARCH_CATALOG_LIMIT,
  });
  const catalog = await loadPublicCatalog(sp, {
    limit: PLAYER_IA_SEARCH_CATALOG_LIMIT,
  });
  const nowMs = createRequestNowMs();

  return (
    <PlayerIaSearchPage
      initialProjects={catalog.projects}
      initialError={catalog.error || catalog.unavailable}
      initialCatalogQuery={initialCatalogQuery}
      nowMs={nowMs}
    />
  );
}
