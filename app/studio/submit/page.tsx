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
  const category = searchParams.category;
  if (!category) {
    return <StudioSubmitCategoryPick />;
  }
  if (category === "game") {
    return <StudioSubmitPage projectCategory="game" />;
  }
  if (category === "asset") {
    return <StudioSubmitPage projectCategory="asset" />;
  }
  const prototypeCategory = parseSubmitPrototypeCategory(category);
  if (prototypeCategory) {
    return <StudioSubmitPage prototypeCategory={prototypeCategory} />;
  }
  return <StudioSubmitCategoryPick />;
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
