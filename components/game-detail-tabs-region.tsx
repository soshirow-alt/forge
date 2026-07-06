"use client";

import { memo, useMemo, type ReactNode } from "react";
import { ForgeTabPanel } from "@/components/forge-tab-panel";
import type { GameDetailTab } from "@/lib/game-detail-tabs";

const TAB_ITEMS: { id: GameDetailTab; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "devlog", label: "開発ログ" },
  { id: "voices", label: "みんなのフィードバック" },
];

type GameDetailTabBarProps = {
  activeTab: GameDetailTab;
  onTabChange: (tab: GameDetailTab) => void;
};

export const GameDetailTabBar = memo(function GameDetailTabBar({
  activeTab,
  onTabChange,
}: GameDetailTabBarProps) {
  return (
    <div className="border-b border-zinc-800/80">
      <div className="flex gap-1 overflow-x-auto" role="tablist">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-violet-500 text-violet-200"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
});

type GameDetailTabPanelsProps = {
  activeTab: GameDetailTab;
  visitedTabs: ReadonlySet<GameDetailTab>;
  overview: ReactNode;
  devlog: ReactNode;
  voices: ReactNode;
};

export const GameDetailTabPanels = memo(function GameDetailTabPanels({
  activeTab,
  visitedTabs,
  overview,
  devlog,
  voices,
}: GameDetailTabPanelsProps) {
  return (
    <div className="min-h-[28rem]">
      <ForgeTabPanel active={activeTab === "overview"}>{overview}</ForgeTabPanel>
      {visitedTabs.has("devlog") ? (
        <ForgeTabPanel active={activeTab === "devlog"}>{devlog}</ForgeTabPanel>
      ) : null}
      {visitedTabs.has("voices") ? (
        <ForgeTabPanel active={activeTab === "voices"}>{voices}</ForgeTabPanel>
      ) : null}
    </div>
  );
});
