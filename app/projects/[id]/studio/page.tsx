import { ProjectStudioPage } from "@/components/project-studio-page";

export default async function ProjectStudioRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProjectStudioPage projectId={id} />;
}
