import { Suspense } from "react";
import { StudioCommunityPage } from "@/components/studio-community-page";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <StudioCommunityPage />
    </Suspense>
  );
}
