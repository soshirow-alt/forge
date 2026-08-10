import { UsageRelationsPage } from "@/components/usage-relations-page";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";

export default function UsageRelationsRoutePage() {
  return (
    <RegisteredAccountGuard>
      <UsageRelationsPage />
    </RegisteredAccountGuard>
  );
}
