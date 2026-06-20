import { ProjectStudioPage } from "@/components/project-studio-page";

/**
 * P0 実データ Studio 正本 — growth-state + 「次に直すこと」
 * mock プレビューは /studio/projects/[mockId] のみ
 */
export default async function ProjectStudioRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectStudioPage projectId={id} />;
}
