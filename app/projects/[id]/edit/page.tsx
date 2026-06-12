import { ProjectEditPage } from "@/components/project-edit-page";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProjectEditPage projectId={id} />;
}
