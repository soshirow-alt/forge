import { MessagesInboxPage } from "@/components/messages-inbox-page";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";
import { StudioShell } from "@/components/studio-shell";

export default async function StudioMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <StudioShell activeNav="messages">
      <RegisteredAccountGuard>
        <MessagesInboxPage basePath="/studio/messages" selectedId={id} />
      </RegisteredAccountGuard>
    </StudioShell>
  );
}
