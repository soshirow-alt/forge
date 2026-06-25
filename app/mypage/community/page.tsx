import { Suspense } from "react";
import { PlayerCommunityPage } from "@/components/player-community-page";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PlayerCommunityPage />
    </Suspense>
  );
}
