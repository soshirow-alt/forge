import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";
import { PlayerIaSearchPage } from "@/components/player-ia/player-ia-search-page";
import { WorksSearchPage } from "@/components/works-search-page";

export default function SearchPage() {
  if (shouldServePlayerIaRedesign()) {
    return <PlayerIaSearchPage />;
  }
  return <WorksSearchPage />;
}
