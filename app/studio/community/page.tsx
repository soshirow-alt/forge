import { Suspense } from "react";
import { StudioCommunityPage } from "@/components/studio-community-page";
import { StudioShell } from "@/components/studio-shell";

export default function Page() {
  return (
    <Suspense
      fallback={
        <StudioShell activeNav="community">
          <p className="text-zinc-500">読み込み中…</p>
        </StudioShell>
      }
    >
      <StudioCommunityPage />
    </Suspense>
  );
}
