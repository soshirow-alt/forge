import { GameDetailPageClient } from "@/components/game-detail-page-client";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <GameDetailPageClient id={id} />;
}
