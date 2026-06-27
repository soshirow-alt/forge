"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";
import { DeveloperPageOnboardingModal } from "@/components/developer-page-onboarding-modal";
import {
  acceptDeveloperPage,
  declineDeveloperPage,
  migratePendingRegistration,
  shouldPromptDeveloperPage,
} from "@/lib/developer-onboarding-v0-store";
import {
  communityIdFromUser,
  openDeveloperCommunity,
} from "@/lib/developer-community-v0-store";
import { buildLoginUrlWithReturn } from "@/lib/login-return-url";
import { shouldBypassStudioLoginGate, shouldHideV0MockContent } from "@/lib/production-mode";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { ensureDeveloperCommunity } from "@/lib/supabase/community-db";

type StudioEntryGateContextValue = {
  attemptStudioEntry: (href?: string) => void;
};

const StudioEntryGateContext = createContext<StudioEntryGateContextValue | null>(
  null,
);

export function StudioEntryGateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState("/studio");

  useEffect(() => {
    if (user?.id) {
      migratePendingRegistration(user.id);
    }
  }, [user?.id]);

  const needsPrompt = Boolean(user && shouldPromptDeveloperPage(user.id));

  const completeAcceptance = useCallback(() => {
    if (!user) {
      return;
    }
    acceptDeveloperPage(user.id);
    const communityId = communityIdFromUser(user.id, user.name);
    if (shouldHideV0MockContent()) {
      const supabase = getOptionalSupabaseClient();
      if (supabase) {
        void ensureDeveloperCommunity(supabase, {
          id: communityId,
          ownerId: user.id,
          name: `${user.name}コミュニティ`,
          description: "フォロワーと交流し、一緒にゲームを育てましょう",
          avatarUrl: "/images/landing/game-1.png",
          handle: communityId,
        });
      }
    } else {
      openDeveloperCommunity({
        id: communityId,
        name: `${user.name}コミュニティ`,
        avatar: "/images/landing/game-1.png",
        handle: communityId,
        description: "フォロワーと交流し、一緒にゲームを育てましょう",
        memberCountLabel: 0,
      });
    }
    setModalOpen(false);
    router.push(pendingHref);
  }, [user, pendingHref, router]);

  const handleDecline = useCallback(() => {
    if (user) {
      declineDeveloperPage(user.id);
    }
    setModalOpen(false);
    if (pathname.startsWith("/studio")) {
      router.push("/home");
    }
  }, [user, pathname, router]);

  const attemptStudioEntry = useCallback(
    (href = "/studio") => {
      // Preview / local — 認証 hydrate 前でも直接遷移（v0 UI レビュー用）
      if (shouldBypassStudioLoginGate()) {
        router.push(href);
        return;
      }
      if (!hydrated) {
        return;
      }
      if (!user) {
        router.push("/login?return=/studio");
        return;
      }
      if (!shouldPromptDeveloperPage(user.id)) {
        router.push(href);
        return;
      }
      setPendingHref(href);
      setModalOpen(true);
    },
    [hydrated, user, router],
  );

  const value = useMemo(
    () => ({ attemptStudioEntry }),
    [attemptStudioEntry],
  );

  return (
    <StudioEntryGateContext.Provider value={value}>
      {children}
      <DeveloperPageOnboardingModal
        open={modalOpen && needsPrompt}
        onAccept={completeAcceptance}
        onDecline={handleDecline}
      />
    </StudioEntryGateContext.Provider>
  );
}

export function useStudioEntryGate() {
  const context = useContext(StudioEntryGateContext);
  if (!context) {
    throw new Error("useStudioEntryGate must be used within StudioEntryGateProvider");
  }
  return context;
}

/** Studio URL 直打ち時 — 本番は未ログインを /login へ。未承諾ならモーダル */
export function StudioDirectAccessGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated } = useAuth();
  const { attemptStudioEntry } = useStudioEntryGate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (shouldBypassStudioLoginGate()) {
      return;
    }
    if (!hydrated) {
      return;
    }
    if (!user) {
      const returnPath = pathname.startsWith("/studio") ? pathname : "/studio";
      router.replace(buildLoginUrlWithReturn(returnPath));
      return;
    }
    if (checked) {
      return;
    }
    setChecked(true);
    if (shouldPromptDeveloperPage(user.id)) {
      attemptStudioEntry(pathname.startsWith("/studio") ? pathname : "/studio");
    }
  }, [hydrated, user, checked, attemptStudioEntry, pathname, router]);

  return null;
}
