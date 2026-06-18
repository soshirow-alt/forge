import { GameDetailV0Page } from "@/components/game-detail-v0-page";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <GameDetailV0Page id={id} />;
}
