"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  buildLoginUrlWithReturn,
  LOGIN_PATH,
} from "@/lib/login-return-url";

export { LOGIN_PATH } from "@/lib/login-return-url";

export function useRequireAuth() {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  function requireAuth(action: () => void, returnPath?: string) {
    if (!hydrated) {
      return;
    }

    if (!user) {
      router.push(
        returnPath ? buildLoginUrlWithReturn(returnPath) : LOGIN_PATH,
      );
      return;
    }

    action();
  }

  return {
    user,
    hydrated,
    isLoggedIn: Boolean(user),
    requireAuth,
    goToLogin: (returnPath?: string) =>
      router.push(
        returnPath ? buildLoginUrlWithReturn(returnPath) : LOGIN_PATH,
      ),
  };
}
