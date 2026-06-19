import { redirect } from "next/navigation";

/**
 * P0 Studio 一本化 — 作品詳細の正本は /projects/[id]/studio
 */
export default async function StudioProjectDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/projects/${id}/studio`);
}
