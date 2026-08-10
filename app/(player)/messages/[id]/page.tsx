import { MessagesInboxPage } from "@/components/messages-inbox-page";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RegisteredAccountGuard>
      <MessagesInboxPage selectedId={id} />
    </RegisteredAccountGuard>
  );
}
