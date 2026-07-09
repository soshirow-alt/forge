"use client";

import { EntryModeProvider, useEntryMode } from "@/components/entry-mode-provider";
import { RegisteredAccountPromptProvider } from "@/components/registered-account-prompt-provider";
import { StudioEntryGateProvider } from "@/components/studio-entry-gate-provider";
import { useAuth } from "@/components/auth-provider";
import { useEffect, type ReactNode } from "react";

function EntryModeAuthSync({ children }: { children: React.ReactNode }) {
  const { isRegisteredUser } = useAuth();
  const { clearGuestEntryMode } = useEntryMode();

  useEffect(() => {
    if (!isRegisteredUser) {
      return;
    }

    clearGuestEntryMode();
    void fetch("/api/guest/submitter", { method: "DELETE" });
  }, [isRegisteredUser, clearGuestEntryMode]);

  return children;
}

export function AppGateProviders({ children }: { children: React.ReactNode }) {
  return (
    <EntryModeProvider>
      <EntryModeAuthSync>
        <RegisteredAccountPromptProvider>
          <StudioEntryGateProvider>
            {children}
          </StudioEntryGateProvider>
        </RegisteredAccountPromptProvider>
      </EntryModeAuthSync>
    </EntryModeProvider>
  );
}
