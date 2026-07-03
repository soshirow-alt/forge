import { ScreenshotGameDetailPage } from "@/components/demo/screenshot-game-detail";
import {
  SCREENSHOT_FLAGSHIP_GAME_ID,
  type ScreenshotGameTab,
} from "@/lib/demo/screenshot-routes";

function parseTab(value: string | undefined): ScreenshotGameTab {
  if (value === "voices" || value === "devlog") {
    return value;
  }
  return "overview";
}

export default async function ScreenshotGameDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const resolvedId = decodeURIComponent(id);
  const activeTab = parseTab(tab);

  if (resolvedId !== SCREENSHOT_FLAGSHIP_GAME_ID) {
    return (
      <ScreenshotGameDetailPage
        gameId={SCREENSHOT_FLAGSHIP_GAME_ID}
        activeTab={activeTab}
      />
    );
  }

  return <ScreenshotGameDetailPage gameId={resolvedId} activeTab={activeTab} />;
}
