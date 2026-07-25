import { PlayerIaAnnouncementDetailPage } from "@/components/player-ia/player-ia-announcement-detail-page";

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PlayerIaAnnouncementDetailPage slug={slug} />;
}
