"use client";

import { useAuth } from "@/components/auth-provider";
import { useRegisteredAccountPrompt } from "@/components/registered-account-prompt-provider";

export function useRegisteredOnlyAction() {
  const { authResolved, isRegisteredUser } = useAuth();
  const { promptRegisteredAccountAccess } = useRegisteredAccountPrompt();

  function runRegisteredOnlyAction(
    action: () => void,
    returnPath?: string,
  ): boolean {
    if (!authResolved) {
      return false;
    }

    if (isRegisteredUser) {
      action();
      return true;
    }

    promptRegisteredAccountAccess(returnPath);
    return false;
  }

  return {
    authResolved,
    isRegisteredUser,
    promptRegisteredAccountAccess,
    runRegisteredOnlyAction,
  };
}
