import { MessagesInboxPage } from "@/components/messages-inbox-page";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";
import { StudioShell } from "@/components/studio-shell";

export default async function StudioMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return (
    <StudioShell activeNav="messages">
      <RegisteredAccountGuard>
        <MessagesInboxPage
          basePath="/studio/messages"
          notice={notice ?? null}
        />
      </RegisteredAccountGuard>
    </StudioShell>
  );
}
