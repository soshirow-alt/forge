import { redirect } from "next/navigation";
import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";
import { Suspense } from "react";
import { PageLoadingSkeleton } from "@/components/forge-loading-skeletons";
import { PlayerCommunityPage } from "@/components/player-community-page";

export default function PlayerCommunityRoute() {
  if (shouldServePlayerIaRedesign()) {
    redirect("/mypage");
  }

  return (
    <Suspense fallback={<PageLoadingSkeleton lines={4} />}>
      <PlayerCommunityPage />
    </Suspense>
  );
}
