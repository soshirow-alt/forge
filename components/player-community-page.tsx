"use client";

import { Suspense } from "react";
import { CommunityHubPage } from "@/components/community-hub-page";
import { PageLoadingSkeleton } from "@/components/forge-loading-skeletons";
import { PlayerShell } from "@/components/player-shell";
import { useForgePerfRoute } from "@/hooks/use-forge-perf-route";

function PlayerCommunityPageContent() {
  useForgePerfRoute({ route: "/mypage/community", ready: true });

  return (
    <PlayerShell activeNav="community">
      <CommunityHubPage variant="player" />
    </PlayerShell>
  );
}

export function PlayerCommunityPage() {
  return (
    <Suspense
      fallback={
        <PlayerShell activeNav="community">
          <PageLoadingSkeleton lines={4} />
        </PlayerShell>
      }
    >
      <PlayerCommunityPageContent />
    </Suspense>
  );
}
