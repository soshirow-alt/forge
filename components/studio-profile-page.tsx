"use client";

import { SharedSelfProfile } from "@/components/shared-self-profile";
import { StudioShell } from "@/components/studio-shell";

export function StudioProfilePage() {
  return (
    <StudioShell activeNav="profile">
      <SharedSelfProfile shell="studio" />
    </StudioShell>
  );
}
