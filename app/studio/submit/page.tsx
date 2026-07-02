import { StudioSubmitPage } from "@/components/studio-submit-page";
import { Suspense } from "react";
import { StudioShell } from "@/components/studio-shell";

export default function StudioSubmitRoute() {
  return (
    <Suspense
      fallback={
        <StudioShell activeNav="mypage">
          <p className="text-zinc-500">読み込み中…</p>
        </StudioShell>
      }
    >
      <StudioSubmitPage />
    </Suspense>
  );
}
