"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export const LOGIN_PATH = "/login";

export function useRequireAuth() {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  function requireAuth(action: () => void) {
    if (!hydrated) {
      return;
    }

    if (!user) {
      router.push(LOGIN_PATH);
      return;
    }

    action();
  }

  return {
    user,
    hydrated,
    isLoggedIn: Boolean(user),
    requireAuth,
    goToLogin: () => router.push(LOGIN_PATH),
  };
}
