import { Suspense } from "react";
import { PageLoadingSkeleton } from "@/components/forge-loading-skeletons";
import { PlayerCommunityPage } from "@/components/player-community-page";

export default function PlayerCommunityRoute() {
  return (
    <Suspense fallback={<PageLoadingSkeleton lines={4} />}>
      <PlayerCommunityPage />
    </Suspense>
  );
}
