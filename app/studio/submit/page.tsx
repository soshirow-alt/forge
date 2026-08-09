import { StudioSubmitPage } from "@/components/studio-submit-page";
import { StudioSubmitCategoryPick } from "@/components/studio-submit-category-pick";
import { Suspense } from "react";
import { StudioShell } from "@/components/studio-shell";
import { parseSubmitPrototypeCategory } from "@/lib/prototype/studio-submit-flow";

function StudioSubmitRouteInner({
  searchParams,
}: {
  searchParams: { view?: string; category?: string };
}) {
  if (searchParams.view === "category-proto") {
    if (searchParams.category === "game") {
      return <StudioSubmitPage />;
    }
    if (searchParams.category === "asset") {
      return <StudioSubmitPage projectCategory="asset" />;
    }
    const prototypeCategory = parseSubmitPrototypeCategory(searchParams.category);
    if (prototypeCategory) {
      return <StudioSubmitPage prototypeCategory={prototypeCategory} />;
    }
    return <StudioSubmitCategoryPick />;
  }
  return <StudioSubmitPage />;
}

export default async function StudioSubmitRoute({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; category?: string }>;
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
