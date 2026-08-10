import { ConsultationsListPage } from "@/components/consultations-list-page";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";

export default function ConsultationsPage() {
  return (
    <RegisteredAccountGuard>
      <ConsultationsListPage />
    </RegisteredAccountGuard>
  );
}
