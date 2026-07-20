import { notFound } from "next/navigation";
import { PlayerShell } from "@/components/player-shell";
import { PrototypeWorkDetailHeader } from "@/components/prototype-work-detail-header";
import { PROTOTYPE_DETAIL_FIXTURES } from "@/lib/prototype/domain-expansion";

export const metadata = {
  title: "作品詳細プロトタイプ — Forge",
  robots: { index: false, follow: false },
};

export default async function PrototypeWorkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fixture = PROTOTYPE_DETAIL_FIXTURES[slug];
  if (!fixture) {
    notFound();
  }

  return (
    <PlayerShell activeNav="home">
      <PrototypeWorkDetailHeader fixture={fixture} />
    </PlayerShell>
  );
}
