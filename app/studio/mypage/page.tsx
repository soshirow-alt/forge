import { StudioMypagePage } from "@/components/studio-mypage-page";
import { Suspense } from "react";

export default function StudioMypageRoute() {
  return (
    <Suspense fallback={null}>
      <StudioMypagePage />
    </Suspense>
  );
}
