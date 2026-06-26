import type { Metadata } from "next";
import { LegalDocumentShell } from "@/components/legal-document-shell";
import { TermsOfServiceDocument } from "@/components/terms-of-service-document";

export const metadata: Metadata = {
  title: "利用規約 | Forge",
  description: "Forge 利用規約",
};

export default function TermsPage() {
  return (
    <LegalDocumentShell title="利用規約">
      <TermsOfServiceDocument />
    </LegalDocumentShell>
  );
}
