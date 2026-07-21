"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { StudioAchievementsTabPanel } from "@/components/studio-achievements-tab-panel";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { StudioFollowersTabPanel } from "@/components/studio-followers-tab-panel";
import { StudioOwnedProjectsDirectoryPanel } from "@/components/studio-owned-projects-directory-panel";
import { StudioMyPageTabs, StudioShell } from "@/components/studio-shell";
import { ForgeTabPanel } from "@/components/forge-tab-panel";
import { PageLoadingSkeleton } from "@/components/forge-loading-skeletons";
import { useForgePerfRoute } from "@/hooks/use-forge-perf-route";
import { useInstantQueryTab } from "@/hooks/use-instant-query-tab";
import { useHideV0MockContent } from "@/lib/forge-deployment-context";
import { STUDIO_SUBMIT_SEARCH_PARAM, studioSubmitModalHref } from "@/lib/project-nurture-links";

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
  const initialQuery = searchParams.get("q") ?? "";
  const initialQueryRef = useRef(initialQuery);
  initialQueryRef.current = initialQuery;
  const { activeTab, setActiveTab } = useInstantQueryTab<StudioMypageTab>({
    parse: parseTab,
    buildHref: (tab, params) =>
      tabHref(tab, params.get("q") ?? initialQueryRef.current),
    perfScope: "studio-mypage-tab",
  });
  const [visitedTabs, setVisitedTabs] = useState<Set<StudioMypageTab>>(() => {
    const initial = parseTab(searchParams.get("tab"));
    return new Set([initial]);
  });

  useForgePerfRoute({
    route: `/studio/mypage?tab=${activeTab}`,
    ready: true,
  });

  useEffect(() => {
    if (searchParams.get(STUDIO_SUBMIT_SEARCH_PARAM) === "1") {
      router.replace(studioSubmitModalHref());
    }
  }, [searchParams, router]);

  const handleTabChange = useCallback(
    (tab: StudioMypageTab) => {
      setActiveTab(tab);
      setVisitedTabs((prev) => {
        if (prev.has(tab)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(tab);
        return next;
      });
    },
    [setActiveTab],
  );

  return (
    <StudioShell activeNav="mypage" headerSearchDefault={initialQuery}>
      <div className="mx-auto max-w-7xl space-y-6">
        <StudioMyPageTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <ForgeTabPanel active={activeTab === "projects"}>
          <StudioOwnedProjectsDirectoryPanel
            initialQuery={initialQuery}
            onOpenSubmit={() => router.push(studioSubmitModalHref())}
          />
        </ForgeTabPanel>
        {visitedTabs.has("achievements") ? (
          <ForgeTabPanel active={activeTab === "achievements"}>
            {hideV0Mock ? (
              <FeatureComingSoonPanel
                title="実績"
                description="開発者実績の集計・表示は Coming Soon です。"
              />
            ) : (
              <StudioAchievementsTabPanel />
            )}
          </ForgeTabPanel>
        ) : null}
        {visitedTabs.has("followers") ? (
          <ForgeTabPanel active={activeTab === "followers"}>
            <StudioFollowersTabPanel />
          </ForgeTabPanel>
        ) : null}
      </div>
    </StudioShell>
  );
}

export function StudioMypagePage() {
  return (
    <Suspense
      fallback={
        <StudioShell activeNav="mypage">
          <PageLoadingSkeleton lines={4} />
        </StudioShell>
      }
    >
      <StudioMypagePageContent />
    </Suspense>
  );
}
