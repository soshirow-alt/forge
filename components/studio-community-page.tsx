"use client";

import { Suspense } from "react";
import { CommunityHubPage } from "@/components/community-hub-page";
import { StudioShell } from "@/components/studio-shell";

function StudioCommunityPageContent() {
  return (
    <StudioShell activeNav="community">
      <CommunityHubPage variant="developer" />
    </StudioShell>
  );
}

export function StudioCommunityPage() {
  return (
    <Suspense
      fallback={
        <StudioShell activeNav="community">
          <div className="mx-auto max-w-3xl">
            <p className="text-zinc-500">読み込み中…</p>
          </div>
        </StudioShell>
      }
    >
      <StudioCommunityPageContent />
    </Suspense>
  );
}
