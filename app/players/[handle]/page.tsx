import { PlayerPublicProfileV0Page } from "@/components/player-public-profile-v0-page";

export default async function PlayerPublicProfileRoute({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ return?: string }>;
}) {
  const { handle } = await params;
  const { return: returnParam } = await searchParams;
  const returnHref =
    returnParam && returnParam.startsWith("/") ? returnParam : undefined;

  return <PlayerPublicProfileV0Page handle={handle} returnHref={returnHref} />;
}
