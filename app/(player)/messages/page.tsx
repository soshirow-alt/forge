import { MessagesInboxPage } from "@/components/messages-inbox-page";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return (
    <RegisteredAccountGuard>
      <MessagesInboxPage notice={notice ?? null} />
    </RegisteredAccountGuard>
  );
}
