"use client";

import { Suspense } from "react";
import { CommunityHubPage } from "@/components/community-hub-page";
import { PlayerShell } from "@/components/player-shell";

function PlayerCommunityPageContent() {
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
          <div className="mx-auto max-w-3xl">
            <p className="text-zinc-500">読み込み中…</p>
          </div>
        </PlayerShell>
      }
    >
      <PlayerCommunityPageContent />
    </Suspense>
  );
}
