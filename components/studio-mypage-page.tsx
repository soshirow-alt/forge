"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";
import { StudioAchievementsTabPanel } from "@/components/studio-achievements-tab-panel";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { StudioFollowersTabPanel } from "@/components/studio-followers-tab-panel";
import { StudioOwnedProjectsDirectoryPanel } from "@/components/studio-owned-projects-directory-panel";
import { StudioMyPageTabs, StudioShell } from "@/components/studio-shell";
import { useHideV0MockContent } from "@/lib/forge-deployment-context";
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

function StudioMypagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hideV0Mock = useHideV0MockContent();
  const activeTab = parseTab(searchParams.get("tab"));
  const initialQuery = searchParams.get("q") ?? "";

  useEffect(() => {
    if (searchParams.get(STUDIO_SUBMIT_SEARCH_PARAM) === "1") {
      router.replace("/studio/submit");
    }
  }, [searchParams, router]);

  const handleTabChange = useCallback(
    (tab: StudioMypageTab) => {
      router.push(tabHref(tab, initialQuery));
    },
    [router, initialQuery],
  );

  return (
    <StudioShell activeNav="mypage" headerSearchDefault={initialQuery}>
      <div className="mx-auto max-w-7xl space-y-6">
        <StudioMyPageTabs activeTab={activeTab} onTabChange={handleTabChange} />
        {activeTab === "projects" ? (
          <StudioOwnedProjectsDirectoryPanel
            initialQuery={initialQuery}
            onOpenSubmit={() => router.push("/studio/submit")}
          />
        ) : activeTab === "achievements" ? (
          hideV0Mock ? (
            <FeatureComingSoonPanel
              title="実績"
              description="開発者実績の集計・表示は Coming Soon です。"
            />
          ) : (
            <StudioAchievementsTabPanel />
          )
        ) : (
          <StudioFollowersTabPanel />
        )}
      </div>
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
