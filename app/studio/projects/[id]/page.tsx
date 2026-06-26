import { redirect, notFound } from "next/navigation";
import { StudioProjectDetailPage } from "@/components/studio-project-detail-page";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { isStudioMockProjectId } from "@/lib/studio-projects-v0-mock-data";

/**
 * P0 Studio ルーター。
 * - mock ID: ログイン不要で v0 詳細を表示（middleware が /projects/ を保護するため、
 *   preview 閲覧はこの URL を正とする）
 * - 実データ ID: 正本 /projects/[id]/studio へリダイレクト
 */
export default async function StudioProjectDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (isStudioMockProjectId(id)) {
    if (shouldHideV0MockContent()) {
      notFound();
    }
    return <StudioProjectDetailPage id={id} />;
  }

  redirect(`/projects/${id}/studio`);
}
