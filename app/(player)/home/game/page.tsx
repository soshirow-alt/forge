import Link from "next/link";
import { redirect } from "next/navigation";
import { PlayerIaGameHomePage } from "@/components/player-ia/player-ia-game-home-page";
import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";
import { loadPlayerIaGameHome } from "@/lib/player-ia/load-player-ia-game-home";
import { createRequestNowMs } from "@/lib/player-ia/request-now";

/**
 * Game category Home — discovery shelves for games only.
 * Distinct from cross-category `/home` and from Search `/search?category=game`.
 * Production gate: not served (redirect to Search game) until Player IA redesign is live there.
 */
export default async function HomeGameCategoryPage() {
  if (!shouldServePlayerIaRedesign()) {
    redirect("/search?category=game");
  }

  const initialHome = await loadPlayerIaGameHome();
  const nowMs = createRequestNowMs();

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-violet-400/90">
            カテゴリ
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            ゲーム
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            完成前のゲームを眺めて見つける
          </p>
        </div>
        <Link
          href="/search?category=game"
          className="inline-flex items-center gap-1 text-sm font-medium text-violet-300 hover:text-violet-200"
        >
          条件で探す
        </Link>
      </header>
      <PlayerIaGameHomePage initialHome={initialHome} nowMs={nowMs} />
    </div>
  );
}
