import { CreatorPageClient } from "@/components/creator-page-client";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CreatorPageClient id={id} />;
}
