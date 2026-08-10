"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";
import { PageLoadingSkeleton } from "@/components/forge-loading-skeletons";

/**
 * Legacy `/consultations` → `/messages`, preserving hash.
 * Usage-relation hashes move to `/usage-relations#...`.
 */
function ConsultationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
    if (
      fragment === "usage-relations" ||
      fragment.startsWith("usage-relation-")
    ) {
      router.replace(`/usage-relations${hash}`);
      return;
    }
    router.replace(`/messages${hash}`);
  }, [router]);

  return <PageLoadingSkeleton />;
}

export default function ConsultationsPage() {
  return (
    <RegisteredAccountGuard>
      <ConsultationsRedirect />
    </RegisteredAccountGuard>
  );
}
