import { redirect } from "next/navigation";
import { studioOverviewEditHref } from "@/lib/studio-edit-url";

/** 旧編集URL — 外部ブックマーク互換。正本は /projects/[id]/studio?edit=basic-info */
export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(studioOverviewEditHref(id, "basic-info"));
}
