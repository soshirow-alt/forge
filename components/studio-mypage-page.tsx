"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { StudioAchievementsTabPanel } from "@/components/studio-achievements-tab-panel";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { StudioFollowersTabPanel } from "@/components/studio-followers-tab-panel";
import { StudioOwnedProjectsDirectoryPanel } from "@/components/studio-owned-projects-directory-panel";
import { StudioProjectsTabPanel } from "@/components/studio-projects-page";
import { StudioMyPageTabs, StudioShell } from "@/components/studio-shell";
import { shouldHideV0MockContent } from "@/lib/production-mode";

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

/**
 * @production-mode-audit high-risk — mock グリッドと実データ Directory を分岐。
 * 本番同等、または Preview で実作品がある場合は DirectoryPanel に統一（2026-06 構造是正）。
 */
function StudioMypageProjectsPanel({ initialQuery = "" }: { initialQuery?: string }) {
  const hideV0Mock = shouldHideV0MockContent();
  const { user, hydrated } = useAuth();
  const { getOwnedProjects, dataReady } = useGames();

  const useRealDirectory = useMemo(() => {
    if (hideV0Mock) {
      return true;
    }
    if (!hydrated || !dataReady || !user) {
      return false;
    }
    return getOwnedProjects(user.id).length > 0;
  }, [hideV0Mock, hydrated, dataReady, user, getOwnedProjects]);

  if (useRealDirectory) {
    return <StudioOwnedProjectsDirectoryPanel initialQuery={initialQuery} />;
  }

  return <StudioProjectsTabPanel initialQuery={initialQuery} />;
}

function StudioMypagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hideV0Mock = shouldHideV0MockContent();
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
          <StudioMypageProjectsPanel initialQuery={initialQuery} />
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
