"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";
import { useEntryMode } from "@/components/entry-mode-provider";
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
import { useForgeDeploymentMode } from "@/lib/forge-deployment-context";
import { ACCOUNT_REGISTRATION_REQUIRED_NOTICE } from "@/lib/guest-auth";
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

function studioPathsEqual(current: string, target: string): boolean {
  return current === target || current.startsWith(`${target}/`);
}

export function StudioEntryGateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated, isRegisteredUser } = useAuth();
  const { isGuestEntry } = useEntryMode();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState("/studio");
  const directAccessPromptedRef = useRef(false);

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
    if (!studioPathsEqual(pathname, pendingHref)) {
      router.push(pendingHref);
    }
  }, [user, pendingHref, pathname, router]);

  const handleDecline = useCallback(() => {
    if (user) {
      declineDeveloperPage(user.id);
    }
    setModalOpen(false);
    if (pathname.startsWith("/studio")) {
      router.push("/home");
    }
  }, [user, pathname, router]);

  const promptDeveloperOnboardingIfNeeded = useCallback(
    (href: string) => {
      if (!user || !shouldPromptDeveloperPage(user.id)) {
        return false;
      }
      if (directAccessPromptedRef.current) {
        return true;
      }
      directAccessPromptedRef.current = true;
      setPendingHref(href);
      setModalOpen(true);
      return true;
    },
    [user],
  );

  const attemptStudioEntry = useCallback(
    (href = "/studio") => {
      if (isGuestEntry) {
        router.push(
          buildLoginUrlWithReturn(href, {
            notice: ACCOUNT_REGISTRATION_REQUIRED_NOTICE,
          }),
        );
        return;
      }
      if (shouldBypassStudioLoginGate()) {
        if (!studioPathsEqual(pathname, href)) {
          router.push(href);
        }
        return;
      }
      if (!user) {
        router.push(buildLoginUrlWithReturn(href));
        return;
      }
      if (promptDeveloperOnboardingIfNeeded(href)) {
        return;
      }
      if (!studioPathsEqual(pathname, href)) {
        router.push(href);
      }
    },
    [user, isGuestEntry, pathname, router, promptDeveloperOnboardingIfNeeded],
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
  const deploymentMode = useForgeDeploymentMode();
  const { user, authResolved, isRegisteredUser } = useAuth();
  const { isGuestEntry } = useEntryMode();
  const { attemptStudioEntry } = useStudioEntryGate();

  useEffect(() => {
    if (!authResolved) {
      return;
    }

    if (isGuestEntry) {
      const returnPath = pathname.startsWith("/studio") ? pathname : "/studio";
      router.replace(
        buildLoginUrlWithReturn(returnPath, {
          notice: ACCOUNT_REGISTRATION_REQUIRED_NOTICE,
        }),
      );
      return;
    }

    if (shouldBypassStudioLoginGate()) {
      return;
    }

    // Production: middleware already requires a session for /studio.
    // Do not bounce to /login on transient client user=null after server login.
    if (deploymentMode === "production") {
      if (user && shouldPromptDeveloperPage(user.id)) {
        attemptStudioEntry(pathname.startsWith("/studio") ? pathname : "/studio");
      }
      return;
    }

    if (!user) {
      const returnPath = pathname.startsWith("/studio") ? pathname : "/studio";
      router.replace(buildLoginUrlWithReturn(returnPath));
      return;
    }
    if (shouldPromptDeveloperPage(user.id)) {
      attemptStudioEntry(pathname.startsWith("/studio") ? pathname : "/studio");
    }
  }, [authResolved, user, isGuestEntry, isRegisteredUser, attemptStudioEntry, pathname, router, deploymentMode]);

  return null;
}
