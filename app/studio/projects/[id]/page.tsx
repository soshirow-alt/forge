import { StudioProjectDetailPage } from "@/components/studio-project-detail-page";

export default async function StudioProjectDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudioProjectDetailPage id={id} />;
}
