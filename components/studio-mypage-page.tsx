"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { StudioAchievementsTabPanel } from "@/components/studio-achievements-tab-panel";
import { StudioProjectsTabPanel } from "@/components/studio-projects-page";
import { StudioMyPageTabs, StudioShell } from "@/components/studio-shell";

export type StudioMypageTab = "projects" | "achievements";

const TAB_IDS: StudioMypageTab[] = ["projects", "achievements"];

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
  const activeTab = parseTab(searchParams.get("tab"));
  const initialQuery = searchParams.get("q") ?? "";

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
          <StudioProjectsTabPanel initialQuery={initialQuery} />
        ) : (
          <StudioAchievementsTabPanel />
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
