"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StudioSubmitPlayerPreview } from "@/components/studio-submit-player-preview";
import { StudioShell } from "@/components/studio-shell";
import { StudioMypageBackLink } from "@/components/studio-mypage-back-link";
import { StudioSubmitPanel } from "@/components/studio-submit-panel";
import { useGames } from "@/components/games-provider";
import { useStudioSubmit, type SubmitValidationEditMode } from "@/hooks/use-studio-submit";
import type { GameDetailTab } from "@/lib/game-detail-tabs";
import { getDeveloperSocialLinkDefaults } from "@/lib/developer-external-link-defaults";
import { resolveDeveloperPublicName } from "@/lib/developer-display-name";
import { useRedirectToLoginWhenLoggedOut } from "@/hooks/use-redirect-to-login-when-logged-out";
import {
  createEmptySubmitDraft,
  type SubmitDraftOwner,
  type SubmitDraftState,
} from "@/lib/studio-submit-draft";

export function StudioSubmitPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { getDeveloperProfileByUserId, getOwnedProjects } = useGames();
  const { submitDraft } = useStudioSubmit();

  const [draft, setDraft] = useState<SubmitDraftState>(() => createEmptySubmitDraft());
  const [activeTab, setActiveTab] = useState<GameDetailTab>("overview");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPromptValidation, setShowPromptValidation] = useState(false);
  const [focusEditMode, setFocusEditMode] = useState<SubmitValidationEditMode | null>(null);
  const socialPrefillDoneRef = useRef(false);

  const developerProfile = user ? getDeveloperProfileByUserId(user.id) : undefined;

  const submitOwner = useMemo((): SubmitDraftOwner | null => {
    if (!user) {
      return null;
    }
    const publicName = resolveDeveloperPublicName(user, developerProfile);
    return {
      ownerId: user.id,
      ownerName: publicName,
      creator: publicName,
    };
  }, [user, developerProfile]);

  useRedirectToLoginWhenLoggedOut();

  useEffect(() => {
    if (!user || socialPrefillDoneRef.current) {
      return;
    }

    const ownedProjects = getOwnedProjects(user.id);
    if (!developerProfile && ownedProjects.length === 0) {
      return;
    }

    const defaults = getDeveloperSocialLinkDefaults(developerProfile, ownedProjects);
    setDraft((current) => ({
      ...current,
      discordUrl: current.discordUrl || defaults.discordUrl,
      xUrl: current.xUrl || defaults.xUrl,
      youtubeUrl: current.youtubeUrl || defaults.youtubeUrl,
      officialUrl: current.officialUrl || defaults.officialUrl,
    }));
    socialPrefillDoneRef.current = true;
  }, [developerProfile, getOwnedProjects, user]);

  function patchDraft(patch: Partial<SubmitDraftState>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function handleSubmit() {
    if (!user) {
      router.push("/login");
      return;
    }

    setSubmitError(null);
    setShowPromptValidation(false);
    setFocusEditMode(null);
    setSubmitting(true);

    const result = await submitDraft(draft, user);
    if (!result.ok) {
      setSubmitError(result.message);
      if (result.editMode) {
        setFocusEditMode(result.editMode);
      }
      if (draft.promptMode === "custom") {
        setShowPromptValidation(true);
      }
      setSubmitting(false);
    }
  }

  if (!hydrated || !user || !submitOwner) {
    return (
      <StudioShell activeNav="mypage">
        <p className="text-sm text-zinc-500">読み込み中…</p>
      </StudioShell>
    );
  }

  return (
    <StudioShell activeNav="mypage">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
        <div className="min-w-0 flex-1">
          <header className="border-b border-zinc-800/80 pb-3">
            <StudioMypageBackLink />
            <p className="mt-2 text-sm text-zinc-400">作品を投稿する</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              右のStudioパネルで入力すると、左に公開ページの見え方が反映されます。
            </p>
          </header>

          <div className="mt-5">
            <StudioSubmitPlayerPreview
              submitDraft={draft}
              submitOwner={submitOwner}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>

        <StudioSubmitPanel
          draft={draft}
          onDraftChange={patchDraft}
          onSubmit={() => void handleSubmit()}
          submitting={submitting}
          submitError={submitError}
          showPromptValidation={showPromptValidation}
          focusEditMode={focusEditMode}
          onFocusEditModeHandled={() => setFocusEditMode(null)}
        />
      </div>
    </StudioShell>
  );
}
