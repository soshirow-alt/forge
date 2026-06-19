import { DeveloperProfileV0Page } from "@/components/developer-profile-v0-page";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeveloperProfileV0Page id={id} />;
}
