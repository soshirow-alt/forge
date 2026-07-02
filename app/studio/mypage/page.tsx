import { StudioMypagePage } from "@/components/studio-mypage-page";
import { Suspense } from "react";
import { StudioShell } from "@/components/studio-shell";

export default function StudioMypageRoute() {
  return (
    <Suspense
      fallback={
        <StudioShell activeNav="mypage">
          <p className="text-zinc-500">読み込み中…</p>
        </StudioShell>
      }
    >
      <StudioMypagePage />
    </Suspense>
  );
}
