import { Suspense } from "react";
import { PlayerCommunityPage } from "@/components/player-community-page";
import { PlayerShell } from "@/components/player-shell";

export default function Page() {
  return (
    <Suspense
      fallback={
        <PlayerShell activeNav="community">
          <p className="text-zinc-500">読み込み中…</p>
        </PlayerShell>
      }
    >
      <PlayerCommunityPage />
    </Suspense>
  );
}
