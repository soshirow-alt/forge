import { PlayerIaGameHomePage } from "@/components/player-ia/player-ia-game-home-page";
import { redirect } from "next/navigation";
import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";
import { loadPlayerIaGameHome } from "@/lib/player-ia/load-player-ia-game-home";
import { createRequestNowMs } from "@/lib/player-ia/request-now";

/**
 * Game category Home — discovery shelves for games only.
 * Starts at 「注目のゲーム」(no category intro chrome).
 */
export default async function HomeGameCategoryPage() {
  if (!shouldServePlayerIaRedesign()) {
    redirect("/search?category=game");
  }

  const initialHome = await loadPlayerIaGameHome();
  const nowMs = createRequestNowMs();

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-0">
      <PlayerIaGameHomePage initialHome={initialHome} nowMs={nowMs} />
    </div>
  );
}
