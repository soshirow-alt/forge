import { PlayerPublicProfileV0Page } from "@/components/player-public-profile-v0-page";

export default async function PlayerPublicProfileRoute({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return <PlayerPublicProfileV0Page handle={handle} />;
}
