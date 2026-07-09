"use client";

import { useAuth } from "@/components/auth-provider";
import { useRegisteredAccountPrompt } from "@/components/registered-account-prompt-provider";
import type { RegisteredActionPromptVariant } from "@/lib/registered-action-prompt";

export function useRegisteredOnlyAction() {
  const { authResolved, isRegisteredUser } = useAuth();
  const { promptRegisteredAccountAccess } = useRegisteredAccountPrompt();

  function runRegisteredOnlyAction(
    action: () => void,
    returnPath?: string,
    variant: RegisteredActionPromptVariant = "default",
  ): boolean {
    if (!authResolved) {
      return false;
    }

    if (isRegisteredUser) {
      action();
      return true;
    }

    promptRegisteredAccountAccess(returnPath, { variant });
    return false;
  }

  return {
    authResolved,
    isRegisteredUser,
    promptRegisteredAccountAccess,
    runRegisteredOnlyAction,
  };
}
