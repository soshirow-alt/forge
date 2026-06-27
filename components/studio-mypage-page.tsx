"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { StudioAchievementsTabPanel } from "@/components/studio-achievements-tab-panel";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { StudioFollowersTabPanel } from "@/components/studio-followers-tab-panel";
import { StudioOwnedProjectsSection } from "@/components/studio-owned-projects-section";
import { StudioProjectsTabPanel } from "@/components/studio-projects-page";
import { StudioMyPageTabs, StudioShell } from "@/components/studio-shell";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { Plus } from "lucide-react";

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

function StudioMypageProjectsPanel({ initialQuery = "" }: { initialQuery?: string }) {
  const hideV0Mock = shouldHideV0MockContent();

  if (!hideV0Mock) {
    return <StudioProjectsTabPanel initialQuery={initialQuery} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">プロジェクト一覧</h1>
          <p className="mt-2 text-sm text-zinc-400">
            あなたの作品を管理し、届いたフィードバックをもとに改善を進められます。
          </p>
        </div>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          <Plus className="size-4" aria-hidden="true" />
          新しい作品を投稿
        </Link>
      </div>
      <StudioOwnedProjectsSection variant="list" />
    </div>
  );
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
        ) : hideV0Mock ? (
          <FeatureComingSoonPanel
            title="フォロワー"
            description="フォロワー一覧の表示は準備中です。公開をお待ちください。"
          />
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
