"use client";

import { StudioShell } from "@/components/studio-shell";
import { SharedSelfProfile } from "@/components/shared-self-profile";

export function StudioProfileSelfPage() {
  return (
    <StudioShell activeNav="profile">
      <SharedSelfProfile shell="studio" />
    </StudioShell>
  );
}
