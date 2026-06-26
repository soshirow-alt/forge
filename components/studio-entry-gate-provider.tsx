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
    openDeveloperCommunity({
      id: communityId,
      name: `${user.name}コミュニティ`,
      avatar: "/images/landing/game-1.png",
      handle: communityId,
      description: "フォロワーと交流し、一緒にゲームを育てましょう",
      memberCountLabel: 0,
    });
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

/** Studio URL 直打ち時 — 未承諾ならモーダルを出し、いいえで Player 側へ戻す */
export function StudioDirectAccessGuard() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { attemptStudioEntry } = useStudioEntryGate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hydrated || checked) {
      return;
    }
    setChecked(true);
    if (!user) {
      return;
    }
    if (shouldPromptDeveloperPage(user.id)) {
      attemptStudioEntry("/studio");
    }
  }, [hydrated, user, checked, attemptStudioEntry]);

  return null;
}
