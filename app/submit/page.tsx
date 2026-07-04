import { redirect } from "next/navigation";
import { studioOverviewEditHref } from "@/lib/studio-edit-url";

/** 旧投稿URL — 外部ブックマーク互換。正本は /studio/submit */
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
  redirect("/studio/submit");
}
