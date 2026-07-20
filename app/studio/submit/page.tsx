import { StudioSubmitPage } from "@/components/studio-submit-page";
import { StudioSubmitFlowPrototype } from "@/components/studio-submit-flow-prototype";
import { Suspense } from "react";
import { StudioShell } from "@/components/studio-shell";

function StudioSubmitRouteInner({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  if (searchParams.view === "category-proto") {
    return <StudioSubmitFlowPrototype />;
  }
  return <StudioSubmitPage />;
}

export default async function StudioSubmitRoute({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  return (
    <Suspense
      fallback={
        <StudioShell activeNav="mypage">
          <p className="text-zinc-500">読み込み中…</p>
        </StudioShell>
      }
    >
      <StudioSubmitRouteInner searchParams={params} />
    </Suspense>
  );
}
