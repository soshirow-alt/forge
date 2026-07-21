"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StudioSubmitPlayerPreview } from "@/components/studio-submit-player-preview";
import { StudioShell } from "@/components/studio-shell";
import { StudioMypageBackLink } from "@/components/studio-mypage-back-link";
import { StudioSubmitPanel } from "@/components/studio-submit-panel";
import { ProjectSubmitSuccessPanel } from "@/components/project-submit-success-panel";
import { useGames } from "@/components/games-provider";
import {
  useStudioSubmit,
  type SubmitDraftSuccessResult,
  type SubmitValidationEditMode,
} from "@/hooks/use-studio-submit";
import type { GameDetailTab } from "@/lib/game-detail-tabs";
import { getDeveloperSocialLinkDefaults, mergeRelatedLinkSocialDefaults } from "@/lib/developer-external-link-defaults";
import { resolveDeveloperPublicName } from "@/lib/developer-display-name";
import { useRedirectToLoginWhenLoggedOut } from "@/hooks/use-redirect-to-login-when-logged-out";
import {
  createEmptySubmitDraft,
  type SubmitDraftOwner,
  type SubmitDraftState,
} from "@/lib/studio-submit-draft";
import {
  STUDIO_PREVIEW_EDIT_ROUTES,
  type StudioPanelFocusRequest,
  type StudioPreviewEditTarget,
} from "@/lib/studio-preview-edit-targets";
import {
  SUBMIT_CATEGORY_PICK_HREF,
  SUBMIT_PROTOTYPE_CATEGORY_LABEL,
  createEmptySubmitPrototypeCategoryFields,
  type SubmitPrototypeCategory,
  type SubmitPrototypeCategoryFields,
} from "@/lib/prototype/studio-submit-flow";

export type StudioSubmitPageProps = {
  /** Preview-only: formal shell with category field variants (no save). */
  prototypeCategory?: SubmitPrototypeCategory | null;
};

export function StudioSubmitPage({
  prototypeCategory = null,
}: StudioSubmitPageProps) {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { getDeveloperProfileByUserId, getOwnedProjects } = useGames();
  const { submitDraft, validateSubmitDraftForPost, validateSubmitDraftSection } =
    useStudioSubmit();

  const [draft, setDraft] = useState<SubmitDraftState>(() => createEmptySubmitDraft());
  const [prototypeFields, setPrototypeFields] =
    useState<SubmitPrototypeCategoryFields>(() =>
      createEmptySubmitPrototypeCategoryFields(),
    );
  const [activeTab, setActiveTab] = useState<GameDetailTab>("overview");
  const [submitting, setSubmitting] = useState(false);
  const [thumbnailsBusy, setThumbnailsBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPromptValidation, setShowPromptValidation] = useState(false);
  const [focusEditMode, setFocusEditMode] = useState<SubmitValidationEditMode | null>(null);
  const [failedEditMode, setFailedEditMode] = useState<SubmitValidationEditMode | null>(null);
  const [successState, setSuccessState] = useState<SubmitDraftSuccessResult | null>(
    null,
  );
  const [panelFocus, setPanelFocus] = useState<StudioPanelFocusRequest | null>(null);
  const panelFocusRequestIdRef = useRef(0);
  const socialPrefillDoneRef = useRef(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      relatedLinks: mergeRelatedLinkSocialDefaults(current.relatedLinks, defaults),
      discordUrl: current.discordUrl || defaults.discordUrl,
      xUrl: current.xUrl || defaults.xUrl,
      youtubeUrl: current.youtubeUrl || defaults.youtubeUrl,
      officialUrl: current.officialUrl || defaults.officialUrl,
    }));
    socialPrefillDoneRef.current = true;
  }, [developerProfile, getOwnedProjects, user]);

  useEffect(() => {
    if (prototypeCategory || !submitError) {
      return;
    }

    const full = validateSubmitDraftForPost(draft);
    if (full.ok) {
      setSubmitError(null);
      setFailedEditMode(null);
      setShowPromptValidation(false);
      return;
    }

    if (failedEditMode) {
      const section = validateSubmitDraftSection(draft, failedEditMode);
      if (section.ok) {
        setSubmitError(null);
        setFailedEditMode(null);
        setShowPromptValidation(false);
      }
    }
  }, [
    draft,
    submitError,
    failedEditMode,
    prototypeCategory,
    validateSubmitDraftForPost,
    validateSubmitDraftSection,
  ]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  function patchDraft(patch: Partial<SubmitDraftState>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function patchPrototypeFields(patch: Partial<SubmitPrototypeCategoryFields>) {
    setPrototypeFields((current) => ({ ...current, ...patch }));
  }

  function handlePreviewEditTarget(target: StudioPreviewEditTarget) {
    setActiveTab("overview");
    panelFocusRequestIdRef.current += 1;
    const next = panelFocusRequestIdRef.current;
    const route = STUDIO_PREVIEW_EDIT_ROUTES[target];
    setPanelFocus({
      editMode: route.editMode,
      fieldId: route.fieldId,
      requestId: next,
      scrollToField: route.scrollToField,
    });
  }

  function handleSubmitAnother() {
    setSuccessState(null);
    setDraft(createEmptySubmitDraft());
    setPrototypeFields(createEmptySubmitPrototypeCategoryFields());
    setSubmitError(null);
    setShowPromptValidation(false);
    setFocusEditMode(null);
    setActiveTab("overview");
    socialPrefillDoneRef.current = false;
  }

  async function handleSubmit() {
    if (prototypeCategory) {
      setSubmitError(null);
      setToastMessage("このPreviewでは保存されません");
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    if (thumbnailsBusy || submitting) {
      return;
    }

    setSubmitError(null);
    setShowPromptValidation(false);
    setFocusEditMode(null);

    const validation = validateSubmitDraftForPost(draft);
    if (!validation.ok) {
      setSubmitError(validation.message);
      if (validation.editMode) {
        setFocusEditMode(validation.editMode);
        setFailedEditMode(validation.editMode);
      }
      setShowPromptValidation(true);
      return;
    }

    setSubmitting(true);
    const result = await submitDraft(draft, user);
    if (!result.ok) {
      setSubmitError(result.message);
      if (result.editMode) {
        setFocusEditMode(result.editMode);
        setFailedEditMode(result.editMode);
      } else {
        setFailedEditMode(null);
      }
      setShowPromptValidation(true);
      setSubmitting(false);
      return;
    }

    setSuccessState(result);
    setSubmitting(false);
  }

  if (!hydrated || !user || !submitOwner) {
    return (
      <StudioShell activeNav="mypage">
        <p className="text-sm text-zinc-500">読み込み中…</p>
      </StudioShell>
    );
  }

  if (successState && !prototypeCategory) {
    return (
      <StudioShell activeNav="mypage">
        <div className="mx-auto max-w-lg">
          <StudioMypageBackLink />
          <ProjectSubmitSuccessPanel
            gameId={successState.gameId}
            title={successState.title}
            visibility={successState.visibility}
            onSubmitAnother={handleSubmitAnother}
          />
        </div>
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
            {prototypeCategory ? (
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                <span>
                  カテゴリ：{SUBMIT_PROTOTYPE_CATEGORY_LABEL[prototypeCategory]}
                </span>
                <Link
                  href={SUBMIT_CATEGORY_PICK_HREF}
                  className="text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
                >
                  カテゴリを選び直す
                </Link>
              </p>
            ) : null}
          </header>

          <div className="mt-5">
            <StudioSubmitPlayerPreview
              submitDraft={draft}
              submitOwner={submitOwner}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onEditTarget={handlePreviewEditTarget}
              prototypeCategory={prototypeCategory}
              prototypeCategoryFields={
                prototypeCategory ? prototypeFields : undefined
              }
            />
          </div>
        </div>

        <StudioSubmitPanel
          draft={draft}
          onDraftChange={patchDraft}
          onSubmit={() => void handleSubmit()}
          submitting={submitting}
          thumbnailsBusy={thumbnailsBusy}
          onThumbnailsBusyChange={setThumbnailsBusy}
          submitError={submitError}
          showPromptValidation={showPromptValidation}
          focusEditMode={focusEditMode}
          onFocusEditModeHandled={() => setFocusEditMode(null)}
          panelFocus={panelFocus}
          onPanelFocusHandled={() => setPanelFocus(null)}
          prototypeCategory={prototypeCategory}
          prototypeCategoryFields={
            prototypeCategory ? prototypeFields : undefined
          }
          onPrototypeCategoryFieldsChange={
            prototypeCategory ? patchPrototypeFields : undefined
          }
        />
      </div>

      {toastMessage ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 shadow-lg"
        >
          {toastMessage}
        </div>
      ) : null}
    </StudioShell>
  );
}
