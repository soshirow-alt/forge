import { MessagesInboxPage } from "@/components/messages-inbox-page";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";

export default function MessagesPage() {
  return (
    <RegisteredAccountGuard>
      <MessagesInboxPage />
    </RegisteredAccountGuard>
  );
}
