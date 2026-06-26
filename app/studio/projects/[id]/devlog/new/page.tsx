import { notFound, redirect } from "next/navigation";
import { StudioDevlogNewPage } from "@/components/studio-devlog-new-page";
import { isStudioMockProjectId } from "@/lib/studio-projects-v0-mock-data";

export default async function StudioDevlogNewRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isStudioMockProjectId(id)) {
    redirect(`/projects/${id}/devlog/new`);
  }

  if (!id) {
    notFound();
  }

  return <StudioDevlogNewPage projectId={id} />;
}
