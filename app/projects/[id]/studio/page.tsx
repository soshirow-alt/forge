import { ProjectStudioPage } from "@/components/project-studio-page";
import { StudioProjectDetailPage } from "@/components/studio-project-detail-page";
import { isStudioMockProjectId } from "@/lib/studio-projects-v0-mock-data";

/**
 * P0 Studio 正本。
 * - Supabase 登録作品 → growth-state 実装（ProjectStudioPage）
 * - preview mock ID → v0 詳細（StudioProjectDetailPage）
 */
export default async function ProjectStudioRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (isStudioMockProjectId(id)) {
    return <StudioProjectDetailPage id={id} />;
  }

  return <ProjectStudioPage projectId={id} />;
}
