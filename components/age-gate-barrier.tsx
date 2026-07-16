"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AgeGateModal } from "@/components/age-gate-modal";
import {
  isR18AgeRating,
  readAgeVerifiedFromStorage,
  writeAgeVerifiedToStorage,
} from "@/lib/age-rating";

type AgeGateBarrierProps = {
  ageRating: unknown;
  /** Studio submit/edit preview must not gate. */
  bypass?: boolean;
  children: ReactNode;
};

/**
 * Blocks R18 project detail content until browser-local self-declared age check.
 * Avoids flash by not rendering children until verified (or bypassed).
 */
export function AgeGateBarrier({
  ageRating,
  bypass = false,
  children,
}: AgeGateBarrierProps) {
  const router = useRouter();
  const needsGate = !bypass && isR18AgeRating(ageRating);
  const [hydrated, setHydrated] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    setVerified(readAgeVerifiedFromStorage());
    setHydrated(true);
  }, []);

  if (!needsGate) {
    return <>{children}</>;
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-zinc-500">
        読み込み中…
      </div>
    );
  }

  if (verified) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-zinc-500"
        aria-hidden="true"
      >
        年齢確認が必要です
      </div>
      <AgeGateModal
        onAdult={() => {
          writeAgeVerifiedToStorage();
          setVerified(true);
        }}
        onUnderage={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
          }
          router.replace("/home");
        }}
      />
    </>
  );
}
