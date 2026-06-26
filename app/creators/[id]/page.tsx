import { CreatorProfilePage } from "@/components/creator-profile-page";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CreatorProfilePage id={id} />;
}
