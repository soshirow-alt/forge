import { redirect } from "next/navigation";
import { studioOverviewEditHref } from "@/lib/studio-edit-url";

/** 旧投稿URL — 外部ブックマーク互換。新規投稿開始はカテゴリ選択へ */
export default async function Submit({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const sp = await searchParams;
  const editId = sp.edit?.trim();
  if (editId) {
    redirect(studioOverviewEditHref(editId, "basic-info"));
  }
  redirect("/studio/submit?view=category-proto");
}
