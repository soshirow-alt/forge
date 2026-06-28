"use client";

import { Suspense } from "react";
import { useAuth } from "@/components/auth-provider";
import { CreatorNotFoundPanel } from "@/components/creator-not-found-panel";
import { CreatorProfileRealView } from "@/components/creator-profile-real-view";
import { DeveloperProfileV0Page } from "@/components/developer-profile-v0-page";
import { PlayerShell } from "@/components/player-shell";
import { useCreatorProfile } from "@/hooks/use-creator-profile";
import { useStudioPublicSettings } from "@/hooks/use-studio-public-settings";
import { shouldHideV0MockContent } from "@/lib/production-mode";

function CreatorProfilePageContent({ id }: { id: string }) {
  const hideV0Mock = shouldHideV0MockContent();
  const { user } = useAuth();
  const { profile, loaded } = useCreatorProfile(id);
  const { isEnabled, loaded: publicLoaded } = useStudioPublicSettings(profile?.userId);

  if (hideV0Mock) {
    if (!loaded || !publicLoaded) {
      return (
        <PlayerShell activeNav="creator-search">
          <p className="text-sm text-zinc-500">読み込み中...</p>
        </PlayerShell>
      );
    }
    if (!profile) {
      return <CreatorNotFoundPanel />;
    }
    const isSelf = user?.id === profile.userId;
    if (!isSelf && !isEnabled("dev-profile")) {
      return <CreatorNotFoundPanel />;
    }
    return <CreatorProfileRealView profile={profile} isSelf={isSelf} />;
  }

  if (profile) {
    const isSelf = user?.id === profile.userId;
    return <CreatorProfileRealView profile={profile} isSelf={isSelf} />;
  }

  return <DeveloperProfileV0Page id={id} />;
}

export function CreatorProfilePage({ id }: { id: string }) {
  return (
    <Suspense
      fallback={
        <PlayerShell activeNav="creator-search">
          <p className="text-sm text-zinc-500">読み込み中...</p>
        </PlayerShell>
      }
    >
      <CreatorProfilePageContent id={id} />
    </Suspense>
  );
}
