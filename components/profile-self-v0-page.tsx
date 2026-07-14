"use client";

import { PlayerShell } from "@/components/player-shell";
import { SharedSelfProfile } from "@/components/shared-self-profile";

export function ProfileSelfV0Page() {
  return (
    <PlayerShell>
      <SharedSelfProfile shell="player" />
    </PlayerShell>
  );
}
