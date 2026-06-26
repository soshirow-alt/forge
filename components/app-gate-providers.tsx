"use client";

import { StudioEntryGateProvider } from "@/components/studio-entry-gate-provider";

export function AppGateProviders({ children }: { children: React.ReactNode }) {
  return <StudioEntryGateProvider>{children}</StudioEntryGateProvider>;
}
