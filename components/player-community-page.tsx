import { CommunityHubPage } from "@/components/community-hub-page";
import { PlayerShell } from "@/components/player-shell";

export function PlayerCommunityPage() {
  return (
    <PlayerShell activeNav="community">
      <CommunityHubPage variant="player" />
    </PlayerShell>
  );
}
