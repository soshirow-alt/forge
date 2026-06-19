import { StudioProjectsPage } from "@/components/studio-projects-page";
import { Suspense } from "react";

export default function StudioProjectsRoute() {
  return (
    <Suspense fallback={null}>
      <StudioProjectsPage />
    </Suspense>
  );
}
