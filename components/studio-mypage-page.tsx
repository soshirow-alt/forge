"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { StudioAchievementsTabPanel } from "@/components/studio-achievements-tab-panel";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { StudioFollowersTabPanel } from "@/components/studio-followers-tab-panel";
import { StudioOwnedProjectsDirectoryPanel } from "@/components/studio-owned-projects-directory-panel";
import { StudioProjectsTabPanel } from "@/components/studio-projects-page";
import { ProjectSubmitModal } from "@/components/project-submit-modal";
import { StudioMyPageTabs, StudioShell } from "@/components/studio-shell";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { isAdScreenshotDemoEnabled } from "@/lib/ad-screenshot-demo";
import { STUDIO_SUBMIT_SEARCH_PARAM } from "@/lib/project-nurture-links";

export type StudioMypageTab = "projects" | "achievements" | "followers";

const TAB_IDS: StudioMypageTab[] = ["projects", "achievements", "followers"];

function parseTab(param: string | null): StudioMypageTab {
  if (!param || param === "projects") {
    return "projects";
  }
  return TAB_IDS.includes(param as StudioMypageTab) ? (param as StudioMypageTab) : "projects";
}

function tabHref(tab: StudioMypageTab, query: string): string {
  const params = new URLSearchParams();
  if (tab !== "projects") {
    params.set("tab", tab);
  }
  if (query.trim()) {
    params.set("q", query.trim());
  }
  const qs = params.toString();
  return qs ? `/studio/mypage?${qs}` : "/studio/mypage";
}

function StudioMypageProjectsLoadingPanel() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="作品一覧を読み込み中">
      <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-zinc-900/60" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <div
            key={key}
            className="aspect-[4/3] animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/40"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * @production-mode-audit high-risk — mock グリッドと実データ Directory を分岐。
 * 本番同等、または Preview で実作品がある場合は DirectoryPanel に統一（2026-06 構造是正）。
 */
function StudioMypageProjectsPanel({
  initialQuery = "",
  onOpenSubmit,
}: {
  initialQuery?: string;
  onOpenSubmit?: () => void;
}) {
  const hideV0Mock = shouldHideV0MockContent();
  const { user, hydrated } = useAuth();
  const { getOwnedProjects, dataReady } = useGames();

  if (!hydrated || !dataReady) {
    return <StudioMypageProjectsLoadingPanel />;
  }

  if (isAdScreenshotDemoEnabled()) {
    return (
      <StudioProjectsTabPanel initialQuery={initialQuery} onOpenSubmit={onOpenSubmit} />
    );
  }

  const hasOwnedProjects = Boolean(user && getOwnedProjects(user.id).length > 0);

  if (hideV0Mock || hasOwnedProjects) {
    return (
      <StudioOwnedProjectsDirectoryPanel
        initialQuery={initialQuery}
        onOpenSubmit={onOpenSubmit}
      />
    );
  }

  return (
    <StudioProjectsTabPanel initialQuery={initialQuery} onOpenSubmit={onOpenSubmit} />
  );
}

function StudioMypagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hideV0Mock = shouldHideV0MockContent();
  const activeTab = parseTab(searchParams.get("tab"));
  const initialQuery = searchParams.get("q") ?? "";
  const [submitModalOpen, setSubmitModalOpen] = useState(
    () => searchParams.get(STUDIO_SUBMIT_SEARCH_PARAM) === "1",
  );

  useEffect(() => {
    if (searchParams.get(STUDIO_SUBMIT_SEARCH_PARAM) === "1") {
      setSubmitModalOpen(true);
    }
  }, [searchParams]);

  const handleTabChange = useCallback(
    (tab: StudioMypageTab) => {
      router.push(tabHref(tab, initialQuery));
    },
    [router, initialQuery],
  );

  function closeSubmitModal() {
    setSubmitModalOpen(false);
    if (searchParams.get(STUDIO_SUBMIT_SEARCH_PARAM)) {
      router.replace(tabHref(activeTab, initialQuery));
    }
  }

  return (
    <StudioShell activeNav="mypage" headerSearchDefault={initialQuery}>
      <div className="mx-auto max-w-7xl space-y-6">
        <StudioMyPageTabs activeTab={activeTab} onTabChange={handleTabChange} />
        {activeTab === "projects" ? (
          <StudioMypageProjectsPanel
            initialQuery={initialQuery}
            onOpenSubmit={() => setSubmitModalOpen(true)}
          />
        ) : activeTab === "achievements" ? (
          hideV0Mock ? (
            <FeatureComingSoonPanel
              title="実績"
              description="開発者実績の集計・表示は準備中です。公開をお待ちください。"
            />
          ) : (
            <StudioAchievementsTabPanel />
          )
        ) : (
          <StudioFollowersTabPanel />
        )}
      </div>
      <ProjectSubmitModal open={submitModalOpen} onClose={closeSubmitModal} />
    </StudioShell>
  );
}

export function StudioMypagePage() {
  return (
    <Suspense fallback={<StudioShell activeNav="mypage"><p className="text-zinc-500">読み込み中…</p></StudioShell>}>
      <StudioMypagePageContent />
    </Suspense>
  );
}
