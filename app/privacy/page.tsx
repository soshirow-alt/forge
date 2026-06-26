import type { Metadata } from "next";
import { LegalDocumentShell } from "@/components/legal-document-shell";
import { PrivacyPolicyDocument } from "@/components/privacy-policy-document";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Forge",
  description: "Forge プライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentShell title="プライバシーポリシー">
      <PrivacyPolicyDocument />
    </LegalDocumentShell>
  );
}
