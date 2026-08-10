import { ConsultationThread } from "@/components/consultation-thread";
import { PlayerShell } from "@/components/player-shell";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RegisteredAccountGuard>
      <PlayerShell activeNav="consultations">
        <ConsultationThread consultationId={id} />
      </PlayerShell>
    </RegisteredAccountGuard>
  );
}
